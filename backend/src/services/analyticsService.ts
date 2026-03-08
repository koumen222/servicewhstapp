import { PageView, Event, Session, Conversion, INotification, IEmailCampaign } from '../models/Analytics.js'
import { User } from '../models/User.js'
import { UserInstance } from '../models/UserInstance.js'
import axios from 'axios'

// GeoIP service pour obtenir la localisation
async function getLocationFromIP(ip: string) {
  try {
    // Utiliser un service gratuit de géolocalisation
    const response = await axios.get(`http://ip-api.com/json/${ip}`)
    if (response.data.status === 'success') {
      return {
        country: response.data.country,
        city: response.data.city,
        region: response.data.region
      }
    }
  } catch (error) {
    console.log('GeoIP lookup failed:', error.message)
  }
  return null
}

// User Agent parser
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  
  let device = 'desktop'
  let browser = 'unknown'
  let os = 'unknown'
  
  // Device detection
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'tablet'
  }
  
  // Browser detection
  if (ua.includes('chrome')) browser = 'chrome'
  else if (ua.includes('firefox')) browser = 'firefox'
  else if (ua.includes('safari')) browser = 'safari'
  else if (ua.includes('edge')) browser = 'edge'
  
  // OS detection
  if (ua.includes('windows')) os = 'windows'
  else if (ua.includes('mac')) os = 'macos'
  else if (ua.includes('linux')) os = 'linux'
  else if (ua.includes('android')) os = 'android'
  else if (ua.includes('ios')) os = 'ios'
  
  return { device, browser, os }
}

export class AnalyticsService {
  // Tracking des pages vues
  static async trackPageView(data: {
    sessionId: string
    userId?: string
    url: string
    referrer?: string
    userAgent: string
    ip: string
  }) {
    try {
      const location = await getLocationFromIP(data.ip)
      const { device, browser, os } = parseUserAgent(data.userAgent)
      
      const pageView = new PageView({
        ...data,
        country: location?.country,
        city: location?.city,
        device,
        browser,
        os,
        timestamp: new Date()
      })
      
      await pageView.save()
      
      // Update session
      await this.updateSession(data.sessionId, {
        pageViews: 1,
        country: location?.country,
        city: location?.city,
        device,
        browser,
        os
      })
      
      return pageView
    } catch (error) {
      console.error('Error tracking page view:', error)
      throw error
    }
  }
  
  // Tracking des événements
  static async trackEvent(data: {
    sessionId: string
    userId?: string
    type: string
    category: string
    action: string
    label?: string
    value?: number
    url?: string
    metadata?: Record<string, any>
  }) {
    try {
      const event = new Event({
        ...data,
        timestamp: new Date()
      })
      
      await event.save()
      
      // Update session
      await this.updateSession(data.sessionId, {
        events: 1
      })
      
      // Track conversions
      if (data.type === 'purchase' || data.type === 'signup') {
        await this.trackConversion({
          sessionId: data.sessionId,
          userId: data.userId,
          type: data.type === 'purchase' ? 'purchase' : 'signup',
          value: data.value || 0
        })
      }
      
      return event
    } catch (error) {
      console.error('Error tracking event:', error)
      throw error
    }
  }
  
  // Mise à jour de session
  static async updateSession(sessionId: string, updates: Partial<{
    pageViews: number
    events: number
    country?: string
    city?: string
    device?: string
    browser?: string
    os?: string
    endTime?: Date
    duration?: number
    converted?: boolean
    conversionValue?: number
  }>) {
    try {
      const updateData: any = { ...updates }
      
      if (updates.pageViews) {
        updateData.$inc = { pageViews: updates.pageViews }
        delete updateData.pageViews
      }
      
      if (updates.events) {
        updateData.$inc = { ...updateData.$inc, events: updates.events }
        delete updateData.events
      }
      
      if (updates.endTime) {
        updateData.endTime = updates.endTime
      }
      
      if (updates.duration) {
        updateData.duration = updates.duration
      }
      
      if (updates.converted !== undefined) {
        updateData.converted = updates.converted
      }
      
      if (updates.conversionValue !== undefined) {
        updateData.conversionValue = updates.conversionValue
      }
      
      if (updates.country) updateData.country = updates.country
      if (updates.city) updateData.city = updates.city
      if (updates.device) updateData.device = updates.device
      if (updates.browser) updateData.browser = updates.browser
      if (updates.os) updateData.os = updates.os
      
      await Session.findOneAndUpdate(
        { sessionId },
        updateData,
        { upsert: true, new: true }
      )
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }
  
  // Tracking des conversions
  static async trackConversion(data: {
    sessionId: string
    userId?: string
    type: 'signup' | 'purchase' | 'subscription' | 'trial_start'
    value: number
    metadata?: Record<string, any>
  }) {
    try {
      const conversion = new Conversion({
        ...data,
        timestamp: new Date()
      })
      
      await conversion.save()
      
      // Update session
      await this.updateSession(data.sessionId, {
        converted: true,
        conversionValue: data.value
      })
      
      return conversion
    } catch (error) {
      console.error('Error tracking conversion:', error)
      throw error
    }
  }
  
  // Statistiques générales
  static async getGeneralStats(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    try {
      const [
        totalPageViews,
        totalSessions,
        totalUsers,
        totalEvents,
        totalConversions,
        activeUsers,
        topCountries,
        topPages,
        deviceStats,
        browserStats
      ] = await Promise.all([
        PageView.countDocuments({ timestamp: { $gte: startDate } }),
        Session.countDocuments({ startTime: { $gte: startDate } }),
        User.countDocuments({ createdAt: { $gte: startDate } }),
        Event.countDocuments({ timestamp: { $gte: startDate } }),
        Conversion.countDocuments({ timestamp: { $gte: startDate } }),
        this.getActiveUsersCount(period),
        this.getTopCountries(period),
        this.getTopPages(period),
        this.getDeviceStats(period),
        this.getBrowserStats(period)
      ])
      
      // Calculate additional metrics
      const avgSessionDuration = await this.getAverageSessionDuration(period)
      const bounceRate = await this.getBounceRate(period)
      const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0
      
      return {
        period,
        totalPageViews,
        totalSessions,
        totalUsers,
        totalEvents,
        totalConversions,
        activeUsers,
        avgSessionDuration,
        bounceRate,
        conversionRate,
        topCountries,
        topPages,
        deviceStats,
        browserStats
      }
    } catch (error) {
      console.error('Error getting general stats:', error)
      throw error
    }
  }
  
  // Nombre d'utilisateurs actifs
  static async getActiveUsersCount(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await Session.distinct('userId', {
      startTime: { $gte: startDate },
      userId: { $exists: true }
    }).then(users => users.length)
  }
  
  // Pays les plus visités
  static async getTopCountries(period: '7d' | '30d' | '90d' = '30d', limit = 10) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await PageView.aggregate([
      { $match: { timestamp: { $gte: startDate }, country: { $exists: true } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ])
  }
  
  // Pages les plus visitées
  static async getTopPages(period: '7d' | '30d' | '90d' = '30d', limit = 10) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await PageView.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$url', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
      { $addFields: { uniqueUserCount: { $size: '$uniqueUsers' } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { url: '$_id', views: '$count', uniqueUsers: '$uniqueUserCount', _id: 0 } }
    ])
  }
  
