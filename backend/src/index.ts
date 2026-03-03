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
app.use(cors({
  origin: env.FRONTEND_URL,
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
  res.status(404).json({ error: 'Route non trouvée' })
})

const PORT = parseInt(env.PORT)
app.listen(PORT, () => {
  console.log(`🚀 Backend proxy démarré sur http://localhost:${PORT}`)
  console.log(`🔒 Evolution API cachée : ${env.EVOLUTION_API_URL}`)
  console.log(`🌐 Frontend autorisé : ${env.FRONTEND_URL}`)
})
