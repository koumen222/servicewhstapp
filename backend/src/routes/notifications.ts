import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthRequest } from '../types/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Récupérer les notifications de l'utilisateur
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const unreadOnly = req.query.unread === 'true'

    const where = {
      userId: req.user.id,
      ...(unreadOnly && { isRead: false })
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          metadata: true,
          createdAt: true,
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false }
      })
    ])

    res.json({
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('[NOTIFICATIONS]', error.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Marquer une notification comme lue
router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' })
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    })

    res.json({ success: true, notification: updated })
  } catch (error: any) {
    console.error('[NOTIFICATIONS]', error.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Marquer toutes les notifications comme lues
router.patch('/mark-all-read', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    })

    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' })
  } catch (error: any) {
    console.error('[NOTIFICATIONS]', error.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
