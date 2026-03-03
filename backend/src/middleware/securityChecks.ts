import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import rateLimit from 'express-rate-limit'

const prisma = new PrismaClient()

/**
 * Middleware de sécurité avancé pour l'isolation multi-tenant
 * Vérifie que chaque requête respecte strictement l'isolation des données
 */
export const multiTenantIsolation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    const apiAuth = req.apiAuth

    // Pour les requêtes authentifiées par JWT
    if (userId && req.params) {
      await validateUserOwnership(userId, req.params, res)
    }

    // Pour les requêtes authentifiées par API Key
    if (apiAuth && req.params) {
      await validateApiKeyOwnership(apiAuth, req.params, res)
    }

    next()
  } catch (error) {
    console.error('Multi-tenant isolation error:', error)
    return res.status(403).json({
      error: 'Access denied',
      message: 'You are not authorized to access this resource',
      code: 'ACCESS_DENIED'
    })
  }
}

/**
 * Valide que l'utilisateur possède bien les ressources demandées
 */
async function validateUserOwnership(userId: string, params: any, res: Response) {
  // Vérifier l'ownership des instances
  if (params.instanceId) {
    const instance = await prisma.instance.findFirst({
      where: {
        id: params.instanceId,
        userId,
        isActive: true
      }
    })

    if (!instance) {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'The requested instance does not exist or you do not have access to it',
        code: 'INSTANCE_NOT_FOUND'
      })
    }
  }

  // Vérifier l'ownership des API keys
  if (params.apiKeyId) {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: params.apiKeyId,
        userId,
        isActive: true
      }
    })

    if (!apiKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'The requested API key does not exist or you do not have access to it',
        code: 'API_KEY_NOT_FOUND'
      })
    }
  }
}

/**
 * Valide que la clé API a bien accès aux ressources demandées
 */
async function validateApiKeyOwnership(apiAuth: any, params: any, res: Response) {
  const { instance, apiKeyData, user } = apiAuth

  // S'assurer que l'instance dans l'URL correspond à l'instance de la clé API
  if (params.instanceId && params.instanceId !== instance.id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'This API key cannot access the specified instance',
      code: 'INSTANCE_ACCESS_DENIED'
    })
  }

  // Vérifier les permissions spécifiques si nécessaire
  if (params.action) {
    const requiredPermission = getRequiredPermission(params.action)
    if (requiredPermission && !apiKeyData.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This API key does not have permission to ${params.action}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }
  }
}

/**
 * Obtient la permission requise pour une action
 */
function getRequiredPermission(action: string): string | null {
  const actionPermissions: { [key: string]: string } = {
    'send-message': 'send_message',
    'send-media': 'send_message',
    'get-status': 'get_instance_status',
    'manage-webhooks': 'manage_webhooks',
    'read-messages': 'read_messages'
  }

  return actionPermissions[action] || null
}

/**
 * Rate limiting par utilisateur (plus strict que par IP)
 */
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const user = req.user
    if (!user) return 100 // Default pour les non-authentifiés

    // Limites selon le plan
    const limits = {
      free: 200,
      starter: 500,
      pro: 2000,
      enterprise: 10000
    }

    return limits[user.plan as keyof typeof limits] || 100
  },
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip
  },
  message: (req: Request) => {
    return {
      error: 'Rate limit exceeded',
      message: `Too many requests for your ${req.user?.plan || 'current'} plan`,
      code: 'USER_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * Middleware de validation des données sensibles
 * Empêche l'injection de données malveillantes
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Nettoyer les paramètres d'URL
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = sanitizeString(value)
        }
      }
    }

    // Nettoyer le body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body)
    }

    // Nettoyer les query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitizeString(value)
        }
      }
    }

    next()
  } catch (error) {
    console.error('Input sanitization error:', error)
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Request contains invalid characters',
      code: 'INVALID_INPUT'
    })
  }
}

/**
 * Nettoie une chaîne de caractères
 */
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Supprimer les balises HTML
    .replace(/javascript:/gi, '') // Supprimer les liens JavaScript
    .replace(/on\w+=/gi, '') // Supprimer les event handlers
    .substring(0, 1000) // Limiter la longueur
}

