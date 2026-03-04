import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'
import { buildInstanceName } from '../utils/instanceName.js'

export async function extractInstanceId(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const { instanceName: customName } = req.params
    if (!customName) {
      return res.status(400).json({ error: 'Nom d\'instance requis' })
    }

    const userId = req.user.id
    const fullInstanceName = buildInstanceName(userId, customName)

    // Vérifier que l'instance existe et appartient à l'utilisateur
    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })

    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    // Stocker l'instanceId dans la requête
    req.instanceId = dbInstance.id
    next()
  } catch (error) {
    console.error('[EXTRACT INSTANCE] Erreur:', error)
    return res.status(500).json({ error: 'Erreur lors de la vérification de l\'instance' })
  }
}
