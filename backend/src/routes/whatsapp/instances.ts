import { Router, Request, Response } from 'express'
import axios from 'axios'
import { InstanceService } from '../../services/instanceService.js'
import { WhatsAppService } from '../../services/whatsAppService.js'

const router = Router()

// Client axios pour Evolution API
function getEvolutionClient() {
  const baseURL = process.env.EVOLUTION_API_URL
  const apikey = process.env.EVOLUTION_MASTER_API_KEY || process.env.EVOLUTION_API_KEY
  if (!baseURL || !apikey) return null
  return axios.create({
    baseURL,
    headers: { apikey, 'Content-Type': 'application/json' },
    timeout: 15000
  })
}

function normalizeEvolutionInstanceName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
}

// POST /api/create-instance — Créer une instance WhatsApp
router.post('/create-instance', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceName: displayName } = req.body

    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Le nom de l\'instance est requis' })
    }

    // Vérifier la limite du plan
    const count = await InstanceService.countUserInstances(userId, true)
    if (count >= req.user!.maxInstances) {
      return res.status(403).json({
        success: false,
        error: `Limite atteinte : ${req.user!.maxInstances} instance(s) maximum pour votre plan`,
        code: 'MAX_INSTANCES_REACHED'
      })
    }

    // Utiliser le nom demandé pour Evolution API (normalisé)
    const instanceName = normalizeEvolutionInstanceName(displayName)
    if (!instanceName) {
      return res.status(400).json({ success: false, code: 'INVALID_INSTANCE_NAME', error: 'Nom d\'instance invalide pour Evolution API' })
    }

    // Créer dans Evolution API (obligatoire)
    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, code: 'EVOLUTION_UNAVAILABLE', error: 'Service Evolution API indisponible' })
    }

    let evolutionResponse: any
    try {
      const evRes = await evolution.post('/instance/create', {
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: false
      })
      evolutionResponse = evRes.data
    } catch (evErr: any) {
      console.warn(`⚠️ Evolution API error:`, evErr?.response?.data || evErr.message)
      const evolutionMessage = JSON.stringify(evErr?.response?.data || '').toLowerCase()
      if (evErr?.response?.status === 403 && evolutionMessage.includes('already in use')) {
        return res.status(409).json({
          success: false,
          code: 'INSTANCE_NAME_ALREADY_EXISTS',
          error: 'Ce nom d\'instance existe déjà sur Evolution. Choisissez un autre nom.'
        })
      }
      return res.status(502).json({ success: false, code: 'EVOLUTION_CREATE_FAILED', error: 'Impossible de créer l\'instance sur Evolution API' })
    }

    const evolutionInstanceName = evolutionResponse?.instance?.instanceName || evolutionResponse?.instance?.instance || instanceName
    const evolutionInstanceId = evolutionResponse?.instance?.instanceId || ''
    const evolutionApiKey = evolutionResponse?.hash?.apikey || evolutionResponse?.apikey || ''
    const evolutionStatus = evolutionResponse?.instance?.state || evolutionResponse?.instance?.status || 'pending'
    const qrcodeData: any = evolutionResponse?.qrcode || null

    console.log(`✅ Evolution instance créée : ${evolutionInstanceName} (id: ${evolutionInstanceId})`, evolutionApiKey ? `avec clé` : `sans clé API`)

    // Sauvegarder dans user_instances (avec userId)
    const savedInstance = await InstanceService.createUserInstance({
      userId,
      instanceName: evolutionInstanceName,
      evolutionInstanceId,
      customName: displayName.trim(),
      instanceToken: evolutionInstanceId || evolutionApiKey,
      status: evolutionStatus as any,
      isActive: true
    })

    res.status(201).json({
      success: true,
      data: {
        dbId: savedInstance._id?.toString(),
        instance: {
          instanceName: evolutionInstanceName,
          instanceId: evolutionInstanceId,
          status: evolutionStatus,
          customName: displayName.trim()
        },
        qrcode: qrcodeData
      },
      message: 'Instance créée avec succès'
    })
  } catch (error: any) {
    console.error('[POST /api/create-instance]', error)
    res.status(500).json({ success: false, error: 'Échec de la création', message: error.message })
  }
})

