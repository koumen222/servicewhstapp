import { Router, Request, Response } from 'express'
import axios from 'axios'
import { InstanceService } from '../services/instanceService.js'
import { UserService } from '../services/userService.js'
import { env } from '../config/env.js'

const router = Router()

// Statut Evolution API → statut frontend
const statusMap: Record<string, string> = {
  open: 'connected',
  connecting: 'connecting',
  close: 'disconnected',
  closed: 'disconnected',
  pending: 'disconnected',
  disconnected: 'disconnected',
  error: 'disconnected'
}

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

// POST / — Créer une instance (authMiddleware déjà appliqué au niveau app)
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { customName } = req.body

    if (!customName || customName.trim().length === 0) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_NAME',
        message: 'Le nom de l\'instance est requis'
      })
    }

    // Récupérer les données fraîches depuis la DB (le JWT peut être périmé)
    const dbUser = await UserService.findById(userId)
    if (!dbUser || !dbUser.isActive) {
      return res.status(403).json({
        error: true,
        code: 'USER_INACTIVE',
        message: 'Compte utilisateur introuvable ou désactivé'
      })
    }

    const isPremium = dbUser.plan === 'premium'
    const isPaid = dbUser.isPaidAccount || dbUser.hasPaid

    // Vérifier la période d'essai si l'utilisateur n'est pas premium/payé
    if (!isPremium && !isPaid && dbUser.trialEndsAt) {
      const now = new Date()
      const trialEnd = new Date(dbUser.trialEndsAt)
      if (now > trialEnd) {
        return res.status(403).json({
          error: true,
          code: 'TRIAL_EXPIRED',
          message: 'Votre période d\'essai gratuit est expirée. Veuillez effectuer un paiement pour continuer.',
          requiresPayment: true
        })
      }
    }

    // Vérifier la limite d'instances (utiliser les données DB, pas le JWT)
    const effectiveMaxInstances = dbUser.maxInstances
    const userInstancesCount = await InstanceService.countUserInstances(userId, true)

    // Les utilisateurs premium (instances illimitées = 999) passent librement
    if (!isPremium && userInstancesCount >= effectiveMaxInstances) {
      return res.status(403).json({
        error: true,
        code: 'MAX_INSTANCES_REACHED',
        message: `Limite atteinte : ${effectiveMaxInstances} instance(s) maximum pour votre plan`
      })
    }

    const requestedInstanceName = normalizeEvolutionInstanceName(customName)
    if (!requestedInstanceName) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_INSTANCE_NAME',
        message: 'Nom d\'instance invalide pour Evolution API'
      })
    }

    // Créer dans Evolution API (obligatoire)
    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({
        error: true,
        code: 'EVOLUTION_UNAVAILABLE',
        message: 'Service Evolution API indisponible'
      })
    }

    let evolutionResponse: any
    try {
      const evRes = await evolution.post('/instance/create', {
        instanceName: requestedInstanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: false
      })
      evolutionResponse = evRes.data
    } catch (evErr: any) {
      console.warn(`⚠️ Evolution API error lors de la création :`, evErr?.response?.data || evErr.message)
      const providerStatus = evErr?.response?.status || null
      const providerData = evErr?.response?.data || null
      const evolutionMessage = JSON.stringify(evErr?.response?.data || '').toLowerCase()
      if (evErr?.response?.status === 403 && evolutionMessage.includes('already in use')) {
        return res.status(409).json({
          error: true,
          code: 'INSTANCE_NAME_ALREADY_EXISTS',
          message: 'Ce nom d\'instance existe déjà sur Evolution. Choisissez un autre nom.'
        })
      }
      return res.status(502).json({
        error: true,
        code: 'EVOLUTION_CREATE_FAILED',
        message: 'Impossible de créer l\'instance sur Evolution API',
        providerStatus,
        providerData
      })
    }

    console.log(`\n📊📊📊 DEBUG: Réponse complète de création Evolution 📊📊📊`)
    console.log(`📊 Réponse complète de création Evolution:`, JSON.stringify(evolutionResponse, null, 2))
    console.log(`📊📊📊 FIN DEBUG 📊📊📊\n`)

    const evolutionInstanceName = evolutionResponse?.instance?.instanceName || evolutionResponse?.instance?.instance || requestedInstanceName
    const evolutionInstanceId = evolutionResponse?.instance?.instanceId || ''
    
    // IMPORTANT: Récupérer le token COMPLET d'Evolution depuis plusieurs emplacements possibles
    let evolutionApiKey = ''
    
    // Le token est dans "hash" qui est une CHAÎNE DIRECTE, pas un objet
    if (evolutionResponse?.hash && typeof evolutionResponse.hash === 'string') {
      evolutionApiKey = evolutionResponse.hash
    } else if (evolutionResponse?.hash?.apikey) {
      evolutionApiKey = evolutionResponse.hash.apikey
    } else if (evolutionResponse?.apikey) {
      evolutionApiKey = evolutionResponse.apikey
    } else if (evolutionResponse?.instance?.hash && typeof evolutionResponse.instance.hash === 'string') {
      evolutionApiKey = evolutionResponse.instance.hash
    } else if (evolutionResponse?.token) {
      evolutionApiKey = evolutionResponse.token
    }
    
    const evolutionStatus: string = evolutionResponse?.instance?.state || evolutionResponse?.instance?.status || 'pending'

    console.log(`✅ Instance Evolution créée : ${evolutionInstanceName} (id: ${evolutionInstanceId})`)
    console.log(`🔑 Token Evolution extrait : ${evolutionApiKey ? evolutionApiKey.substring(0, 20) + '...' : 'NON TROUVÉ'}`)
    console.log(`🔑 Token Evolution complet : ${evolutionApiKey}`)

    const instance = await InstanceService.createUserInstance({
      userId,
      instanceName: evolutionInstanceName,
      evolutionInstanceId,
      customName: customName.trim(),
      instanceToken: evolutionApiKey,
      status: evolutionStatus as any,
      isActive: true
    })

    return res.status(201).json({
      success: true,
      data: {
        instance: {
          id: instance._id?.toString(),
          _id: instance._id?.toString(),
          name: instance.customName,
          customName: instance.customName,
          instanceName: evolutionInstanceName,
          evolutionInstanceId,
          status: instance.status,
          connectionStatus: statusMap[instance.status] || 'disconnected',
          // Envoyer le token COMPLET d'Evolution tel quel, sans modification
          instanceToken: evolutionApiKey,
          apiKey: evolutionApiKey,
          createdAt: instance.createdAt
        },
      },
      message: 'Instance créée avec succès'
    })
  } catch (error) {
    console.error('Create instance error:', error)
    return res.status(500).json({
      error: true,
      code: 'INSTANCE_CREATION_FAILED',
      message: 'Échec de la création de l\'instance'
    })
  }
})

