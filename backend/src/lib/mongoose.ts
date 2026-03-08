import mongoose from 'mongoose'

let isConnected = false

export async function connectMongoose(): Promise<void> {
  if (isConnected) {
    console.log('✅ Mongoose already connected')
    return
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  try {
    console.log('🔄 Connecting to MongoDB with Mongoose...')
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    isConnected = true
    console.log('✅ Mongoose connected to MongoDB successfully')
  } catch (error) {
    console.error('❌ Failed to connect Mongoose to MongoDB:', error)
    throw error
  }
}

export async function disconnectMongoose(): Promise<void> {
  if (!isConnected) {
    return
  }

  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('🔴 Mongoose disconnected from MongoDB')
  } catch (error) {
    console.error('❌ Failed to disconnect Mongoose:', error)
    throw error
  }
}

process.on('SIGINT', disconnectMongoose)
process.on('SIGTERM', disconnectMongoose)
