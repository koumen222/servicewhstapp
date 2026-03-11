import express from 'express'
import { InstanceService } from '../services/instanceService.js'
import { UserService } from '../services/userService.js'
import { buildInstanceName } from '../utils/instanceName.js'
import axios from 'axios'
import crypto from 'crypto'

const router = express.Router()

// Client axios centralisé pour Evolution API
const createEvolutionClient = () => {
  const baseURL = process.env.EVOLUTION_API_URL
  const apikey = process.env.EVOLUTION_MASTER_API_KEY || process.env.EVOLUTION_API_KEY
  
  if (!baseURL || !apikey) {
    console.error('❌ Evolution API not configured')
    console.error('   EVOLUTION_API_URL:', baseURL || '(empty)')
    console.error('   API Key:', apikey ? 'set' : '(empty)')
    return null
  }
  
  return axios.create({
    baseURL,
    headers: {
      'apikey': apikey,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  })
}

/**
 * POST /create-instance
 * Créer une nouvelle instance WhatsApp pour l'utilisateur connecté
 */
router.post('/create-instance', async (req, res) => {
  try {
    const { customName, integration = 'WHATSAPP-BAILEYS' } = req.body
    const userId = req.user?.id // Supposé venir du middleware d'auth JWT

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (!customName || customName.trim().length === 0) {
      return res.status(400).json({
        error: 'Instance name is required',
        code: 'INVALID_NAME'
      })
    }

    // Valider le nom d'instance (caractères alphanumériques + tirets)
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(customName.trim())) {
      return res.status(400).json({
        error: 'Invalid instance name. Use 3-30 alphanumeric characters, underscores, or hyphens only',
        code: 'INVALID_NAME_FORMAT'
      })
    }

    // Récupérer l'utilisateur avec ses quotas
    const user = await UserService.findById(userId)

    if (!user || !user.isActive) {
      return res.status(403).json({
        error: 'User account not found or inactive',
        code: 'USER_INACTIVE'
      })
    }

    // Vérifier les limites d'instances selon le plan
    const userInstances = await InstanceService.countUserInstances(userId, true)
    if (userInstances >= user.maxInstances) {
      return res.status(400).json({
        error: 'Instance limit reached',
        message: `Your ${user.plan} plan allows maximum ${user.maxInstances} instances`,
        code: 'INSTANCE_LIMIT_REACHED',
        currentCount: userInstances,
        maxAllowed: user.maxInstances
      })
    }

    // Générer un ID unique à 5 chiffres (retry jusqu'à 5 fois en cas de collision)
    let instanceName: string = ''
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      instanceName = buildInstanceName(userId, customName.trim())
      const existing = await InstanceService.findByInstanceName(instanceName)
      if (!existing) break
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({
        error: 'Failed to generate unique instance ID',
        message: 'Please try again',
        code: 'ID_GENERATION_FAILED'
      })
    }

    // Créer l'instance dans Evolution API (sans qrcode pour éviter l'auto-connexion)
    const evolutionResponse = await createEvolutionInstance(instanceName, integration)

    // IMPORTANT: Extraire le token COMPLET d'Evolution tel quel, sans modification
    const evolutionApiKey = evolutionResponse?.hash?.apikey || evolutionResponse?.apikey || ''
    
    if (!evolutionApiKey) {
      console.warn('⚠️ Aucun token Evolution reçu, génération d\'un token temporaire')
    }
    
    console.log(`🔑 Token Evolution complet : ${evolutionApiKey ? evolutionApiKey.substring(0, 20) + '...' : 'non fourni'}`)

    // Créer l'instance dans notre base de données
    const instance = await InstanceService.createUserInstance({
      userId,
      instanceName,
      customName: customName.trim(),
      instanceToken: evolutionApiKey,
      status: 'disconnected',
      isActive: true
    })

    // Initialiser les quotas pour cette instance (TODO: implement QuotaService)
    // await QuotaService.initializeInstanceQuotas(instance._id!.toString(), user.plan)

    // Créer une clé API par défaut (TODO: implement ApiKeyService)
    // const { apiKey, keyData } = await ApiKeyService.createApiKey({
    //   userId,
    //   instanceId: instance._id!.toString(),
    //   name: `${customName} - Default Key`,
    //   permissions: ['send_message', 'get_instance_status']
    // })
    
    const apiKey = 'temp-key-' + instance.instanceToken

    // Réponse avec toutes les informations nécessaires
    const response = {
      success: true,
      message: 'Instance created successfully',
      data: {
        instance: {
          id: instance._id?.toString(),
          name: instance.customName,
          instanceName: instance.instanceName,
          status: instance.status,
          createdAt: instance.createdAt,
          // Envoyer le token COMPLET d'Evolution tel quel, sans modification
          instanceToken: evolutionApiKey,
          apiKey: evolutionApiKey
        },
        apiKey: {
          key: evolutionApiKey, // Token Evolution complet en clair (sera affiché une seule fois)
          id: 'temp-id',
          name: 'Default Key',
          prefix: 'temp',
          permissions: ['send_message', 'get_instance_status']
        },
        quotas: [], // TODO: implement QuotaService
        qrCode: evolutionResponse.qrcode || null
      }
    }

    res.status(201).json(response)

  } catch (error) {
    console.error('Create instance error:', error)
    
    if (error instanceof Error && error.message.includes('Evolution API')) {
      return res.status(502).json({
        error: 'WhatsApp service unavailable',
        message: 'Unable to create instance on WhatsApp service',
        code: 'EVOLUTION_API_ERROR'
      })
    }

    return res.status(500).json({
      error: 'Failed to create instance',
      message: 'An unexpected error occurred',
      code: 'CREATION_ERROR'
    })
  }
})

