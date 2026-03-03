// ── Types pour le système SaaS multi-tenant WhatsApp ──────────────────────────

// =============== TYPES UTILISATEUR ===============
export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  maxInstances: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthenticatedUser extends User {
  token: string
}

// =============== TYPES INSTANCE ===============
export interface WhatsAppInstance {
  id: string
  name: string // customName from DB
  instanceName: string // nom technique Evolution API
  status: 'open' | 'close' | 'connecting' | 'qrcode' | 'pairingCode'
  connectionStatus?: string // statut temps réel d'Evolution API
  profileName?: string
  profilePictureUrl?: string
  ownerJid?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastUsed?: string
}

export interface InstanceWithStats extends WhatsAppInstance {
  stats: {
    messagesLast30Days: number
    totalApiKeys: number
    activeApiKeys: number
  }
  quotas: QuotaUsage[]
  apiKeys: ApiKeyInfo[]
}

export interface CreateInstanceRequest {
  customName: string
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'
}

export interface CreateInstanceResponse {
  success: true
  message: string
  data: {
    instance: {
      id: string
      name: string
      instanceName: string
      status: string
      createdAt: string
    }
    apiKey: {
      key: string // Clé en clair (affichée une seule fois)
      id: string
      name: string
      prefix: string
      permissions: string[]
    }
    quotas: QuotaUsage[]
    qrCode?: QRCodeData | null
  }
}

// =============== TYPES CLÉS API ===============
export interface ApiKeyInfo {
  id: string
  name: string
  keyPrefix: string // Ex: "ak_live_abc123..."
  permissions: string[]
  lastUsed?: string
  usageCount: number
  createdAt: string
  expiresAt?: string
  instanceName?: string
}

export interface CreateApiKeyRequest {
  instanceId: string
  name?: string
  permissions?: string[]
  expiresAt?: string
}

export interface CreateApiKeyResponse {
  apiKey: string // Clé en clair
  keyData: ApiKeyInfo
}

// =============== TYPES QUOTAS ===============
export interface QuotaUsage {
  type: string // 'messages_per_day', 'messages_per_month'
  used: number
  limit: number
  remaining: number
  resetDate: string
  isExpired: boolean
  usagePercentage: number
}

export interface QuotaLimits {
  messages_per_day: number
  messages_per_month: number
}

// =============== TYPES MESSAGES ===============
export interface SendMessageRequest {
  number: string
  text: string
  options?: {
    mentions?: string[]
    quotedMessageId?: string
    linkPreview?: boolean
  }
}

export interface SendMediaRequest {
  number: string
  media: string // URL ou base64
  mediaType: 'image' | 'document' | 'audio' | 'video'
  caption?: string
  fileName?: string
}

export interface MessageResponse {
  success: true
  message: string
  data: {
    messageId: string
    instanceId: string
    instanceName: string
    recipient: string
    timestamp: string
    quotaRemaining?: number
  }
  metadata: {
    requestId: string
    processingTime: number
  }
}

export interface MessageLog {
  id: string
  recipientNumber: string
  messageType: string
  messageContent?: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  errorMessage?: string
  evolutionMessageId?: string
  apiKeyName: string
  apiKeyPrefix: string
  ipAddress?: string
  createdAt: string
}

// =============== TYPES EVOLUTION API ===============
export interface EvolutionInstance {
  instanceName: string
  instanceId?: string
  status: 'open' | 'close' | 'connecting' | 'qrcode' | 'pairingCode'
  serverUrl?: string
  apikey?: string
  integration?: string
  profilePictureUrl?: string
  profileName?: string
  profileStatus?: string
  ownerJid?: string
  lastActivity?: string
}

export interface QRCodeData {
  pairingCode?: string | null
  code?: string | null
  base64?: string | null
  count?: number
}

export interface EvolutionCreateInstancePayload {
  instanceName: string
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'
  qrcode?: boolean
  number?: string
}

export interface EvolutionCreateInstanceResponse {
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
  qrcode?: QRCodeData
}

export interface EvolutionSendTextPayload {
  number: string
  text: string
}

export interface EvolutionSendTextResponse {
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

// =============== TYPES ANALYTICS ===============
export interface MessageStats {
  period: {
    startDate: string
    endDate: string
    days: number
  }
  summary: {
    totalMessages: number
    successfulMessages: number
    failedMessages: number
    successRate: number
  }
  messagesByType: { [key: string]: number }
  dailyBreakdown: { [date: string]: { sent: number; failed: number; total: number } }
  topRecipients: Array<{ number: string; count: number }>
}

export interface ApiKeyMetrics {
  period: {
    startDate: string
    endDate: string
    days: number
  }
  summary: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    successRate: number
    averageRequestsPerDay: number
  }
  hourlyUsage: { [hour: string]: number }
  messageTypes: { [type: string]: number }
}

// =============== TYPES SÉCURITÉ ===============
export interface SuspiciousActivity {
  timeframe: string
  totalMessages: number
  alerts: Array<{
    type: 'HIGH_FREQUENCY_RECIPIENT' | 'DUPLICATE_CONTENT' | 'HIGH_VOLUME'
    severity: 'low' | 'medium' | 'high'
    message: string
    details: any
  }>
  riskScore: number
}

// =============== TYPES API RESPONSES ===============
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  code?: string
  timestamp?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

export interface ErrorResponse {
  error: string
  message: string
  code: string
  timestamp?: string
  details?: any
}

// =============== TYPES WEBHOOK ===============
export interface WebhookEvent {
  event: string
  instanceId: string
  instanceName: string
  data: any
  timestamp: string
}

export interface MessageReceivedEvent extends WebhookEvent {
  event: 'message.received'
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message: any
    messageType: string
    pushName?: string
  }
}

export interface InstanceStatusEvent extends WebhookEvent {
  event: 'instance.status'
  data: {
    status: 'open' | 'close' | 'connecting'
    qrcode?: QRCodeData
  }
}

// =============== TYPES DASHBOARD ===============
export interface DashboardStats {
  user: {
    plan: string
    instancesUsed: number
    instancesLimit: number
  }
  instances: {
    total: number
    active: number
    connecting: number
    disconnected: number
  }
  messages: {
    today: number
    thisMonth: number
    quotaUsed: number
    quotaLimit: number
  }
  apiKeys: {
    total: number
    active: number
    lastUsed?: string
  }
}

// =============== TYPES PLANS & BILLING ===============
export interface PlanFeatures {
  instances: number
  messagesPerDay: number
  messagesPerMonth: number
  apiKeysPerInstance: number
  webhookSupport: boolean
  prioritySupport: boolean
  customIntegrations: boolean
}

export interface Plan {
  id: string
  name: 'free' | 'starter' | 'pro' | 'enterprise'
  displayName: string
  price: number
  currency: 'EUR' | 'USD'
  features: PlanFeatures
  isPopular?: boolean
}

// =============== TYPES UTILITAIRES ===============
export type InstanceStatus = 'open' | 'close' | 'connecting' | 'qrcode' | 'pairingCode'
export type MessageStatus = 'sent' | 'delivered' | 'failed' | 'pending' | 'read'
export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type ApiPermission = 'send_message' | 'get_instance_status' | 'manage_webhooks' | 'read_messages'

// Legacy exports pour compatibilité
export interface ApiError extends ErrorResponse {}
export interface InstanceCredentials extends InstanceWithStats {}
