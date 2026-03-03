import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/stats', async (req, res) => {
  try {
    const [userCount, instanceCount, dbSize] = await Promise.all([
      prisma.user.count(),
      prisma.instance.count(),
      prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    ])

    const recentInstances = await prisma.instance.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        instanceName: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } }
      }
    })

    res.json({
      timestamp: new Date().toISOString(),
      database: {
        users: userCount,
        instances: instanceCount,
        size: (dbSize as any)[0]?.size || 'unknown'
      },
      recent: recentInstances
    })
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

export default router
