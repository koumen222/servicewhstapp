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
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' })
    }

    const userId = req.user.id
    console.log('[CREATE] userId:', userId, 'customName:', customName)

    const userExists = await prisma.user.findUnique({ where: { id: userId } })
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    }

    const fullInstanceName = buildInstanceName(userId, customName)

    const existing = await prisma.instance.findUnique({ where: { instanceName: fullInstanceName } })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Instance already exists' })
    }

    console.log('[CREATE] Creating Evolution API instance:', fullInstanceName)
    const evolutionResponse = await evolutionAPI.createInstance(fullInstanceName, integration, qrcode)

    const apiKey = crypto.randomBytes(32).toString('hex')

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

    console.log('[CREATE] Instance created successfully:', instance.id)
    return res.json({
      success: true,
      message: 'Instance created successfully',
      data: {
        instance: {
          id: instance.id,
          name: instance.customName,
          instanceName: instance.instanceName,
          status: instance.status,
          createdAt: instance.createdAt,
        },
        evolution: evolutionResponse,
      }
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid data', details: error.errors })
    }
    if (error?.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'User relation error - please log in again' })
    }
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unknown error'
    console.error('[CREATE]', msg, error?.response?.data)
    return res.status(500).json({ success: false, message: msg })
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
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    try {
      const state = await evolutionAPI.getConnectionState(fullInstanceName)
      const rawState = state.instance?.state || state.state || 'close'

      await prisma.instance.update({
        where: { id: dbInstance.id },
        data: { status: rawState }
      })

      return res.json({
        success: true,
        data: { state: rawState, instanceName: fullInstanceName }
      })
    } catch (evolutionError: any) {
      console.warn('[STATE] Evolution API error, using DB fallback:', evolutionError?.message)
      return res.json({
        success: true,
        data: { state: dbInstance.status, instanceName: fullInstanceName }
      })
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[STATE]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

// Reliable status endpoint for polling — returns {success, data: {status, profileName}}
// Status mapping: open → connected, connecting → connecting, close → disconnected
router.get('/status/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    let rawState = dbInstance.status
    try {
      const state = await evolutionAPI.getConnectionState(fullInstanceName)
      rawState = state.instance?.state || state.state || dbInstance.status

      // Persist the latest status
      if (rawState !== dbInstance.status) {
        await prisma.instance.update({
          where: { id: dbInstance.id },
          data: { status: rawState }
        })
      }
    } catch (evolutionError: any) {
      console.warn('[STATUS] Evolution API unreachable, using DB status:', evolutionError?.message)
    }

    // Map Evolution states → frontend ConnectionStatus
    const statusMap: Record<string, string> = {
      open: 'connected',
      connecting: 'connecting',
      close: 'disconnected',
      closed: 'disconnected',
    }
    const status = statusMap[rawState] || 'disconnected'

    return res.json({
      success: true,
      data: {
        status,
        rawState,
        instanceName: dbInstance.customName,
        profileName: dbInstance.profileName || null,
        profilePicture: dbInstance.profilePictureUrl || null,
      }
    })
  } catch (error: any) {
    const msg = error?.message || 'Unknown error'
    console.error('[STATUS]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

router.get('/connect/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName: fullInstanceName, userId } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const result = await evolutionAPI.connectInstance(fullInstanceName)
    return res.json({ success: true, data: result })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[CONNECT]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

router.get('/qrcode/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName: fullInstanceName, userId } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const qrData = await evolutionAPI.fetchQRCode(fullInstanceName)
    const qrBase64 = qrData?.qrcode?.base64 || qrData?.base64 || null

    return res.json({
      success: true,
      data: {
        qrCode: qrBase64,
        pairingCode: qrData?.pairingCode || null,
        count: qrData?.count || 0,
      }
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[QR]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

// Connect with phone number — generates a pairing code
router.post('/connect-phone', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName, phoneNumber } = req.body

    if (!customName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'instanceName and phoneNumber are required' })
    }

    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName: fullInstanceName, userId } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    // Clean phone number: strip spaces, +, and non-digits
    const cleanNumber = phoneNumber.replace(/\D/g, '')

    console.log('[PHONE] Requesting pairing code for:', cleanNumber, 'instance:', fullInstanceName)
    const result = await evolutionAPI.connectWithPhoneNumber(fullInstanceName, cleanNumber)

    return res.json({
      success: true,
      message: 'Pairing code generated. Enter it in WhatsApp.',
      data: {
        pairingCode: result?.code || result?.pairingCode || result,
        instanceName: customName,
      }
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Failed to generate pairing code'
    console.error('[PHONE]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

// Send message from dashboard frontend
router.post('/send-message', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName, number, message } = req.body

    if (!customName || !number || !message) {
      return res.status(400).json({ success: false, message: 'instanceName, number, and message are required' })
    }

    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName: fullInstanceName, userId } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    // Verify instance is connected before sending
    try {
      const state = await evolutionAPI.getConnectionState(fullInstanceName)
      const rawState = state.instance?.state || state.state || 'close'
      if (rawState !== 'open') {
        return res.status(400).json({ success: false, message: 'Instance is not connected. Please scan QR code first.' })
      }
    } catch (stateError: any) {
      console.warn('[SEND] Could not verify connection state:', stateError?.message)
    }

    const result = await evolutionAPI.sendTextMessage(fullInstanceName, number, message)

    await prisma.instance.update({ where: { id: dbInstance.id }, data: { lastUsed: new Date() } })

    return res.json({
      success: true,
      message: 'Message sent successfully',
      data: { messageId: result?.key?.id || null, number, message }
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Failed to send message'
    console.error('[SEND-MSG]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

// Fetch chats from Evolution API
router.get('/chats/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName: fullInstanceName, userId } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const rawChats = await evolutionAPI.getChats(fullInstanceName)
    const chatsArray = Array.isArray(rawChats) ? rawChats : []

    const chats = chatsArray.map((chat: any) => ({
      id: chat.id || chat.remoteJid,
      contactId: chat.id || chat.remoteJid,
      contactName: chat.pushName || chat.name || chat.id?.replace('@s.whatsapp.net', '') || 'Unknown',
      contactAvatar: chat.profilePictureUrl || null,
      unreadCount: chat.unreadCount || 0,
      lastActivity: chat.updatedAt || chat.messageTimestamp || new Date().toISOString(),
      lastMessage: chat.lastMessage ? {
        content: chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || '',
        isFromMe: chat.lastMessage?.key?.fromMe || false,
        timestamp: chat.lastMessage?.messageTimestamp
          ? new Date(Number(chat.lastMessage.messageTimestamp) * 1000).toISOString()
          : new Date().toISOString(),
        status: 'delivered',
      } : null,
      isArchived: false,
      isPinned: false,
    }))

    return res.json({
      success: true,
      data: { chats, total: chats.length }
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Failed to fetch chats'
    console.error('[CHATS]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

// Fetch messages for a specific chat
router.get('/chats/:instanceName/:remoteJid/messages', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName, remoteJid } = req.params
    const limit = parseInt(req.query.limit as string) || 50
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName: fullInstanceName, userId } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const rawMessages = await evolutionAPI.getChatMessages(fullInstanceName, decodeURIComponent(remoteJid), limit)
    const messagesArray = Array.isArray(rawMessages) ? rawMessages : (rawMessages?.messages || [])

    const messages = messagesArray.map((msg: any) => ({
      id: msg.key?.id || msg.id,
      content: msg.message?.conversation ||
               msg.message?.extendedTextMessage?.text ||
               msg.message?.imageMessage?.caption ||
               '[Media]',
      isFromMe: msg.key?.fromMe || false,
      timestamp: msg.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString(),
      status: msg.key?.fromMe ? 'sent' : 'delivered',
      messageType: msg.message?.imageMessage ? 'image' : 'text',
    }))

    return res.json({
      success: true,
      data: { messages, total: messages.length }
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Failed to fetch messages'
    console.error('[MESSAGES]', msg)
    return res.status(500).json({ success: false, message: msg })
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
