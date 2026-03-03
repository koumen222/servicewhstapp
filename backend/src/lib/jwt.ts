import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AuthUser } from '../types/index.js'

export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    maxInstances: user.maxInstances,
  }
  // @ts-ignore - Conflit de types entre versions de jsonwebtoken
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, env.JWT_SECRET) as AuthUser
}
