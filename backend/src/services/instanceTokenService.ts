import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'

export class InstanceTokenService {
  private static readonly TOKEN_LENGTH = 48
  private static readonly ALLOWED_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  static generateToken(): string {
    const bytes = crypto.randomBytes(this.TOKEN_LENGTH)
    let token = ''
    
    for (let i = 0; i < this.TOKEN_LENGTH; i++) {
      const randomIndex = bytes[i] % this.ALLOWED_CHARS.length
      token += this.ALLOWED_CHARS[randomIndex]
    }
    
    return token
  }

  static async generateUniqueToken(): Promise<string> {
    let token: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      token = this.generateToken()
      
      const existing = await prisma.instance.findUnique({
        where: { instanceToken: token }
      })
      
      if (!existing) {
        isUnique = true
        return token
      }
      
      attempts++
    }

    throw new Error('Failed to generate unique instance token after maximum attempts')
  }

  static async validateToken(token: string): Promise<{
    valid: boolean
    instance?: any
    error?: string
  }> {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid token format' }
    }

    try {
      const instance = await prisma.instance.findUnique({
        where: { instanceToken: token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              plan: true,
              isActive: true
            }
          }
        }
      })

      if (!instance) {
        return { valid: false, error: 'Instance not found' }
      }

      if (!instance.isActive) {
        return { valid: false, error: 'Instance is inactive' }
      }

      if (instance.status !== 'active' && instance.status !== 'connected') {
        return { valid: false, error: 'Instance is not active' }
      }

      await prisma.instance.update({
        where: { id: instance.id },
        data: { lastActivity: new Date() }
      })

      return { valid: true, instance }
    } catch (error) {
      console.error('Token validation error:', error)
      return { valid: false, error: 'Token validation failed' }
    }
  }
}