// POST /api/refresh-qr/:instanceId — Rafraîchir le QR code
router.post('/refresh-qr/:instanceId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    // Chercher par instanceName dans user_instances
    const instance = await InstanceService.findUserInstanceByName(instanceId, userId)
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance non trouvée' })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, error: 'Service WhatsApp indisponible' })
    }

    const qrRes = await evolution.get(`/instance/connect/${instance.instanceName}`)
    const qrData = qrRes.data?.qrcode || qrRes.data

    // Mettre à jour le statut en DB
    await InstanceService.updateUserInstance(instance._id!.toString(), userId, {
      status: (qrRes.data?.instance?.state || instance.status) as any
    })

    res.json({
      success: true,
      qrcode: { base64: qrData?.base64 || '' },
      pairingCode: qrData?.pairingCode || null,
      count: qrData?.count || 1
    })
  } catch (error: any) {
    console.error('[POST /api/refresh-qr]', error)
    res.status(500).json({ success: false, error: 'Échec du refresh QR', message: error.message })
  }
})

// POST /api/check-connection/:instanceId — Vérifier la connexion
router.post('/check-connection/:instanceId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    const instance = await InstanceService.findUserInstanceByName(instanceId, userId)
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance non trouvée' })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, error: 'Service WhatsApp indisponible' })
    }

    let state = 'close'
    try {
      const connRes = await evolution.get(`/instance/connectionState/${instance.instanceName}`)
      console.log(`🔍 connectionState response for ${instance.instanceName}:`, JSON.stringify(connRes.data))
      state = connRes.data?.instance?.state || connRes.data?.state || 'close'
    } catch (err: any) {
      console.warn(`⚠️ connectionState error for ${instance.instanceName}:`, err?.response?.status, err?.response?.data)
      if (err?.response?.status === 404) state = 'close'
      else throw err
    }

    const connected = state === 'open'
    console.log(`📡 Connection check: ${instance.instanceName} → state=${state}, connected=${connected}`)

    // Persister le nouveau statut
    await InstanceService.updateUserInstance(instance._id!.toString(), userId, { status: state as any })

    res.json({
      success: true,
      connected,
      instanceId,
      status: state,
      fullData: { instance: { state, connectionStatus: connected ? 'connected' : 'disconnected' } }
    })
  } catch (error: any) {
    console.error('[POST /api/check-connection]', error)
    res.status(500).json({ success: false, error: 'Échec de la vérification', message: error.message })
  }
})

// POST /api/send-message/:instanceId — Envoyer un message WhatsApp
router.post('/send-message/:instanceId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params
    const { to, message } = req.body

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Les champs to et message sont requis' })
    }

    const instance = await InstanceService.findUserInstanceByName(instanceId, userId)
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance non trouvée' })
    }

    if (instance.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'L\'instance n\'est pas connectée',
        status: instance.status
      })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, error: 'Service WhatsApp indisponible' })
    }

    const result = await evolution.post(`/message/sendText/${instance.instanceName}`, {
      number: to,
      text: message
    })

    res.json({
      success: true,
      evolution: {
        key: {
          remoteJid: result.data?.key?.remoteJid || to,
          id: result.data?.key?.id || 'unknown'
        }
      },
      instanceId,
      to,
      message
    })
  } catch (error: any) {
    console.error('[POST /api/send-message]', error)
    res.status(500).json({ success: false, error: 'Échec de l\'envoi du message', message: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════
// CHATS & MESSAGES — Evolution API integration
// ═══════════════════════════════════════════════════════════════

// GET /api/instance/chats/:instanceName — Récupérer les conversations
router.get('/instance/chats/:instanceName', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceName } = req.params

    const instance = await InstanceService.findUserInstanceByName(instanceName, userId)
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance non trouvée' })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, error: 'Service WhatsApp indisponible' })
    }

    // Appeler Evolution API pour récupérer les chats (v2 utilise POST)
    const evoRes = await evolution.post(`/chat/findChats/${instance.instanceName}`)
    const rawChats = Array.isArray(evoRes.data) ? evoRes.data : []
    
    // Log pour déboguer la structure des chats
    if (rawChats.length > 0) {
      console.log('📋 Sample chat from Evolution:', JSON.stringify(rawChats[0], null, 2))
    }

    // Mapper les chats Evolution vers le format frontend
    const chats = rawChats
      .filter((c: any) => c.remoteJid) // Inclure tous les chats (groupes et individuels)
      .slice(0, 100) // Limiter à 100 conversations
      .map((c: any) => {
        const remoteJid = c.remoteJid || c.id || ''
        const name = c.pushName || c.name || c.contact?.pushName || remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '')
        const lastMsg = c.lastMessage || c.messages?.[0] || null

        return {
          id: c.id || remoteJid, // ID MongoDB pour l'UI
          instanceId: instance.instanceName,
          contactId: remoteJid, // remoteJid pour l'envoi de messages
          contactName: name,
          contactAvatar: c.profilePicUrl || null,
          unreadCount: c.unreadMessages || 0,
          lastActivity: lastMsg?.messageTimestamp
            ? new Date(Number(lastMsg.messageTimestamp) * 1000).toISOString()
            : c.updatedAt || new Date().toISOString(),
          lastMessage: lastMsg ? {
            id: lastMsg.key?.id || `msg_${Date.now()}`,
            chatId: remoteJid,
            instanceId: instance.instanceName,
            senderId: lastMsg.key?.fromMe ? 'me' : remoteJid,
            recipientId: lastMsg.key?.fromMe ? remoteJid : 'me',
            content: lastMsg.message?.conversation
              || lastMsg.message?.extendedTextMessage?.text
              || lastMsg.message?.imageMessage?.caption
              || '[Media]',
            messageType: 'text',
            status: lastMsg.key?.fromMe ? 'sent' : 'delivered',
            isFromMe: Boolean(lastMsg.key?.fromMe),
            timestamp: lastMsg.messageTimestamp
              ? new Date(Number(lastMsg.messageTimestamp) * 1000).toISOString()
              : new Date().toISOString(),
          } : null,
          messages: [],
        }
      })
      .sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

    console.log(`📨 Chats loaded for ${instance.instanceName}: ${chats.length} conversations`)

    res.json({
      success: true,
      data: { chats }
    })
  } catch (error: any) {
    console.error('[GET /api/instance/chats]', error?.response?.data || error?.message)
    res.status(500).json({ success: false, error: 'Échec de la récupération des chats', message: error.message })
  }
})

