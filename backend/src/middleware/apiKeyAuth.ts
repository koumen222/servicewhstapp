import { Request, Response, NextFunction } from 'express'
import { ApiKeyService } from '../services/apiKeyService.js'

// Extension des types Express pour inclure nos données personnalisées
declare global {
  namespace Express {
    interface Request {
      apiAuth?: {
        instance: any
        apiKeyData: any
        user: any
      }
    }
  }
}

interface ApiKeyAuthOptions {
  requiredPermissions?: string[]
  checkQuota?: boolean
}

/**
 * Middleware pour valider les clés API et autoriser l'accès aux endpoints publics
 * Vérifie le header x-api-key et assure l'isolation multi-tenant
 */
export const apiKeyAuth = (options: ApiKeyAuthOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extraire la clé API du header
      const apiKey = req.headers['x-api-key'] as string

      if (!apiKey) {
        return res.status(401).json({
          error: 'API key required',
          message: 'Please provide x-api-key header',
          code: 'MISSING_API_KEY'
        })
      }

      // Vérifier le format de la clé API
      if (!apiKey.startsWith('ak_live_') || apiKey.length < 30) {
        return res.status(401).json({
          error: 'Invalid API key format',
          message: 'API key must be in format: ak_live_...',
          code: 'INVALID_API_KEY_FORMAT'
        })
      }

      // Valider la clé API
      const validation = await ApiKeyService.validateApiKey(apiKey)

      if (!validation.isValid) {
        return res.status(401).json({
          error: 'Invalid or expired API key',
          message: 'The provided API key is invalid, expired, or has been revoked',
          code: 'INVALID_API_KEY'
        })
      }

      const { instance, apiKeyData, user } = validation

      // Vérifier les permissions requises
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasPermissions = options.requiredPermissions.every(permission =>
          apiKeyData.permissions.includes(permission)
        )

        if (!hasPermissions) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: `This API key does not have required permissions: ${options.requiredPermissions.join(', ')}`,
            code: 'INSUFFICIENT_PERMISSIONS'
          })
        }
      }

      // Vérifier les quotas si requis
      if (options.checkQuota) {
        const quotaCheck = await checkQuotaLimits(instance.id)
        if (!quotaCheck.allowed) {
          return res.status(429).json({
            error: 'Quota exceeded',
            message: quotaCheck.message,
            code: 'QUOTA_EXCEEDED',
            resetDate: quotaCheck.resetDate
          })
        }
      }

      // Vérifier que l'instance WhatsApp est connectée (pour certains endpoints)
      const requiresConnection = ['send_message', 'get_profile', 'manage_webhooks']
      const endpoint = req.path.split('/').pop()
      
      if (requiresConnection.some(action => req.path.includes(action)) || 
          endpoint === 'send-message') {
        if (instance.status !== 'open') {
          return res.status(400).json({
            error: 'Instance not connected',
            message: 'WhatsApp instance must be connected to perform this action',
            code: 'INSTANCE_NOT_CONNECTED',
            instanceStatus: instance.status
          })
        }
      }

      // Ajouter les données d'authentification à la requête
      req.apiAuth = {
        instance,
        apiKeyData,
        user
      }

      // Logger l'utilisation pour audit
      console.log(`🔑 API Key used: ${apiKeyData.keyPrefix} | Instance: ${instance.instanceName} | User: ${user.email} | Endpoint: ${req.method} ${req.path}`)

      next()

    } catch (error) {
      console.error('API Key Auth Error:', error)
      
      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication',
        code: 'AUTH_ERROR'
      })
    }
  }
}

/**
 * Vérifie les limites de quota pour une instance
 */
async function checkQuotaLimits(instanceId: string): Promise<{
  allowed: boolean
  message?: string
  resetDate?: Date
}> {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // Vérifier le quota quotidien de messages
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dailyQuota = await prisma.quotaUsage.findUnique({
      where: {
        instanceId_quotaType: {
          instanceId,
          quotaType: 'messages_per_day'
        }
      }
    })

    if (dailyQuota) {
      if (dailyQuota.currentUsage >= dailyQuota.maxAllowed) {
        return {
          allowed: false,
          message: `Daily message limit reached (${dailyQuota.maxAllowed} messages)`,
          resetDate: dailyQuota.resetDate
        }
      }
    }

    // Vérifier le quota mensuel
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthQuota = await prisma.quotaUsage.findUnique({
      where: {
        instanceId_quotaType: {
          instanceId,
          quotaType: 'messages_per_month'
        }
      }
    })

    if (monthQuota) {
      if (monthQuota.currentUsage >= monthQuota.maxAllowed) {
        return {
          allowed: false,
          message: `Monthly message limit reached (${monthQuota.maxAllowed} messages)`,
          resetDate: monthQuota.resetDate
        }
      }
    }

    await prisma.$disconnect()
    return { allowed: true }

  } catch (error) {
    console.error('Quota check error:', error)
    // En cas d'erreur, on autorise (fail-open) mais on log
    return { allowed: true }
  }
}

/**
 * Middleware optionnel pour logging détaillé des requêtes API
 */
export const apiRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // Capturer l'IP réelle (derrière un proxy)
  const realIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                 req.headers['x-real-ip'] as string || 
                 req.connection.remoteAddress

  const originalSend = res.send

  res.send = function(body) {
    const responseTime = Date.now() - startTime
    
    // Logger la requête complète
    console.log(`📊 API Request Log:`, {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: realIp,
      userAgent: req.headers['user-agent'],
      apiKeyPrefix: req.apiAuth?.apiKeyData?.keyPrefix || 'none',
      instanceId: req.apiAuth?.instance?.id || 'none',
      userId: req.apiAuth?.user?.id || 'none',
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      bodySize: Buffer.byteLength(body || '', 'utf8')
    })

    // Appeler la fonction originale
    return originalSend.call(this, body)
  }

  next()
}

/**
 * Middleware de limitation de taux par clé API
 * Utilise une approche sliding window en mémoire (Redis recommandé en production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const apiKeyRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string
    
    if (!apiKey || !req.apiAuth) {
      return next() // Skip rate limiting si pas de clé API valide
    }

    const now = Date.now()
    const key = `rateLimit:${req.apiAuth.apiKeyData.id}`
    
    // Nettoyer les entrées expirées périodiquement
    if (Math.random() < 0.01) { // 1% de chance de cleanup
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k)
        }
      }
    }

    const current = rateLimitStore.get(key)
    
    if (!current || current.resetTime < now) {
      // Nouvelle fenêtre
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (current.count >= maxRequests) {
      const resetIn = Math.ceil((current.resetTime - now) / 1000)
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} requests per ${windowMs/1000} seconds`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetIn
      })
    }

    // Incrémenter le compteur
    current.count++
    rateLimitStore.set(key, current)
    
    // Ajouter headers de rate limiting
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - current.count).toString(),
      'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString()
    })

    next()
  }
}
