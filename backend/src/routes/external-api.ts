import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { instanceTokenAuth } from '../middleware/instanceTokenAuth.js'
import axios from 'axios'
import { env } from '../config/env.js'

const router = Router()

router.post('/send-message', instanceTokenAuth, async (req: Request, res: Response) => {
  try {
    const instance = req.instanceAuth!.instance
    const { recipient, message } = req.body

    if (!recipient || !message) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAMETERS',
        message: 'recipient and message are required',
        timestamp: new Date().toISOString()
      })
    }

    if (instance.status !== 'active' && instance.status !== 'connected') {
      return res.status(403).json({
        error: true,
        code: 'INSTANCE_NOT_ACTIVE',
        message: 'Instance is not active. Please connect your WhatsApp first.',
        timestamp: new Date().toISOString()
      })
    }

    try {
      const response = await axios.post(
        `${env.EVOLUTION_API_URL}/message/sendText/${instance.instanceName}`,
        {
          number: recipient,
          text: message
        },
        {
          headers: {
            'apikey': instance.evolutionApiKey || env.EVOLUTION_API_KEY
          }
        }
      )

      await prisma.activityLog.create({
        data: {
          instanceId: instance.id,
          actionType: 'send_message',
          actionResult: 'success',
          details: JSON.stringify({
            recipient,
            messageLength: message.length
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      })

      return res.json({
        status: 'sent',
        messageId: response.data?.key?.id || null,
        timestamp: new Date().toISOString()
      })
    } catch (evolutionError: any) {
      await prisma.activityLog.create({
        data: {
          instanceId: instance.id,
          actionType: 'send_message',
          actionResult: 'failed',
          details: JSON.stringify({
            recipient,
            error: evolutionError.message
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      })

      return res.status(500).json({
        error: true,
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send message via WhatsApp',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Send message error:', error)
    return res.status(500).json({
      error: true,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    })
  }
})

router.get('/instance-status', instanceTokenAuth, async (req: Request, res: Response) => {
  try {
    const instance = req.instanceAuth!.instance

    let connected = false
    if (instance.status === 'active' || instance.status === 'connected') {
      try {
        const response = await axios.get(
          `${env.EVOLUTION_API_URL}/instance/connectionState/${instance.instanceName}`,
          {
            headers: {
              'apikey': instance.evolutionApiKey || env.EVOLUTION_API_KEY
            }
          }
        )
        connected = response.data?.state === 'open'
      } catch (error) {
        connected = false
      }
    }

    await prisma.activityLog.create({
      data: {
        instanceId: instance.id,
        actionType: 'check_status',
        actionResult: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    })

    return res.json({
      instanceId: instance.id,
      status: instance.status,
      whatsappNumber: instance.whatsappNumber,
      connected
    })
  } catch (error) {
    console.error('Instance status error:', error)
    return res.status(500).json({
      error: true,
      code: 'STATUS_CHECK_FAILED',
      message: 'Failed to check instance status',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
