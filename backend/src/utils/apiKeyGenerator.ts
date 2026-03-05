import crypto from 'crypto'
import bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 12

export interface GeneratedApiKey {
  apiKey: string
  keyHash: string
  keyPrefix: string
}

export function generateApiKey(): GeneratedApiKey {
  const prefix = 'ak_live_'
  const randomBytes = crypto.randomBytes(24).toString('hex')
  const apiKey = prefix + randomBytes
  
  const keyPrefix = apiKey.substring(0, 15) + '...'
  
  return {
    apiKey,
    keyHash: '', // Will be hashed separately
    keyPrefix
  }
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return await bcrypt.hash(apiKey, BCRYPT_ROUNDS)
}

export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(apiKey, hash)
  } catch (error) {
    console.error('[API Key] Verification error:', error)
    return false
  }
}

export async function generateAndHashApiKey(): Promise<GeneratedApiKey> {
  const { apiKey, keyPrefix } = generateApiKey()
  const keyHash = await hashApiKey(apiKey)
  
  console.log('[API Key] Generated new API key')
  console.log('  Prefix:', keyPrefix)
  console.log('  Hash length:', keyHash.length)
  
  return {
    apiKey,
    keyHash,
    keyPrefix
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 20) return '***'
  return apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 4)
}
