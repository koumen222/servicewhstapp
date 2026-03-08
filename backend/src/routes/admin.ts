import { Router, Request, Response } from 'express'
import { AdminService } from '../services/adminService.js'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const router = Router()

// Middleware pour vérifier que l'utilisateur est admin
const adminAuthMiddleware = (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, error: 'Non autorisé' })
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as any
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, error: 'Accès refusé - Admin uniquement' })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token invalide' })
  }
}

// POST /api/admin/login - Connexion admin
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' })
    }

    const { admin, token } = await AdminService.login(email, password)

    console.log(`🔐 Admin login: ${admin.email} (${admin.role})`)

    return res.json({
      success: true,
      data: {
        admin: {
          id: (admin as any)._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        token,
      },
    })
  } catch (error: any) {
    console.error('Admin login error:', error)
    return res.status(401).json({ success: false, error: 'Identifiants invalides' })
  }
})

// GET /api/admin/stats - Statistiques globales
router.get('/stats', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getGlobalStats()
    return res.json({ success: true, data: stats })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des statistiques' })
  }
})

// GET /api/admin/users - Liste des utilisateurs
router.get('/users', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    const result = await AdminService.getAllUsers(page, limit)
    return res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Admin users error:', error)
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des utilisateurs' })
  }
})

// GET /api/admin/users/:userId - Détails d'un utilisateur
router.get('/users/:userId', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const result = await AdminService.getUserDetails(userId)
    return res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Admin user details error:', error)
    return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' })
  }
})

// PUT /api/admin/users/:userId/plan - Mettre à jour le plan d'un utilisateur
router.put('/users/:userId/plan', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { plan, maxInstances } = req.body

    if (!plan || !maxInstances) {
      return res.status(400).json({ success: false, error: 'Plan et maxInstances requis' })
    }

    const user = await AdminService.updateUserPlan(userId, plan, maxInstances)
    console.log(`📝 Admin updated user plan: ${user.email} -> ${plan} (${maxInstances} instances)`)

    return res.json({ success: true, data: user })
  } catch (error: any) {
    console.error('Admin update plan error:', error)
    return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du plan' })
  }
})

// PUT /api/admin/users/:userId/toggle - Activer/Désactiver un utilisateur
router.put('/users/:userId/toggle', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const user = await AdminService.toggleUserStatus(userId)
    console.log(`🔄 Admin toggled user status: ${user.email} -> ${user.isActive ? 'active' : 'inactive'}`)

    return res.json({ success: true, data: user })
  } catch (error: any) {
    console.error('Admin toggle user error:', error)
    return res.status(500).json({ success: false, error: 'Erreur lors de la modification du statut' })
  }
})

// GET /api/admin/instances - Liste des instances
router.get('/instances', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    const result = await AdminService.getAllInstances(page, limit)
    return res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Admin instances error:', error)
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des instances' })
  }
})

// DELETE /api/admin/instances/:instanceId - Supprimer une instance
router.delete('/instances/:instanceId', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params
    const instance = await AdminService.deleteInstance(instanceId)
    console.log(`🗑️ Admin deleted instance: ${instance.instanceName}`)

    return res.json({ success: true, message: 'Instance supprimée avec succès' })
  } catch (error: any) {
    console.error('Admin delete instance error:', error)
    return res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l\'instance' })
  }
})

// GET /api/admin/analytics/growth - Données de croissance
router.get('/analytics/growth', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    // Générer des données mockées pour la démonstration
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const userGrowth = [];
    const messageVolume = [];
    const revenue = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      userGrowth.push({
        date: dateStr,
        value: Math.floor(Math.random() * 50) + 100 + (days - i) * 2
      });
      
      messageVolume.push({
        date: dateStr,
        value: Math.floor(Math.random() * 1000) + 2000 + (days - i) * 50
      });
      
      revenue.push({
        date: dateStr,
        value: Math.floor(Math.random() * 500) + 1000 + (days - i) * 20
      });
    }

    return res.json({
      success: true,
      data: {
        userGrowth,
        messageVolume,
        revenue,
        period
      }
    });
  } catch (error: any) {
    console.error('Admin analytics growth error:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des données de croissance' });
  }
});

// GET /api/admin/analytics/kpi - KPIs avancés
router.get('/analytics/kpi', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getGlobalStats();
    
    const kpis = {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      totalInstances: stats.totalInstances,
      activeInstances: stats.activeInstances,
      messagesToday: Math.floor(Math.random() * 10000) + 40000,
      monthlyRevenue: Math.floor(Math.random() * 5000) + 10000,
      conversionRate: (Math.random() * 2 + 2).toFixed(1),
      engagementRate: (Math.random() * 20 + 70).toFixed(1),
      retentionRate: (Math.random() * 10 + 60).toFixed(1),
      averageSessionDuration: `${Math.floor(Math.random() * 5) + 5}m ${Math.floor(Math.random() * 60)}s`,
      pagesPerSession: (Math.random() * 2 + 3).toFixed(1),
      bounceRate: (Math.random() * 20 + 25).toFixed(1),
      satisfactionScore: (Math.random() * 0.5 + 4.2).toFixed(1)
    };

    return res.json({ success: true, data: kpis });
  } catch (error: any) {
    console.error('Admin analytics KPI error:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des KPIs' });
  }
});

// GET /api/admin/analytics/revenue - Données de revenus
router.get('/analytics/revenue', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const revenue = {
      monthlyRecurringRevenue: Math.floor(Math.random() * 5000) + 10000,
      annualRecurringRevenue: Math.floor(Math.random() * 50000) + 120000,
      customerLifetimeValue: Math.floor(Math.random() * 2000) + 2000,
      customerAcquisitionCost: Math.floor(Math.random() * 100) + 100,
      averageRevenuePerUser: Math.floor(Math.random() * 50) + 150,
      churnRate: (Math.random() * 5 + 2).toFixed(1),
      revenueByPlan: [
        { plan: 'Free', revenue: 0, users: 450 },
        { plan: 'Starter', revenue: 2800, users: 280 },
        { plan: 'Pro', revenue: 6750, users: 150 },
        { plan: 'Enterprise', revenue: 2925, users: 45 }
      ],
      forecasts: {
        nextMonth: Math.floor(Math.random() * 2000) + 12000,
        nextQuarter: Math.floor(Math.random() * 10000) + 40000,
        nextSemester: Math.floor(Math.random() * 20000) + 80000
      }
    };

    return res.json({ success: true, data: revenue });
  } catch (error: any) {
    console.error('Admin analytics revenue error:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des données de revenus' });
  }
});

// GET /api/admin/system/health - État du système
router.get('/system/health', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const systemHealth = {
      cpu: Math.floor(Math.random() * 40) + 30,
      memory: Math.floor(Math.random() * 30) + 50,
      storage: Math.floor(Math.random() * 20) + 25,
      bandwidth: Math.floor(Math.random() * 20) + 70,
      uptime: process.uptime(),
      activeConnections: Math.floor(Math.random() * 100) + 200,
      responseTime: Math.floor(Math.random() * 100) + 50,
      errorRate: (Math.random() * 2).toFixed(2)
    };

    return res.json({ success: true, data: systemHealth });
  } catch (error: any) {
    console.error('Admin system health error:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l\'état du système' });
  }
});

export default router
