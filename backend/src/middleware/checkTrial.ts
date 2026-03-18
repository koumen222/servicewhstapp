import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/userService.js'

/**
 * Middleware pour vérifier si l'essai gratuit de l'utilisateur est expiré
 * Bloque l'accès si l'essai est expiré et que l'utilisateur n'a pas payé
 */
export async function checkTrialExpiration(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    // Récupérer l'utilisateur
    const user = await UserService.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }

    // Si l'utilisateur a déjà payé ou est sur le plan premium, on le laisse passer
    if (user.isPaidAccount || user.hasPaid || user.plan === 'premium') {
      return next()
    }

    // Vérifier si l'essai gratuit est expiré
    if (user.trialEndsAt) {
      const now = new Date()
      const trialEnd = new Date(user.trialEndsAt)

      if (now > trialEnd) {
        // L'essai est expiré et l'utilisateur n'a pas payé
        return res.status(403).json({
          error: 'Votre période d\'essai gratuit de 3 jours est expirée. Veuillez effectuer un paiement pour continuer à utiliser le service.',
          code: 'TRIAL_EXPIRED',
          trialEndsAt: user.trialEndsAt,
          requiresPayment: true,
          paymentInfo: {
            whatsappNumber: '237676778377',
            plans: [
              { name: 'Basic', price: 3000, currency: 'XAF', instances: 1 },
              { name: 'Premium', price: 10000, currency: 'XAF', instances: 'unlimited' }
            ]
          }
        })
      }
    }

    // L'essai est toujours actif ou pas encore commencé
    next()
  } catch (error) {
    console.error('Trial check error:', error)
    res.status(500).json({
      error: 'Failed to verify trial status',
      code: 'TRIAL_CHECK_ERROR'
    })
  }
}

/**
 * Fonction helper pour vérifier si un utilisateur est en période d'essai active
 */
export function isTrialActive(user: any): boolean {
  if (user.isPaidAccount || user.hasPaid) {
    return false // Pas en essai, c'est un compte payant
  }

  if (!user.trialEndsAt) {
    return false // Pas d'essai configuré
  }

  const now = new Date()
  const trialEnd = new Date(user.trialEndsAt)
  return now <= trialEnd
}

/**
 * Fonction helper pour obtenir les jours restants de l'essai
 */
export function getTrialDaysRemaining(user: any): number {
  if (!user.trialEndsAt) {
    return 0
  }

  const now = new Date()
  const trialEnd = new Date(user.trialEndsAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}
