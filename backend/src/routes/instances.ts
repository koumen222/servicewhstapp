import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'
import { evolutionAPI } from '../lib/evolution.js'
import { buildInstanceName } from '../utils/instanceName.js'
import { authenticate } from '../middleware/auth.js'
import { checkInstanceQuota } from '../middleware/quota.js'
import { env } from '../config/env.js'

const router = Router()

router.use(authenticate)

const createInstanceSchema = z.object({
  instanceName: z.string().min(1),
  integration: z.string().optional().default('WHATSAPP-BAILEYS'),
  qrcode: z.boolean().optional().default(true),
})

router.post('/create', checkInstanceQuota, async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName, integration, qrcode } = createInstanceSchema.parse(req.body)
    const userId = req.user!.id

    const fullInstanceName = buildInstanceName(userId, customName)

    const existing = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName }
    })
    if (existing) {
      return res.status(400).json({ error: 'Instance déjà existante' })
    }

    const evolutionResponse = await evolutionAPI.createInstance(fullInstanceName, integration, qrcode)

    // Générer un token API unique pour cette instance
    const apiKey = crypto.randomBytes(32).toString('hex')

    const instance = await prisma.instance.create({
      data: {
        userId,
        instanceName: fullInstanceName,
        customName,
        status: 'close',
        instanceUrl: env.EVOLUTION_API_URL,
        apiKey,
      } as any
    })

    res.json({
      instance: {
        instanceName: instance.customName,
        status: instance.status,
      },
      evolution: evolutionResponse
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors })
    }
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[CREATE]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.get('/fetchInstances', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    const userInstances = await prisma.instance.findMany({
      where: { userId }
    })

    let allEvolutionInstances: any[] = []
    
    try {
      allEvolutionInstances = await evolutionAPI.fetchInstances()
    } catch (evolutionError: any) {
      console.warn('[FETCH] Evolution API error, using database data only:', evolutionError?.response?.data?.message || evolutionError?.message)
      // Continue with empty array - we'll use database data only
    }

    const enriched = userInstances.map((dbInstance: any) => {
      const evolutionData = allEvolutionInstances.find(
        (e: any) => e.instance?.instanceName === dbInstance.instanceName
      )

      return {
        instanceName: dbInstance.customName,
        status: evolutionData?.instance?.state || dbInstance.status,
        profileName: evolutionData?.profileName || dbInstance.profileName,
        profilePictureUrl: evolutionData?.profilePictureUrl || dbInstance.profilePictureUrl,
        ownerJid: evolutionData?.owner || dbInstance.ownerJid,
      }
    })

    res.json(enriched)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[FETCH]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.get('/connectionState/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    try {
      const state = await evolutionAPI.getConnectionState(fullInstanceName)

      await prisma.instance.update({
        where: { id: dbInstance.id },
        data: { status: state.instance?.state || 'close' }
      })

      res.json(state)
    } catch (evolutionError: any) {
      console.warn('[STATE] Evolution API error, returning database status:', evolutionError?.response?.data?.message || evolutionError?.message)
      
      // Return database status as fallback
      res.json({
        instance: {
          instanceName: fullInstanceName,
          state: dbInstance.status
        }
      })
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[STATE]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.get('/connect/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const result = await evolutionAPI.connectInstance(fullInstanceName)
    res.json(result)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[CONNECT]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.get('/qrcode/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const qrData = await evolutionAPI.fetchQRCode(fullInstanceName)
    res.json(qrData)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[QR]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.delete('/logout/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    const result = await evolutionAPI.logoutInstance(fullInstanceName)

    await prisma.instance.update({
      where: { id: dbInstance.id },
      data: { status: 'close' }
    })

    res.json(result)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[LOGOUT]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

router.delete('/delete/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    await evolutionAPI.deleteInstance(fullInstanceName)
    await prisma.instance.delete({ where: { id: dbInstance.id } })

    res.json({ success: true })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[DELETE]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

// Endpoint pour récupérer les informations d'accès API d'une instance
router.get('/credentials/:instanceName', async (req: AuthRequest, res) => {
  try {
    const { instanceName: customName } = req.params
    const userId = req.user!.id
    const fullInstanceName = buildInstanceName(userId, customName)

    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName: fullInstanceName, userId }
    })
    if (!dbInstance) {
      return res.status(404).json({ error: 'Instance non trouvée' })
    }

    res.json({
      instanceName: dbInstance.customName,
      fullInstanceName: dbInstance.instanceName,
      evolutionApiUrl: dbInstance.instanceUrl,
      apiKey: dbInstance.apiKey,
      status: dbInstance.status,
      createdAt: dbInstance.createdAt
    })
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur inconnue'
    console.error('[CREDENTIALS]', msg, error?.response?.data)
    res.status(500).json({ error: msg })
  }
})

export default router
