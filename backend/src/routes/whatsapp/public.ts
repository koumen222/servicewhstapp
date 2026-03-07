import { Router, Request, Response } from 'express'
import { WhatsAppService } from '../../services/whatsAppService.js'
import { InstanceService } from '../../services/instanceService.js'
import { MessageUsageService } from '../../services/messageUsageService.js'

const router = Router()

/**
 * POST /api/v1/external/whatsapp/link
 * Enregistrer une instance Evolution existante dans la base de données du service.
 * Permet de lier une instance déjà créée sur Evolution à un utilisateur du SaaS.
 */
router.post('/whatsapp/link', async (req: Request, res: Response) => {
  try {
    const { instanceName, instanceToken, userId, customName } = req.body

    console.log(`[Public API] Link instance request: ${instanceName} for user ${userId}`)

    if (!instanceName || !instanceToken || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Champs manquants', 
        details: 'instanceName, instanceToken et userId sont requis.' 
      })
    }

    // Créer l'enregistrement dans user_instances
    const newInstance = await InstanceService.createUserInstance({
      userId,
      instanceName,
      instanceToken,
      customName: customName || instanceName,
      status: 'open', // On assume qu'elle est ouverte si on la lie avec un token
      isActive: true
    })

    res.json({
      success: true,
      message: 'Instance liée avec succès',
      data: {
        id: newInstance._id,
        instanceName: newInstance.instanceName
      }
    })
  } catch (error: any) {
    console.error('[Public API] Link instance error:', error.message)
    res.status(500).json({ 
      success: false, 
      error: 'Échec du lien de l\'instance', 
      details: error.message 
    })
  }
})

/**
 * POST /api/v1/external/whatsapp/send
 * Endpoint simplifié pour l'envoi de message.
 * Utilise les identifiants fournis pour envoyer directement.
 */
router.post('/whatsapp/send', async (req: Request, res: Response) => {
  try {
    const { instanceName, instanceToken, number, message } = req.body

    if (!instanceName || !instanceToken || !number || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Champs manquants', 
        details: 'instanceName, instanceToken, number et message sont requis.' 
      })
    }

    // Find the instance in DB to check limits and record usage
    const instances = await InstanceService.findUserInstanceByNameGlobal(instanceName)
    if (instances) {
      if (!instances.isActive) {
        return res.status(403).json({ success: false, error: 'Instance désactivée.' })
      }
      const limitCheck = await MessageUsageService.checkLimits(
        instances._id.toString(), instances.userId, instanceName, 'free'
      )
      if (!limitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Limite de messages atteinte',
          message: limitCheck.reason,
          usage: limitCheck.usage
        })
      }
    }

    const result = await WhatsAppService.sendDirect(instanceName, instanceToken, number, message)

    // Record message usage
    if (instances) {
      await MessageUsageService.recordMessage(instances._id.toString(), instances.userId, instanceName)
    }

    res.json({
      success: true,
      message: 'Message envoyé avec succès',
      data: result
    })
  } catch (error: any) {
    console.error('[Public API] Send error:', error.message)
    res.status(500).json({ 
      success: false, 
      error: 'Échec de l\'envoi', 
      details: error.message 
    })
  }
})

export default router
