export type UserRole = 'user' | 'admin';
export type InstanceStatus = 'open' | 'close' | 'connecting' | 'expired' | 'unknown' | 'connected' | 'disconnected';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'expired' | 'unknown';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document';
export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanType;
  maxInstances: number;
  isActive?: boolean;
  role?: UserRole;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Instances ───────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name?: string;
  keyPrefix: string;
  permissions: string[];
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  expiresAt?: string;
}

export interface QuotaUsage {
  type: string;
  used: number;
  limit: number;
  remaining: number;
  resetDate?: string;
}

export interface Instance {
  id: string;
  name: string;
  instanceName: string;
  evolutionInstanceId?: string | null;
  instanceToken?: string | null;
  status: InstanceStatus;
  connectionStatus: InstanceStatus;
  realTimeStatus?: ConnectionStatus; // For real-time updates
  profileName?: string | null;
  profilePictureUrl?: string | null;
  ownerJid?: string | null;
  createdAt: string;
  lastUsed?: string | null;
  apiKeys: ApiKey[];
  quotas: QuotaUsage[];
  stats: {
    messagesLast30Days: number;
    totalApiKeys: number;
  };
  chats?: Chat[]; // Associated chats
  connectionInfo?: InstanceConnectionInfo;
}

export interface InstanceListResponse {
  success: boolean;
  data: {
    instances: Instance[];
    summary: {
      totalInstances: number;
      activeInstances: number;
      maxAllowed: number;
    };
  };
}

export interface InstanceCredentials {
  instanceName: string;
  fullInstanceName: string;
  evolutionApiUrl: string;
  apiKey: string;
  status: string;
  createdAt: string;
}

export interface InstanceStats {
  instanceName: string;
  quota: {
    daily: { current: number; limit: number; remaining: number | string; percentage: number; resetDate: string };
    monthly: { current: number; limit: number; remaining: number | string; percentage: number; resetDate: string };
    canSend: boolean;
    reason?: string;
  };
  statistics: {
    total: number;
    thisHour: number;
    byStatus: Record<string, number>;
  };
  recentMessages: Array<{
    id: string;
    recipientNumber: string;
    messageType: string;
    status: string;
    createdAt: string;
    errorMessage?: string;
  }>;
  lastUsed?: string;
}

// ─── Plans & Payments ────────────────────────────────────────────────────────

/** Real backend plan data — prices in XAF */
export interface PlanDetails {
  name: string;
  price: number;   // XAF (prix après réduction)
  originalPrice?: number; // Prix avant réduction
  maxInstances: number;
  currency: 'XAF';
}

export const PLAN_CATALOG: Record<PlanType, PlanDetails> = {
  free:       { name: 'Free',       price: 0,     maxInstances: 1,  currency: 'XAF' },
  starter:    { name: 'Starter',    price: 2495,  originalPrice: 4990,  maxInstances: 1,  currency: 'XAF' },
  pro:        { name: 'Pro',        price: 7495,  originalPrice: 14990, maxInstances: 5,  currency: 'XAF' },
  enterprise: { name: 'Enterprise', price: 24995, originalPrice: 49990, maxInstances: 10, currency: 'XAF' },
};

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  plan: PlanType;
  provider: string;
  externalRef?: string;
  createdAt: string;
}

export interface UsageStats {
  activeInstances: number;
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  deliveredMessages: number;
  messages30d: number;
}

export interface SubscriptionInfo {
  plan: PlanType;
  maxInstances: number;
  planDetails: PlanDetails;
  payments: Payment[];
  usage: UsageStats;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Generic ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateInstancePayload {
  instanceName: string;  // customName in the body (instances.ts uses 'instanceName' field)
  integration?: string;
}

export interface Stats {
  totalInstances: number;
  activeInstances: number;
  expiredInstances: number;
  messagesSent: number;
  maxInstances: number;
}

// ─── Messages & Chats ────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chatId: string;
  instanceId: string;
  senderId: string; // phone number or instance ID
  recipientId: string; // phone number
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  isFromMe: boolean;
  timestamp: string;
  deliveredAt?: string;
  readAt?: string;
  mediaUrl?: string;
  mediaCaption?: string;
}

export interface Chat {
  id: string;
  instanceId: string;
  contactId: string; // phone number
  contactName: string;
  contactAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  lastActivity: string;
  isArchived: boolean;
  isPinned: boolean;
  messages?: ChatMessage[];
}

export interface SendMessagePayload {
  instanceName: string;
  number: string;
  message: string;
  messageType?: MessageType;
}

export interface InstanceConnectionInfo {
  instanceId: string;
  instanceName: string;
  status: ConnectionStatus;
  profileName?: string;
  profilePicture?: string;
  lastSeen?: string;
  qrCode?: string;
  batteryLevel?: number;
  isOnWhatsApp?: boolean;
}