/**
 * GET /instances
 * Lister toutes les instances de l'utilisateur connecté avec synchronisation Evolution API
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instances = await InstanceService.findUserInstances(userId, true)

    // Status mapping: Evolution API raw state → frontend ConnectionStatus
    const statusMap: Record<string, string> = {
      open: 'connected',
      connecting: 'connecting',
      close: 'disconnected',
      closed: 'disconnected',
      pending: 'disconnected',
      disconnected: 'disconnected',
      error: 'disconnected'
    }

    // Synchroniser avec Evolution API pour obtenir les vrais statuts
    const evolution = createEvolutionClient()
    let evolutionStates: Record<string, { state: string, profileName?: string, profilePicUrl?: string, number?: string }> = {}
    
    if (evolution) {
      try {
        console.log('🔄 Fetching all Evolution instances for status sync...')
        const evoRes = await evolution.get('/instance/fetchInstances', { timeout: 5000 })
        const evoInstances = Array.isArray(evoRes.data) ? evoRes.data : []
        
        for (const evo of evoInstances) {
          const name = evo.name || evo.instanceName
          if (name) {
            evolutionStates[name] = {
              state: evo.connectionStatus || evo.state || 'close',
              profileName: evo.profileName || undefined,
              profilePicUrl: evo.profilePicUrl || undefined,
              number: evo.number || undefined,
            }
          }
        }
        console.log(`✅ Synced ${evoInstances.length} Evolution instances`)
      } catch (evoErr: any) {
        console.warn('⚠️ Could not fetch Evolution states:', evoErr?.message)
      }
    }

    // Enrichir les données avec le statut Evolution API et récupérer les tokens complets
    const enrichedInstances = await Promise.all(
      instances.map(async (instance: any) => {
        const evoState = evolutionStates[instance.instanceName]
        const realStatus = evoState?.state || instance.status
        const isOpen = realStatus === 'open'

        // Mettre à jour en DB si le statut a changé
        if (evoState && realStatus !== instance.status) {
          InstanceService.updateUserInstance(instance._id!.toString(), userId, {
            status: realStatus as any,
            ...(evoState.profileName ? { profileName: evoState.profileName } : {}),
            ...(evoState.profilePicUrl ? { profilePictureUrl: evoState.profilePicUrl } : {}),
            ...(evoState.number ? { whatsappNumber: evoState.number } : {}),
          }).catch(() => {})
        }

        // Récupérer le vrai token si le token stocké est court
        let realToken = instance.instanceToken
        const hasShortToken = instance.instanceToken && instance.instanceToken.length < 50
        
        if (hasShortToken && evolution) {
          try {
            console.log(`🔍 Fetching real token for instance: ${instance.instanceName}`)
            const fetchRes = await evolution.get('/instance/fetchInstances', {
              params: { instanceName: instance.instanceName },
              headers: { 'apikey': process.env.EVOLUTION_MASTER_API_KEY }
            })
            
            let evoInstances = []
            if (Array.isArray(fetchRes.data)) {
              evoInstances = fetchRes.data
            } else if (fetchRes.data?.response && Array.isArray(fetchRes.data.response)) {
              evoInstances = fetchRes.data.response
            } else if (fetchRes.data) {
              evoInstances = [fetchRes.data]
            }
            
            const foundInstance = evoInstances.find((evo: any) => 
              (evo.name || evo.instanceName) === instance.instanceName
            )
            
            if (foundInstance) {
              if (foundInstance.hash && typeof foundInstance.hash === 'string') {
                realToken = foundInstance.hash
                console.log(`✅ Token found in hash: ${realToken?.substring(0, 20)}...`)
              } else if (foundInstance.hash?.apikey) {
                realToken = foundInstance.hash.apikey
                console.log(`✅ Token found in hash.apikey: ${realToken?.substring(0, 20)}...`)
              } else if (foundInstance.apikey) {
                realToken = foundInstance.apikey
                console.log(`✅ Token found in apikey: ${realToken?.substring(0, 20)}...`)
              }
              
              // Mettre à jour le token en DB
              if (realToken && realToken !== instance.instanceToken) {
                console.log(`💾 Updating token in DB for ${instance.instanceName}`)
                InstanceService.updateUserInstance(instance._id!.toString(), userId, {
                  instanceToken: realToken
                }).catch(() => {})
              }
            }
          } catch (err: any) {
            console.warn(`⚠️ Could not fetch real token for ${instance.instanceName}:`, err?.message)
          }
        }

        const connectionStatus = isOpen ? 'connected' : (statusMap[realStatus] || 'disconnected')

        return {
          id: instance._id?.toString(),
          _id: instance._id?.toString(),
          instanceId: instance._id?.toString(),
          name: instance.customName,
          customName: instance.customName,
          instanceName: instance.instanceName,
          evolutionInstanceId: instance.evolutionInstanceId || '',
          status: realStatus,
          connectionStatus,
          instanceToken: realToken,
          apiKey: realToken,
          whatsappNumber: evoState?.number || instance.whatsappNumber,
          profileName: evoState?.profileName || instance.profileName,
          profilePictureUrl: evoState?.profilePicUrl || instance.profilePictureUrl,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
          lastUsed: instance.lastActivity,
          lastActivity: instance.lastActivity,
          apiKeys: [], // TODO: Get from ApiKeyService
          quotas: [], // TODO: Get from QuotaService
          stats: {
            messagesLast30Days: 0, // TODO: Get from MessageLogService
            totalApiKeys: 0 // TODO: Get from ApiKeyService
          }
        }
      })
    )

    const response = {
      success: true,
      data: {
        instances: enrichedInstances,
        summary: {
          totalInstances: instances.length,
          activeInstances: enrichedInstances.filter(i => i.connectionStatus === 'connected').length,
          maxAllowed: req.user?.maxInstances || 1
        }
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('List instances error:', error)
    
    return res.status(500).json({
      error: 'Failed to list instances',
      message: 'An error occurred while retrieving instances',
      code: 'LIST_ERROR'
    })
  }
})

/**
 * POST /instances/:instanceId/check-connection
 * Vérifier la connexion d'une instance WhatsApp
 */
