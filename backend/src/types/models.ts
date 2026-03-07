import { ObjectId, WithId } from 'mongodb'

// Base document interface
export interface BaseDocument {
  _id?: ObjectId
  createdAt: Date
  updatedAt: Date
}

// User document
export interface User extends BaseDocument {
  email: string
  name: string
  password: string
  phone?: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  maxInstances: number
  isActive: boolean
  emailVerified?: boolean
  emailVerificationToken?: string
}

// ApiKey document
export interface ApiKey extends BaseDocument {
  userId: ObjectId
  instanceId: ObjectId
  keyHash: string
  keyPrefix: string
  name?: string
  permissions: string[]
  isActive: boolean
  revoked: boolean
  revokedAt?: Date
  revokedReason?: string
  lastUsed?: Date
  lastUsedIp?: string
  usageCount: number
  rateLimitPerMin: number
  expiresAt?: Date
}

// Subscription document
export interface Subscription extends BaseDocument {
  userId: ObjectId
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  startDate: Date
  endDate?: Date
}

// Payment document
export interface Payment extends BaseDocument {
  userId: ObjectId
  subscriptionId?: ObjectId
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  plan: string
  provider: string
  externalRef?: string
  paymentUrl?: string
  metadata?: string
}

// Notification document
export interface Notification extends BaseDocument {
  userId: ObjectId
  type: string
  title: string
  message: string
  isRead: boolean
  metadata?: string
  createdBy?: ObjectId
}

// ActivityLog document
export interface ActivityLog extends BaseDocument {
  instanceId: ObjectId
  actionType: string
  actionResult: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

// QuotaUsage document
export interface QuotaUsage extends BaseDocument {
  instanceId: ObjectId
  quotaType: string
  currentUsage: number
  maxAllowed: number
  resetDate: Date
}

// MessageLog document
export interface MessageLog extends BaseDocument {
  instanceId: ObjectId
  apiKeyId: ObjectId
  recipientNumber: string
  messageType: string
  messageContent?: string
  status: string
  evolutionMessageId?: string
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}

// SystemConfig document
export interface SystemConfig extends BaseDocument {
  key: string
  value: string
  description?: string
}

// WhatsApp Instance document (from previous implementation)
export interface WhatsAppInstance extends BaseDocument {
  instanceId: string
  instanceName: string
  customName: string
  apiKey: string
  hash: string
  status: string
  integration?: string
  qrcodeBase64?: string
  userId?: ObjectId // For multi-tenant support
  isActive?: boolean
}

// Type helpers
export type UserDocument = WithId<User>
export type ApiKeyDocument = WithId<ApiKey>
export type SubscriptionDocument = WithId<Subscription>
export type PaymentDocument = WithId<Payment>
export type NotificationDocument = WithId<Notification>
export type ActivityLogDocument = WithId<ActivityLog>
export type QuotaUsageDocument = WithId<QuotaUsage>
export type MessageLogDocument = WithId<MessageLog>
export type SystemConfigDocument = WithId<SystemConfig>
export type WhatsAppInstanceDocument = WithId<WhatsAppInstance>
