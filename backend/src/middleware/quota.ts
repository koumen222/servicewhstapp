import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'

export async function checkInstanceQuota(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const instanceCount = await prisma.instance.count({
      where: { 
        userId: req.user.id,
        isActive: true
      }
    })

    if (instanceCount >= req.user.maxInstances) {
      return res.status(403).json({ 
        error: `Quota atteint : ${req.user.maxInstances} instance(s) maximum pour le plan ${req.user.plan}`,
        quota: {
          current: instanceCount,
          max: req.user.maxInstances,
          plan: req.user.plan
        }
      })
    }

    next()
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la vérification du quota' })
  }
}
