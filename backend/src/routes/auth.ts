import { Router } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/authService.mongo.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post('/register', async (req, res) => {
  try {
    const { email, name, password, plan } = registerSchema.parse(req.body)

    const result = await AuthService.register({
      email,
      name,
      password,
      plan: plan || 'free'
    })

    if (!result) {
      return res.status(400).json({ error: 'Email déjà utilisé' })
    }

    const { user, token } = result

    res.json({
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        plan: user.plan,
        maxInstances: user.maxInstances,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    console.log('💥 Error:', error)
    if (error instanceof z.ZodError) {
      console.log('📝 Validation error:', error.errors)
      return res.status(400).json({ error: 'Données invalides', details: error.errors })
    }
    console.log('🚨 Server error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/login', async (req, res) => {
  try {
    console.log('🔐 LOGIN attempt:', { email: req.body?.email, hasPassword: !!req.body?.password })
    const { email, password } = loginSchema.parse(req.body)

    const result = await AuthService.login(email, password)
    console.log('👤 Login result:', !!result)
    
    if (!result) {
      console.log('❌ LOGIN failed: invalid credentials')
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const { user, token } = result

    res.json({
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        plan: user.plan,
        maxInstances: user.maxInstances,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    console.log('💥 Error:', error)
    if (error instanceof z.ZodError) {
      console.log('📝 Validation error:', error.errors)
      return res.status(400).json({ error: 'Données invalides', details: error.errors })
    }
    console.log('🚨 Server error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
