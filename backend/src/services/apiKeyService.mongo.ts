import { Collection, ObjectId, WithId } from 'mongodb'
import { generateAndHashApiKey, verifyApiKey } from '../utils/apiKeyGenerator.js'
import { ApiKey, ApiKeyDocument, UserDocument, WhatsAppInstanceDocument } from '../types/models.js'
import { getMongoCollection } from '../lib/mongo.js'

export class ApiKeyService {
  private static collectionName = 'apikeys'

  private static async getCollection(): Promise<Collection<ApiKey>> {
    return getMongoCollection<ApiKey>(this.collectionName)
  }

  private static async getInstanceCollection(): Promise<Collection<WhatsAppInstanceDocument>> {
    return getMongoCollection<WhatsAppInstanceDocument>('whatsapp_instances')
  }

  private static async getUserCollection(): Promise<Collection<UserDocument>> {
    return getMongoCollection<UserDocument>('users')
  }

  /**
   * Crée une nouvelle clé API pour une instance
   */
  static async createApiKey(data: {
    userId: string | ObjectId
    instanceId: string | ObjectId
    name?: string
    permissions?: string[]
    expiresAt?: Date
    rateLimitPerMin?: number
  }): Promise<{ apiKey: string; keyData: any }> {
    console.log('\n========== CREATE API KEY ==========')
    console.log('User ID:', data.userId)
    console.log('Instance ID:', data.instanceId)

    const userObjectId = typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId
    const instanceObjectId = typeof data.instanceId === 'string' ? new ObjectId(data.instanceId) : data.instanceId

    // Vérifier que l'instance appartient bien à l'utilisateur
    const instanceCollection = await this.getInstanceCollection()
    const instance = await instanceCollection.findOne({
      _id: instanceObjectId,
      userId: userObjectId
    })

    if (!instance) {
      throw new Error('Instance not found or access denied')
    }

    // Vérifier les quotas (nombre max de clés par instance)
    const collection = await this.getCollection()
    const keyCount = await collection.countDocuments({
      instanceId: instanceObjectId,
      isActive: true,
      revoked: false
    })

    const MAX_KEYS_PER_INSTANCE = 10
    if (keyCount >= MAX_KEYS_PER_INSTANCE) {
      console.log(`❌ Maximum API keys reached: ${keyCount}/${MAX_KEYS_PER_INSTANCE}`)
      throw new Error(`Maximum number of API keys reached (${MAX_KEYS_PER_INSTANCE})`)
    }

    console.log('🔑 Generating secure API key with bcrypt...')
    const { apiKey, keyHash, keyPrefix } = await generateAndHashApiKey()

    const defaultPermissions = ['send_message', 'get_instance_status']

    console.log('💾 Saving API key to database...')
    const now = new Date()
    const keyData = {
      userId: userObjectId,
      instanceId: instanceObjectId,
      keyHash,
      keyPrefix,
      name: data.name || `API Key - ${new Date().toISOString().split('T')[0]}`,
      permissions: data.permissions || defaultPermissions,
      expiresAt: data.expiresAt,
      rateLimitPerMin: data.rateLimitPerMin || 60,
      isActive: true,
      revoked: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    }

    const result = await collection.insertOne(keyData as any)
    const createdKey = {
      ...keyData,
      _id: result.insertedId
    }

    console.log('✅ API key created successfully')
    console.log('  ID:', createdKey._id)
    console.log('  Prefix:', createdKey.keyPrefix)
    console.log('  Instance:', instance.instanceName)
    console.log('====================================\n')

    return {
      apiKey, // Clé en clair (à retourner une seule fois)
      keyData: {
        id: createdKey._id?.toString(),
        name: createdKey.name,
        keyPrefix: createdKey.keyPrefix,
        permissions: createdKey.permissions,
        rateLimitPerMin: createdKey.rateLimitPerMin,
        instanceName: instance.instanceName,
        createdAt: createdKey.createdAt,
        expiresAt: createdKey.expiresAt
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
      const collection = await this.getCollection()
      const instanceCollection = await this.getInstanceCollection()
      const userCollection = await this.getUserCollection()

      // Récupérer toutes les clés actives et non révoquées
      const apiKeys = await collection.find({
        isActive: true,
        revoked: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      }).toArray()

      // Vérifier chaque clé avec bcrypt
      for (const apiKeyData of apiKeys) {
        const isValid = await verifyApiKey(apiKey, apiKeyData.keyHash)
        
        if (isValid) {
          // Récupérer l'instance et l'utilisateur
          const instance = await instanceCollection.findOne({ _id: apiKeyData.instanceId })
          const user = await userCollection.findOne({ _id: apiKeyData.userId })

          if (!instance || !user || !instance.isActive || !user.isActive) {
            return { isValid: false }
          }

          // Mettre à jour les stats d'utilisation
          await collection.updateOne(
            { _id: apiKeyData._id },
            {
              $set: { lastUsed: new Date() },
              $inc: { usageCount: 1 }
            }
          )

          return {
            isValid: true,
            instance,
            apiKeyData,
            user
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
   * Liste les clés API d'un utilisateur
   */
  static async listApiKeys(userId: string | ObjectId, instanceId?: string | ObjectId) {
    const collection = await this.getCollection()
    const instanceCollection = await this.getInstanceCollection()
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId

    const where: any = {
      userId: userObjectId,
      isActive: true
    }

    if (instanceId) {
      where.instanceId = typeof instanceId === 'string' ? new ObjectId(instanceId) : instanceId
    }

    const apiKeys = await collection.find(where).sort({ createdAt: -1 }).toArray()

    // Récupérer les informations des instances
    const instanceIds = [...new Set(apiKeys.map(k => k.instanceId))]
    const instances = await instanceCollection.find({ 
      _id: { $in: instanceIds } 
    }).toArray()

    const instanceMap = new Map(instances.map(i => [i._id?.toString(), i]))

    return apiKeys.map(key => {
      const instance = instanceMap.get(key.instanceId.toString())
      return {
        id: key._id?.toString(),
        name: key.name,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        lastUsed: key.lastUsed,
        usageCount: key.usageCount,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        instance: instance ? {
          id: instance._id?.toString(),
          instanceName: instance.instanceName,
          customName: instance.customName,
          status: instance.status
        } : null
      }
    })
  }

  /**
   * Désactive une clé API avec révocation explicite
   */
  static async revokeApiKey(userId: string | ObjectId, keyId: string | ObjectId, reason?: string): Promise<boolean> {
    const collection = await this.getCollection()
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId
    const keyObjectId = typeof keyId === 'string' ? new ObjectId(keyId) : keyId

    const result = await collection.updateMany({
      _id: keyObjectId,
      userId: userObjectId,
      isActive: true
    }, {
      $set: {
        isActive: false,
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Revoked by user',
        updatedAt: new Date()
      }
    })

    if (result.modifiedCount > 0) {
      console.log(`✅ API key ${keyId} revoked. Reason: ${reason || 'User request'}`)
    }

    return result.modifiedCount > 0
  }

  /**
   * Met à jour les permissions d'une clé API
   */
  static async updateApiKeyPermissions(
    userId: string | ObjectId,
    keyId: string | ObjectId,
    permissions: string[]
  ): Promise<boolean> {
    const validPermissions = [
      'send_message',
      'get_instance_status',
      'manage_webhooks',
      'read_messages'
    ]

    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`)
    }

    const collection = await this.getCollection()
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId
    const keyObjectId = typeof keyId === 'string' ? new ObjectId(keyId) : keyId

    const result = await collection.updateMany({
      _id: keyObjectId,
      userId: userObjectId,
      isActive: true
    }, {
      $set: {
        permissions,
        updatedAt: new Date()
      }
    })

    return result.modifiedCount > 0
  }

  /**
   * Nettoie les clés expirées
   */
  static async cleanupExpiredKeys(): Promise<number> {
    const collection = await this.getCollection()
    const result = await collection.updateMany({
      expiresAt: { $lt: new Date() },
      isActive: true
    }, {
      $set: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    console.log(`Cleaned up ${result.modifiedCount} expired API keys`)
    return result.modifiedCount
  }
}
