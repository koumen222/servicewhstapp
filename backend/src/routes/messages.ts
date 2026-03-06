import { Router } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'
import { evolutionAPI } from '../lib/evolution.js'
import { buildInstanceName } from '../utils/instanceName.js'
import { authenticate } from '../middleware/auth.js'
import { extractInstanceId } from '../middleware/extractInstance.js'
import { checkMessageQuota } from '../middleware/messageQuota.js'
import { incrementMessageUsage, getUsageStats } from '../utils/quotaManager.js'

const router = Router()

router.use(authenticate)

const sendTextSchema = z.object({
  number: z.string().min(1),
  text: z.string().min(1),
})

router.post('/sendText/:instanceName', extractInstanceId, checkMessageQuota, async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const { number, text } = sendTextSchema.parse(req.body)
    const userId = req.user!.id
    const instanceId = req.instanceId!

    // Find the instance by customName and userId
    const dbInstance = await prisma.instance.findFirst({
      where: { instanceName: customName, userId, isActive: true }
    })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const evolutionName = (dbInstance as any).evolutionInstanceName || dbInstance.instanceName

    // Créer une clé API temporaire pour ce message (ou utiliser une existante)
    let apiKey = await prisma.apiKey.findFirst({
      where: { 
        instanceId,
        isActive: true,
        name: 'internal-web-app'
      }
    })

    if (!apiKey) {
      // Créer une clé API interne pour l'app web
      const keyHash = require('crypto').createHash('sha256').update(`internal-${instanceId}-${Date.now()}`).digest('hex')
      apiKey = await prisma.apiKey.create({
        data: {
          userId,
          instanceId,
          keyHash,
          keyPrefix: 'ak_int_',
          name: 'internal-web-app',
          permissions: ['send_messages'],
          isActive: true
        }
      })
    }

    let messageLog
    try {
      // Envoyer le message via Evolution API
      const result = await evolutionAPI.sendTextMessage(evolutionName, number, text)
      
      // Enregistrer le message comme réussi
      messageLog = await prisma.messageLog.create({
        data: {
          instanceId,
          apiKeyId: apiKey.id,
          recipientNumber: number,
          messageType: 'text',
          messageContent: text.substring(0, 500), // Tronquer si trop long
          status: 'sent',
          evolutionMessageId: result?.key?.id || null,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      })

      // Incrémenter les quotas
      await incrementMessageUsage(instanceId)

      // Mettre à jour le lastUsed de l'instance
      await prisma.instance.update({
        where: { id: instanceId },
        data: { lastUsed: new Date() }
      })

      // Récupérer les stats mises à jour
      const stats = await getUsageStats(instanceId)

      res.json({
        success: true,
        message: result,
        quota: {
          daily: stats.daily,
          monthly: stats.monthly,
          remaining: {
            daily: stats.daily.limit === -1 ? 'Illimité' : Math.max(0, stats.daily.limit - stats.daily.current),
            monthly: stats.monthly.limit === -1 ? 'Illimité' : Math.max(0, stats.monthly.limit - stats.monthly.current)
          }
        }
      })
    } catch (evolutionError: any) {
      // Enregistrer l'échec
      messageLog = await prisma.messageLog.create({
        data: {
          instanceId,
          apiKeyId: apiKey.id,
          recipientNumber: number,
          messageType: 'text',
          messageContent: text.substring(0, 500),
          status: 'failed',
          errorMessage: evolutionError?.response?.data?.message || evolutionError?.message,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      })

      throw evolutionError
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors })
    }
    
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur lors de l\'envoi du message'
    console.error('[SEND TEXT]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

// Endpoint pour récupérer les statistiques d'envoi
router.get('/stats/:instanceName', extractInstanceId, async (req: AuthRequest, res) => {
  try {
    const instanceId = req.instanceId!
    const stats = await getUsageStats(instanceId)

    // Récupérer l'historique des messages récents
    const recentMessages = await prisma.messageLog.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        recipientNumber: true,
        messageType: true,
        status: true,
        createdAt: true,
        errorMessage: true
      }
    })

    // Statistiques par statut
    const statusStats = await prisma.messageLog.groupBy({
      by: ['status'],
      where: { instanceId },
      _count: { status: true }
    })

    // Statistiques des dernières 24h
    const last24h = await prisma.messageLog.count({
      where: {
        instanceId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    res.json({
      quota: {
        daily: stats.daily,
        monthly: stats.monthly,
        canSend: stats.canSend
      },
      statistics: {
        total: stats.total,
        last24h,
        thisHour: stats.thisHour,
        byStatus: statusStats.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {} as Record<string, number>)
      },
      recentMessages
    })
  } catch (error: any) {
    console.error('[STATS]', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' })
  }
})

export default router
