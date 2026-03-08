import mongoose, { Schema, Document } from 'mongoose'

export interface IPageView extends Document {
  sessionId: string
  userId?: string
  url: string
  referrer?: string
  userAgent: string
  ip: string
  country?: string
  city?: string
  device?: string
  browser?: string
  os?: string
  timestamp: Date
  duration?: number
  bounced: boolean
}

export interface IEvent extends Document {
  sessionId: string
  userId?: string
  type: 'click' | 'scroll' | 'form_submit' | 'purchase' | 'signup' | 'login' | 'logout' | 'page_view'
  category: string
  action: string
  label?: string
  value?: number
  url: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ISession extends Document {
  sessionId: string
  userId?: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageViews: number
  events: number
  bounced: boolean
  converted: boolean
  conversionValue?: number
  country?: string
  city?: string
  device?: string
  browser?: string
  os?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export interface IConversion extends Document {
  userId?: string
  sessionId: string
  type: 'signup' | 'purchase' | 'subscription' | 'trial_start'
  value: number
  currency: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface INotification extends Document {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  targetAudience: 'all' | 'users' | 'admins' | 'premium'
  targetUsers?: string[]
  scheduledFor?: Date
  sentAt?: Date
  isActive: boolean
  clickCount: number
  viewCount: number
  createdBy: string
  metadata?: Record<string, any>
}

export interface IEmailCampaign extends Document {
  name: string
  subject: string
  content: string
  type: 'newsletter' | 'promotional' | 'transactional' | 'notification'
  targetAudience: 'all' | 'users' | 'admins' | 'premium' | 'custom'
  targetUsers?: string[]
  scheduledFor?: Date
  sentAt?: Date
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  bouncedCount: number
  unsubscribedCount: number
  isActive: boolean
  createdBy: string
  metadata?: Record<string, any>
}

// Page View Schema
const pageViewSchema = new Schema<IPageView>({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  url: { type: String, required: true },
  referrer: String,
  userAgent: String,
  ip: { type: String, required: true },
  country: String,
  city: String,
  device: String,
  browser: String,
  os: String,
  timestamp: { type: Date, default: Date.now, index: true },
  duration: Number,
  bounced: { type: Boolean, default: false }
})

// Event Schema
const eventSchema = new Schema<IEvent>({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  type: { 
    type: String, 
    enum: ['click', 'scroll', 'form_submit', 'purchase', 'signup', 'login', 'logout', 'page_view'],
    required: true 
  },
  category: { type: String, required: true },
  action: { type: String, required: true },
  label: String,
  value: Number,
  url: String,
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: Schema.Types.Mixed
})

// Session Schema
const sessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number,
  pageViews: { type: Number, default: 0 },
  events: { type: Number, default: 0 },
  bounced: { type: Boolean, default: false },
  converted: { type: Boolean, default: false },
  conversionValue: Number,
  country: String,
  city: String,
  device: String,
  browser: String,
  os: String,
  referrer: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String
})

// Conversion Schema
const conversionSchema = new Schema<IConversion>({
  userId: { type: String, index: true },
  sessionId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['signup', 'purchase', 'subscription', 'trial_start'],
    required: true 
  },
  value: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: Schema.Types.Mixed
})

// Notification Schema
const notificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  targetAudience: { 
    type: String, 
    enum: ['all', 'users', 'admins', 'premium'],
    default: 'all'
  },
  targetUsers: [String],
  scheduledFor: Date,
  sentAt: Date,
  isActive: { type: Boolean, default: true },
  clickCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  metadata: Schema.Types.Mixed
})

// Email Campaign Schema
const emailCampaignSchema = new Schema<IEmailCampaign>({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['newsletter', 'promotional', 'transactional', 'notification'],
    required: true
  },
  targetAudience: { 
    type: String, 
    enum: ['all', 'users', 'admins', 'premium', 'custom'],
    default: 'all'
  },
  targetUsers: [String],
  scheduledFor: Date,
  sentAt: Date,
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused'],
    default: 'draft'
  },
  totalRecipients: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  openedCount: { type: Number, default: 0 },
  clickedCount: { type: Number, default: 0 },
  bouncedCount: { type: Number, default: 0 },
  unsubscribedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  metadata: Schema.Types.Mixed
})

// Indexes for performance
pageViewSchema.index({ timestamp: -1 })
pageViewSchema.index({ sessionId: 1, timestamp: -1 })
pageViewSchema.index({ userId: 1, timestamp: -1 })
pageViewSchema.index({ country: 1, timestamp: -1 })

eventSchema.index({ timestamp: -1 })
eventSchema.index({ sessionId: 1, timestamp: -1 })
eventSchema.index({ userId: 1, timestamp: -1 })
eventSchema.index({ type: 1, timestamp: -1 })

sessionSchema.index({ startTime: -1 })
sessionSchema.index({ userId: 1, startTime: -1 })
sessionSchema.index({ country: 1, startTime: -1 })

conversionSchema.index({ timestamp: -1 })
conversionSchema.index({ userId: 1, timestamp: -1 })
conversionSchema.index({ type: 1, timestamp: -1 })

notificationSchema.index({ createdAt: -1 })
emailCampaignSchema.index({ createdAt: -1 })

export const PageView = mongoose.model<IPageView>('PageView', pageViewSchema)
export const Event = mongoose.model<IEvent>('Event', eventSchema)
export const Session = mongoose.model<ISession>('Session', sessionSchema)
export const Conversion = mongoose.model<IConversion>('Conversion', conversionSchema)
export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
export const EmailCampaign = mongoose.model<IEmailCampaign>('EmailCampaign', emailCampaignSchema)