  // Statistiques des appareils
  static async getDeviceStats(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await PageView.aggregate([
      { $match: { timestamp: { $gte: startDate }, device: { $exists: true } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  }
  
  // Statistiques des navigateurs
  static async getBrowserStats(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await PageView.aggregate([
      { $match: { timestamp: { $gte: startDate }, browser: { $exists: true } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  }
  
  // Durée moyenne de session
  static async getAverageSessionDuration(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const result = await Session.aggregate([
      { $match: { startTime: { $gte: startDate }, duration: { $exists: true } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ])
    
    return result.length > 0 ? Math.round(result[0].avgDuration) : 0
  }
  
  // Taux de rebond
  static async getBounceRate(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const [totalSessions, bouncedSessions] = await Promise.all([
      Session.countDocuments({ startTime: { $gte: startDate } }),
      Session.countDocuments({ startTime: { $gte: startDate }, bounced: true })
    ])
    
    return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0
  }
  
  // Données de croissance dans le temps
  static async getGrowthData(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const growthData = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const [pageViews, sessions, users, conversions] = await Promise.all([
        PageView.countDocuments({ timestamp: { $gte: date, $lt: nextDate } }),
        Session.countDocuments({ startTime: { $gte: date, $lt: nextDate } }),
        User.countDocuments({ createdAt: { $gte: date, $lt: nextDate } }),
        Conversion.countDocuments({ timestamp: { $gte: date, $lt: nextDate } })
      ])
      
      growthData.push({
        date: date.toISOString().split('T')[0],
        pageViews,
        sessions,
        users,
        conversions
      })
    }
    
    return growthData
  }
  
  // Activité récente
  static async getRecentActivity(limit = 50) {
    const recentEvents = await Event.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean()
    
    return recentEvents.map(event => ({
      id: event._id,
      type: event.type,
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      url: event.url,
      timestamp: event.timestamp,
      user: event.userId,
      metadata: event.metadata
    }))
  }
  
  // Notifications
  static async createNotification(data: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    targetAudience: 'all' | 'users' | 'admins' | 'premium'
    targetUsers?: string[]
    scheduledFor?: Date
    createdBy: string
    metadata?: Record<string, any>
  }) {
    try {
      const notification = new Notification(data)
      await notification.save()
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }
  
  static async getNotifications(limit = 20) {
    return await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean()
  }
  
  // Email Campaigns
  static async createEmailCampaign(data: {
    name: string
    subject: string
    content: string
    type: 'newsletter' | 'promotional' | 'transactional' | 'notification'
    targetAudience: 'all' | 'users' | 'admins' | 'premium' | 'custom'
    targetUsers?: string[]
    scheduledFor?: Date
    createdBy: string
    metadata?: Record<string, any>
  }) {
    try {
      const campaign = new EmailCampaign(data)
      
      // Calculate recipients
      if (data.targetAudience === 'all') {
        campaign.totalRecipients = await User.countDocuments({ isActive: true })
      } else if (data.targetAudience === 'custom' && data.targetUsers) {
        campaign.totalRecipients = data.targetUsers.length
      } else {
        // Add logic for other audiences
        campaign.totalRecipients = await User.countDocuments({ 
          isActive: true, 
          plan: data.targetAudience 
        })
      }
      
      await campaign.save()
      return campaign
    } catch (error) {
      console.error('Error creating email campaign:', error)
      throw error
    }
  }
  
  static async getEmailCampaigns(limit = 20) {
    return await EmailCampaign.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean()
  }
}
