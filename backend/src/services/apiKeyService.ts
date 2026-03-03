import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ApiKeyService {
  /**
   * Génère une clé API sécurisée avec préfixe
   * Format: ak_live_xxxxxxxxxxxxxxxxxxxxxxxxxx (32 chars après préfixe)
   */
  private static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(24) // 24 bytes = 48 hex chars, on en prend 25
    const keyBody = randomBytes.toString('hex').substring(0, 25)
    return `ak_live_${keyBody}`
  }

  /**
   * Hash une clé API avec SHA-256 + salt
   */
  private static hashApiKey(apiKey: string): string {
    const salt = process.env.API_KEY_SALT || 'default-salt-change-me'
    return crypto
      .createHash('sha256')
      .update(apiKey + salt)
      .digest('hex')
  }

  /**
   * Extrait le préfixe de la clé (premiers 16 caractères) pour identification
   */
  private static getKeyPrefix(apiKey: string): string {
    return apiKey.substring(0, 16) + '...'
  }

  /**
   * Crée une nouvelle clé API pour une instance
   */
  static async createApiKey(data: {
    userId: string
    instanceId: string
    name?: string
    permissions?: string[]
    expiresAt?: Date
  }): Promise<{ apiKey: string; keyData: any }> {
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
        isActive: true
      }
    })

    const MAX_KEYS_PER_INSTANCE = 10 // Configurable
    if (keyCount >= MAX_KEYS_PER_INSTANCE) {
      throw new Error(`Maximum number of API keys reached (${MAX_KEYS_PER_INSTANCE})`)
    }

    const apiKey = this.generateApiKey()
    const keyHash = this.hashApiKey(apiKey)
    const keyPrefix = this.getKeyPrefix(apiKey)

    const defaultPermissions = ['send_message', 'get_instance_status']

    const keyData = await prisma.apiKey.create({
      data: {
        userId: data.userId,
        instanceId: data.instanceId,
        keyHash,
        keyPrefix,
        name: data.name || `API Key - ${new Date().toISOString().split('T')[0]}`,
        permissions: data.permissions || defaultPermissions,
        expiresAt: data.expiresAt,
        isActive: true
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

    return {
      apiKey, // Clé en clair (à retourner une seule fois)
      keyData: {
        id: keyData.id,
        name: keyData.name,
        keyPrefix: keyData.keyPrefix,
        permissions: keyData.permissions,
        instanceName: keyData.instance.instanceName,
        createdAt: keyData.createdAt,
        expiresAt: keyData.expiresAt
      }
    }
  }

  /**
   * Valide une clé API et retourne les informations d'instance si valide
   */
  static async validateApiKey(apiKey: string): Promise<{
    isValid: boolean
    instance?: any
    apiKeyData?: any
    user?: any
  }> {
    try {
      const keyHash = this.hashApiKey(apiKey)

      const apiKeyData = await prisma.apiKey.findUnique({
        where: {
          keyHash,
          isActive: true
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

      if (!apiKeyData) {
        return { isValid: false }
      }

      // Vérifier si la clé a expiré
      if (apiKeyData.expiresAt && apiKeyData.expiresAt < new Date()) {
        return { isValid: false }
      }

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
   * Désactive une clé API
   */
  static async revokeApiKey(userId: string, keyId: string): Promise<boolean> {
    const result = await prisma.apiKey.updateMany({
      where: {
        id: keyId,
        userId, // S'assurer que l'utilisateur possède cette clé
        isActive: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

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
