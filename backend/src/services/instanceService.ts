import { Collection, ObjectId, WithId } from 'mongodb'
import { WhatsAppInstance } from '../types/instance.js'
import { getMongoCollection } from '../lib/mongo.js'

export interface UserInstance {
  _id?: ObjectId
  userId: string
  instanceName: string
  evolutionInstanceId?: string
  customName: string
  instanceToken: string
  status: 'pending' | 'connected' | 'disconnected' | 'error' | 'close' | 'connecting' | 'open' | 'closed' | 'created'
  whatsappNumber?: string
  profileName?: string
  profilePictureUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastActivity?: Date
}

export type UserInstanceDocument = WithId<UserInstance>

export class InstanceService {
  private static userInstanceCollectionName = 'user_instances'
  private static whatsappInstanceCollectionName = 'whatsapp_instances'

  private static async getUserInstanceCollection(): Promise<Collection<UserInstance>> {
    return getMongoCollection<UserInstance>(this.userInstanceCollectionName)
  }

  private static async getWhatsAppInstanceCollection(): Promise<Collection<WhatsAppInstance>> {
    return getMongoCollection<WhatsAppInstance>(this.whatsappInstanceCollectionName)
  }

  // User Instance Management (for SaaS)
  static async createUserInstance(instanceData: Omit<UserInstance, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserInstanceDocument> {
    const collection = await this.getUserInstanceCollection()
    const now = new Date()
    const doc = {
      ...instanceData,
      createdAt: now,
      updatedAt: now
    }
    const result = await collection.insertOne(doc as any)
    return {
      ...doc,
      _id: result.insertedId
    }
  }

  static async findUserInstances(userId: string, activeOnly = true): Promise<UserInstanceDocument[]> {
    const collection = await this.getUserInstanceCollection()
    const filter = { userId }
    if (activeOnly) {
      (filter as any).isActive = true
    }
    return collection.find(filter).sort({ createdAt: -1 }).toArray()
  }

  static async findUserInstanceById(instanceId: string, userId: string): Promise<UserInstanceDocument | null> {
    const collection = await this.getUserInstanceCollection()
    const objectId = new ObjectId(instanceId)
    return collection.findOne({ _id: objectId, userId, isActive: true })
  }

  static async findUserInstanceByName(instanceName: string, userId: string): Promise<UserInstanceDocument | null> {
    const collection = await this.getUserInstanceCollection()
    return collection.findOne({ instanceName, userId, isActive: true })
  }

  static async countUserInstances(userId: string, activeOnly = true): Promise<number> {
    const collection = await this.getUserInstanceCollection()
    const filter = { userId }
    if (activeOnly) {
      (filter as any).isActive = true
    }
    return collection.countDocuments(filter)
  }

  static async updateUserInstance(instanceId: string, userId: string, update: Partial<UserInstance>): Promise<UserInstanceDocument | null> {
    const collection = await this.getUserInstanceCollection()
    const objectId = new ObjectId(instanceId)
    const now = new Date()
    const result = await collection.findOneAndUpdate(
      { _id: objectId, userId },
      { 
        $set: { 
          ...update, 
          updatedAt: now 
        } 
      },
      { returnDocument: 'after' }
    )
    return result
  }

  static async deactivateUserInstance(instanceId: string, userId: string): Promise<boolean> {
    const collection = await this.getUserInstanceCollection()
    const objectId = new ObjectId(instanceId)
    const result = await collection.updateOne(
      { _id: objectId, userId },
      { $set: { isActive: false, updatedAt: new Date() } }
    )
    return result.modifiedCount > 0
  }

  // WhatsApp Instance Management (for Evolution API)
  static async create(instanceData: Omit<WhatsAppInstance, '_id' | 'createdAt' | 'updatedAt'>): Promise<WithId<WhatsAppInstance>> {
    const collection = await this.getWhatsAppInstanceCollection()
    const now = new Date()
    const doc = {
      ...instanceData,
      createdAt: now,
      updatedAt: now
    }
    const result = await collection.insertOne(doc as any)
    return {
      ...doc,
      _id: result.insertedId
    }
  }

  static async findByInstanceName(instanceName: string): Promise<WithId<WhatsAppInstance> | null> {
    const collection = await this.getWhatsAppInstanceCollection()
    return collection.findOne({ instanceName })
  }

  static async findByInstanceNameWithOwner(instanceName: string, userId?: string): Promise<WithId<WhatsAppInstance> | null> {
    const collection = await this.getWhatsAppInstanceCollection()
    const filter: any = { instanceName }
    // If multi-tenant, add userId filter
    // if (userId) filter.userId = userId
    return collection.findOne(filter)
  }

  static async findAll(): Promise<WithId<WhatsAppInstance>[]> {
    const collection = await this.getWhatsAppInstanceCollection()
    return collection.find({}).toArray()
  }

  static async findAllByOwner(userId?: string): Promise<WithId<WhatsAppInstance>[]> {
    const collection = await this.getWhatsAppInstanceCollection()
    // If multi-tenant, add userId filter
    const filter = userId ? { userId } : {}
    return collection.find(filter).toArray()
  }

  static async updateByInstanceName(instanceName: string, update: Partial<WhatsAppInstance>): Promise<WithId<WhatsAppInstance> | null> {
    const collection = await this.getWhatsAppInstanceCollection()
    const now = new Date()
    const result = await collection.findOneAndUpdate(
      { instanceName },
      { 
        $set: { 
          ...update, 
          updatedAt: now 
        } 
      },
      { returnDocument: 'after' }
    )
    return result
  }

  static async deleteByInstanceName(instanceName: string): Promise<boolean> {
    const collection = await this.getWhatsAppInstanceCollection()
    const result = await collection.deleteOne({ instanceName })
    return result.deletedCount > 0
  }

  static async exists(instanceName: string): Promise<boolean> {
    const collection = await this.getWhatsAppInstanceCollection()
    const doc = await collection.findOne({ instanceName }, { projection: { _id: 1 } })
    return !!doc
  }
}
