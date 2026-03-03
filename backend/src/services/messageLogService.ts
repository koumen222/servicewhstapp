import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LogMessageData {
  instanceId: string
  apiKeyId: string
  recipientNumber: string
  messageType: string
  messageContent?: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  evolutionMessageId?: string
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}

export class MessageLogService {
  /**
   * Enregistre un message dans les logs pour audit et analytics
   */
  static async logMessage(data: LogMessageData): Promise<void> {
    try {
      await prisma.messageLog.create({
        data: {
          instanceId: data.instanceId,
          apiKeyId: data.apiKeyId,
          recipientNumber: data.recipientNumber,
          messageType: data.messageType,
          messageContent: data.messageContent?.substring(0, 1000), // Limiter la taille
          status: data.status,
          evolutionMessageId: data.evolutionMessageId,
          errorMessage: data.errorMessage?.substring(0, 500),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent?.substring(0, 200),
          createdAt: new Date()
        }
      })
    } catch (error) {
      // Ne pas faire échouer la requête principale si le logging échoue
      console.error('Failed to log message:', error)
    }
  }

  /**
   * Met à jour le statut d'un message existant
   */
  static async updateMessageStatus(
    evolutionMessageId: string, 
    status: 'delivered' | 'failed' | 'read',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.messageLog.updateMany({
        where: {
          evolutionMessageId,
          status: { in: ['sent', 'pending'] }
        },
        data: {
          status,
          errorMessage: errorMessage?.substring(0, 500)
        }
      })
    } catch (error) {
      console.error('Failed to update message status:', error)
    }
  }

  /**
   * Récupère l'historique des messages pour une instance
   */
  static async getMessageHistory(
    instanceId: string,
    options: {
      limit?: number
      offset?: number
      status?: string
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    try {
      const {
        limit = 50,
        offset = 0,
        status,
        startDate,
        endDate
      } = options

      const where: any = {
        instanceId
      }

      if (status) {
        where.status = status
      }

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = startDate
        if (endDate) where.createdAt.lte = endDate
      }

      const messages = await prisma.messageLog.findMany({
        where,
        include: {
          apiKey: {
            select: {
              name: true,
              keyPrefix: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      })

      const total = await prisma.messageLog.count({ where })

      return {
        messages: messages.map(msg => ({
          id: msg.id,
          recipientNumber: msg.recipientNumber,
          messageType: msg.messageType,
          messageContent: msg.messageContent,
          status: msg.status,
          errorMessage: msg.errorMessage,
          evolutionMessageId: msg.evolutionMessageId,
          apiKeyName: msg.apiKey.name,
          apiKeyPrefix: msg.apiKey.keyPrefix,
          ipAddress: msg.ipAddress,
          createdAt: msg.createdAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    } catch (error) {
      console.error('Failed to get message history:', error)
      return { messages: [], pagination: { total: 0, limit: 0, offset: 0, hasMore: false } }
    }
  }

  /**
   * Récupère les statistiques de messages pour une instance
   */
  static async getMessageStats(instanceId: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Statistiques générales
      const totalMessages = await prisma.messageLog.count({
        where: {
          instanceId,
          createdAt: { gte: startDate }
        }
      })

      const successfulMessages = await prisma.messageLog.count({
        where: {
          instanceId,
          status: 'sent',
          createdAt: { gte: startDate }
        }
      })

      const failedMessages = await prisma.messageLog.count({
        where: {
          instanceId,
          status: 'failed',
          createdAt: { gte: startDate }
        }
      })

      // Messages par type
      const messagesByType = await prisma.messageLog.groupBy({
        by: ['messageType'],
        where: {
          instanceId,
          createdAt: { gte: startDate }
        },
        _count: {
          id: true
        }
      })

      // Messages par jour (derniers 7 jours)
      const last7Days = new Date()
      last7Days.setDate(last7Days.getDate() - 7)

      const dailyMessages = await prisma.messageLog.findMany({
        where: {
          instanceId,
          createdAt: { gte: last7Days }
        },
        select: {
          createdAt: true,
          status: true
        }
      })

      // Grouper par jour
      const dailyStats: { [key: string]: { sent: number; failed: number; total: number } } = {}
      
      dailyMessages.forEach(msg => {
        const dateKey = msg.createdAt.toISOString().split('T')[0]
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { sent: 0, failed: 0, total: 0 }
        }
        dailyStats[dateKey].total++
        if (msg.status === 'sent') dailyStats[dateKey].sent++
        if (msg.status === 'failed') dailyStats[dateKey].failed++
      })

      // Top destinataires
      const topRecipients = await prisma.messageLog.groupBy({
        by: ['recipientNumber'],
        where: {
          instanceId,
          createdAt: { gte: startDate }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      })

      return {
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days
        },
        summary: {
          totalMessages,
          successfulMessages,
          failedMessages,
          successRate: totalMessages > 0 ? Math.round((successfulMessages / totalMessages) * 100) : 0
        },
        messagesByType: messagesByType.reduce((acc, item) => {
          acc[item.messageType] = item._count.id
          return acc
        }, {} as { [key: string]: number }),
        dailyBreakdown: dailyStats,
        topRecipients: topRecipients.map(item => ({
          number: item.recipientNumber,
          count: item._count.id
        }))
      }
    } catch (error) {
      console.error('Failed to get message stats:', error)
      return null
    }
  }

  /**
   * Nettoie les anciens logs (à exécuter via cron)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await prisma.messageLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} old message logs (older than ${daysToKeep} days)`)
      return result.count
    } catch (error) {
      console.error('Failed to cleanup old logs:', error)
      return 0
    }
  }

  /**
   * Obtient les métriques de performance pour les API keys
   */
  static async getApiKeyMetrics(apiKeyId: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const metrics = await prisma.messageLog.findMany({
        where: {
          apiKeyId,
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true,
          status: true,
          messageType: true
        }
      })

      const totalRequests = metrics.length
      const successfulRequests = metrics.filter(m => m.status === 'sent').length
      const failedRequests = metrics.filter(m => m.status === 'failed').length

      // Grouper par heure pour voir les pics d'utilisation
      const hourlyUsage: { [key: string]: number } = {}
      metrics.forEach(m => {
        const hourKey = m.createdAt.toISOString().slice(0, 13) + ':00:00.000Z'
        hourlyUsage[hourKey] = (hourlyUsage[hourKey] || 0) + 1
      })

      return {
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days
        },
        summary: {
          totalRequests,
          successfulRequests,
          failedRequests,
          successRate: totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0,
          averageRequestsPerDay: Math.round((totalRequests / days) * 100) / 100
        },
        hourlyUsage,
        messageTypes: metrics.reduce((acc, m) => {
          acc[m.messageType] = (acc[m.messageType] || 0) + 1
          return acc
        }, {} as { [key: string]: number })
      }
    } catch (error) {
      console.error('Failed to get API key metrics:', error)
      return null
    }
  }

  /**
   * Détecte les patterns d'usage suspects (rate limiting, spam, etc.)
   */
  static async detectSuspiciousActivity(instanceId: string, hoursToCheck: number = 1) {
    try {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hoursToCheck)

      const recentMessages = await prisma.messageLog.findMany({
        where: {
          instanceId,
          createdAt: { gte: startTime }
        },
        select: {
          recipientNumber: true,
          messageContent: true,
          ipAddress: true,
          createdAt: true,
          apiKey: {
            select: {
              id: true,
              keyPrefix: true
            }
          }
        }
      })

      const alerts = []

      // 1. Trop de messages au même destinataire
      const recipientCounts: { [key: string]: number } = {}
      recentMessages.forEach(msg => {
        recipientCounts[msg.recipientNumber] = (recipientCounts[msg.recipientNumber] || 0) + 1
      })

      for (const [recipient, count] of Object.entries(recipientCounts)) {
        if (count > 50) { // Plus de 50 messages par heure au même destinataire
          alerts.push({
            type: 'HIGH_FREQUENCY_RECIPIENT',
            severity: 'high',
            message: `${count} messages sent to ${recipient} in the last hour`,
            details: { recipient, count, timeframe: `${hoursToCheck}h` }
          })
        }
      }

      // 2. Messages identiques répétés (spam potentiel)
      const contentCounts: { [key: string]: number } = {}
      recentMessages.forEach(msg => {
        if (msg.messageContent) {
          const content = msg.messageContent.toLowerCase().trim()
          contentCounts[content] = (contentCounts[content] || 0) + 1
        }
      })

      for (const [content, count] of Object.entries(contentCounts)) {
        if (count > 20) { // Même message répété plus de 20 fois
          alerts.push({
            type: 'DUPLICATE_CONTENT',
            severity: 'medium',
            message: `Identical message sent ${count} times in the last hour`,
            details: { content: content.substring(0, 100), count, timeframe: `${hoursToCheck}h` }
          })
        }
      }

      // 3. Volume global très élevé
      const totalMessages = recentMessages.length
      if (totalMessages > 1000) {
        alerts.push({
          type: 'HIGH_VOLUME',
          severity: 'medium',
          message: `${totalMessages} messages sent in the last hour`,
          details: { totalMessages, timeframe: `${hoursToCheck}h` }
        })
      }

      return {
        timeframe: `${hoursToCheck} hour(s)`,
        totalMessages,
        alerts,
        riskScore: this.calculateRiskScore(alerts)
      }
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error)
      return {
        timeframe: `${hoursToCheck} hour(s)`,
        totalMessages: 0,
        alerts: [],
        riskScore: 0
      }
    }
  }

  /**
   * Calcule un score de risque basé sur les alertes
   */
  private static calculateRiskScore(alerts: any[]): number {
    let score = 0
    alerts.forEach(alert => {
      switch (alert.severity) {
        case 'high':
          score += 30
          break
        case 'medium':
          score += 15
          break
        case 'low':
          score += 5
          break
      }
    })
    return Math.min(score, 100) // Score maximum de 100
  }
}
