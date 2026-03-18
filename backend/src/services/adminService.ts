import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Admin, IAdmin } from '../models/Admin.js'
import { User } from '../models/User.js'
import { UserInstance } from '../models/UserInstance.js'
import { env } from '../config/env.js'

export class AdminService {
  /**
   * Créer un compte super admin (à utiliser une seule fois)
   */
  static async createSuperAdmin(email: string, password: string, name: string): Promise<IAdmin> {
    const existingAdmin = await Admin.findOne({ email })
    if (existingAdmin) {
      throw new Error('Admin already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const admin = await Admin.create({
      email,
      password: hashedPassword,
      name,
      role: 'super_admin',
      isActive: true,
    })

    return admin
  }

  /**
   * Authentifier un admin
   */
  static async login(email: string, password: string): Promise<{ admin: IAdmin; token: string }> {
    const admin = await Admin.findOne({ email, isActive: true })
    if (!admin) {
      throw new Error('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Mettre à jour lastLogin
    admin.lastLogin = new Date()
    await admin.save()

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        isAdmin: true,
      },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return { admin, token }
  }

  /**
   * Obtenir les statistiques globales
   */
  static async getGlobalStats() {
    const [totalUsers, activeUsers, totalInstances, activeInstances] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      UserInstance.countDocuments(),
      UserInstance.countDocuments({ isActive: true }),
    ])

    // Compter les instances par statut
    const instancesByStatus = await UserInstance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    // Compter les utilisateurs par plan
    const usersByPlan = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ])

    return {
      totalUsers,
      activeUsers,
      totalInstances,
      activeInstances,
      instancesByStatus: instancesByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {} as Record<string, number>),
      usersByPlan: usersByPlan.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {} as Record<string, number>),
    }
  }

  /**
   * Lister tous les utilisateurs avec pagination
   * Auto-corriger les utilisateurs premium qui n'ont pas hasPaid=true
   */
  static async getAllUsers(page: number = 1, limit: number = 50) {
    // Corriger silencieusement les utilisateurs premium existants sans hasPaid
    await User.updateMany(
      { plan: 'premium', $or: [{ hasPaid: false }, { isPaidAccount: false }] },
      { hasPaid: true, isPaidAccount: true }
    )

    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Lister toutes les instances avec pagination
   */
  static async getAllInstances(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit
    const [instances, total] = await Promise.all([
      UserInstance.find()
        .populate('userId', 'email name plan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserInstance.countDocuments(),
    ])

    return {
      instances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Obtenir les détails d'un utilisateur
   */
  static async getUserDetails(userId: string) {
    const user = await User.findById(userId).select('-password').lean()
    if (!user) {
      throw new Error('User not found')
    }

    const instances = await UserInstance.find({ userId }).lean()

    return {
      user,
      instances,
      stats: {
        totalInstances: instances.length,
        activeInstances: instances.filter((i: any) => i.isActive).length,
        connectedInstances: instances.filter((i: any) => i.status === 'open').length,
      },
    }
  }

  /**
   * Mettre à jour le plan d'un utilisateur
   */
  static async updateUserPlan(userId: string, plan: string, maxInstances: number) {
    const updateData: Record<string, any> = {
      plan,
      maxInstances,
      hasPaid: true,
      isPaidAccount: true,
    }

    // Si le plan est premium, on efface la date de fin d'essai
    if (plan === 'premium') {
      updateData.trialEndsAt = null
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password')

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  /**
   * Désactiver/Activer un utilisateur
   */
  static async toggleUserStatus(userId: string) {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    user.isActive = !user.isActive
    await user.save()

    return user
  }

  /**
   * Supprimer un utilisateur et ses instances
   */
  static async deleteUser(userId: string) {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Supprimer les instances de l'utilisateur
    await UserInstance.deleteMany({ userId })
    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId)

    return user
  }

  /**
   * Migrer tous les utilisateurs premium existants vers hasPaid=true
   */
  static async migratePremiumUsers() {
    const result = await User.updateMany(
      { plan: 'premium', $or: [{ hasPaid: false }, { isPaidAccount: false }] },
      { hasPaid: true, isPaidAccount: true, trialEndsAt: null }
    )
    return { updated: result.modifiedCount }
  }

  /**
   * Supprimer une instance (admin)
   */
  static async deleteInstance(instanceId: string) {
    const instance = await UserInstance.findByIdAndDelete(instanceId)
    if (!instance) {
      throw new Error('Instance not found')
    }

    return instance
  }
}
