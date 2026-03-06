import { Collection, ObjectId, WithId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { User, UserDocument } from '../types/models.js'
import { getMongoCollection } from '../lib/mongo.js'

export class UserService {
  private static collectionName = 'users'

  private static async getCollection(): Promise<Collection<User>> {
    return getMongoCollection<User>(this.collectionName)
  }

  static async create(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserDocument> {
    const collection = await this.getCollection()
    const now = new Date()
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    
    const doc = {
      ...userData,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await collection.insertOne(doc as any)
    return {
      ...doc,
      _id: result.insertedId
    }
  }

  static async findByEmail(email: string): Promise<UserDocument | null> {
    const collection = await this.getCollection()
    return collection.findOne({ email })
  }

  static async findById(id: string | ObjectId): Promise<UserDocument | null> {
    try {
      const collection = await this.getCollection()
      const objectId = typeof id === 'string' ? new ObjectId(id) : id
      return collection.findOne({ _id: objectId })
    } catch (error) {
      console.error('Invalid ObjectId format:', id)
      return null
    }
  }

  static async verifyPassword(user: UserDocument, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password)
  }

  static async updateById(id: string | ObjectId, update: Partial<User>): Promise<UserDocument | null> {
    const collection = await this.getCollection()
    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    const now = new Date()
    
    // Hash password if it's being updated
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10)
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
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

  static async deleteById(id: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection()
    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    const result = await collection.deleteOne({ _id: objectId })
    return result.deletedCount > 0
  }

  static async findAll(activeOnly = false): Promise<UserDocument[]> {
    const collection = await this.getCollection()
    const filter = activeOnly ? { isActive: true } : {}
    return collection.find(filter).toArray()
  }

  static async updateLastActivity(id: string | ObjectId): Promise<void> {
    const collection = await this.getCollection()
    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    await collection.updateOne(
      { _id: objectId },
      { $set: { updatedAt: new Date() } }
    )
  }
}
