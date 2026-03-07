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
          id: admin._id,
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

export default router
