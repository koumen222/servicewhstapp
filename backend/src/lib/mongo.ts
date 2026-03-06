import { MongoClient, Db, Collection, Document } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectMongo(): Promise<Db> {
  // Si la connexion existe déjà, vérifier qu'elle est toujours active
  if (db && client) {
    try {
      // Tester la connexion avec un ping
      await db.admin().ping()
      return db
    } catch (error) {
      console.log('⚠️ MongoDB connection lost, reconnecting...')
      // La connexion n'est plus active, continuer avec une nouvelle connexion
    }
  }

  // Fermer la connexion précédente si elle existe
  if (client) {
    try {
      await client.close()
    } catch (error) {
      console.log('⚠️ Failed to close previous MongoDB connection:', error)
    }
    client = null
    db = null
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  try {
    console.log('🔄 Connecting to MongoDB...')
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    })
    await client.connect()
    db = client.db() // Uses database name from URI
    console.log('✅ Connected to MongoDB successfully')
    
    // Vérifier la connexion avec un ping
    await db.admin().ping()
    console.log('🏓 MongoDB ping successful')
    
    return db
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    client = null
    db = null
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
