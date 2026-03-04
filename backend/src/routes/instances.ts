import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'
import { evolutionAPI } from '../lib/evolution.js'
import { buildInstanceName } from '../utils/instanceName.js'
import { authenticate } from '../middleware/auth.js'
import { checkInstanceQuota } from '../middleware/quota.js'
import { getUsageStats } from '../utils/quotaManager.js'
import { env } from '../config/env.js'

const router = Router()

router.use(authenticate)

const getPublicApiBaseUrl = (req: AuthRequest): string => {
  if (env.BACKEND_PUBLIC_URL) {
    return env.BACKEND_PUBLIC_URL
  }

  const forwardedProto = req.headers['x-forwarded-proto']
  const forwardedHost = req.headers['x-forwarded-host']

  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || req.protocol
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.get('host')

  return host ? `${proto}://${host}` : ''
}

const createInstanceSchema = z.object({
  instanceName: z.string().min(1),
  integration: z.string().optional().default('WHATSAPP-BAILEYS'),
  qrcode: z.boolean().optional().default(true),
})

router.post('/create', checkInstanceQuota, async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName, integration, qrcode } = createInstanceSchema.parse(req.body)
    
    if (!req.user || !req.user.id) {
      console.error('[CREATE] Utilisateur non authentifié:', req.user)
      return res.status(401).json({ error: 'Utilisateur non authentifié' })
    }

    const userId = req.user.id
    console.log('[CREATE] Tentative de création d\'instance pour userId:', userId, 'customName:', customName)

    // Vérifier explicitement que l'utilisateur existe dans la base
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    })
    if (!userExists) {
      console.error('[CREATE] Utilisateur non trouvé en base:', userId)
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    console.log('[CREATE] Utilisateur trouvé:', userExists.email, 'plan:', userExists.plan)

    const fullInstanceName = buildInstanceName(userId, customName)

    const existing = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName }
    })
    if (existing) {
      return res.status(400).json({ error: 'Instance déjà existante' })
    }

    console.log('[CREATE] Création de l\'instance Evolution API:', fullInstanceName)
    const evolutionResponse = await evolutionAPI.createInstance(fullInstanceName, integration, qrcode)

    // Générer un token API unique pour cette instance
    const apiKey = crypto.randomBytes(32).toString('hex')

    console.log('[CREATE] Enregistrement en base avec userId:', userId)
    const instance = await prisma.instance.create({
      data: {
        userId,
        instanceName: fullInstanceName,
        customName,
        status: 'close',
        instanceUrl: getPublicApiBaseUrl(req) || env.EVOLUTION_API_URL,
        evolutionApiKey: apiKey,
      }
    })

    console.log('[CREATE] Instance créée avec succès:', instance.id)
    res.json({
      instance: {
        instanceName: instance.customName,
        status: instance.status,
      },
      evolution: evolutionResponse
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors })
    }
    
    // Logs détaillés pour l'erreur de contrainte de clé étrangère
    if (error?.code === 'P2003') {
      console.error('[CREATE] Erreur de contrainte de clé étrangère:', {
        code: error.code,
        target: error.meta?.target,
        field_name: error.meta?.field_name,
        userId: req.user?.id,
        userExists: req.user ? 'user object exists' : 'no user object'
      })
      return res.status(400).json({ error: 'Erreur de relation utilisateur - veuillez vous reconnecter' })
    }

    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[CREATE]', msg, error?.response?.data)
    console.error('[CREATE] Full error:', error)
    res.status(500).json({ error: msg })
  }
})

