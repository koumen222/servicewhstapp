import { Router } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/authService.mongo.js'
import { UserService } from '../services/userService.js'
import { emailService } from '../services/email.service.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  phone: z.string().optional(),
  plan: z.enum(['basic', 'premium']).optional().default('basic'),
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
      plan
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

/**
 * GET /profile
 * Obtenir le profil de l'utilisateur connecté
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const user = await UserService.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }

    res.json({
      success: true,
      data: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        plan: user.plan,
        maxInstances: user.maxInstances,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      error: 'Failed to get profile',
      code: 'PROFILE_ERROR'
    })
  }
})

export default router
