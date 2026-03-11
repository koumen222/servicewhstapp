import express from 'express'
import { InstanceService } from '../services/instanceService.js'
import { UserService } from '../services/userService.js'
import { buildInstanceName } from '../utils/instanceName.js'
import axios from 'axios'

const router = express.Router()

// Client axios centralisé pour Evolution API
const createEvolutionClient = () => {
  const baseURL = process.env.EVOLUTION_API_URL
  const apikey = process.env.EVOLUTION_MASTER_API_KEY || process.env.EVOLUTION_API_KEY
  
  if (!baseURL || !apikey) {
    console.error('❌ Evolution API not configured')
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
 * Créer une instance dans Evolution API
 */
async function createEvolutionInstance(instanceName: string, integration: string) {
  const evolution = createEvolutionClient()
  if (!evolution) {
    throw new Error('Evolution API not configured')
  }

  const response = await evolution.post('/instance/create', {
    instanceName,
    integration,
    qrcode: false
  })

  return response.data
}

/**
 * POST /api/instance/create
 * Créer une nouvelle instance WhatsApp (route compatible avec les tests)
 */
router.post('/create', async (req, res) => {
  try {
    const { customName, integration = 'WHATSAPP-BAILEYS' } = req.body
    const userId = req.user?.id

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

    // Valider le nom d'instance
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

    // Générer un ID unique
    let instanceName: string = ''
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      instanceName = buildInstanceName(userId, customName.trim())
      const existing = await InstanceService.findUserInstanceByNameGlobal(instanceName)
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

    // Créer l'instance dans Evolution API
    console.log(`🔧 Tentative de création Evolution instance: ${instanceName}`)
    let evolutionResponse: any
    try {
      evolutionResponse = await createEvolutionInstance(instanceName, integration)
      console.log(`✅ Evolution API response:`, JSON.stringify(evolutionResponse, null, 2))
    } catch (evoError: any) {
      console.error('❌ Evolution API error:', evoError?.response?.data || evoError.message)
      return res.status(502).json({
        error: 'WhatsApp service unavailable',
        message: 'Unable to create instance on WhatsApp service',
        code: 'EVOLUTION_API_ERROR',
        details: evoError?.response?.data || evoError.message
      })
    }

    // Extraire le token d'Evolution
    const evolutionApiKey = evolutionResponse?.hash?.apikey || evolutionResponse?.apikey || ''
    
    console.log(`🔑 Token Evolution : ${evolutionApiKey ? evolutionApiKey.substring(0, 20) + '...' : 'non fourni'}`)

    // Créer l'instance dans notre base de données
    const instance = await InstanceService.createUserInstance({
      userId,
      instanceName,
      customName: customName.trim(),
      instanceToken: evolutionApiKey,
      status: 'disconnected',
      isActive: true
    })

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
          instanceToken: evolutionApiKey,
          apiKey: evolutionApiKey
        },
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
 * GET /api/instance/status/:name
 * Obtenir le statut d'une instance par son nom
 */
router.get('/status/:name', async (req, res) => {
  try {
    const { name } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    // Chercher l'instance par nom
    const instance = await InstanceService.findUserInstanceByName(name, userId)
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Créer le client Evolution
    const evolution = createEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: 'WhatsApp service unavailable',
        code: 'EVOLUTION_UNAVAILABLE'
      })
    }

    // Obtenir le statut depuis Evolution API
    let state = 'close'
    try {
      const connRes = await evolution.get(`/instance/connectionState/${instance.instanceName}`)
      state = connRes.data?.instance?.state || connRes.data?.state || 'close'
    } catch (err: any) {
      console.warn(`⚠️ connectionState error for ${instance.instanceName}:`, err?.response?.status)
      if (err?.response?.status === 404) state = 'close'
      else throw err
    }

    const connected = state === 'open'

    // Mettre à jour le statut en DB
    await InstanceService.updateUserInstance(instance._id!.toString(), userId, { status: state as any })

    const response = {
      success: true,
      data: {
        instanceId: instance._id?.toString(),
        instanceName: instance.instanceName,
        customName: instance.customName,
        connected,
        status: state,
        connectionStatus: connected ? 'connected' : 'disconnected'
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Get instance status error:', error)
    return res.status(500).json({
      error: 'Failed to get instance status',
      code: 'STATUS_ERROR'
    })
  }
})

export default router
