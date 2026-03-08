import { Router, Request, Response } from 'express'
import { AnalyticsService } from '../services/analyticsService.js'
import { authMiddleware } from '../middleware/auth.js'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'

const router = Router()

// Middleware pour vérifier que l'utilisateur est authentifié (pour le tracking)
const trackingMiddleware = (req: Request, res: Response, next: Function) => {
  // Le tracking ne nécessite pas d'authentification stricte
  // On utilise un sessionId généré côté client
  next()
}

// POST /api/analytics/track/pageview - Tracker une page vue
router.post('/track/pageview', trackingMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, url, referrer, userAgent, ip } = req.body
    
    if (!sessionId || !url || !userAgent || !ip) {
      return res.status(400).json({ 
        success: false, 
        error: 'sessionId, url, userAgent et ip sont requis' 
      })
    }
    
    const pageView = await AnalyticsService.trackPageView({
      sessionId,
      userId,
      url,
      referrer,
      userAgent,
      ip
    })
    
    res.json({ success: true, data: pageView })
  } catch (error: any) {
    console.error('Page view tracking error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors du tracking de page vue' })
  }
})

// POST /api/analytics/track/event - Tracker un événement
router.post('/track/event', trackingMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, type, category, action, label, value, url, metadata } = req.body
    
    if (!sessionId || !type || !category || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'sessionId, type, category et action sont requis' 
      })
    }
    
    const event = await AnalyticsService.trackEvent({
      sessionId,
      userId,
      type,
      category,
      action,
      label,
      value,
      url,
      metadata
    })
    
    res.json({ success: true, data: event })
  } catch (error: any) {
    console.error('Event tracking error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors du tracking d\'événement' })
  }
})

// GET /api/analytics/stats - Statistiques générales (admin seulement)
router.get('/stats', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query
    
    const stats = await AnalyticsService.getGeneralStats(period as any)
    
    res.json({ success: true, data: stats })
  } catch (error: any) {
    console.error('Analytics stats error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des statistiques' })
  }
})

// GET /api/analytics/growth - Données de croissance (admin seulement)
router.get('/growth', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query
    
    const growthData = await AnalyticsService.getGrowthData(period as any)
    
    res.json({ success: true, data: growthData })
  } catch (error: any) {
    console.error('Analytics growth error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des données de croissance' })
  }
})

// GET /api/analytics/countries - Pays les plus visités (admin seulement)
router.get('/countries', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = '30d', limit = 10 } = req.query
    
    const countries = await AnalyticsService.getTopCountries(
      period as any, 
      parseInt(limit as string)
    )
    
    res.json({ success: true, data: countries })
  } catch (error: any) {
    console.error('Analytics countries error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des pays' })
  }
})

// GET /api/analytics/pages - Pages les plus visitées (admin seulement)
router.get('/pages', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = '30d', limit = 10 } = req.query
    
    const pages = await AnalyticsService.getTopPages(
      period as any, 
      parseInt(limit as string)
    )
    
    res.json({ success: true, data: pages })
  } catch (error: any) {
    console.error('Analytics pages error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des pages' })
  }
})

// GET /api/analytics/devices - Statistiques des appareils (admin seulement)
router.get('/devices', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query
    
    const devices = await AnalyticsService.getDeviceStats(period as any)
    
    res.json({ success: true, data: devices })
  } catch (error: any) {
    console.error('Analytics devices error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des appareils' })
  }
})

// GET /api/analytics/browsers - Statistiques des navigateurs (admin seulement)
router.get('/browsers', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query
    
    const browsers = await AnalyticsService.getBrowserStats(period as any)
    
    res.json({ success: true, data: browsers })
  } catch (error: any) {
    console.error('Analytics browsers error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des navigateurs' })
  }
})

// GET /api/analytics/activity - Activité récente (admin seulement)
router.get('/activity', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query
    
    const activity = await AnalyticsService.getRecentActivity(parseInt(limit as string))
    
    res.json({ success: true, data: activity })
  } catch (error: any) {
    console.error('Analytics activity error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l\'activité' })
  }
})

// === NOTIFICATIONS ===

// POST /api/analytics/notifications - Créer une notification (admin seulement)
router.post('/notifications', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, message, type, targetAudience, targetUsers, scheduledFor, metadata } = req.body
    const adminId = (req as any).admin?.id
    
    if (!title || !message || !type || !targetAudience) {
      return res.status(400).json({ 
        success: false, 
        error: 'title, message, type et targetAudience sont requis' 
      })
    }
    
    const notification = await AnalyticsService.createNotification({
      title,
      message,
      type,
      targetAudience,
      targetUsers,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      createdBy: adminId,
      metadata
    })
    
    res.json({ success: true, data: notification })
  } catch (error: any) {
    console.error('Create notification error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la notification' })
  }
})

// GET /api/analytics/notifications - Lister les notifications (admin seulement)
router.get('/notifications', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query
    
    const notifications = await AnalyticsService.getNotifications(parseInt(limit as string))
    
    res.json({ success: true, data: notifications })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des notifications' })
  }
})

// PUT /api/analytics/notifications/:id/send - Envoyer une notification (admin seulement)
router.put('/notifications/:id/send', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Logique d'envoi de notification push
    // Pour l'instant, on simule l'envoi
    console.log(`Sending notification ${id} to target audience`)
    
    res.json({ success: true, message: 'Notification envoyée avec succès' })
  } catch (error: any) {
    console.error('Send notification error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi de la notification' })
  }
})

// === EMAIL CAMPAIGNS ===

// POST /api/analytics/campaigns - Créer une campagne email (admin seulement)
router.post('/campaigns', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, subject, content, type, targetAudience, targetUsers, scheduledFor, metadata } = req.body
    const adminId = (req as any).admin?.id
    
    if (!name || !subject || !content || !type || !targetAudience) {
      return res.status(400).json({ 
        success: false, 
        error: 'name, subject, content, type et targetAudience sont requis' 
      })
    }
    
    const campaign = await AnalyticsService.createEmailCampaign({
      name,
      subject,
      content,
      type,
      targetAudience,
      targetUsers,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      createdBy: adminId,
      metadata
    })
    
    res.json({ success: true, data: campaign })
  } catch (error: any) {
    console.error('Create email campaign error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la campagne email' })
  }
})

// GET /api/analytics/campaigns - Lister les campagnes email (admin seulement)
router.get('/campaigns', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query
    
    const campaigns = await AnalyticsService.getEmailCampaigns(parseInt(limit as string))
    
    res.json({ success: true, data: campaigns })
  } catch (error: any) {
    console.error('Get email campaigns error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des campagnes email' })
  }
})

// PUT /api/analytics/campaigns/:id/send - Envoyer une campagne email (admin seulement)
router.put('/campaigns/:id/send', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Logique d'envoi d'emails
    // Pour l'instant, on simule l'envoi
    console.log(`Sending email campaign ${id} to recipients`)
    
    res.json({ success: true, message: 'Campagne email envoyée avec succès' })
  } catch (error: any) {
    console.error('Send email campaign error:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi de la campagne email' })
  }
})

export default router