/**
 * Nettoie récursivement un objet
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj
  
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = sanitizeString(key)
      sanitized[cleanKey] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Middleware de détection d'activité suspecte
 */
export const suspiciousActivityDetector = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || req.apiAuth?.user?.id
    const ip = req.ip
    const userAgent = req.headers['user-agent']

    // Stocker l'activité récente (en production, utiliser Redis)
    const activityKey = `activity:${userId || ip}`
    
    // Détecter les patterns suspects
    const suspiciousPatterns = [
      // Trop de requêtes vers des ressources différentes
      isScanningBehavior(req),
      // Tentatives d'accès à des ressources non autorisées
      isUnauthorizedAccess(req),
      // User-Agent suspect
      isSuspiciousUserAgent(userAgent || ''),
      // Paramètres malveillants
      hasMaliciousPayload(req)
    ]

    const suspiciousCount = suspiciousPatterns.filter(Boolean).length

    if (suspiciousCount >= 2) {
      console.warn(`🚨 Suspicious activity detected:`, {
        userId,
        ip,
        userAgent,
        url: req.url,
        method: req.method,
        body: req.body,
        patterns: suspiciousPatterns
      })

      // En production, vous pourriez vouloir bloquer temporairement l'IP/utilisateur
      // ou envoyer une alerte
    }

    next()
  } catch (error) {
    console.error('Suspicious activity detection error:', error)
    next() // Ne pas faire échouer la requête
  }
}

function isScanningBehavior(req: Request): boolean {
  // Détecter si l'utilisateur teste plusieurs endpoints rapidement
  const commonScanPaths = ['/admin', '/api/v1/users', '/debug', '/.env', '/config']
  return commonScanPaths.some(path => req.path.includes(path))
}

function isUnauthorizedAccess(req: Request): boolean {
  // Détecter les tentatives d'accès sans authentification appropriée
  const protectedPaths = ['/instances/', '/api-keys/', '/admin/']
  const hasAuth = req.user || req.apiAuth
  
  return protectedPaths.some(path => req.path.includes(path)) && !hasAuth
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousAgents = [
    'sqlmap', 'nmap', 'nikto', 'burpsuite', 'curl/7', 'python-requests',
    'postman', 'insomnia', 'gobuster', 'dirbuster'
  ]
  
  const lowerAgent = userAgent.toLowerCase()
  return suspiciousAgents.some(agent => lowerAgent.includes(agent))
}

function hasMaliciousPayload(req: Request): boolean {
  const payloadStr = JSON.stringify(req.body || '') + JSON.stringify(req.query || '')
  const maliciousPatterns = [
    /union\s+select/i,
    /script\s*>/i,
    /javascript:/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /<iframe/i,
    /\.\.\/\.\.\//,
    /etc\/passwd/i,
    /cmd\.exe/i
  ]
  
  return maliciousPatterns.some(pattern => pattern.test(payloadStr))
}

/**
 * Middleware de logging de sécurité avancé
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  const originalSend = res.send

  res.send = function(body) {
    const responseTime = Date.now() - startTime
    const statusCode = res.statusCode

    // Logger les événements de sécurité importants
    if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
      console.warn(`🔒 Security Event:`, {
        timestamp: new Date().toISOString(),
        event: getSecurityEventType(statusCode),
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id || null,
        apiKeyPrefix: req.apiAuth?.apiKeyData?.keyPrefix || null,
        statusCode,
        responseTime: `${responseTime}ms`,
        referer: req.headers.referer || null
      })
    }

    return originalSend.call(this, body)
  }

  next()
}

function getSecurityEventType(statusCode: number): string {
  switch (statusCode) {
    case 401: return 'UNAUTHORIZED_ACCESS'
    case 403: return 'FORBIDDEN_ACCESS'
    case 429: return 'RATE_LIMIT_EXCEEDED'
    default: return 'SECURITY_EVENT'
  }
}

/**
 * Middleware de validation des headers de sécurité
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Headers de sécurité obligatoires
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // HSTS en production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // CSP pour les API (très restrictif)
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")

  next()
}
