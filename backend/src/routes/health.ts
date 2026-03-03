import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/health', async (req, res) => {
  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`
    
    // Test tables
    const userCount = await prisma.user.count()
    const instanceCount = await prisma.instance.count()
    
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount,
        instances: instanceCount
      }
    })
  } catch (error: any) {
    console.error('[HEALTH]', error)
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

export default router
