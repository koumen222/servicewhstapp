import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserService } from './userService.js'
import { UserDocument } from '../types/models.js'

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

  static async generateToken(user: UserDocument): Promise<string> {
    const payload = {
      id: user._id?.toString(),
      email: user.email,
      name: user.name,
      plan: user.plan,
      maxInstances: user.maxInstances,
      isActive: user.isActive
    }

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    } as jwt.SignOptions)
  }

  static async verifyToken(token: string): Promise<UserDocument | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any
      
      // Fetch fresh user data
      const user = await UserService.findById(decoded.id)
      if (!user || !user.isActive) {
        return null
      }

      return user
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  static async login(email: string, password: string): Promise<{ user: UserDocument; token: string } | null> {
    try {
      // Find user by email
      const user = await UserService.findByEmail(email)
      if (!user) {
        return null
      }

      // Check if user is active
      if (!user.isActive) {
        return null
      }

      // Verify password
      const isValidPassword = await UserService.verifyPassword(user, password)
      if (!isValidPassword) {
        return null
      }

      // Generate token
      const token = await this.generateToken(user)

      // Update last activity
      await UserService.updateLastActivity(user._id!)

      return { user, token }
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  static async register(userData: {
    email: string
    name: string
    password: string
    plan?: string
  }): Promise<{ user: UserDocument; token: string } | null> {
    try {
      // Check if user already exists
      const existingUser = await UserService.findByEmail(userData.email)
      if (existingUser) {
        return null
      }

      // Create new user
      const user = await UserService.create({
        email: userData.email,
        name: userData.name,
        password: userData.password,
        plan: (userData.plan as any) || 'free',
        maxInstances: this.getMaxInstancesForPlan(userData.plan || 'free'),
        isActive: true
      })

      // Generate token
      const token = await this.generateToken(user)

      return { user, token }
    } catch (error) {
      console.error('Registration error:', error)
      return null
    }
  }

  private static getMaxInstancesForPlan(plan: string): number {
    const planLimits = {
      free: 1,
      starter: 3,
      pro: 10,
      enterprise: 50
    }
    return planLimits[plan as keyof typeof planLimits] || 1
  }

  static async changePassword(userId: string | ObjectId, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await UserService.findById(userId)
      if (!user) {
        return false
      }

      // Verify current password
      const isValidPassword = await UserService.verifyPassword(user, currentPassword)
      if (!isValidPassword) {
        return false
      }

      // Update password
      await UserService.updateById(userId, { password: newPassword })
      return true
    } catch (error) {
      console.error('Change password error:', error)
      return false
    }
  }

  static async updateProfile(userId: string | ObjectId, updates: {
    name?: string
    email?: string
  }): Promise<UserDocument | null> {
    try {
      // If email is being updated, check if it's already taken
      if (updates.email) {
        const existingUser = await UserService.findByEmail(updates.email)
        if (existingUser && existingUser._id?.toString() !== userId.toString()) {
          return null
        }
      }

      return await UserService.updateById(userId, updates)
    } catch (error) {
      console.error('Update profile error:', error)
      return null
    }
  }
}
