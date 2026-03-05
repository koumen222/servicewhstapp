import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

/**
 * Webhook endpoint pour recevoir les événements d'Evolution API
 * Evolution API envoie des notifications pour :
 * - connection.update (changements de statut de connexion)
 * - messages.upsert (nouveaux messages)
 * - qr.updated (nouveau QR code généré)
 */
router.post('/evolution', async (req: Request, res: Response) => {
  try {
    const event = req.body

    console.log('[WEBHOOK] Received Evolution API event:', {
      event: event.event,
      instance: event.instance,
      data: event.data
    })

    // Vérifier que l'événement contient les données nécessaires
    if (!event.instance) {
      console.warn('[WEBHOOK] Event missing instance name')
      return res.status(400).json({ error: 'Missing instance name' })
    }

    const instanceName = event.instance

    // Trouver l'instance dans la DB
    const dbInstance = await prisma.instance.findUnique({
      where: { instanceName }
    })

    if (!dbInstance) {
      console.warn(`[WEBHOOK] Instance not found in DB: ${instanceName}`)
      return res.status(404).json({ error: 'Instance not found' })
    }

    // Traiter selon le type d'événement
    switch (event.event) {
      case 'connection.update':
        await handleConnectionUpdate(dbInstance.id, event.data)
        break

      case 'qrcode.updated':
        await handleQRCodeUpdate(dbInstance.id, event.data)
        break

      case 'messages.upsert':
        await handleMessageUpsert(dbInstance.id, event.data)
        break

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.event}`)
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' })

  } catch (error: any) {
    console.error('[WEBHOOK] Error processing webhook:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Gère les mises à jour de connexion
 */
async function handleConnectionUpdate(instanceId: string, data: any) {
  try {
    const state = data.state || data.status || 'close'
    
    console.log(`[WEBHOOK] Connection update for instance ${instanceId}: ${state}`)

    // Mapping des états Evolution vers nos états
    const statusMap: Record<string, string> = {
      'open': 'open',
      'connecting': 'connecting',
      'close': 'close',
      'closed': 'close'
    }

    const mappedState = statusMap[state] || 'close'

    // Mettre à jour le statut dans la DB
    await prisma.instance.update({
      where: { id: instanceId },
      data: {
        status: mappedState,
        profileName: data.profileName || undefined,
        profilePictureUrl: data.profilePictureUrl || undefined,
        lastUsed: new Date()
      }
    })

    console.log(`[WEBHOOK] Instance ${instanceId} status updated to: ${mappedState}`)

  } catch (error: any) {
    console.error('[WEBHOOK] Error handling connection update:', error)
  }
}

/**
 * Gère les mises à jour de QR code
 */
async function handleQRCodeUpdate(instanceId: string, data: any) {
  try {
    console.log(`[WEBHOOK] QR code updated for instance ${instanceId}`)
    
    // Optionnel : stocker le QR code en cache ou notifier via SSE
    // Pour l'instant, on log juste l'événement
    
  } catch (error: any) {
    console.error('[WEBHOOK] Error handling QR code update:', error)
  }
}

/**
 * Gère les nouveaux messages
 */
async function handleMessageUpsert(instanceId: string, data: any) {
  try {
    console.log(`[WEBHOOK] Message upsert for instance ${instanceId}`)
    
    // Optionnel : créer des logs de messages, notifier l'utilisateur, etc.
    // Pour l'instant, on met juste à jour lastUsed
    
    await prisma.instance.update({
      where: { id: instanceId },
      data: { lastUsed: new Date() }
    })

  } catch (error: any) {
    console.error('[WEBHOOK] Error handling message upsert:', error)
  }
}

export default router
