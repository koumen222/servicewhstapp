import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthRequest } from '../types/index.js'

const router = Router()

const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!(req.user as any)?.isAdmin) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  next()
}

router.use(requireAdmin)

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
    const { plan, maxInstances, isActive, isAdmin } = req.body
    const planLimits: Record<string, number> = { free: 1, starter: 3, pro: 10, enterprise: 100 }

    const data: any = {}
    if (plan !== undefined) { data.plan = plan; data.maxInstances = maxInstances ?? planLimits[plan] ?? 1 }
    if (maxInstances !== undefined) data.maxInstances = maxInstances
    if (isActive !== undefined) data.isActive = isActive
    if (isAdmin !== undefined) data.isAdmin = isAdmin

    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    res.json({ success: true, user })
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' })
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