// GET / — Lister les instances de l'utilisateur
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const instances = await InstanceService.findUserInstances(userId, true)

    // Synchroniser le statut réel avec Evolution API
    const evolution = getEvolutionClient()
    let evolutionStates: Record<string, { state: string, profileName?: string, profilePicUrl?: string, number?: string }> = {}
    
    if (evolution) {
      try {
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
      } catch (evoErr: any) {
        console.warn('⚠️ Could not fetch Evolution states:', evoErr?.message)
      }
    }

    const mappedInstances = await Promise.all(instances.map(async (inst) => {
      const evoState = evolutionStates[inst.instanceName]
      const realStatus = evoState?.state || inst.status
      const isOpen = realStatus === 'open'

      // Mettre à jour en DB si le statut a changé (async, non-bloquant)
      if (evoState && realStatus !== inst.status) {
        InstanceService.updateUserInstance(inst._id!.toString(), userId, {
          status: realStatus as any,
          ...(evoState.profileName ? { profileName: evoState.profileName } : {}),
          ...(evoState.profilePicUrl ? { profilePictureUrl: evoState.profilePicUrl } : {}),
          ...(evoState.number ? { whatsappNumber: evoState.number } : {}),
        }).catch(() => {})
      }

      // Récupérer le vrai token si le token stocké est court (moins de 50 caractères)
      let realToken = inst.instanceToken
      const isInstanceConnected = realStatus === 'open' || isOpen
      const hasShortToken = inst.instanceToken && inst.instanceToken.length < 50
      
      // Toujours essayer de récupérer le token si c'est un token court, peu importe le statut
      if (hasShortToken && evolution) {
        try {
          console.log(`🔍 Fetching real token for instance with short token: ${inst.instanceName}`)
          const fetchRes = await evolution.get('/instance/fetchInstances', {
            params: {
              instanceName: inst.instanceName
            },
            headers: {
              'apikey': env.EVOLUTION_MASTER_API_KEY
            }
          })
          
          console.log(`📊 Response:`, JSON.stringify(fetchRes.data, null, 2))
          
          // La réponse peut être un objet ou un tableau
          let instances = []
          if (Array.isArray(fetchRes.data)) {
            instances = fetchRes.data
          } else if (fetchRes.data?.response && Array.isArray(fetchRes.data.response)) {
            instances = fetchRes.data.response
          } else if (fetchRes.data) {
            instances = [fetchRes.data]
          }
          
          const foundInstance = instances.find((evo: any) => 
            (evo.name || evo.instanceName) === inst.instanceName
          )
          
          if (foundInstance) {
            // Le token est dans "hash" qui est une CHAÎNE DIRECTE
            if (foundInstance.hash && typeof foundInstance.hash === 'string') {
              realToken = foundInstance.hash
              console.log(`✅ Token trouvé dans hash (string): ${realToken?.substring(0, 20)}...`)
            } else if (foundInstance.hash?.apikey) {
              realToken = foundInstance.hash.apikey
              console.log(`✅ Token trouvé dans hash.apikey: ${realToken?.substring(0, 20)}...`)
            } else if (foundInstance.apikey) {
              realToken = foundInstance.apikey
              console.log(`✅ Token trouvé dans apikey: ${realToken?.substring(0, 20)}...`)
            }
          }
          
          // Mettre à jour le token en DB avec le vrai token
          if (realToken && realToken !== inst.instanceToken) {
            console.log(`💾 Updating token in DB: ${inst.instanceToken?.substring(0, 10)}... → ${realToken?.substring(0, 20)}...`)
            InstanceService.updateUserInstance(inst._id!.toString(), userId, {
              instanceToken: realToken
            }).catch(() => {})
          }
        } catch (err: any) {
          console.warn(`⚠️ Could not fetch real token for ${inst.instanceName}:`, err?.message || err?.toString())
        }
      } else {
        console.log(`✅ Instance ${inst.instanceName} already has full token (${inst.instanceToken?.length} chars)`)
      }

      return {
        id: inst._id?.toString(),
        _id: inst._id?.toString(),
        instanceId: inst._id?.toString(),
        name: inst.customName,
        customName: inst.customName,
        instanceName: inst.instanceName,
        evolutionInstanceId: inst.evolutionInstanceId || '',
        status: realStatus,
        connectionStatus: isOpen ? 'connected' : (statusMap[realStatus] || 'disconnected'),
        instanceToken: realToken,
        apiKey: realToken,
        whatsappNumber: evoState?.number || inst.whatsappNumber,
        profileName: evoState?.profileName || inst.profileName,
        profilePictureUrl: evoState?.profilePicUrl || inst.profilePictureUrl,
        createdAt: inst.createdAt,
        updatedAt: inst.updatedAt,
        lastUsed: inst.lastActivity,
        lastActivity: inst.lastActivity,
        apiKeys: [],
        quotas: [],
        stats: { messagesLast30Days: 0, totalApiKeys: 0 }
      }
    }))

    return res.json({
      success: true,
      data: {
        instances: mappedInstances,
        summary: {
          totalInstances: instances.length,
          activeInstances: mappedInstances.filter(i => i.connectionStatus === 'connected').length,
          maxAllowed: req.user!.maxInstances
        }
      }
    })
  } catch (error) {
    console.error('List instances error:', error)
    return res.status(500).json({
      error: true,
      code: 'INSTANCES_FETCH_FAILED',
      message: 'Échec de la récupération des instances'
    })
  }
})

