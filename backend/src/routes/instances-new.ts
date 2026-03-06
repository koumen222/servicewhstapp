import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { InstanceTokenService } from '../services/instanceTokenService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { customName } = req.body

    const userInstances = await prisma.instance.count({
      where: { userId, isActive: true }
    })

    if (userInstances >= req.user!.maxInstances) {
      return res.status(403).json({
        error: true,
        code: 'MAX_INSTANCES_REACHED',
        message: `You have reached the maximum number of instances (${req.user!.maxInstances}) for your plan`,
        timestamp: new Date().toISOString()
      })
    }

    const instanceToken = await InstanceTokenService.generateUniqueToken()
    
    const instanceCount = await prisma.instance.count({
      where: { userId }
    })
    
    const instanceName = `user_${userId}_${instanceCount + 1}`

    const instance = await prisma.instance.create({
      data: {
        userId,
        instanceName,
        customName: customName || `Instance ${instanceCount + 1}`,
        instanceToken,
        status: 'pending',
        isActive: true
      },
      select: {
        id: true,
        instanceName: true,
        customName: true,
        instanceToken: true,
        status: true,
        whatsappNumber: true,
        createdAt: true
      }
    })

    return res.status(201).json({
      id: instance.id,
      instanceName: instance.instanceName,
      customName: instance.customName,
      instanceToken: instance.instanceToken,
      status: instance.status,
      whatsappNumber: instance.whatsappNumber,
      createdAt: instance.createdAt,
      message: 'Instance created successfully. Keep this token safe - you can view it anytime in your dashboard.'
    })
  } catch (error) {
    console.error('Create instance error:', error)
    return res.status(500).json({
      error: true,
      code: 'INSTANCE_CREATION_FAILED',
      message: 'Failed to create instance',
      timestamp: new Date().toISOString()
    })
  }
})

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    const instances = await prisma.instance.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        instanceName: true,
        customName: true,
        status: true,
        whatsappNumber: true,
        profileName: true,
        profilePictureUrl: true,
        createdAt: true,
        lastActivity: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.json({
      instances: instances.map(inst => ({
        id: inst.id,
        instanceName: inst.instanceName,
        customName: inst.customName,
        status: inst.status,
        whatsappNumber: inst.whatsappNumber,
        profileName: inst.profileName,
        profilePictureUrl: inst.profilePictureUrl,
        createdAt: inst.createdAt,
        lastActivity: inst.lastActivity
      }))
    })
  } catch (error) {
    console.error('List instances error:', error)
    return res.status(500).json({
      error: true,
      code: 'INSTANCES_FETCH_FAILED',
      message: 'Failed to fetch instances',
      timestamp: new Date().toISOString()
    })
  }
})

router.get('/:instanceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        userId,
        isActive: true
      },
      select: {
        id: true,
        instanceName: true,
        customName: true,
        instanceToken: true,
        status: true,
        whatsappNumber: true,
        profileName: true,
        profilePictureUrl: true,
        createdAt: true,
        lastActivity: true
      }
    })

    if (!instance) {
      return res.status(404).json({
        error: true,
        code: 'INSTANCE_NOT_FOUND',
        message: 'Instance not found',
        timestamp: new Date().toISOString()
      })
    }

    return res.json({
      id: instance.id,
      instanceName: instance.instanceName,
      customName: instance.customName,
      instanceToken: instance.instanceToken,
      status: instance.status,
      whatsappNumber: instance.whatsappNumber,
      profileName: instance.profileName,
      profilePictureUrl: instance.profilePictureUrl,
      createdAt: instance.createdAt,
      lastActivity: instance.lastActivity
    })
  } catch (error) {
    console.error('Get instance error:', error)
    return res.status(500).json({
      error: true,
      code: 'INSTANCE_FETCH_FAILED',
      message: 'Failed to fetch instance',
      timestamp: new Date().toISOString()
    })
  }
})

router.delete('/:instanceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { instanceId } = req.params

    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        userId,
        isActive: true
      }
    })

    if (!instance) {
      return res.status(404).json({
        error: true,
        code: 'INSTANCE_NOT_FOUND',
        message: 'Instance not found',
        timestamp: new Date().toISOString()
      })
    }

    await prisma.instance.update({
      where: { id: instanceId },
      data: { isActive: false }
    })

    return res.json({
      message: 'Instance deleted successfully'
    })
  } catch (error) {
    console.error('Delete instance error:', error)
    return res.status(500).json({
      error: true,
      code: 'INSTANCE_DELETE_FAILED',
      message: 'Failed to delete instance',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
