import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { AuthRequest } from '../types/index.js'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { PLAN_LIMITS } from '../utils/quotaManager.js'

const router = Router()

// Endpoint spécial pour promouvoir un compte existant en admin (uniquement si aucun admin existe)
router.post('/setup-admin', async (req: AuthRequest, res) => {
  try {
    // Vérifier s'il existe déjà un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true } as any
    })
    
    if (existingAdmin) {
      return res.status(400).json({ error: 'Un administrateur existe déjà. Contactez votre admin.' })
    }
    
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' })
    }
    
    // Trouver l'utilisateur existant
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      return res.status(404).json({ error: `Aucun compte trouvé pour ${email}` })
    }
    
    // Promouvoir en admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true, plan: 'enterprise', maxInstances: 100 } as any,
      select: { id: true, name: true, email: true, plan: true, createdAt: true }
    })
    
    console.log('[ADMIN] Utilisateur promu administrateur:', updatedUser.email)
    
    res.json({ 
      success: true, 
      user: updatedUser,
      message: `${updatedUser.name} est maintenant administrateur. Reconnectez-vous.`
    })
  } catch (error: any) {
    console.error('[SETUP ADMIN]', error.message)
    res.status(500).json({ error: 'Erreur lors de la promotion en administrateur' })
  }
})

router.use(authenticate)
router.use(requireAdmin)

// Schémas de validation
const createUserSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  isActive: z.boolean().default(true),
  isAdmin: z.boolean().default(false)
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
  maxInstances: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isAdmin: z.boolean().optional()
})

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [totalUsers, totalInstances, totalPayments, revenueResult] = await Promise.all([
      prisma.user.count(),
      prisma.instance.count(),
      (prisma as any).payment?.count({ where: { status: 'success' } }).catch(() => 0),
      (prisma as any).payment?.aggregate({ _sum: { amount: true }, where: { status: 'success' } }).catch(() => ({ _sum: { amount: 0 } })),
    ])

    const revenue = revenueResult?._sum?.amount ?? 0

    const planStats = await prisma.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    })

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, plan: true, createdAt: true, isActive: true },
    })

    res.json({
      stats: {
        totalUsers,
        totalInstances,
        totalPayments: totalPayments ?? 0,
        revenue,
      },
      planStats: planStats.map((p: any) => ({ plan: p.plan, count: p._count.plan })),
      recentUsers,
    })
  } catch (error: any) {
    console.error('[ADMIN STATS]', error.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Créer un nouvel utilisateur
router.post('/users', async (req: AuthRequest, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body)
    
    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' })
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Définir les limites selon le plan
    const planLimits = PLAN_LIMITS[validatedData.plan]
    
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        plan: validatedData.plan,
        maxInstances: planLimits.instancesMax === -1 ? 100 : planLimits.instancesMax,
        isActive: validatedData.isActive,
        isAdmin: validatedData.isAdmin
      },
      select: {
        id: true,
        name: true, 
        email: true,
        plan: true,
        maxInstances: true,
        isActive: true,
        isAdmin: true,
        createdAt: true
      }
    })
    
    console.log('[ADMIN] Utilisateur créé:', user.email, 'par admin:', req.user?.email)
    
    res.status(201).json({ 
      success: true, 
      user,
      message: `Utilisateur ${user.name} créé avec succès` 
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      })
    }
    
    console.error('[ADMIN CREATE USER]', error.message)
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' })
  }
})

router.get('/users', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string || ''

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, plan: true,
          maxInstances: true, isActive: true,
          createdAt: true, updatedAt: true,
          _count: { select: { instances: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('[ADMIN USERS]', error.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, plan: true,
        maxInstances: true, isActive: true, createdAt: true,
        instances: { select: { id: true, customName: true, status: true, createdAt: true } },
      },
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json(user)
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const validatedData = updateUserSchema.parse(req.body)
    
    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id }
    })
    
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }
    
    // Empêcher un admin de se retirer ses propres privilèges
    if (req.params.id === req.user?.id && validatedData.isAdmin === false) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous retirer vos propres privilèges d\'administrateur' })
    }

    const data: any = {}
    
    if (validatedData.name !== undefined) data.name = validatedData.name
    if (validatedData.email !== undefined) {
      // Vérifier que l'email n'est pas déjà pris
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: validatedData.email,
          NOT: { id: req.params.id }
        }
      })
      if (emailExists) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' })
      }
      data.email = validatedData.email
    }
    
    if (validatedData.plan !== undefined) {
      data.plan = validatedData.plan
      // Mettre à jour automatiquement maxInstances selon le plan si pas spécifié
      if (validatedData.maxInstances === undefined) {
        const planLimits = PLAN_LIMITS[validatedData.plan]
        data.maxInstances = planLimits.instancesMax === -1 ? 100 : planLimits.instancesMax
      }
    }
    
    if (validatedData.maxInstances !== undefined) data.maxInstances = validatedData.maxInstances
    if (validatedData.isActive !== undefined) data.isActive = validatedData.isActive
    if (validatedData.isAdmin !== undefined) data.isAdmin = validatedData.isAdmin

    const updatedUser = await prisma.user.update({ 
      where: { id: req.params.id }, 
      data,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        maxInstances: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // Créer des notifications pour les changements importants
    const notifications = []
    
    if (validatedData.plan !== undefined && existingUser.plan !== validatedData.plan) {
      notifications.push({
        userId: req.params.id,
        type: 'plan_change',
        title: 'Plan modifié',
        message: `Votre plan a été mis à jour de "${existingUser.plan}" vers "${validatedData.plan}" par un administrateur.`,
        metadata: JSON.stringify({ 
          oldPlan: existingUser.plan, 
          newPlan: validatedData.plan,
          adminEmail: req.user?.email 
        }),
        createdBy: req.user?.id
      })
    }
    
    if (validatedData.isActive !== undefined && existingUser.isActive !== validatedData.isActive) {
      notifications.push({
        userId: req.params.id,
        type: 'account_status',
        title: validatedData.isActive ? 'Compte réactivé' : 'Compte suspendu',
        message: validatedData.isActive 
          ? 'Votre compte a été réactivé par un administrateur.' 
          : 'Votre compte a été suspendu par un administrateur.',
        metadata: JSON.stringify({ 
          oldStatus: existingUser.isActive, 
          newStatus: validatedData.isActive,
          adminEmail: req.user?.email 
        }),
        createdBy: req.user?.id
      })
    }
    
    // Créer toutes les notifications en une fois
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }
    
    console.log('[ADMIN] Utilisateur mis à jour:', updatedUser.email, 'par admin:', req.user?.email)
    
    res.json({ 
      success: true, 
      user: updatedUser,
      message: `Utilisateur ${updatedUser.name} mis à jour avec succès`
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      })
    }
    
    console.error('[ADMIN UPDATE USER]', error.message)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' })
  }
})

router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user?.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/payments', async (req: AuthRequest, res) => {
  try {
    const payments = await (prisma as any).payment?.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, name: true, email: true } } },
    }).catch(() => [])
    res.json({ payments: payments ?? [] })
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