router.post('/:instanceId/check-connection', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Vérifier la connexion via Evolution API
    const evolution = createEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: 'WhatsApp service unavailable',
        code: 'EVOLUTION_UNAVAILABLE'
      })
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

    // Mettre à jour le statut en DB
    await InstanceService.updateUserInstance(instanceId, userId, { status: state as any })

    const response = {
      success: true,
      data: {
        instanceId,
        instanceName: instance.customName,
        connected,
        status: state,
        connectionStatus: connected ? 'connected' : 'disconnected',
        fullData: { instance: { state, connectionStatus: connected ? 'connected' : 'disconnected' } }
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Check connection error:', error)
    return res.status(500).json({
      error: 'Failed to check connection',
      code: 'CONNECTION_CHECK_ERROR'
    })
  }
})

/**
 * POST /instances/:instanceId/refresh-qr
 * Rafraîchir le QR code pour une instance
 */
router.post('/:instanceId/refresh-qr', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Rafraîchir le QR via Evolution API
    const evolution = createEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: 'WhatsApp service unavailable',
        code: 'EVOLUTION_UNAVAILABLE'
      })
    }

    const qrRes = await evolution.get(`/instance/connect/${instance.instanceName}`)
    const qrData = qrRes.data?.qrcode || qrRes.data

    // Mettre à jour le statut en DB
    await InstanceService.updateUserInstance(instanceId, userId, {
      status: (qrRes.data?.instance?.state || instance.status) as any
    })

    const response = {
      success: true,
      data: {
        instanceId,
        instanceName: instance.customName,
        qrcode: { base64: qrData?.base64 || '' },
        pairingCode: qrData?.pairingCode || null,
        count: qrData?.count || 1
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Refresh QR error:', error)
    return res.status(500).json({
      error: 'Failed to refresh QR code',
      code: 'QR_REFRESH_ERROR'
    })
  }
})

