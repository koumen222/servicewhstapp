import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/authService.mongo.js'
import { UserDocument } from '../types/models.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    plan: string
    maxInstances: number
    isActive: boolean
  }
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization header'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    const user = await AuthService.verifyToken(token)
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed'
      })
    }

    // Transform UserDocument to match expected interface
    req.user = {
      id: user._id?.toString() || '',
      email: user.email,
      name: user.name,
      plan: user.plan,
      maxInstances: user.maxInstances,
      isActive: user.isActive
    }
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid token'
    })
  }
}

export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const user = await AuthService.verifyToken(token)
      if (user) {
        req.user = {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          plan: user.plan,
          maxInstances: user.maxInstances,
          isActive: user.isActive
        }
      }
    }
    
    next()
  } catch (error) {
    // Optional auth - continue even if token is invalid
    next()
  }
}
