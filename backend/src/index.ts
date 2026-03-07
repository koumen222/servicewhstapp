import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { connectMongo, closeMongo } from './lib/mongo.js'
import authRoutes from './routes/auth.js'
import instancesNewRoutes from './routes/instances-new.js'
import instanceManagementRoutes from './routes/instanceManagement.js'
import whatsappInstanceRoutes from './routes/whatsapp/instances.js'
import publicWhatsAppRoutes from './routes/whatsapp/public.js'
import supportRoutes from './routes/support.js'
import adminRoutes from './routes/admin.js'
import { authMiddleware } from './middleware/auth.js'

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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}))

const allowedOrigins = env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/$/, ''))
console.log('🔧 CORS allowedOrigins:', allowedOrigins)

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // En développement, autoriser toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 CORS check (DEV MODE) - Origin: ${origin} - Allowed`)
      return callback(null, true)
    }
    
    // En production, autoriser les origines configurées + requêtes sans origin (Postman, curl, etc.)
    console.log(`🔍 CORS check (PROD) - Origin: ${origin}`)
    
    // Autoriser les requêtes sans origin (serveur à serveur, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS: No origin header - Allowed')
      return callback(null, true)
    }
    
    // Vérifier si l'origin est dans la liste autorisée
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origin ${origin} is in allowed list`)
      return callback(null, true)
    }
    
    console.log(`❌ CORS: Origin ${origin} blocked. Allowed origins:`, allowedOrigins)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
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

// Log des requêtes importantes
app.use((req, res, next) => {
  if (!req.path.includes('/health')) {
    console.log(`📥 ${req.method} ${req.url}`)
    if (req.headers['x-api-key']) {
      console.log(`🔑 API Key: ${req.headers['x-api-key'].toString().substring(0, 20)}...`)
    }
  }
  next()
})


// =============== INITIALISATION BASES DE DONNÉES ===============
// Initialiser MongoDB avec retry et gestion d'erreur robuste
let mongoRetryCount = 0
const maxMongoRetries = 5

async function initializeMongoWithRetry() {
  try {
    await connectMongo()
    console.log('✅ MongoDB initialized successfully')
  } catch (error) {
    mongoRetryCount++
    console.error(`❌ MongoDB connection attempt ${mongoRetryCount}/${maxMongoRetries} failed:`, error)
    
    if (mongoRetryCount < maxMongoRetries) {
      console.log(`🔄 Retrying MongoDB connection in 5 seconds... (${mongoRetryCount}/${maxMongoRetries})`)
      setTimeout(initializeMongoWithRetry, 5000)
    } else {
      console.error('💀 Max MongoDB retries reached. Continuing without MongoDB...')
      console.error('   Some features will not work without MongoDB.')
    }
  }
}

// Démarrer l'initialisation MongoDB en arrière-plan
initializeMongoWithRetry()

// =============== WEBHOOKS (sans authentification - Evolution API) ===============
// app.use('/webhooks', webhookRoutes)
// console.log('✅ Registered webhook endpoint: /webhooks/evolution')

// =============== ROUTES PUBLIQUES (avec clés API) ===============
// app.use('/api/v1', publicRoutes)

// =============== API EXTERNE (avec tokens d'instance) ===============
app.use('/api/v1/external', publicWhatsAppRoutes)
console.log('✅ Registered External WhatsApp routes: /api/v1/external/whatsapp/send-direct')

// =============== ROUTES AUTHENTIFIÉES (JWT) ===============
// Health check simple (sans authentification)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

app.use('/api/auth', authRoutes)
console.log('✅ Registered auth routes: /api/auth/login, /api/auth/register, /api/auth/verify-email')

// Admin routes (avec authentification admin)
app.use('/api/admin', adminRoutes)
console.log('✅ Registered admin routes: /api/admin/*')

// Support chatbot (public - no auth required)
app.use('/api/support', supportRoutes)
console.log('✅ Registered support chatbot route: /api/support/chat')

app.use('/api/instances', authMiddleware, instancesNewRoutes)

// Routes protégées par JWT
app.use('/api/instance-management', authMiddleware, instanceManagementRoutes)
console.log('✅ Registered routes: /api/instance-management/*')

// =============== ROUTES WHATSAPP INSTANCE (MongoDB) ===============
app.use('/api', authMiddleware, whatsappInstanceRoutes)
console.log('✅ Registered WhatsApp instance routes (auth): /api/create-instance, /api/refresh-qr/:id, /api/check-connection/:id, /api/send-message/:id')

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
  
  // Fermer MongoDB
  closeMongo().then(() => {
    console.log('🔴 MongoDB connection closed')
  }).catch((err: any) => {
    console.error('❌ Error closing MongoDB:', err)
  })
  
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
