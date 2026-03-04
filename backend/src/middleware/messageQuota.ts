import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types/index.js'
import { canSendMessage } from '../utils/quotaManager.js'

export async function checkMessageQuota(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    // Récupérer l'instanceId depuis les paramètres de la requête
    const instanceId = req.instanceId
    if (!instanceId) {
      return res.status(400).json({ error: 'Instance non spécifiée' })
    }

    const quotaCheck = await canSendMessage(instanceId)
    
    if (!quotaCheck.canSend) {
      return res.status(429).json({ 
        error: 'Limite d\'envoi de messages atteinte',
        reason: quotaCheck.reason,
        quota: {
          daily: {
            current: quotaCheck.dailyUsage,
            limit: quotaCheck.dailyLimit
          },
          monthly: {
            current: quotaCheck.monthlyUsage,
            limit: quotaCheck.monthlyLimit
          }
        }
      })
    }

    // Stocker les infos de quota pour utilisation dans la route
    req.quotaInfo = quotaCheck
    next()
  } catch (error) {
    console.error('[MESSAGE QUOTA] Erreur:', error)
    return res.status(500).json({ error: 'Erreur lors de la vérification des limites' })
  }
}