router.get('/fetchInstances', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    const userInstances = await prisma.instance.findMany({
      where: { userId }
    })

    let allEvolutionInstances: any[] = []
    
    try {
      allEvolutionInstances = await evolutionAPI.fetchInstances()
    } catch (evolutionError: any) {
      console.warn('[FETCH] Evolution API error, using database data only:', evolutionError?.response?.data?.message || evolutionError?.message)
      // Continue with empty array - we'll use database data only
    }

    const enriched = userInstances.map((dbInstance: any) => {
      const evolutionData = allEvolutionInstances.find(
        (e: any) => e.instance?.instanceName === dbInstance.instanceName
      )

      return {
        instanceName: dbInstance.customName,
        status: evolutionData?.instance?.state || dbInstance.status,
        profileName: evolutionData?.profileName || dbInstance.profileName,
        profilePictureUrl: evolutionData?.profilePictureUrl || dbInstance.profilePictureUrl,
        ownerJid: evolutionData?.owner || dbInstance.ownerJid,
      }
    })

    res.json(enriched)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[FETCH]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.get('/connectionState/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    try {
      const state = await evolutionAPI.getConnectionState(fullInstanceName)

      await prisma.instance.update({
        where: { id: dbInstance.id },
        data: { status: state.instance?.state || 'close' }
      })

      res.json(state)
    } catch (evolutionError: any) {
      console.warn('[STATE] Evolution API error, returning database status:', evolutionError?.response?.data?.message || evolutionError?.message)
      
      // Return database status as fallback
      res.json({
        instance: {
          instanceName: fullInstanceName,
          state: dbInstance.status
        }
      })
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[STATE]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.get('/connect/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const result = await evolutionAPI.connectInstance(fullInstanceName)
    res.json(result)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[CONNECT]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.get('/qrcode/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const qrData = await evolutionAPI.fetchQRCode(fullInstanceName)
    res.json(qrData)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[QR]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.delete('/logout/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const result = await evolutionAPI.logoutInstance(fullInstanceName)

    await prisma.instance.update({
      where: { id: dbInstance.id },
      data: { status: 'close' }
    })

    res.json(result)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[LOGOUT]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.delete('/delete/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    await evolutionAPI.deleteInstance(fullInstanceName)
    await prisma.instance.delete({ where: { id: dbInstance.id } })

    res.json({ success: true })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[DELETE]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

// Endpoint pour récupérer les informations d'accès API d'une instance
router.get('/credentials/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    res.json({
      instanceName: dbInstance.customName,
      fullInstanceName: dbInstance.instanceName,
      evolutionApiUrl: getPublicApiBaseUrl(req) || dbInstance.instanceUrl || env.EVOLUTION_API_URL,
      apiKey: dbInstance.evolutionApiKey ?? '',
      status: dbInstance.status,
      createdAt: dbInstance.createdAt
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[CREDENTIALS]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

// Endpoint pour récupérer les statistiques d'usage d'une instance
router.get('/stats/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const stats = await getUsageStats(dbInstance.id)

    // Récupérer l'historique des messages récents
    const recentMessages = await prisma.messageLog.findMany({
      where: { instanceId: dbInstance.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        recipientNumber: true,
        messageType: true,
        status: true,
        createdAt: true,
        errorMessage: true
      }
    })

    // Statistiques par statut pour cette instance
    const statusStats = await prisma.messageLog.groupBy({
      by: ['status'],
      where: { instanceId: dbInstance.id },
      _count: { status: true }
    })

    res.json({
      instanceName: dbInstance.customName,
      quota: {
        daily: {
          current: stats.daily.current,
          limit: stats.daily.limit,
          remaining: stats.daily.limit === -1 ? 'Illimité' : Math.max(0, stats.daily.limit - stats.daily.current),
          percentage: stats.daily.percentage,
          resetDate: stats.daily.resetDate
        },
        monthly: {
          current: stats.monthly.current,
          limit: stats.monthly.limit,
          remaining: stats.monthly.limit === -1 ? 'Illimité' : Math.max(0, stats.monthly.limit - stats.monthly.current),
          percentage: stats.monthly.percentage,
          resetDate: stats.monthly.resetDate
        },
        canSend: stats.canSend.canSend,
        reason: stats.canSend.reason
      },
      statistics: {
        total: stats.total,
        thisHour: stats.thisHour,
        byStatus: statusStats.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {} as Record<string, number>)
      },
      recentMessages,
      lastUsed: dbInstance.lastUsed
    })
  } catch (error: any) {
    const msg = error?.message || 'Erreur lors de la récupération des statistiques'
    console.error('[INSTANCE STATS]', msg, error)
    res.status(500).json({ error: msg })
  }
})

export default router
