import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'
import { evolutionAPI } from '../lib/evolution.js'
import { buildInstanceName } from '../utils/instanceName.js'
import { checkInstanceQuota } from '../middleware/quota.js'
import { getUsageStats, canSendMessage, incrementMessageUsage } from '../utils/quotaManager.js'
import { env } from '../config/env.js'

const router = Router()

console.log('✅ Instance routes module loaded')

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
  qrcode: z.boolean().optional().default(false), // Do NOT auto-connect on creation
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
    const evolutionResponse = await evolutionAPI.createInstance(fullInstanceName, integration, false) // qrcode:false — no auto-connect

    // Configurer le webhook pour recevoir les mises à jour de statut
    const webhookUrl = `${getPublicApiBaseUrl(req) || env.BACKEND_PUBLIC_URL}/webhooks/evolution`
    try {
      await evolutionAPI.setWebhook(fullInstanceName, webhookUrl)
      console.log('[CREATE] Webhook configured:', webhookUrl)
    } catch (webhookError: any) {
      console.warn('[CREATE] Failed to configure webhook (non-critical):', webhookError.message)
    }

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

    const dbInstance = await prisma.instance.findFirst({
      where: { instanceName: customName, userId, isActive: true }
    })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    try {
      const state = await evolutionAPI.getConnectionState(dbInstance.instanceName)
      const rawState = state.instance?.state || state.state || 'close'

      await prisma.instance.update({
        where: { id: dbInstance.id },
        data: { status: rawState }
      })

      return res.json({
        success: true,
        data: { state: rawState, instanceName: dbInstance.instanceName }
      })
    } catch (evolutionError: any) {
      console.warn('[STATE] Evolution API error, using DB fallback:', evolutionError?.message)
      return res.json({
        success: true,
        data: { state: dbInstance.status, instanceName: dbInstance.instanceName }
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
  console.log('[STATUS] Route hit - instanceName:', req.params.instanceName);
  try {
    const { instanceName } = req.params // Now this is the real 5-digit ID or old format
    const userId = req.user!.id

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    let rawState = dbInstance.status
    try {
      const state = await evolutionAPI.getConnectionState(instanceName)
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

    const dbInstance = await prisma.instance.findFirst({ where: { instanceName: customName, userId, isActive: true } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const result = await evolutionAPI.connectInstance(dbInstance.instanceName)
    return res.json({ success: true, data: result })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error('[CONNECT]', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

router.get('/qrcode/:instanceName', async (req: AuthRequest, res) => {
  console.log('[QR] Route hit - instanceName:', req.params.instanceName);
  try {
    const { instanceName } = req.params // Now this is the real 5-digit ID or old format
    const userId = req.user!.id

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName, userId } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const qrData = await evolutionAPI.fetchQRCode(instanceName)
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

    const dbInstance = await prisma.instance.findFirst({ where: { instanceName: customName, userId, isActive: true } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    // Clean phone number: strip spaces, +, and non-digits
    const cleanNumber = phoneNumber.replace(/\D/g, '')

    console.log('[PHONE] Requesting pairing code for:', cleanNumber, 'instance:', dbInstance.instanceName)
    const result = await evolutionAPI.connectWithPhoneNumber(dbInstance.instanceName, cleanNumber)

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

    const dbInstance = await prisma.instance.findFirst({ 
      where: { instanceName: customName, userId, isActive: true },
      include: { user: true }
    })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    // Check quota limits before sending
    const quotaCheck = await canSendMessage(dbInstance.id)
    if (!quotaCheck.canSend) {
      return res.status(403).json({
        success: false,
        message: quotaCheck.reason || 'Message quota exceeded',
        code: 'QUOTA_EXCEEDED',
        quota: {
          dailyUsed: quotaCheck.dailyUsage,
          dailyLimit: quotaCheck.dailyLimit,
          monthlyUsed: quotaCheck.monthlyUsage,
          monthlyLimit: quotaCheck.monthlyLimit
        }
      })
    }

    // Verify instance is connected before sending
    try {
      const state = await evolutionAPI.getConnectionState(dbInstance.instanceName)
      const rawState = state.instance?.state || state.state || 'close'
      if (rawState !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'Instance is not connected. Please scan QR code or use phone pairing first.',
          code: 'INSTANCE_NOT_CONNECTED'
        })
      }
    } catch (stateError: any) {
      console.warn('[SEND] Could not verify connection state:', stateError?.message)
      // If Evolution API is unreachable, check the DB status as fallback
      if (dbInstance.status !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'Instance is not connected. Please scan QR code or use phone pairing first.',
          code: 'INSTANCE_NOT_CONNECTED'
        })
      }
    }

    // JID handling for Evolution API:
    // "@g.us"            → pass full JID (group)
    // "@lid"             → pass full JID (WhatsApp Linked Device — phone number hidden)
    // "@s.whatsapp.net"  → strip suffix, send plain number
    // plain number       → send as-is
    let cleanNumber: string
    if (number.includes('@g.us') || number.includes('@lid')) {
      cleanNumber = number // pass full JID for groups and linked devices
    } else {
      cleanNumber = number.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9+]/g, '')
    }

    if (!cleanNumber) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' })
    }

    console.log(`[SEND-MSG] Sending to ${cleanNumber} via ${dbInstance.instanceName}`)
    
    // Get or create API key BEFORE sending (required for logging)
    let apiKey = await prisma.apiKey.findFirst({
      where: { instanceId: dbInstance.id }
    })
    
    if (!apiKey) {
      const keyString = `default-${dbInstance.id}-${Date.now()}`
      apiKey = await prisma.apiKey.create({
        data: {
          userId: dbInstance.userId,
          instanceId: dbInstance.id,
          name: 'Default Key',
          keyHash: crypto.createHash('sha256').update(keyString).digest('hex'),
          keyPrefix: 'ak_default',
          permissions: ['send_message', 'read_message']
        }
      })
    }

    // Send message via Evolution API
    let result
    let sendError = null
    try {
      result = await evolutionAPI.sendTextMessage(dbInstance.instanceName, cleanNumber, message)
    } catch (err: any) {
      sendError = err
      console.error('[SEND-MSG] Evolution API error:', err?.message)
    }

    // ALWAYS log and increment quota, even if send failed
    // This prevents quota bypass by intentionally failing sends
    try {
      await prisma.messageLog.create({
        data: {
          instanceId: dbInstance.id,
          apiKeyId: apiKey.id,
          recipientNumber: cleanNumber,
          messageType: 'text',
          messageContent: message.substring(0, 500),
          status: sendError ? 'failed' : 'sent',
          evolutionMessageId: result?.key?.id || null,
          errorMessage: sendError?.message || null
        }
      })

      // CRITICAL: Always increment quota when attempt is made
      await incrementMessageUsage(dbInstance.id)
      console.log(`[QUOTA] Incremented usage for instance ${dbInstance.id}`)

      await prisma.instance.update({ 
        where: { id: dbInstance.id }, 
        data: { lastUsed: new Date() } 
      })
    } catch (logError: any) {
      console.error('[SEND-MSG] Failed to log message or increment quota:', logError?.message)
      // Continue anyway - message was sent
    }

    // If Evolution API failed, throw error now (after logging)
    if (sendError) {
      throw sendError
    }

    // Get updated quota info
    const updatedQuota = await canSendMessage(dbInstance.id)

    return res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: result?.key?.id || null,
        remoteJid: result?.key?.remoteJid || number,
        timestamp: result?.messageTimestamp || new Date().toISOString(),
        status: result?.status || 'PENDING',
        number: cleanNumber,
        text: message
      },
      quota: {
        dailyUsed: updatedQuota.dailyUsage,
        dailyLimit: updatedQuota.dailyLimit,
        monthlyUsed: updatedQuota.monthlyUsage,
        monthlyLimit: updatedQuota.monthlyLimit,
        dailyRemaining: updatedQuota.dailyLimit === -1 ? -1 : (updatedQuota.dailyLimit || 0) - (updatedQuota.dailyUsage || 0),
        monthlyRemaining: updatedQuota.monthlyLimit === -1 ? -1 : (updatedQuota.monthlyLimit || 0) - (updatedQuota.monthlyUsage || 0)
      }
    })
  } catch (error: any) {
    const evolutionMsg = error?.response?.data?.message || error?.response?.data?.error
    const msg = evolutionMsg || error?.message || 'Failed to send message'
    console.error('[SEND-MSG] Final error:', { 
      number: req.body?.number, 
      statusCode: error?.response?.status, 
      msg,
      note: 'Quota was still incremented to prevent abuse'
    })
    return res.status(500).json({ 
      success: false, 
      message: msg,
      note: 'Message quota was consumed even though send failed'
    })
  }
})

