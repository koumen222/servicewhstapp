import { PrismaClient } from '@prisma/client'
import { generateAndHashApiKey, verifyApiKey } from '../utils/apiKeyGenerator.js'

const prisma = new PrismaClient()

export class ApiKeyService {

  /**
   * Crée une nouvelle clé API pour une instance
   */
  static async createApiKey(data: {
    userId: string
    instanceId: string
    name?: string
    permissions?: string[]
    expiresAt?: Date
    rateLimitPerMin?: number
  }): Promise<{ apiKey: string; keyData: any }> {
    console.log('\n========== CREATE API KEY ==========')
    console.log('User ID:', data.userId)
    console.log('Instance ID:', data.instanceId)
    // Vérifier que l'instance appartient bien à l'utilisateur
    const instance = await prisma.instance.findFirst({
      where: {
        id: data.instanceId,
        userId: data.userId,
        isActive: true
      }
    })

    if (!instance) {
      throw new Error('Instance not found or access denied')
    }

    // Vérifier les quotas (nombre max de clés par instance)
    const keyCount = await prisma.apiKey.count({
      where: {
        instanceId: data.instanceId,
        isActive: true,
        revoked: false
      }
    })

    const MAX_KEYS_PER_INSTANCE = 10 // Configurable
    if (keyCount >= MAX_KEYS_PER_INSTANCE) {
      console.log(`❌ Maximum API keys reached: ${keyCount}/${MAX_KEYS_PER_INSTANCE}`)
      throw new Error(`Maximum number of API keys reached (${MAX_KEYS_PER_INSTANCE})`)
    }

    console.log('🔑 Generating secure API key with bcrypt...')
    const { apiKey, keyHash, keyPrefix } = await generateAndHashApiKey()

    const defaultPermissions = ['send_message', 'get_instance_status']

    console.log('💾 Saving API key to database...')
    const keyData = await prisma.apiKey.create({
      data: {
        userId: data.userId,
        instanceId: data.instanceId,
        keyHash,
        keyPrefix,
        name: data.name || `API Key - ${new Date().toISOString().split('T')[0]}`,
        permissions: data.permissions || defaultPermissions,
        expiresAt: data.expiresAt,
        rateLimitPerMin: data.rateLimitPerMin || 60,
        isActive: true,
        revoked: false
      },
      include: {
        instance: {
          select: {
            instanceName: true,
            customName: true
          }
        }
      }
    })

    console.log('✅ API key created successfully')
    console.log('  ID:', keyData.id)
    console.log('  Prefix:', keyData.keyPrefix)
    console.log('  Instance:', keyData.instance.instanceName)
    console.log('====================================\n')

    return {
      apiKey, // Clé en clair (à retourner une seule fois)
      keyData: {
        id: keyData.id,
        name: keyData.name,
        keyPrefix: keyData.keyPrefix,
        permissions: keyData.permissions,
        rateLimitPerMin: keyData.rateLimitPerMin,
        instanceName: keyData.instance.instanceName,
        createdAt: keyData.createdAt,
        expiresAt: keyData.expiresAt
      }
    }
  }