// GET /:instanceId — Détail d'une instance
router.get('/:instanceId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    // Essayer d'abord par instanceName, puis par _id si c'est un ObjectId valide
    let instance = await InstanceService.findUserInstanceByName(instanceId, userId)
    if (!instance && instanceId.length === 24) {
      instance = await InstanceService.findUserInstanceById(instanceId, userId)
    }
    if (!instance) {
      return res.status(404).json({
        error: true,
        code: 'INSTANCE_NOT_FOUND',
        message: 'Instance non trouvée'
      })
    }

    return res.json({
      success: true,
      data: {
        id: instance._id?.toString(),
        instanceName: instance.instanceName,
        customName: instance.customName,
        name: instance.customName,
        instanceToken: instance.instanceToken,
        apiKey: instance.instanceToken,
        status: instance.status,
        connectionStatus: statusMap[instance.status] || 'disconnected',
        whatsappNumber: instance.whatsappNumber,
        profileName: instance.profileName,
        profilePictureUrl: instance.profilePictureUrl,
        createdAt: instance.createdAt,
        lastActivity: instance.lastActivity
      }
    })
  } catch (error) {
    console.error('Get instance error:', error)
    return res.status(500).json({
      error: true,
      code: 'INSTANCE_FETCH_FAILED',
      message: 'Échec de la récupération de l\'instance'
    })
  }
})