/**
 * POST /instances/:instanceId/send-message
 * Envoyer un message via une instance
 */
router.post('/:instanceId/send-message', async (req, res) => {
  try {
    const { instanceId } = req.params
    const { number, message, simulateHuman = false } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (!number || !message) {
      return res.status(400).json({
        error: 'Number and message are required',
        code: 'MISSING_FIELDS'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    if (!instance.isActive) {
      return res.status(403).json({
        error: 'Instance is inactive',
        code: 'INSTANCE_INACTIVE'
      })
    }

    if (instance.status !== 'open') {
      return res.status(400).json({
        error: 'WhatsApp instance not connected',
        code: 'INSTANCE_NOT_CONNECTED'
      })
    }

    // Envoyer via Evolution API
    const evolution = createEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: 'WhatsApp service unavailable',
        code: 'EVOLUTION_UNAVAILABLE'
      })
    }

    let processedMessage = message
    let sendDelay = 0

    // Simulation du comportement humain
    if (simulateHuman) {
      processedMessage = addHumanVariations(message)
      sendDelay = Math.floor(Math.random() * 4000) + 1000
    }

    // Appliquer le délai si nécessaire
    if (sendDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, sendDelay))
    }

    const result = await evolution.post(`/message/sendText/${instance.instanceName}`, {
      number,
      text: processedMessage
    })

    const response = {
      success: true,
      data: {
        key: result.data?.key || {},
        messageId: result.data?.key?.id || null,
        status: 'sent',
        instanceUsed: instance.instanceName,
        to: number,
        message: processedMessage
      }
    }
    res.status(200).json(response)

  } catch (error) {
    console.error('Send message error:', error)
    return res.status(500).json({
      error: 'Failed to send message',
      code: 'SEND_MESSAGE_ERROR'
    })
  }
})

/**
 * POST /instances/:instanceId/send-bulk-messages
 * Envoyer plusieurs messages en simulant le comportement humain
 */
router.post('/:instanceId/send-bulk-messages', async (req, res) => {
  try {
    const { instanceId } = req.params
    const { messages, simulateHuman = true, minDelay = 10000, maxDelay = 10000 } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required',
        code: 'MISSING_MESSAGES'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    if (!instance.isActive) {
      return res.status(403).json({
        error: 'Instance is inactive',
        code: 'INSTANCE_INACTIVE'
      })
    }

    if (instance.status !== 'open') {
      return res.status(400).json({
        error: 'WhatsApp instance not connected',
        code: 'INSTANCE_NOT_CONNECTED'
      })
    }

    const evolution = createEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: 'WhatsApp service unavailable',
        code: 'EVOLUTION_UNAVAILABLE'
      })
    }

    const results = []
    let totalDelay = 0

    for (let i = 0; i < messages.length; i++) {
      const msgData = messages[i]
      const { number, message, customDelay } = msgData

      if (!number || !message) {
        results.push({
          index: i,
          success: false,
          error: 'Number and message are required',
          to: number,
          message
        })
        continue
      }

      try {
        let processedMessage = message
        let sendDelay = customDelay

        if (simulateHuman) {
          processedMessage = addHumanVariations(message)
          
          if (i > 0) {
            sendDelay = customDelay || Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay
          } else {
            sendDelay = Math.floor(Math.random() * 2000) + 8000
          }
        }

        if (sendDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, sendDelay))
          totalDelay += sendDelay
        }

        const result = await evolution.post(`/message/sendText/${instance.instanceName}`, {
          number,
          text: processedMessage
        })

        results.push({
          index: i,
          success: true,
          messageId: result.data?.key?.id || null,
          to: number,
          message: processedMessage,
          timestamp: new Date().toISOString()
        })

        if (simulateHuman && i < messages.length - 1) {
          const microPause = Math.floor(Math.random() * 1000) + 200
          await new Promise(resolve => setTimeout(resolve, microPause))
          totalDelay += microPause
        }

      } catch (error: any) {
        results.push({
          index: i,
          success: false,
          error: error?.message || 'Send failed',
          to: number,
          message
        })
      }
    }

    const response = {
      success: true,
      data: {
        instanceId,
        instanceName: instance.customName,
        totalMessages: messages.length,
        successfulMessages: results.filter(r => r.success).length,
        failedMessages: results.filter(r => !r.success).length,
        results
      }
    }
    res.status(200).json(response)

  } catch (error) {
    console.error('Bulk send error:', error)
    return res.status(500).json({
      error: 'Failed to send bulk messages',
      code: 'BULK_SEND_ERROR'
    })
  }
})

