import { Router } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types/index.js'
import { prisma } from '../lib/prisma.js'
import { verifyWhatsAppInstance, sendWhatsAppMessage } from '../services/whatsappIntegration.js'

const router = Router()

console.log('✅ Integration routes module loaded')

const connectWhatsAppSchema = z.object({
  workspaceId: z.string().optional(),
  instanceName: z.string().min(1),
  instanceId: z.string().min(1),
  apiKey: z.string().min(1)
})

router.post('/whatsapp/connect', async (req: AuthRequest, res) => {
  console.log("\n========== CONNECT WHATSAPP ==========")

  try {
    const { workspaceId, instanceName, instanceId, apiKey } = connectWhatsAppSchema.parse(req.body)

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'UNAUTHORIZED',
        message: 'User not authenticated' 
      })
    }

    const userId = req.user.id

    console.log("Workspace:", workspaceId || 'N/A')
    console.log("Instance Name:", instanceName)
    console.log("Instance ID:", instanceId)
    console.log("User ID:", userId)

    await verifyWhatsAppInstance({ instanceId, apiKey })

    const existingConfig = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!existingConfig) {
      console.log("❌ User not found")
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      })
    }

    console.log("✅ WhatsApp instance verified and ready")
    console.log("=====================================\n")

    res.json({ 
      success: true,
      message: 'WhatsApp instance connected successfully',
      data: {
        instanceName,
        instanceId,
        connected: true,
        verifiedAt: new Date().toISOString()
      }
    })

  } catch (err: any) {
    console.log("💥 ERROR:", err.message)
    
    let errorCode = 'CONNECTION_FAILED'
    let statusCode = 400
    
    if (err.message === 'MISSING_CREDENTIALS') {
      errorCode = 'MISSING_CREDENTIALS'
      statusCode = 400
    } else if (err.message === 'INSTANCE_VERIFICATION_FAILED') {
      errorCode = 'INVALID_CREDENTIALS'
      statusCode = 401
    }

    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: err.message
    })
  }
})

const testMessageSchema = z.object({
  instanceId: z.string().min(1),
  apiKey: z.string().min(1),
  number: z.string().min(1),
  text: z.string().min(1)
})

router.post('/whatsapp/test-message', async (req: AuthRequest, res) => {
  console.log("\n========== TEST WHATSAPP MESSAGE ==========")

  try {
    const { instanceId, apiKey, number, text } = testMessageSchema.parse(req.body)

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'UNAUTHORIZED',
        message: 'User not authenticated' 
      })
    }

    console.log("Instance ID:", instanceId)
    console.log("Number:", number)

    const result = await sendWhatsAppMessage({ instanceId, apiKey, number, text })

    console.log("✅ Test message sent successfully")
    console.log("==========================================\n")

    res.json({
      success: true,
      message: 'Test message sent successfully',
      data: result
    })

  } catch (err: any) {
    console.log("💥 ERROR:", err.message)
    
    let errorCode = 'SEND_FAILED'
    let statusCode = 500
    
    if (err.message === 'MISSING_CREDENTIALS') {
      errorCode = 'MISSING_CREDENTIALS'
      statusCode = 400
    } else if (err.message === 'WHATSAPP_SEND_FAILED') {
      errorCode = 'SEND_FAILED'
      statusCode = 500
    }

    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: err.message
    })
  }
})

router.get('/whatsapp/status', async (req: AuthRequest, res) => {
  console.log("\n========== GET WHATSAPP STATUS ==========")

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'UNAUTHORIZED',
        message: 'User not authenticated' 
      })
    }

    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        instances: {
          where: { isActive: true },
          select: {
            id: true,
            customName: true,
            instanceName: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      })
    }

    console.log("✅ Retrieved WhatsApp status")
    console.log("========================================\n")

    res.json({
      success: true,
      data: {
        connected: user.instances.length > 0,
        instances: user.instances.map(inst => ({
          id: inst.instanceName,
          name: inst.customName,
          status: inst.status,
          createdAt: inst.createdAt
        }))
      }
    })

  } catch (err: any) {
    console.log("💥 ERROR:", err.message)
    res.status(500).json({
      success: false,
      error: 'STATUS_CHECK_FAILED',
      message: err.message
    })
  }
})

export default router
