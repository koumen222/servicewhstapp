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
      case 'CONNECTION_UPDATE':
      case 'connection.update':
        await handleConnectionUpdate(dbInstance.id, event.data)
        break

      case 'QRCODE_UPDATED':
      case 'qrcode.updated':
        await handleQRCodeUpdate(dbInstance.id, event.data)
        break

      case 'MESSAGES_UPSERT':
      case 'messages.upsert':
        await handleMessageUpsert(dbInstance.id, event.data)
        break

      case 'MESSAGES_UPDATE':
      case 'messages.update':
        console.log(`[WEBHOOK] Message update for instance ${dbInstance.id}`)
        break

      case 'SEND_MESSAGE':
        console.log(`[WEBHOOK] Message sent from instance ${dbInstance.id}`)
        await prisma.instance.update({
          where: { id: dbInstance.id },
          data: { lastUsed: new Date() }
        })
        break

      case 'CHATS_UPSERT':
      case 'CHATS_UPDATE':
        console.log(`[WEBHOOK] Chat update for instance ${dbInstance.id}`)
        await prisma.instance.update({
          where: { id: dbInstance.id },
          data: { lastUsed: new Date() }
        })
        break

      case 'CONTACTS_UPSERT':
      case 'CONTACTS_UPDATE':
        console.log(`[WEBHOOK] Contact update for instance ${dbInstance.id}`)
        break

      case 'PRESENCE_UPDATE':
        console.log(`[WEBHOOK] Presence update for instance ${dbInstance.id}`)
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
    // Evolution API envoie: { state: 'open'|'connecting'|'close', instance: {...} }
    const state = data.state || data.status || data.instance?.state || 'close'
    const instanceData = data.instance || {}
    
    console.log(`[WEBHOOK] Connection update for instance ${instanceId}:`, {
      state,
      profileName: instanceData.profileName,
      hasProfilePicture: !!instanceData.profilePictureUrl
    })

    // Mapping des états Evolution vers nos états
    const statusMap: Record<string, string> = {
      'open': 'open',
      'connecting': 'connecting',
      'close': 'close',
      'closed': 'close'
    }

    const mappedState = statusMap[state] || 'close'

    // Mettre à jour le statut dans la DB
    const updateData: any = {
      status: mappedState,
      lastUsed: new Date()
    }

    // Ajouter les infos de profil si disponibles
    if (instanceData.profileName) {
      updateData.profileName = instanceData.profileName
    }
    if (instanceData.profilePictureUrl) {
      updateData.profilePictureUrl = instanceData.profilePictureUrl
    }

    await prisma.instance.update({
      where: { id: instanceId },
      data: updateData
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
