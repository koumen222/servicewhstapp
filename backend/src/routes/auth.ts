import { Router } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/authService.mongo.js'
import { emailService } from '../services/email.service.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  phone: z.string().optional(),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post('/register', async (req, res) => {
  try {
    const { email, name, password, phone, plan } = registerSchema.parse(req.body)

    const result = await AuthService.register({
      email,
      name,
      password,
      phone,
      plan: plan || 'free'
    })

    if (!result) {
      return res.status(400).json({ error: 'Email déjà utilisé' })
    }

    const { user, token, verificationToken } = result

    // Send verification email in background (non-blocking)
    // Don't await - let it run asynchronously
    emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken
    }).then(() => {
      console.log('✅ Verification email sent to:', user.email)
    }).catch((emailError) => {
      console.error('❌ Failed to send verification email:', emailError)
      // Email failure doesn't block registration
    })

    res.json({
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        plan: user.plan,
        maxInstances: user.maxInstances,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
      message: 'Compte créé avec succès. Un email de vérification vous a été envoyé.'
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

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de vérification manquant' })
    }

    const email = await AuthService.verifyEmailToken(token)
    if (!email) {
      return res.status(400).json({ error: 'Token de vérification invalide ou expiré' })
    }

    const activated = await AuthService.activateUserEmail(email)
    if (!activated) {
      return res.status(400).json({ error: 'Impossible d\'activer le compte' })
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({ to: email, name: email.split('@')[0] })
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError)
    }

    res.json({
      success: true,
      message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'
    })
  } catch (error) {
    console.error('💥 Email verification error:', error)
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
