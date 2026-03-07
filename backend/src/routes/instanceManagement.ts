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
 * Lister toutes les instances de l'utilisateur connecté
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
    }

    // Enrichir les données avec le statut Evolution API (un appel par instance, pas fetchAll)
    const enrichedInstances = await Promise.all(
      instances.map(async (instance: any) => {
        let rawState = instance.status // fallback to DB value
        try {
          const stateResp = await getEvolutionConnectionState(instance.instanceName)
          rawState = stateResp.instance?.state || stateResp.state || instance.status
          // Persist updated status to DB if changed
          if (rawState !== instance.status) {
            await InstanceService.updateUserInstance(instance._id!.toString(), userId, { status: rawState as any })
          }
        } catch (error) {
          console.warn(`[INSTANCES] Could not get live status for ${instance.instanceName}, using DB:`, (error as any)?.message)
        }

        const connectionStatus = statusMap[rawState] || 'disconnected'

        return {
          id: instance._id?.toString(),
          name: instance.customName,
          instanceName: instance.instanceName,
          status: rawState,
          connectionStatus,
          profileName: instance.profileName,
          profilePictureUrl: instance.profilePictureUrl,
          createdAt: instance.createdAt,
          lastUsed: instance.lastActivity,
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
