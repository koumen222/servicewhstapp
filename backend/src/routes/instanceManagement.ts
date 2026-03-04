import express from 'express'
import { PrismaClient } from '@prisma/client'
import { ApiKeyService } from '../services/apiKeyService.js'
import { QuotaService } from '../services/quotaService.js'
import axios from 'axios'
import crypto from 'crypto'

const router = express.Router()
const prisma = new PrismaClient()

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        instances: {
          where: { isActive: true }
        }
      }
    })

    if (!user || !user.isActive) {
      return res.status(403).json({
        error: 'User account not found or inactive',
        code: 'USER_INACTIVE'
      })
    }

    // Vérifier les limites d'instances selon le plan
    if (user.instances.length >= user.maxInstances) {
      return res.status(400).json({
        error: 'Instance limit reached',
        message: `Your ${user.plan} plan allows maximum ${user.maxInstances} instances`,
        code: 'INSTANCE_LIMIT_REACHED',
        currentCount: user.instances.length,
        maxAllowed: user.maxInstances
      })
    }

    // Vérifier l'unicité du nom d'instance pour cet utilisateur
    const existingInstance = await prisma.instance.findFirst({
      where: {
        userId,
        customName: customName.trim()
      }
    })

    if (existingInstance) {
      return res.status(400).json({
        error: 'Instance name already exists',
        message: 'Choose a different name for your instance',
        code: 'DUPLICATE_NAME'
      })
    }

    // Générer le nom d'instance unique pour Evolution API
    const instanceName = `user_${userId.substring(0, 8)}_${customName.trim()}_${Date.now()}`

    // Créer l'instance dans Evolution API
    const evolutionResponse = await createEvolutionInstance(instanceName, integration)

    // Créer l'instance dans notre base de données
    const instance = await prisma.instance.create({
      data: {
        userId,
        instanceName,
        customName: customName.trim(),
        status: 'close',
        evolutionApiKey: evolutionResponse.hash.apikey,
        instanceUrl: process.env.EVOLUTION_API_URL,
        isActive: true
      }
    })

    // Initialiser les quotas pour cette instance
    await QuotaService.initializeInstanceQuotas(instance.id, user.plan)

    // Créer une clé API par défaut
    const { apiKey, keyData } = await ApiKeyService.createApiKey({
      userId,
      instanceId: instance.id,
      name: `${customName} - Default Key`,
      permissions: ['send_message', 'get_instance_status']
    })

    // Réponse avec toutes les informations nécessaires
    const response = {
      success: true,
      message: 'Instance created successfully',
      data: {
        instance: {
          id: instance.id,
          name: instance.customName,
          instanceName: instance.instanceName,
          status: instance.status,
          createdAt: instance.createdAt
        },
        apiKey: {
          key: apiKey, // Clé en clair (sera affichée une seule fois)
          id: keyData.id,
          name: keyData.name,
          prefix: keyData.keyPrefix,
          permissions: keyData.permissions
        },
        quotas: await QuotaService.getQuotaUsage(instance.id),
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
router.get('/instances', async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instances = await prisma.instance.findMany({
      where: { 
        userId,
        isActive: true
      },
      include: {
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            permissions: true,
            lastUsed: true,
            usageCount: true,
            createdAt: true
          }
        },
        quotaUsage: true,
        _count: {
          select: {
            messagesSent: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Derniers 30 jours
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Enrichir les données avec le statut Evolution API
    const enrichedInstances = await Promise.all(
      instances.map(async (instance) => {
        let connectionStatus = 'unknown'
        try {
          const evolutionStatus = await getEvolutionInstanceStatus(
            instance.instanceName,
            instance.evolutionApiKey!
          )
          connectionStatus = evolutionStatus.connectionState || instance.status
        } catch (error) {
          console.warn(`Failed to get status for instance ${instance.instanceName}:`, error)
        }

        return {
          id: instance.id,
          name: instance.customName,
          instanceName: instance.instanceName,
          status: instance.status,
          connectionStatus,
          profileName: instance.profileName,
          profilePictureUrl: instance.profilePictureUrl,
          createdAt: instance.createdAt,
          lastUsed: instance.lastUsed,
          apiKeys: instance.apiKeys,
          quotas: instance.quotaUsage.map(quota => ({
            type: quota.quotaType,
            used: quota.currentUsage,
            limit: quota.maxAllowed,
            remaining: Math.max(0, quota.maxAllowed - quota.currentUsage),
            resetDate: quota.resetDate
          })),
          stats: {
            messagesLast30Days: instance._count.messagesSent,
            totalApiKeys: instance.apiKeys.length
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
          activeInstances: enrichedInstances.filter(i => i.connectionStatus === 'open').length,
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
router.delete('/instances/:instanceId', async (req, res) => {
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
    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        userId, // CRITICAL: isolation multi-tenant
        isActive: true
      }
    })

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        message: 'Instance not found or access denied',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Supprimer l'instance de Evolution API
    try {
      await deleteEvolutionInstance(instance.instanceName, instance.evolutionApiKey!)
    } catch (evolutionError) {
      console.warn(`Failed to delete instance from Evolution API: ${evolutionError}`)
      // Continuer même si la suppression Evolution échoue
    }

    // Supprimer en cascade : les clés API, quotas, et logs sont supprimés automatiquement
    // grâce aux contraintes onDelete: Cascade dans le schéma Prisma
    await prisma.instance.update({
      where: { id: instanceId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

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
router.post('/instances/:instanceId/restart', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        userId,
        isActive: true
      }
    })

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Redémarrer via Evolution API
    await restartEvolutionInstance(instance.instanceName, instance.evolutionApiKey!)

    // Mettre à jour le statut
    await prisma.instance.update({
      where: { id: instanceId },
      data: {
        status: 'connecting',
        updatedAt: new Date()
      }
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
router.get('/instances/:instanceId/qr-code', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        userId,
        isActive: true
      }
    })

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND'
      })
    }

    // Obtenir le QR code depuis Evolution API
    const qrData = await getEvolutionQRCode(instance.instanceName, instance.evolutionApiKey!)

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
    qrcode: true
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

async function getEvolutionInstanceStatus(instanceName: string, apiKey: string) {
  const evolution = createEvolutionClient()
  if (!evolution) {
    throw new Error('Evolution API configuration missing')
  }

  const response = await evolution.get('/instance/fetchInstances')

  const instances = Array.isArray(response.data) ? response.data : [response.data]
  return instances.find((i: any) => i.instance?.instanceName === instanceName) || { connectionState: 'unknown' }
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
