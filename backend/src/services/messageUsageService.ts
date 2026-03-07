import { Collection, ObjectId } from 'mongodb'
import { getMongoCollection } from '../lib/mongo.js'

// Plan limits configuration
export const PLAN_LIMITS: Record<string, { dailyMessages: number; monthlyMessages: number }> = {
  free: { dailyMessages: 50, monthlyMessages: 100 },
  starter: { dailyMessages: 500, monthlyMessages: 5000 },
  pro: { dailyMessages: 2000, monthlyMessages: 30000 },
  enterprise: { dailyMessages: 10000, monthlyMessages: 200000 },
}

export interface MessageUsage {
  _id?: ObjectId
  instanceId: string        // user_instances _id as string
  userId: string
  instanceName: string
  date: string              // YYYY-MM-DD for daily tracking
  month: string             // YYYY-MM for monthly tracking
  dailyCount: number
  monthlyCount: number
  totalCount: number
  lastMessageAt: Date
  updatedAt: Date
}

export interface UsageStats {
  dailyCount: number
  monthlyCount: number
  totalCount: number
  dailyLimit: number
  monthlyLimit: number
  dailyRemaining: number
  monthlyRemaining: number
  isOverDailyLimit: boolean
  isOverMonthlyLimit: boolean
  lastMessageAt: Date | null
}

export class MessageUsageService {
  private static collectionName = 'message_usage'

  private static async getCollection(): Promise<Collection<MessageUsage>> {
    return getMongoCollection<MessageUsage>(this.collectionName)
  }

  /**
   * Get today's date string (YYYY-MM-DD) and current month (YYYY-MM)
   */
  private static getDateKeys(): { date: string; month: string } {
    const now = new Date()
    const date = now.toISOString().slice(0, 10) // YYYY-MM-DD
    const month = now.toISOString().slice(0, 7)  // YYYY-MM
    return { date, month }
  }

  /**
   * Check if user can send a message (within plan limits)
   * Returns { allowed, reason, usage }
   */
  static async checkLimits(
    instanceId: string,
    userId: string,
    instanceName: string,
    plan: string
  ): Promise<{ allowed: boolean; reason?: string; usage: UsageStats }> {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
    const { date, month } = this.getDateKeys()
    const collection = await this.getCollection()

    // Get daily usage
    const dailyDoc = await collection.findOne({ instanceId, date })
    const dailyCount = dailyDoc?.dailyCount || 0

    // Get monthly usage (sum all daily docs for this month)
    const monthlyPipeline = await collection.aggregate([
      { $match: { instanceId, month } },
      { $group: { _id: null, total: { $sum: '$dailyCount' }, totalAll: { $max: '$totalCount' } } }
    ]).toArray()

    const monthlyCount = monthlyPipeline[0]?.total || 0
    const totalCount = dailyDoc?.totalCount || 0

    const usage: UsageStats = {
      dailyCount,
      monthlyCount,
      totalCount,
      dailyLimit: limits.dailyMessages,
      monthlyLimit: limits.monthlyMessages,
      dailyRemaining: Math.max(0, limits.dailyMessages - dailyCount),
      monthlyRemaining: Math.max(0, limits.monthlyMessages - monthlyCount),
      isOverDailyLimit: dailyCount >= limits.dailyMessages,
      isOverMonthlyLimit: monthlyCount >= limits.monthlyMessages,
      lastMessageAt: dailyDoc?.lastMessageAt || null,
    }

    if (dailyCount >= limits.dailyMessages) {
      return {
        allowed: false,
        reason: `Limite quotidienne atteinte (${limits.dailyMessages} messages/jour pour le plan ${plan}). Passez à un plan supérieur ou attendez demain.`,
        usage
      }
    }

    if (monthlyCount >= limits.monthlyMessages) {
      return {
        allowed: false,
        reason: `Limite mensuelle atteinte (${limits.monthlyMessages} messages/mois pour le plan ${plan}). Passez à un plan supérieur.`,
        usage
      }
    }

    return { allowed: true, usage }
  }

  /**
   * Record a sent message — increment daily + total counters
   */
  static async recordMessage(
    instanceId: string,
    userId: string,
    instanceName: string
  ): Promise<void> {
    const { date, month } = this.getDateKeys()
    const collection = await this.getCollection()
    const now = new Date()

    await collection.updateOne(
      { instanceId, date },
      {
        $inc: { dailyCount: 1, totalCount: 1 },
        $set: {
          userId,
          instanceName,
          month,
          lastMessageAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          monthlyCount: 0, // Not used directly — we aggregate
        }
      },
      { upsert: true }
    )
  }

  /**
   * Get usage stats for an instance
   */
  static async getUsageStats(
    instanceId: string,
    plan: string
  ): Promise<UsageStats> {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
    const { date, month } = this.getDateKeys()
    const collection = await this.getCollection()

    // Daily
    const dailyDoc = await collection.findOne({ instanceId, date })
    const dailyCount = dailyDoc?.dailyCount || 0

    // Monthly aggregate
    const monthlyPipeline = await collection.aggregate([
      { $match: { instanceId, month } },
      { $group: { _id: null, total: { $sum: '$dailyCount' } } }
    ]).toArray()
    const monthlyCount = monthlyPipeline[0]?.total || 0

    // Total all-time
    const totalPipeline = await collection.aggregate([
      { $match: { instanceId } },
      { $group: { _id: null, total: { $sum: '$dailyCount' } } }
    ]).toArray()
    const totalCount = totalPipeline[0]?.total || 0

    return {
      dailyCount,
      monthlyCount,
      totalCount,
      dailyLimit: limits.dailyMessages,
      monthlyLimit: limits.monthlyMessages,
      dailyRemaining: Math.max(0, limits.dailyMessages - dailyCount),
      monthlyRemaining: Math.max(0, limits.monthlyMessages - monthlyCount),
      isOverDailyLimit: dailyCount >= limits.dailyMessages,
      isOverMonthlyLimit: monthlyCount >= limits.monthlyMessages,
      lastMessageAt: dailyDoc?.lastMessageAt || null,
    }
  }

  /**
   * Get usage stats for ALL instances of a user
   */
  static async getUserUsageStats(
    userId: string,
    plan: string
  ): Promise<{ daily: number; monthly: number; total: number; limits: { daily: number; monthly: number } }> {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
    const { date, month } = this.getDateKeys()
    const collection = await this.getCollection()

    // Daily total across all instances
    const dailyPipeline = await collection.aggregate([
      { $match: { userId, date } },
      { $group: { _id: null, total: { $sum: '$dailyCount' } } }
    ]).toArray()
    const daily = dailyPipeline[0]?.total || 0

    // Monthly total
    const monthlyPipeline = await collection.aggregate([
      { $match: { userId, month } },
      { $group: { _id: null, total: { $sum: '$dailyCount' } } }
    ]).toArray()
    const monthly = monthlyPipeline[0]?.total || 0

    // All-time total
    const totalPipeline = await collection.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$dailyCount' } } }
    ]).toArray()
    const total = totalPipeline[0]?.total || 0

    return {
      daily,
      monthly,
      total,
      limits: { daily: limits.dailyMessages, monthly: limits.monthlyMessages }
    }
  }
}
