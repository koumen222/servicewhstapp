import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types/index.js'
import { verifyToken } from '../lib/jwt.js'

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
