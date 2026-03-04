// ── Types frontend (strict + rétrocompatibles) ───────────────────────────────

// =============== TYPES UTILITAIRES ===============
export type InstanceStatus = 'open' | 'close' | 'connecting' | 'qrcode' | 'pairingCode'
export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise'

// =============== UTILISATEUR / AUTH ===============
export interface User {
  id: string
  email: string
  name: string
  token?: string
  plan?: UserPlan
  maxInstances?: number
  isActive?: boolean
  isAdmin?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PlanDetails {
  name: string
  price: number
  maxInstances: number
  currency: string
}

export interface Payment {
  id: string
  userId: string
  plan: string
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  externalRef?: string
  createdAt: string
}

export interface UsageStats {
  activeInstances: number
  totalMessages: number
  sentMessages: number
  failedMessages: number
  deliveredMessages: number
  messages30d: number
}

export interface MySubscriptionResponse {
  plan: string
  maxInstances: number
  planDetails: PlanDetails
  payments: Payment[]
  usage?: UsageStats
}

export interface AdminStats {
  totalUsers: number
  totalInstances: number
  totalPayments: number
  revenue: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  plan: string
  maxInstances: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: { instances: number }
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  metadata?: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

// =============== INSTANCES ===============
export interface EvolutionInstance {
  instanceName: string
  instanceId?: string
  status: InstanceStatus
  state?: InstanceStatus
  serverUrl?: string
  apikey?: string
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS' | string
  profilePictureUrl?: string
  profileName?: string
  profileStatus?: string
  ownerJid?: string
  lastActivity?: string
}

export interface InstanceConnectionState {
  instance: {
    instanceName: string
    state: InstanceStatus
  }
}

export interface CreateInstancePayload {
  instanceName: string
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'
  qrcode?: boolean
  number?: string
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string
    instanceId: string
    status: string
    integration: string
  }
  hash: {
    apikey: string
  }
  settings: Record<string, unknown>
  qrcode?: {
    pairingCode?: string | null
    code?: string | null
    base64?: string | null
    count?: number
  }
}

export interface FetchInstancesResponse {
  instance?: EvolutionInstance
  instanceName?: string
  status?: InstanceStatus
  owner?: string
  ownerJid?: string
  profileName?: string
  profilePictureUrl?: string
  connectionStatus?: string
}

// =============== QR CODE ===============
export interface QRCodeResponse {
  pairingCode?: string | null
  code?: string | null
  base64?: string | null
  count?: number
  qrcode?: {
    pairingCode?: string | null
    code?: string | null
    base64?: string | null
    count?: number
  }
}

// =============== MESSAGES ===============
export interface SendTextPayload {
  number: string
  text: string
}

export interface SendTextResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: {
    conversation?: string
  }
  messageType: string
  status: string
}

// =============== IDENTIFIANTS INSTANCE ===============
export interface InstanceCredentials {
  instanceName: string
  fullInstanceName: string
  evolutionApiUrl: string
  apiKey: string
  status: string
  createdAt: string
}

// =============== API GÉNÉRIQUES ===============
export interface ApiError {
  status: number
  message: string
  error?: string
}

export interface ApiResponse<TData> {
  success: boolean
  data?: TData
  message?: string
  error?: string
}
