import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/authService.mongo.js'

// Types pour l'authentification JWT
interface JWTPayload {
  id: string
  email: string
  name: string
  plan: string
  maxInstances: number
  isActive?: boolean
}

// Middleware d'authentification JWT pour le système multi-tenant
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Vérifier la présence du header Authorization
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token',
        code: 'MISSING_AUTH_TOKEN'
      })
    }

    // Extraire et vérifier le token
    const token = authHeader.substring(7)
    if (!token || token.length === 0) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Bearer token is empty',
        code: 'EMPTY_TOKEN'
      })
    }

    // Vérifier le token avec AuthService et récupérer les données fraîches de l'utilisateur
    const user = await AuthService.verifyToken(token)
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or expired',
        code: 'INVALID_TOKEN'
      })
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user._id?.toString() || '',
      email: user.email,
      name: user.name,
      plan: user.plan || 'free',
      maxInstances: user.maxInstances || 1,
      isActive: user.isActive ?? true
    }

    // Logger l'authentification (en développement uniquement)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 Authenticated user: ${user.email} (${user.plan} plan)`)
    }

    next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
      code: 'AUTH_ERROR'
    })
  }
}

// Legacy function pour compatibilité avec l'ancien code
export function authenticate(req: any, res: Response, next: NextFunction) {
  return authMiddleware(req, res, next)
}

/**
 * Middleware d'authentification optionnelle (n'échoue pas si pas de token)
 * Utile pour des endpoints qui peuvent fonctionner avec ou sans authentification
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader?.startsWith('Bearer ')) {
    // Pas d'authentification, continuer sans user
    return next()
  }

  // Utiliser le middleware principal mais ne pas faire échouer en cas d'erreur
  try {
    await authMiddleware(req, res, next)
  } catch (error) {
    // En cas d'erreur d'auth optionnelle, continuer sans user
    console.warn('Optional auth failed:', error)
    next()
  }
}

/**
 * Middleware pour vérifier des rôles/plans spécifiques
 */
export const requirePlan = (requiredPlans: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (!requiredPlans.includes(user.plan)) {
      return res.status(403).json({
        error: 'Insufficient plan',
        message: `This feature requires one of these plans: ${requiredPlans.join(', ')}. Your current plan: ${user.plan}`,
        code: 'INSUFFICIENT_PLAN'
      })
    }

    next()
  }
}

/**
 * Middleware pour vérifier que l'utilisateur peut créer des instances
 */
export const canCreateInstance = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user
  
  if (!user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
  }

  try {
    const { InstanceService } = await import('../services/instanceService.js')
    const instanceCount = await InstanceService.countUserInstances(user.id, true)

    if (instanceCount >= user.maxInstances) {
      return res.status(400).json({
        error: 'Instance limit reached',
        message: `Your ${user.plan} plan allows maximum ${user.maxInstances} instances`,
        code: 'INSTANCE_LIMIT_REACHED',
        currentCount: instanceCount,
        maxAllowed: user.maxInstances
      })
    }

    next()
  } catch (error) {
    console.error('Instance limit check error:', error)
    return res.status(500).json({
      error: 'Failed to check instance limits',
      code: 'LIMIT_CHECK_ERROR'
    })
  }
}