// =============== FONCTIONS UTILITAIRES ===============

/**
 * Ajoute des variations humaines à un message
 */
function addHumanVariations(message: string): string {
  let variations = message

  // Ajouter des espaces aléatoires (double espaces, tabulations)
  if (Math.random() < 0.1) { // 10% de chance
    variations = variations.replace(/\s/g, (match) => {
      if (Math.random() < 0.2) return '  ' // Double espace
      if (Math.random() < 0.05) return '\t' // Tabulation
      return match
    })
  }

  // Ajouter des ponctuations aléatoires
  if (Math.random() < 0.05) { // 5% de chance
    const punctuation = ['...', '!', '!!', '?', '??']
    const randomPunc = punctuation[Math.floor(Math.random() * punctuation.length)]
    variations += randomPunc
  }

  // Variation de casse (majuscules/minuscules)
  if (Math.random() < 0.08) { // 8% de chance
    variations = variations.split('').map(char => {
      if (Math.random() < 0.3) {
        return char.toUpperCase()
      }
      return char.toLowerCase()
    }).join('')
  }

  // Ajouter des émojis occasionnellement
  if (Math.random() < 0.03) { // 3% de chance
    const emojis = ['😊', '👍', '😄', '🎉', '✨', '💪', '🙏']
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
    variations += ` ${randomEmoji}`
  }

  // Nettoyer les variations extrêmes
  variations = variations.replace(/\s{3,}/g, '  ') // Limiter les espaces multiples
  variations = variations.replace(/\t{2,}/g, '\t') // Limiter les tabulations

  return variations.trim()
}

/**
 * GET /instances/:instanceId/chats
 * Récupérer les conversations d'une instance
 */
router.get('/:instanceId/chats', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Récupérer les chats via Evolution API
    const evolution = createEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: 'WhatsApp service unavailable',
        code: 'EVOLUTION_UNAVAILABLE'
      })
    }

    const evoRes = await evolution.post(`/chat/findChats/${instance.instanceName}`)
    const rawChats = Array.isArray(evoRes.data) ? evoRes.data : []
    
    // Mapper les chats Evolution vers le format frontend
    const chats = rawChats
      .filter((c: any) => c.remoteJid)
      .slice(0, 100)
      .map((c: any) => {
        const remoteJid = c.remoteJid || c.id || ''
        const name = c.pushName || c.name || c.contact?.pushName || remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '')
        const lastMsg = c.lastMessage || c.messages?.[0] || null

        return {
          id: c.id || remoteJid,
          instanceId: instance.instanceName,
          contactId: remoteJid,
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

    const response = {
      success: true,
      data: { chats }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Get chats error:', error)
    return res.status(500).json({
      error: 'Failed to retrieve chats',
      code: 'CHATS_ERROR'
    })
  }
})

/**
 * GET /instances/:instanceId/chats/:remoteJid/messages
 * Récupérer les messages d'une conversation
 */
router.get('/:instanceId/chats/:remoteJid/messages', async (req, res) => {
  try {
    const { instanceId, remoteJid } = req.params
    const userId = req.user?.id
    const limit = parseInt(req.query.limit as string) || 50

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Récupérer les messages via Evolution API
    const evolution = createEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: 'WhatsApp service unavailable',
        code: 'EVOLUTION_UNAVAILABLE'
      })
    }

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

    const response = {
      success: true,
      data: { messages }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Get messages error:', error)
    return res.status(500).json({
      error: 'Failed to retrieve messages',
      code: 'MESSAGES_ERROR'
    })
  }
})

/**
 * DELETE /instances/:instanceId
 * Supprimer une instance (avec isolation multi-tenant)
 */
