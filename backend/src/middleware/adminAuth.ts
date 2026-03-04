import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types/index.js'

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: 'Cette action nécessite les privilèges administrateur' 
      })
    }

    next()
  } catch (error) {
    console.error('[ADMIN AUTH] Erreur:', error)
    return res.status(500).json({ error: 'Erreur lors de la vérification des privilèges' })
  }
}

export function requireAdminOrSelf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const targetUserId = req.params.userId
    const isOwner = req.user.id === targetUserId
    const isAdmin = req.user.isAdmin

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: 'Vous ne pouvez modifier que votre propre profil ou avoir les privilèges administrateur' 
      })
    }

    // Ajouter une indication si c'est un admin qui agit sur un autre utilisateur
    if (isAdmin && !isOwner) {
      req.isAdminAction = true
    }

    next()
  } catch (error) {
    console.error('[ADMIN AUTH] Erreur:', error)
    return res.status(500).json({ error: 'Erreur lors de la vérification des privilèges' })
  }
}
