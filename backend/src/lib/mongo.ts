import { MongoClient, Db, Collection, Document } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectMongo(): Promise<Db> {
  if (db && client) {
    return db
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  try {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db() // Uses database name from URI
    console.log('✅ Connected to MongoDB')
    return db
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    throw error
  }
}

export async function getMongoCollection<T extends Document = any>(name: string): Promise<Collection<T>> {
  const database = await connectMongo()
  return database.collection<T>(name)
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('🔴 MongoDB connection closed')
  }
}

// Graceful shutdown
process.on('SIGINT', closeMongo)
process.on('SIGTERM', closeMongo)
