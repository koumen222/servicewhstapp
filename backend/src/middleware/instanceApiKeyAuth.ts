import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyApiKey } from '../utils/apiKeyGenerator.js'

export interface InstanceApiKeyRequest extends Request {
  apiKeyAuth?: {
    apiKey: any
    instance: any
    user: any
  }
}

export async function instanceApiKeyAuth(
  req: InstanceApiKeyRequest,
  res: Response,
  next: NextFunction
) {
  console.log('\n========== INSTANCE API KEY AUTH ==========')
  
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      console.log('❌ No Authorization header')
      return res.status(401).json({
        success: false,
        error: 'MISSING_API_KEY',
        message: 'Authorization header is required'
      })
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid Authorization format')
      return res.status(401).json({
        success: false,
        error: 'INVALID_AUTH_FORMAT',
        message: 'Authorization must be Bearer token'
      })
    }

    const token = authHeader.substring(7)
    
    if (!token || token.length < 20) {
      console.log('❌ Invalid token format')
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid API key format'
      })
    }

    console.log('🔍 Searching for API key...')
    console.log('  Token prefix:', token.substring(0, 15) + '...')

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
            user: true
          }
        },
        user: true
      }
    })

    console.log(`  Found ${apiKeys.length} active API keys to check`)

    for (const apiKeyRecord of apiKeys) {
      const isValid = await verifyApiKey(token, apiKeyRecord.keyHash)
      
      if (isValid) {
        console.log('✅ API Key validated successfully')
        console.log('  Key ID:', apiKeyRecord.id)
        console.log('  Key Prefix:', apiKeyRecord.keyPrefix)
        console.log('  Instance:', apiKeyRecord.instance.instanceName)
        console.log('  User:', apiKeyRecord.user.email)

        await prisma.apiKey.update({
          where: { id: apiKeyRecord.id },
          data: {
            lastUsed: new Date(),
            lastUsedIp: req.ip || req.socket.remoteAddress || null,
            usageCount: { increment: 1 }
          }
        })

        req.apiKeyAuth = {
          apiKey: apiKeyRecord,
          instance: apiKeyRecord.instance,
          user: apiKeyRecord.user
        }

        console.log('  Updated usage stats')
        console.log('  Usage count:', apiKeyRecord.usageCount + 1)
        console.log('==========================================\n')

        return next()
      }
    }

    console.log('❌ No matching API key found')
    console.log('==========================================\n')

    return res.status(401).json({
      success: false,
      error: 'INVALID_API_KEY',
      message: 'Invalid or expired API key'
    })

  } catch (error: any) {
    console.error('💥 API Key Auth Error:', error.message)
    console.log('==========================================\n')
    
    return res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Authentication failed'
    })
  }
}

export async function checkApiKeyPermission(
  permission: string
) {
  return async (req: InstanceApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiKeyAuth) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'API key authentication required'
      })
    }

    const hasPermission = req.apiKeyAuth.apiKey.permissions.includes(permission)
    
    if (!hasPermission) {
      console.log(`❌ Permission denied: ${permission}`)
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `This API key does not have '${permission}' permission`
      })
    }

    next()
  }
}
