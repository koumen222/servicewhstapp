import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { generateToken } from '../lib/jwt.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  isAdmin: z.boolean().optional().default(false),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post('/register', async (req, res) => {
  try {
    const { email, name, password, isAdmin } = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email déjà utilisé' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        plan: isAdmin ? 'enterprise' : 'free',
        maxInstances: isAdmin ? 100 : 1,
        isAdmin: isAdmin || false,
      },
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      maxInstances: user.maxInstances,
      isActive: user.isActive,
      isAdmin: (user as any).isAdmin ?? false,
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        maxInstances: user.maxInstances,
        isAdmin: (user as any).isAdmin ?? false,
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

    const user = await prisma.user.findUnique({ where: { email } })
    console.log('👤 User found:', !!user)
    if (!user) {
      console.log('❌ LOGIN failed: user not found')
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const valid = await bcrypt.compare(password, user.password)
    console.log('🔑 Password valid:', valid)
    if (!valid) {
      console.log('❌ LOGIN failed: invalid password')
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      maxInstances: user.maxInstances,
      isActive: user.isActive,
      isAdmin: (user as any).isAdmin ?? false,
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        maxInstances: user.maxInstances,
        isAdmin: (user as any).isAdmin ?? false,
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