// Fetch chats from Evolution API
router.get('/chats/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName } = req.params // Real 5-digit ID — same pattern as /status and /qrcode
    const userId = req.user!.id

    console.log(`[CHATS] Fetching chats for instanceName="${instanceName}", userId="${userId}"`)

    const dbInstance = await prisma.instance.findUnique({ where: { instanceName, userId } })
    if (!dbInstance) {
      console.warn(`[CHATS] Instance not found in DB: ${instanceName}`)
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    console.log(`[CHATS] DB instance found, status="${dbInstance.status}", calling Evolution API...`)

    const rawChats = await evolutionAPI.getChats(instanceName)
    const chatsArray = Array.isArray(rawChats) ? rawChats : []

    console.log(`[CHATS] Evolution API returned ${chatsArray.length} chats`)

    const chats = chatsArray.map((chat: any) => {
      // Extract last message content
      let lastMessageContent = ''
      if (chat.lastMessage?.message) {
        const msg = chat.lastMessage.message
        lastMessageContent = msg.conversation || 
                           msg.extendedTextMessage?.text || 
                           msg.imageMessage?.caption || 
                           (msg.imageMessage ? '[Image]' : '') ||
                           (msg.videoMessage ? '[Video]' : '') ||
                           (msg.audioMessage ? '[Audio]' : '') ||
                           (msg.documentMessage ? '[Document]' : '') ||
                           (msg.stickerMessage ? '[Sticker]' : '') ||
                           ''
      }

      // remoteJid is the actual WhatsApp JID (e.g. 5511999@s.whatsapp.net)
      // chat.id in Evolution API may be an internal ID — always prefer remoteJid
      const jid = chat.remoteJid || chat.id || ''
      return {
        id: jid,
        contactId: jid,
        contactName: chat.pushName || chat.name || jid.replace('@s.whatsapp.net', '').replace('@g.us', '') || 'Unknown',
        contactAvatar: chat.profilePictureUrl || null,
        unreadCount: chat.unreadCount || 0,
        lastActivity: chat.updatedAt || 
                     (chat.lastMessage?.messageTimestamp 
                       ? new Date(Number(chat.lastMessage.messageTimestamp) * 1000).toISOString()
                       : new Date().toISOString()),
        lastMessage: chat.lastMessage ? {
          id: chat.lastMessage.key?.id || 'unknown',
          content: lastMessageContent,
          isFromMe: chat.lastMessage.key?.fromMe || false,
          timestamp: chat.lastMessage.messageTimestamp
            ? new Date(Number(chat.lastMessage.messageTimestamp) * 1000).toISOString()
            : new Date().toISOString(),
          status: 'delivered',
        } : null,
        isArchived: false,
        isPinned: false,
      }
    })

    return res.json({
      success: true,
      data: { chats, total: chats.length }
    })
  } catch (error: any) {
    const evolutionError = error?.response?.data
    const statusCode = error?.response?.status
    const msg = evolutionError?.message || evolutionError?.error || error?.message || 'Failed to fetch chats'
    
    console.error('[CHATS] Error details:', {
      instanceName: req.params.instanceName,
      statusCode,
      evolutionError,
      errorMessage: msg
    })

    // If instance doesn't exist in Evolution API (404), return empty chats instead of error
    if (statusCode === 404) {
      console.warn('[CHATS] Instance not found in Evolution API, returning empty chats')
      return res.json({
        success: true,
        data: { chats: [], total: 0 },
        warning: 'Instance not connected to WhatsApp yet'
      })
    }

    return res.status(500).json({ success: false, message: msg })
  }
})