// GET /api/instance/chats/:instanceName/:remoteJid/messages — Récupérer les messages d'une conversation
router.get('/instance/chats/:instanceName/:remoteJid/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceName, remoteJid } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    const instance = await InstanceService.findUserInstanceByName(instanceName, userId)
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance non trouvée' })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, error: 'Service WhatsApp indisponible' })
    }

    // Appeler Evolution API pour récupérer les messages
    const evoRes = await evolution.post(`/chat/findMessages/${instance.instanceName}`, {
      where: {
        key: {
          remoteJid: decodeURIComponent(remoteJid)
        }
      },
      limit
    })
    const rawMessages = Array.isArray(evoRes.data) ? evoRes.data : evoRes.data?.messages || []

    // Mapper les messages Evolution vers le format frontend
    const messages = rawMessages.map((m: any) => {
      const key = m.key || {}
      const msg = m.message || {}
      const content = msg.conversation
        || msg.extendedTextMessage?.text
        || msg.imageMessage?.caption
        || msg.videoMessage?.caption
        || msg.documentMessage?.title
        || msg.audioMessage ? '[Audio]'
        : msg.stickerMessage ? '[Sticker]'
        : msg.contactMessage?.displayName ? `[Contact: ${msg.contactMessage.displayName}]`
        : msg.locationMessage ? '[Location]'
        : '[Media]'

      return {
        id: key.id || m.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        chatId: key.remoteJid || remoteJid,
        instanceId: instance.instanceName,
        senderId: key.fromMe ? 'me' : key.remoteJid || remoteJid,
        recipientId: key.fromMe ? key.remoteJid || remoteJid : 'me',
        content,
        messageType: msg.imageMessage ? 'image'
          : msg.audioMessage ? 'audio'
          : msg.videoMessage ? 'video'
          : msg.documentMessage ? 'document'
          : 'text',
        status: m.status === 'READ' ? 'read'
          : m.status === 'DELIVERY_ACK' ? 'delivered'
          : key.fromMe ? 'sent'
          : 'delivered',
        isFromMe: Boolean(key.fromMe),
        timestamp: m.messageTimestamp
          ? new Date(Number(m.messageTimestamp) * 1000).toISOString()
          : m.createdAt || new Date().toISOString(),
      }
    })

    console.log(`💬 Messages loaded for ${remoteJid}: ${messages.length} messages`)

    res.json({
      success: true,
      data: { messages }
    })
  } catch (error: any) {
    console.error('[GET /api/instance/chats/messages]', error?.response?.data || error?.message)
    res.status(500).json({ success: false, error: 'Échec de la récupération des messages', message: error.message })
  }
})

