import express from 'express'
import { apiKeyAuth, apiRequestLogger, apiKeyRateLimit } from '../middleware/apiKeyAuth.js'
import { QuotaService } from '../services/quotaService.js'
import { MessageLogService } from '../services/messageLogService.js'
import axios from 'axios'

const router = express.Router()

// Middleware global pour les endpoints publics
router.use(apiRequestLogger)
router.use(apiKeyRateLimit(1000, 60000)) // 1000 req/min par clé API

/**
 * POST /api/v1/send-message
 * Endpoint public pour envoyer des messages WhatsApp via clé API enfant
 */
router.post('/send-message', 
  apiKeyAuth({ 
    requiredPermissions: ['send_message'], 
    checkQuota: true 
  }), 
  async (req, res) => {
    try {
      const { number, text, options = {} } = req.body
      const { instance, apiKeyData, user } = req.apiAuth!

      // Validation des paramètres
      if (!number || !text) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'Both "number" and "text" are required',
          code: 'MISSING_PARAMETERS'
        })
      }

      // Validation du format du numéro
      if (!isValidWhatsAppNumber(number)) {
        return res.status(400).json({
          error: 'Invalid phone number',
          message: 'Phone number must be in international format (e.g., 33612345678)',
          code: 'INVALID_PHONE_NUMBER'
        })
      }

      // Validation de la longueur du message
      if (text.length > 4096) {
        return res.status(400).json({
          error: 'Message too long',
          message: 'Message cannot exceed 4096 characters',
          code: 'MESSAGE_TOO_LONG'
        })
      }

      // Vérifier et consommer le quota
      const quotaResult = await QuotaService.consumeQuota(instance.id, 'messages_per_day', 1)
      if (!quotaResult.allowed) {
        return res.status(429).json({
          error: 'Quota exceeded',
          message: quotaResult.message,
          code: 'QUOTA_EXCEEDED',
          remaining: quotaResult.remaining,
          resetDate: quotaResult.resetDate
        })
      }

      // Préparer la requête vers Evolution API
      const evolutionPayload = {
        number: number,
        text: text,
        ...options // Options supplémentaires (mentions, quoted message, etc.)
      }

      // Faire l'appel vers Evolution API avec la clé principale (cachée)
      const evolutionResponse = await callEvolutionAPI(
        instance.instanceName,
        instance.evolutionApiKey,
        'sendText',
        evolutionPayload
      )

      // Logger le message envoyé pour audit
      await MessageLogService.logMessage({
        instanceId: instance.id,
        apiKeyId: apiKeyData.id,
        recipientNumber: number,
        messageType: 'text',
        messageContent: text.substring(0, 500), // Tronquer pour le stockage
        status: 'sent',
        evolutionMessageId: evolutionResponse.key?.id,
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent']
      })

      // Réponse standardisée pour le client
      const response = {
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: evolutionResponse.key?.id,
          instanceId: instance.id,
          instanceName: instance.customName,
          recipient: number,
          timestamp: new Date().toISOString(),
          quotaRemaining: quotaResult.remaining
        },
        metadata: {
          requestId: generateRequestId(),
          processingTime: Date.now() - (req.startTime ?? Date.now())
        }
      }

      res.status(200).json(response)

    } catch (error) {
      console.error('Send message error:', error)
      
      // Logger l'erreur
      try {
        await MessageLogService.logMessage({
          instanceId: req.apiAuth!.instance.id,
          apiKeyId: req.apiAuth!.apiKeyData.id,
          recipientNumber: req.body.number,
          messageType: 'text',
          messageContent: req.body.text?.substring(0, 500),
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent']
        })
      } catch (logError) {
        console.error('Failed to log error:', logError)
      }

      if (error instanceof Error && error.message.includes('Evolution API')) {
        return res.status(502).json({
          error: 'WhatsApp service unavailable',
          message: 'Unable to connect to WhatsApp service',
          code: 'WHATSAPP_SERVICE_ERROR'
        })
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while sending the message',
        code: 'INTERNAL_ERROR'
      })
    }
  }
)

/**
 * GET /api/v1/instance/status
 * Obtenir le statut de l'instance WhatsApp
 */
router.get('/instance/status', 
  apiKeyAuth({ requiredPermissions: ['get_instance_status'] }),
  async (req, res) => {
    try {
      const { instance } = req.apiAuth!

      // Récupérer le statut depuis Evolution API
      const evolutionStatus = await callEvolutionAPI(
        instance.instanceName,
        instance.evolutionApiKey,
        'fetchInstances'
      )

      const response = {
        success: true,
        data: {
          instanceId: instance.id,
          instanceName: instance.customName,
          status: instance.status,
          connectionState: evolutionStatus[0]?.connectionStatus || 'unknown',
          profileName: instance.profileName,
          profilePictureUrl: instance.profilePictureUrl,
          lastUsed: instance.lastUsed,
          createdAt: instance.createdAt
        }
      }

      res.status(200).json(response)

    } catch (error) {
      console.error('Get instance status error:', error)
      
      return res.status(500).json({
        error: 'Failed to get instance status',
        message: 'Unable to retrieve instance status',
        code: 'STATUS_ERROR'
      })
    }
  }
)

