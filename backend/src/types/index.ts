import { Request } from 'express'

export interface AuthUser {
  id: string
  email: string
  name: string
  plan: string
  maxInstances: number
  isActive: boolean
  isAdmin?: boolean
}

export interface QuotaInfo {
  canSend: boolean
  reason?: string
  dailyUsage?: number
  monthlyUsage?: number
  dailyLimit?: number
  monthlyLimit?: number
}

export interface AuthRequest extends Request {
  user?: AuthUser
  instanceId?: string
  quotaInfo?: QuotaInfo
  isAdminAction?: boolean
}

export interface EvolutionInstance {
  instanceName: string
  status: string
  profileName?: string
  profilePictureUrl?: string
  ownerJid?: string
}

export interface CreateInstancePayload {
  instanceName: string
  integration?: string
  qrcode?: boolean
}

export interface SendMessagePayload {
  number: string
  text: string
}
