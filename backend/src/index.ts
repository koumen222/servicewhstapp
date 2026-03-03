import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import authRoutes from './routes/auth.js'
import instanceRoutes from './routes/instances.js'
import messageRoutes from './routes/messages.js'
import healthRoutes from './routes/health.js'
import publicRoutes from './routes/public.js'
import instanceManagementRoutes from './routes/instanceManagement.js'
import { 
  multiTenantIsolation, 
  userRateLimit, 
  sanitizeInput, 
  suspiciousActivityDetector, 
  securityLogger, 
  securityHeaders 
} from './middleware/securityChecks.js'
import { authMiddleware } from './middleware/auth.js'

// Extension des types Express pour nos données personnalisées
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        plan: string
        maxInstances: number
        isActive: boolean
      }
      apiAuth?: {
        instance: any
        apiKeyData: any
        user: any
      }
      startTime?: number
    }
  }
}

const app = express()
app.set('etag', false)
app.set('trust proxy', 1)

// =============== SÉCURITÉ GLOBALE ===============
app.use(securityHeaders)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}))

// Logging de sécurité
app.use(securityLogger)
app.use(suspiciousActivityDetector)
app.use(sanitizeInput)

const allowedOrigins = env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/$/, ''))
console.log('🔧 CORS allowedOrigins:', allowedOrigins)

// CORS sécurisé
app.use(cors({
  origin: (origin, callback) => {
    // En développement, autoriser les requêtes sans origin (Postman, etc.)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    
    console.log(`🔍 CORS check - Origin: ${origin}, Allowed: ${allowedOrigins}`)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed')
      return callback(null, true)
    }
    console.log('❌ CORS: Origin blocked')
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  maxAge: 86400 // Cache preflight requests for 24 hours
}))

app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// =============== RATE LIMITING ===============
// Rate limiting global (par IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Plus généreux pour les API publiques
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health'
  }
})
app.use(globalLimiter)

// Middleware pour mesurer le temps de traitement
app.use((req: any, res, next) => {
  req.startTime = Date.now()
  next()
})

// Log des requêtes importantes (en développement uniquement)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (!req.path.includes('/health')) {
      console.log(`📥 ${req.method} ${req.url}`)
      if (req.headers['x-api-key']) {
        console.log(`🔑 API Key: ${req.headers['x-api-key'].toString().substring(0, 20)}...`)
      }
    }
    next()
  })
}

// =============== ROUTES PUBLIQUES (avec clés API) ===============
app.use('/api/v1', publicRoutes)

// =============== ROUTES AUTHENTIFIÉES (JWT) ===============
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)

// Routes protégées par JWT avec isolation multi-tenant
app.use('/api/instances', authMiddleware, userRateLimit, multiTenantIsolation, instanceManagementRoutes)
app.use('/api/instance', authMiddleware, userRateLimit, multiTenantIsolation, instanceRoutes)
app.use('/api/message', authMiddleware, userRateLimit, multiTenantIsolation, messageRoutes)

// =============== ROUTES DE GESTION DES CLÉS API ===============
app.use('/api/api-keys', authMiddleware, userRateLimit, multiTenantIsolation, (req, res, next) => {
  // Routes pour la gestion des clés API (à implémenter si nécessaire)
  res.status(501).json({ error: 'API key management routes not yet implemented' })
})

// =============== ENDPOINTS DE SANTÉ ===============
// Health check simple (sans authentification)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Health check détaillé (avec authentification)
app.get('/api/health/detailed', authMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // TODO: vérifier la connexion DB
      evolutionApi: 'connected', // TODO: vérifier la connexion Evolution API
      redis: process.env.REDIS_URL ? 'connected' : 'not_configured'
    },
    stats: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    }
  })
})

// =============== GESTION DES ERREURS ===============
// 404 Handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`)
  res.status(404).json({ 
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  })
})

// Error handler global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Unhandled error:', err)
  
  // Log l'erreur avec contexte
  console.error('Error context:', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id || null,
    timestamp: new Date().toISOString()
  })

  // Ne pas exposer les détails d'erreur en production
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && { details: err.message, stack: err.stack }),
    timestamp: new Date().toISOString()
  })
})

// =============== DÉMARRAGE DU SERVEUR ===============
const PORT = Number(env.PORT) || 3001

// Gestionnaire de fermeture propre
const gracefulShutdown = (signal: string) => {
  console.log(`📴 Received ${signal}, shutting down gracefully...`)
  
  // TODO: Fermer les connexions DB, Redis, etc.
  // await prisma.$disconnect()
  
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp SaaS Multi-Tenant API started on http://localhost:${PORT}`)
  console.log(`🔒 Evolution API: ${env.EVOLUTION_API_URL}`)
  console.log(`🌐 Frontend origins: ${allowedOrigins.join(', ')}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🛡️ Security: Multi-tenant isolation enabled`)
  console.log(`⚡ Features: API Keys, Quotas, Rate Limiting, Audit Logs`)
  
  // Log de démarrage pour monitoring
  console.log(JSON.stringify({
    event: 'SERVER_STARTED',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    pid: process.pid
  }))
})