// GET /:instanceId/qr-code — Obtenir le QR code
router.get('/:instanceId/qr-code', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    // Essayer d'abord par instanceName, puis par _id si c'est un ObjectId valide
    let instance = await InstanceService.findUserInstanceByName(instanceId, userId)
    if (!instance && instanceId.length === 24) {
      instance = await InstanceService.findUserInstanceById(instanceId, userId)
    }
    if (!instance) {
      return res.status(404).json({ error: true, code: 'INSTANCE_NOT_FOUND', message: 'Instance non trouvée' })
    }

    const evolution = getEvolutionClient()
    if (!evolution) {
      return res.status(503).json({ error: true, code: 'EVOLUTION_UNAVAILABLE', message: 'Service WhatsApp indisponible' })
    }

    console.log(`🔍 Fetching QR code for instance: ${instance.instanceName}`)
    
    // 1) Vérifier que l'instance existe sur Evolution
    let instanceState = 'unknown'
    try {
      const checkRes = await evolution.get(`/instance/fetchInstances?instanceName=${instance.instanceName}`, {
        timeout: 5000
      })
      const inst = Array.isArray(checkRes.data) ? checkRes.data[0] : checkRes.data
      instanceState = inst?.connectionStatus || inst?.state || 'unknown'
      console.log(`✅ Instance exists on Evolution: ${instance.instanceName} (state: ${instanceState})`)
    } catch (checkErr: any) {
      console.error('❌ Instance not found on Evolution API:', checkErr?.response?.data || checkErr.message)
      return res.status(404).json({ 
        error: true, 
        code: 'INSTANCE_NOT_ON_EVOLUTION', 
        message: 'Instance non trouvée sur Evolution API. Elle doit être recréée.' 
      })
    }

    // 2) Redémarrer l'instance avant de connecter (nécessaire pour que le scan fonctionne)
    if (instanceState !== 'open') {
      try {
        console.log(`🔄 Restarting instance before connect: ${instance.instanceName}`)
        await evolution.put(`/instance/restart/${instance.instanceName}`, {}, { timeout: 10000 })
        // Attendre un peu que l'instance redémarre
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log(`✅ Instance restarted successfully`)
      } catch (restartErr: any) {
        console.warn(`⚠️ Restart failed (non-blocking):`, restartErr?.response?.data?.message || restartErr.message)
        // Non-bloquant : on continue avec connect même si restart échoue
      }
    }
    
    // 3) Générer le QR code via /instance/connect
    const qrRes = await evolution.get(`/instance/connect/${instance.instanceName}`, {
      timeout: 15000
    })
    
    console.log(`✅ QR code response status: ${qrRes.status}`)
    console.log(`📦 QR code raw response:`, JSON.stringify(qrRes.data, null, 2))
    
    // Evolution renvoie directement { base64, pairingCode, count }, pas dans un sous-objet qrcode
    const qrData = qrRes.data
    console.log(`🔍 Extracted qrData:`, qrData)

    const qrCodeBase64 = qrData?.base64 || qrData?.code || qrData?.qrcode?.base64 || null
    
    if (!qrCodeBase64) {
      console.error('❌ Evolution API returned empty QR data')
      return res.status(502).json({ 
        error: true, 
        code: 'EVOLUTION_EMPTY_QR', 
        message: 'Evolution API n\'a pas renvoyé de QR code. L\'instance est peut-être déjà connectée.' 
      })
    }

    console.log(`✅ QR code extracted, length: ${qrCodeBase64.length}`)

    return res.json({
      success: true,
      data: {
        instanceId: instance._id?.toString(),
        instanceName: instance.instanceName,
        qrCode: qrCodeBase64,
        pairingCode: qrData?.pairingCode || null,
        count: qrData?.count || 0
      }
    })
  } catch (error: any) {
    console.error('Get QR code error:', error?.message || error)
    console.error('Error details:', {
      status: error?.response?.status,
      data: error?.response?.data,
      code: error?.code
    })
    
    const errorMsg = error?.response?.data?.message || error?.message || 'Échec de la récupération du QR code'
    const statusCode = error?.code === 'ECONNABORTED' ? 504 : 500
    
    return res.status(statusCode).json({ 
      error: true, 
      code: error?.code === 'ECONNABORTED' ? 'TIMEOUT' : 'QR_CODE_ERROR', 
      message: errorMsg 
    })
  }
})