// Fetch messages for a specific chat
router.get('/chats/:instanceName/:remoteJid/messages', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName, remoteJid } = req.params
    const limit = parseInt(req.query.limit as string) || 50
    const userId = req.user!.id

    const dbInstance = await prisma.instance.findFirst({ where: { instanceName: customName, userId, isActive: true } })
    if (!dbInstance) {
      return res.status(404).json({ success: false, message: 'Instance not found' })
    }

    const decodedJid = decodeURIComponent(remoteJid)
    console.log(`[MESSAGES] Fetching messages: instance=${dbInstance.instanceName}, remoteJid=${decodedJid}`)
    const rawMessages = await evolutionAPI.getChatMessages(dbInstance.instanceName, decodedJid, limit)
    // Evolution API may return: array | { messages: [] } | { message: [] }
    const messagesArray = Array.isArray(rawMessages)
      ? rawMessages
      : (rawMessages?.messages || rawMessages?.message || [])

    const messages = messagesArray.map((msg: any) => {
      // Extract message content from various possible fields
      let content = '[Message]'
      let messageType = 'text'

      if (msg.message) {
        if (msg.message.conversation) {
          content = msg.message.conversation
        } else if (msg.message.extendedTextMessage?.text) {
          content = msg.message.extendedTextMessage.text
        } else if (msg.message.imageMessage) {
          content = msg.message.imageMessage.caption || '[Image]'
          messageType = 'image'
        } else if (msg.message.videoMessage) {
          content = msg.message.videoMessage.caption || '[Video]'
          messageType = 'video'
        } else if (msg.message.audioMessage) {
          content = '[Audio]'
          messageType = 'audio'
        } else if (msg.message.documentMessage) {
          content = msg.message.documentMessage.fileName || '[Document]'
          messageType = 'document'
        } else if (msg.message.stickerMessage) {
          content = '[Sticker]'
          messageType = 'sticker'
        } else if (msg.message.contactMessage) {
          content = `[Contact: ${msg.message.contactMessage.displayName || 'Unknown'}]`
          messageType = 'contact'
        }
      }

      return {
        id: msg.key?.id || msg.id || `msg_${Date.now()}`,
        content,
        isFromMe: msg.key?.fromMe || false,
        timestamp: msg.messageTimestamp
          ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
          : new Date().toISOString(),
        status: msg.key?.fromMe ? (msg.status || 'sent') : 'delivered',
        messageType,
        remoteJid: msg.key?.remoteJid || remoteJid
      }
    })

    return res.json({
      success: true,
      data: { messages, total: messages.length }
    })
  } catch (error: any) {
    const statusCode = error?.response?.status
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to fetch messages'
    console.error('[MESSAGES] Error:', { remoteJid: req.params.remoteJid, statusCode, msg })
    // Return empty messages instead of 500 for not-found/disconnected cases
    if (statusCode === 404 || statusCode === 400) {
      return res.json({ success: true, data: { messages: [], total: 0 }, warning: msg })
    }
    return res.status(500).json({ success: false, message: msg })
  }
})

router.delete('/logout/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id

    const dbInstance = await prisma.instance.findFirst({
      where: { instanceName: customName, userId, isActive: true }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const result = await evolutionAPI.logoutInstance(dbInstance.instanceName)

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

    const dbInstance = await prisma.instance.findFirst({
      where: { instanceName: customName, userId, isActive: true }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    await evolutionAPI.deleteInstance(dbInstance.instanceName)
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

    const dbInstance = await prisma.instance.findFirst({
      where: { instanceName: customName, userId, isActive: true }
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

    const dbInstance = await prisma.instance.findFirst({
      where: { instanceName: customName, userId, isActive: true }
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