// POST /api/instance/send-message — Envoyer un message via Evolution API
router.post('/instance/send-message', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceName, number, message } = req.body

    console.log(`📤 Send message request:`, { instanceName, number: number?.substring(0, 50), messageLength: message?.length })

    if (!number || !message) {
      return res.status(400).json({ success: false, error: 'number et message sont requis' })
    }

    // Si instanceName n'est pas fourni, utiliser la première instance connectée de l'utilisateur
    let instance
    if (instanceName) {
      instance = await InstanceService.findUserInstanceByName(instanceName, userId)
    } else {
      const allInstances = await InstanceService.findUserInstances(userId)
      instance = allInstances.find((i: any) => i.status === 'open') || allInstances[0]
    }

    if (!instance) {
      return res.status(404).json({ success: false, error: 'Aucune instance WhatsApp trouvée. Créez-en une d\'abord.' })
    }

    if (instance.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Instance WhatsApp non connectée. Scannez le QR code d\'abord.' })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, error: 'Service WhatsApp indisponible' })
    }

    // Envoyer via Evolution API
    console.log(`📤 Calling Evolution API: POST /message/sendText/${instance.instanceName}`, { number, text: message.substring(0, 50) })
    const result = await evolution.post(`/message/sendText/${instance.instanceName}`, {
      number,
      text: message
    })

    console.log(`✅ Message sent via ${instance.instanceName} to ${number}`)

    res.json({
      success: true,
      data: {
        key: result.data?.key || {},
        messageId: result.data?.key?.id || null,
        status: 'sent',
        instanceUsed: instance.instanceName
      }
    })
  } catch (error: any) {
    console.error('[POST /api/instance/send-message] Error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    res.status(500).json({ 
      success: false, 
      error: 'Échec de l\'envoi du message', 
      message: error?.response?.data?.message || error.message 
    })
  }
})

// POST /api/whatsapp/send — Endpoint simple pour envoyer un message WhatsApp
// Utilise automatiquement l'instance connectée de l'utilisateur
router.post('/whatsapp/send', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { number, message } = req.body

    if (!number || !message) {
      return res.status(400).json({ success: false, error: 'number et message sont requis' })
    }

    const result = await WhatsAppService.send(userId, number, message)

    res.json({
      success: true,
      message: 'Message envoyé avec succès',
      data: result
    })
  } catch (error: any) {
    console.error('[POST /api/whatsapp/send] Error:', error.message)
    res.status(error.message.includes('Aucune instance') ? 404 : 500).json({ 
      success: false, 
      error: 'Échec de l\'envoi du message', 
      details: error.message 
    })
  }
})

// POST /api/whatsapp/send-bulk — Envoyer un message à plusieurs numéros
router.post('/whatsapp/send-bulk', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { numbers, message, instanceName } = req.body

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ success: false, error: 'Le champ numbers doit être un tableau non vide' })
    }

    if (!message) {
      return res.status(400).json({ success: false, error: 'Le champ message est requis' })
    }

    // Trouver l'instance à utiliser
    let instance
    if (instanceName) {
      instance = await InstanceService.findUserInstanceByName(instanceName, userId)
    } else {
      const allInstances = await InstanceService.findUserInstances(userId)
      instance = allInstances.find((i: any) => i.status === 'open') || allInstances[0]
    }

    if (!instance) {
      return res.status(404).json({ success: false, error: 'Aucune instance WhatsApp trouvée' })
    }

    if (instance.status !== 'open') {
      return res.status(400).json({ success: false, error: 'L\'instance sélectionnée n\'est pas connectée' })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ success: false, error: 'Service WhatsApp indisponible' })
    }

    console.log(`🚀 Starting bulk send to ${numbers.length} numbers via ${instance.instanceName}`)

    const results = []
    for (const number of numbers) {
      try {
        const result = await evolution.post(`/message/sendText/${instance.instanceName}`, {
          number,
          text: message
        })
        results.push({ number, success: true, messageId: result.data?.key?.id })
      } catch (err: any) {
        console.error(`❌ Failed to send to ${number}:`, err?.response?.data || err.message)
        results.push({ number, success: false, error: err?.response?.data?.message || err.message })
      }
      // Petit délai pour éviter de saturer l'API ou d'être banni par WhatsApp
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const summary = {
      total: numbers.length,
      successCount: results.filter(r => r.success).length,
      failCount: results.filter(r => !r.success).length
    }

    console.log(`✅ Bulk send completed: ${summary.successCount} success, ${summary.failCount} failed`)

    res.json({
      success: true,
      message: 'Envoi groupé terminé',
      summary,
      results,
      instanceUsed: instance.instanceName
    })
  } catch (error: any) {
    console.error('[POST /api/whatsapp/send-bulk] Error:', error)
    res.status(500).json({ success: false, error: 'Échec de l\'envoi groupé', message: error.message })
  }
})

export default router