router.delete('/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    // Vérifier que l'instance appartient bien à l'utilisateur
    const instance = await InstanceService.findUserInstanceById(instanceId, userId)

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        message: 'Instance not found or access denied',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Supprimer l'instance de Evolution API
    try {
      await deleteEvolutionInstance(instance.instanceName, instance.instanceToken!)
    } catch (evolutionError) {
      console.warn(`Failed to delete instance from Evolution API: ${evolutionError}`)
      // Continuer même si la suppression Evolution échoue
    }

    // Supprimer l'instance de MongoDB
    await InstanceService.deactivateUserInstance(instanceId, userId)

    const response = {
      success: true,
      message: 'Instance deleted successfully',
      data: {
        instanceId,
        instanceName: instance.customName,
        deletedAt: new Date().toISOString()
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Delete instance error:', error)
    
    return res.status(500).json({
      error: 'Failed to delete instance',
      message: 'An error occurred while deleting the instance',
      code: 'DELETE_ERROR'
    })
  }
})

/**
 * POST /instances/:instanceId/restart
 * Redémarrer une instance WhatsApp
 */
router.post('/:instanceId/restart', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Redémarrer via Evolution API
    await restartEvolutionInstance(instance.instanceName, instance.instanceToken!)

    // Mettre à jour le statut
    await InstanceService.updateUserInstance(instanceId, userId, {
      status: 'connecting',
      updatedAt: new Date()
    })

    const response = {
      success: true,
      message: 'Instance restart initiated',
      data: {
        instanceId,
        instanceName: instance.customName,
        status: 'connecting'
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Restart instance error:', error)
    
    return res.status(500).json({
      error: 'Failed to restart instance',
      code: 'RESTART_ERROR'
    })
  }
})

/**
 * GET /instances/:instanceId/qr-code
 * Obtenir le QR code pour la connexion WhatsApp
 */
router.get('/:instanceId/qr-code', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Obtenir le QR code depuis Evolution API
    const qrData = await getEvolutionQRCode(instance.instanceName, instance.instanceToken!)

    const response = {
      success: true,
      data: {
        instanceId,
        instanceName: instance.customName,
        qrCode: qrData.base64 || qrData.code,
        pairingCode: qrData.pairingCode,
        count: qrData.count || 0
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Get QR code error:', error)
    
    return res.status(500).json({
      error: 'Failed to get QR code',
      code: 'QR_CODE_ERROR'
    })
  }
})

// =============== FONCTIONS UTILITAIRES EVOLUTION API ===============

async function createEvolutionInstance(instanceName: string, integration: string) {
  console.log('\n🔄 Creating Evolution instance...')
  console.log('Instance name:', instanceName)
  console.log('Integration:', integration)
  
  const evolution = createEvolutionClient()
  if (!evolution) {
    throw new Error('Evolution API configuration missing')
  }

  const payload = {
    instanceName,
    integration,
    qrcode: false // Do NOT auto-connect on creation — user must initiate via QR or phone
  }
  
  console.log('Sending request to: /instance/create')
  console.log('Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await evolution.post('/instance/create', payload)
    
    console.log('✅ Evolution instance created successfully')
    console.log('Response status:', response.status)
    return response.data
  } catch (error: any) {
    console.error('❌ Evolution API request failed:')
    console.error('Status:', error.response?.status)
    console.error('Error:', error.response?.data || error.message)
    throw error
  }
}

async function deleteEvolutionInstance(instanceName: string, apiKey: string) {
  const evolution = createEvolutionClient()
  if (!evolution) {
    throw new Error('Evolution API configuration missing')
  }

  await evolution.delete(`/instance/delete/${instanceName}`)
}

async function getEvolutionConnectionState(instanceName: string) {
  const evolution = createEvolutionClient()
  if (!evolution) {
    throw new Error('Evolution API configuration missing')
  }
  // If instance not found in Evolution (404), treat as disconnected
  try {
    const response = await evolution.get(`/instance/connectionState/${instanceName}`)
    return response.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { instance: { state: 'close' } }
    }
    throw error
  }
}

async function restartEvolutionInstance(instanceName: string, apiKey: string) {
  const evolution = createEvolutionClient()
  if (!evolution) {
    throw new Error('Evolution API configuration missing')
  }

  await evolution.put(`/instance/restart/${instanceName}`, {})
}

async function getEvolutionQRCode(instanceName: string, apiKey: string) {
  const evolution = createEvolutionClient()
  if (!evolution) {
    throw new Error('Evolution API configuration missing')
  }

  const response = await evolution.get(`/instance/connect/${instanceName}`)

  return response.data.qrcode || response.data
}

export default router
