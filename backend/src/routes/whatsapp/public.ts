import { Router, Request, Response } from 'express'
import { WhatsAppService } from '../../services/whatsAppService.js'

const router = Router()

/**
 * POST /api/v1/whatsapp/send-direct
 * Public endpoint to send WhatsApp messages using direct instance credentials.
 * This endpoint does NOT require JWT authentication.
 * Security is handled by the instanceToken.
 */
router.post('/whatsapp/send-direct', async (req: Request, res: Response) => {
  try {
    const { instanceName, instanceToken, number, message } = req.body

    console.log(`[Public API] Direct send request for instance: ${instanceName} to ${number}`)

    if (!instanceName || !instanceToken || !number || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields', 
        details: 'instanceName, instanceToken, number, and message are all required.' 
      })
    }

    // In a real production scenario, we might want to verify that instanceToken 
    // matches what we have in DB for this instanceName. 
    // However, the user asked for something that "works directly" based on these two.
    
    const result = await WhatsAppService.sendDirect(instanceName, instanceToken, number, message)

    res.json({
      success: true,
      message: 'Message envoyé avec succès',
      data: result
    })
  } catch (error: any) {
    console.error('[Public API] Direct send error:', error.message)
    res.status(500).json({ 
      success: false, 
      error: 'Échec de l\'envoi du message', 
      details: error.message 
    })
  }
})

export default router