  /**
   * Valide une clé API et retourne les informations d'instance si valide
   * Note: Utilisez instanceApiKeyAuth middleware pour une meilleure sécurité
   */
  static async validateApiKey(apiKey: string): Promise<{
    isValid: boolean
    instance?: any
    apiKeyData?: any
    user?: any
  }> {
    try {
      // Récupérer toutes les clés actives et non révoquées
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          isActive: true,
          revoked: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          instance: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  plan: true,
                  isActive: true
                }
              }
            }
          }
        }
      })

      // Vérifier chaque clé avec bcrypt
      for (const apiKeyData of apiKeys) {
        const isValid = await verifyApiKey(apiKey, apiKeyData.keyHash)
        
        if (isValid) {
          // Vérifier si l'instance et l'utilisateur sont actifs
          if (!apiKeyData.instance.isActive || !apiKeyData.instance.user.isActive) {
            return { isValid: false }
          }

          // Mettre à jour les stats d'utilisation
          await prisma.apiKey.update({
            where: { id: apiKeyData.id },
            data: {
              lastUsed: new Date(),
              usageCount: { increment: 1 }
            }
          })

          return {
            isValid: true,
            instance: apiKeyData.instance,
            apiKeyData,
            user: apiKeyData.instance.user
          }
        }
      }

      return { isValid: false }
    } catch (error) {
      console.error('Error validating API key:', error)
      return { isValid: false }
    }
  }

  /**
   * Liste les clés API d'un utilisateur (pour une instance spécifique ou toutes)
   */
  static async listApiKeys(userId: string, instanceId?: string) {
    const where: any = {
      userId,
      isActive: true
    }

    if (instanceId) {
      where.instanceId = instanceId
    }

    return await prisma.apiKey.findMany({
      where,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsed: true,
        usageCount: true,
        createdAt: true,
        expiresAt: true,
        instance: {
          select: {
            id: true,
            instanceName: true,
            customName: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * Désactive une clé API avec révocation explicite
   */
  static async revokeApiKey(userId: string, keyId: string, reason?: string): Promise<boolean> {
    const result = await prisma.apiKey.updateMany({
      where: {
        id: keyId,
        userId, // S'assurer que l'utilisateur possède cette clé
        isActive: true
      },
      data: {
        isActive: false,
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Revoked by user',
        updatedAt: new Date()
      }
    })

    if (result.count > 0) {
      console.log(`✅ API key ${keyId} revoked. Reason: ${reason || 'User request'}`)
    }

    return result.count > 0
  }

  /**
   * Met à jour les permissions d'une clé API
   */
  static async updateApiKeyPermissions(
    userId: string,
    keyId: string,
    permissions: string[]
  ): Promise<boolean> {
    const validPermissions = [
      'send_message',
      'get_instance_status',
      'manage_webhooks',
      'read_messages'
    ]

    // Valider les permissions
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`)
    }

    const result = await prisma.apiKey.updateMany({
      where: {
        id: keyId,
        userId,
        isActive: true
      },
      data: {
        permissions,
        updatedAt: new Date()
      }
    })

    return result.count > 0
  }

  /**
   * Nettoie les clés expirées (à exécuter via cron)
   */
  static async cleanupExpiredKeys(): Promise<number> {
    const result = await prisma.apiKey.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isActive: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    console.log(`Cleaned up ${result.count} expired API keys`)
    return result.count
  }

  /**
   * Récupère les statistiques d'utilisation d'une clé API
   */
  static async getApiKeyStats(userId: string, keyId: string) {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
        isActive: true
      },
      include: {
        messagesSent: {
          select: {
            createdAt: true,
            status: true,
            messageType: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 100
        }
      }
    })

    if (!apiKey) {
      return null
    }

    // Calculer les stats
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const messagesLast24h = apiKey.messagesSent.filter(m => m.createdAt > last24h).length
    const messagesLast7days = apiKey.messagesSent.filter(m => m.createdAt > last7days).length
    const messagesLast30days = apiKey.messagesSent.filter(m => m.createdAt > last30days).length

    const successfulMessages = apiKey.messagesSent.filter(m => m.status === 'sent').length
    const failedMessages = apiKey.messagesSent.filter(m => m.status === 'failed').length

    return {
      keyInfo: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt,
        lastUsed: apiKey.lastUsed,
        totalUsage: apiKey.usageCount
      },
      messageStats: {
        last24h: messagesLast24h,
        last7days: messagesLast7days,
        last30days: messagesLast30days,
        successful: successfulMessages,
        failed: failedMessages,
        total: apiKey.messagesSent.length
      },
      recentActivity: apiKey.messagesSent.slice(0, 10)
    }
  }
}
