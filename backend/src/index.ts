import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import authRoutes from './routes/auth.js'
import instanceRoutes from './routes/instances.js'
import messageRoutes from './routes/messages.js'

const app = express()

app.use(helmet())
const allowedOrigins = env.FRONTEND_URL.split(',').map(o => o.trim().replace(/\/$/, ''))
console.log('🔧 CORS allowedOrigins:', allowedOrigins)

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`)
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2))
  console.log('🌐 Origin:', req.headers.origin)
  next()
})

app.use(cors({
  origin: (origin, callback) => {
    console.log(`🔍 CORS check - Origin: ${origin}, Allowed: ${allowedOrigins}`)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed')
      return callback(null, true)
    }
    console.log('❌ CORS: Origin blocked')
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, réessayez plus tard',
})
app.use(limiter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/instance', instanceRoutes)
app.use('/api/message', messageRoutes)

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`)
  res.status(404).json({ error: 'Route non trouvée' })
})

const PORT = Number(env.PORT) || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend proxy démarré sur http://localhost:${PORT}`)
  console.log(`🔒 Evolution API cachée : ${env.EVOLUTION_API_URL}`)
  console.log(`🌐 Frontend autorisé : ${env.FRONTEND_URL}`)
})
