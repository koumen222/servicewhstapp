import { Router } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'
import { evolutionAPI } from '../lib/evolution.js'
import { buildInstanceName } from '../utils/instanceName.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

const sendTextSchema = z.object({
  number: z.string().min(1),
  text: z.string().min(1),
})

router.post('/sendText/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const { number, text } = sendTextSchema.parse(req.body)
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const result = await evolutionAPI.sendTextMessage(fullInstanceName, number, text)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors })
    }
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' })
  }
})

export default router
