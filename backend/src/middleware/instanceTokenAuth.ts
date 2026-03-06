import { Request, Response, NextFunction } from 'express'
import { InstanceTokenService } from '../services/instanceTokenService.js'

declare global {
  namespace Express {
    interface Request {
      instanceAuth?: {
        instance: any
        user: any
      }
    }
  }
}

export const instanceTokenAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        error: true,
        code: 'MISSING_TOKEN',
        message: 'Authorization header is required',
        timestamp: new Date().toISOString()
      })
    }

    const parts = authHeader.split(' ')
    
    if (parts.length !== 2 || parts[0] !== 'Instance-Token') {
      return res.status(401).json({
        error: true,
        code: 'INVALID_AUTH_FORMAT',
        message: 'Authorization header must be in format: Instance-Token <token>',
        timestamp: new Date().toISOString()
      })
    }

    const token = parts[1]

    const validation = await InstanceTokenService.validateToken(token)

    if (!validation.valid) {
      return res.status(401).json({
        error: true,
        code: 'INVALID_TOKEN',
        message: validation.error || 'Invalid instance token',
        timestamp: new Date().toISOString()
      })
    }

    req.instanceAuth = {
      instance: validation.instance,
      user: validation.instance.user
    }

    next()
  } catch (error) {
    console.error('Instance token auth error:', error)
    return res.status(500).json({
      error: true,
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      timestamp: new Date().toISOString()
    })
  }
}