/**
 * GET /api/v1/quota/usage
 * Obtenir l'utilisation des quotas pour l'instance
 */
router.get('/quota/usage',
  apiKeyAuth(),
  async (req, res) => {
    try {
      const { instance } = req.apiAuth!

      const quotaUsage = await QuotaService.getQuotaUsage(instance.id)

      const response = {
        success: true,
        data: {
          instanceId: instance.id,
          quotas: quotaUsage,
          currentPlan: instance.user.plan,
          instanceName: instance.customName
        }
      }

      res.status(200).json(response)

    } catch (error) {
      console.error('Get quota usage error:', error)
      
      return res.status(500).json({
        error: 'Failed to get quota usage',
        message: 'Unable to retrieve quota information',
        code: 'QUOTA_ERROR'
      })
    }
  }
)

/**
 * POST /api/v1/send-media
 * Envoyer des médias (images, documents, etc.)
 */
router.post('/send-media',
  apiKeyAuth({ 
    requiredPermissions: ['send_message'],
    checkQuota: true 
  }),
  async (req, res) => {
    try {
      const { number, media, caption, mediaType = 'image' } = req.body
      const { instance, apiKeyData } = req.apiAuth!

      // Validation
      if (!number || !media) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'Both "number" and "media" are required',
          code: 'MISSING_PARAMETERS'
        })
      }

      if (!isValidWhatsAppNumber(number)) {
        return res.status(400).json({
          error: 'Invalid phone number',
          code: 'INVALID_PHONE_NUMBER'
        })
      }

      // Vérifier le quota
      const quotaResult = await QuotaService.consumeQuota(instance.id, 'messages_per_day', 1)
      if (!quotaResult.allowed) {
        return res.status(429).json({
          error: 'Quota exceeded',
          message: quotaResult.message,
          code: 'QUOTA_EXCEEDED'
        })
      }

      // Préparer le payload selon le type de média
      let evolutionPayload
      switch (mediaType) {
        case 'image':
          evolutionPayload = {
            number,
            media,
            caption: caption || '',
            mediatype: 'image'
          }
          break
        case 'document':
          evolutionPayload = {
            number,
            media,
            fileName: req.body.fileName || 'document',
            caption: caption || '',
            mediatype: 'document'
          }
          break
        default:
          return res.status(400).json({
            error: 'Invalid media type',
            message: 'Supported types: image, document',
            code: 'INVALID_MEDIA_TYPE'
          })
      }

      const evolutionResponse = await callEvolutionAPI(
        instance.instanceName,
        instance.evolutionApiKey,
        'sendMedia',
        evolutionPayload
      )

      // Logger le message
      await MessageLogService.logMessage({
        instanceId: instance.id,
        apiKeyId: apiKeyData.id,
        recipientNumber: number,
        messageType: mediaType,
        messageContent: caption?.substring(0, 500) || `[${mediaType}]`,
        status: 'sent',
        evolutionMessageId: evolutionResponse.key?.id,
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent']
      })

      const response = {
        success: true,
        message: 'Media sent successfully',
        data: {
          messageId: evolutionResponse.key?.id,
          instanceId: instance.id,
          recipient: number,
          mediaType,
          timestamp: new Date().toISOString()
        }
      }

      res.status(200).json(response)

    } catch (error) {
      console.error('Send media error:', error)
      
      return res.status(500).json({
        error: 'Failed to send media',
        message: 'An error occurred while sending media',
        code: 'MEDIA_SEND_ERROR'
      })
    }
  }
)

// =============== FONCTIONS UTILITAIRES ===============

/**
 * Appel sécurisé vers Evolution API avec la clé principale
 */
async function callEvolutionAPI(
  instanceName: string, 
  apiKey: string, 
  endpoint: string, 
  payload?: any
) {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  if (!evolutionUrl) {
    throw new Error('Evolution API URL not configured')
  }

  const url = `${evolutionUrl}/${endpoint}/${instanceName}`
  
  const config = {
    method: payload ? 'POST' : 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey // Clé principale Evolution (cachée)
    },
    data: payload,
    timeout: 30000
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (error) {
    console.error('Evolution API call failed:', error)
    throw new Error(`Evolution API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validation du numéro WhatsApp
 */
function isValidWhatsAppNumber(number: string): boolean {
  // Format international sans + (ex: 33612345678)
  const phoneRegex = /^[1-9]\d{6,14}$/
  return phoneRegex.test(number.replace(/\s+/g, ''))
}

/**
 * Obtenir l'IP réelle du client
 */
function getClientIP(req: express.Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

/**
 * Générer un ID de requête unique
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Middleware pour mesurer le temps de traitement
router.use((req: any, res, next) => {
  req.startTime = Date.now()
  next()
})

export default router