// POST /:instanceId/restart — Redémarrer une instance
router.post('/:instanceId/restart', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    const instance = await InstanceService.findUserInstanceById(instanceId, userId)
    if (!instance) {
      return res.status(404).json({ error: true, code: 'INSTANCE_NOT_FOUND', message: 'Instance non trouvée' })
    }

    const evolution = getEvolutionClient()
    if (evolution) {
      try {
        await evolution.put(`/instance/restart/${instance.instanceName}`, {})
      } catch (evErr: any) {
        console.warn(`⚠️ Evolution restart error:`, evErr?.response?.data || evErr.message)
      }
    }

    await InstanceService.updateUserInstance(instanceId, userId, { status: 'connecting' })

    return res.json({
      success: true,
      message: 'Redémarrage de l\'instance initié',
      data: { instanceId, status: 'connecting' }
    })
  } catch (error) {
    console.error('Restart instance error:', error)
    return res.status(500).json({ error: true, code: 'RESTART_ERROR', message: 'Échec du redémarrage' })
  }
})

// DELETE /:instanceId — Supprimer une instance (accepte ObjectId OU instanceName)
router.delete('/:instanceId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    // Chercher par ObjectId d'abord
    let instance = null
    try {
      instance = await InstanceService.findUserInstanceById(instanceId, userId)
    } catch {}

    // Si non trouvé, chercher par instanceName
    if (!instance) {
      const allInstances = await InstanceService.findUserInstances(userId, true)
      instance = allInstances.find(i => i.instanceName === instanceId) || null
    }

    if (!instance) {
      return res.status(404).json({ error: true, code: 'INSTANCE_NOT_FOUND', message: 'Instance non trouvée' })
    }

    // Supprimer dans Evolution API
    const evolution = getEvolutionClient()
    if (evolution) {
      try {
        console.log(`🗑️ Suppression de l'instance ${instance.instanceName} sur Evolution API...`)
        await evolution.delete(`/instance/delete/${instance.instanceName}`)
        console.log(`✅ Instance ${instance.instanceName} supprimée avec succès sur Evolution API`)
      } catch (evErr: any) {
        console.error(`❌ Échec de suppression sur Evolution API:`, evErr?.response?.data || evErr.message)
        // Continue quand même avec la suppression en base de données
      }
    } else {
      console.warn(`⚠️ Client Evolution API non disponible, impossible de supprimer l'instance sur Evolution`)
    }

    // Désactiver dans MongoDB
    console.log(`🗑️ Désactivation de l'instance ${instance.instanceName} dans MongoDB...`)
    await InstanceService.deactivateUserInstance(instance._id!.toString(), userId)
    console.log(`✅ Instance ${instance.instanceName} désactivée dans MongoDB`)

    return res.json({
      success: true,
      message: 'Instance supprimée avec succès',
      data: { instanceId: instance._id?.toString(), instanceName: instance.instanceName }
    })
  } catch (error) {
    console.error('Delete instance error:', error)
    return res.status(500).json({ error: true, code: 'INSTANCE_DELETE_FAILED', message: 'Échec de la suppression' })
  }
})

export default router
