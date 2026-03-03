import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class QuotaService {
  /**
   * Initialise les quotas par défaut pour une nouvelle instance
   */
  static async initializeInstanceQuotas(instanceId: string, userPlan: string) {
    const quotaLimits = this.getQuotaLimitsByPlan(userPlan)
    
    const quotasToCreate = []
    
    for (const [quotaType, limit] of Object.entries(quotaLimits)) {
      const resetDate = this.getNextResetDate(quotaType)
      
      quotasToCreate.push({
        instanceId,
        quotaType,
        maxAllowed: limit,
        currentUsage: 0,
        resetDate
      })
    }

    try {
      // Créer tous les quotas en une transaction
      await prisma.$transaction(
        quotasToCreate.map(quota =>
          prisma.quotaUsage.upsert({
            where: {
              instanceId_quotaType: {
                instanceId: quota.instanceId,
                quotaType: quota.quotaType
              }
            },
            update: {
              maxAllowed: quota.maxAllowed,
              resetDate: quota.resetDate
            },
            create: quota
          })
        )
      )
      
      console.log(`✅ Quotas initialized for instance ${instanceId} with plan ${userPlan}`)
    } catch (error) {
      console.error('Failed to initialize quotas:', error)
      throw new Error('Failed to initialize instance quotas')
    }
  }

  /**
   * Consomme une unité de quota et vérifie les limites
   */
  static async consumeQuota(
    instanceId: string, 
    quotaType: string, 
    amount: number = 1
  ): Promise<{
    allowed: boolean
    remaining: number
    message?: string
    resetDate?: Date
  }> {
    try {
      // Vérifier le quota actuel
      const quota = await prisma.quotaUsage.findUnique({
        where: {
          instanceId_quotaType: {
            instanceId,
            quotaType
          }
        }
      })

      if (!quota) {
        // Pas de quota configuré = pas de limite
        return { allowed: true, remaining: -1 }
      }

      // Vérifier si le quota doit être réinitialisé
      const now = new Date()
      if (quota.resetDate < now) {
        await this.resetQuota(instanceId, quotaType)
        // Récupérer le quota après reset
        const updatedQuota = await prisma.quotaUsage.findUnique({
          where: {
            instanceId_quotaType: {
              instanceId,
              quotaType
            }
          }
        })
        if (updatedQuota) {
          quota.currentUsage = updatedQuota.currentUsage
          quota.resetDate = updatedQuota.resetDate
        }
      }

      // Vérifier si on peut consommer
      if (quota.currentUsage + amount > quota.maxAllowed) {
        return {
          allowed: false,
          remaining: Math.max(0, quota.maxAllowed - quota.currentUsage),
          message: `${quotaType} limit exceeded. Limit: ${quota.maxAllowed}, Current: ${quota.currentUsage}`,
          resetDate: quota.resetDate
        }
      }

      // Consommer le quota
      const updatedQuota = await prisma.quotaUsage.update({
        where: {
          instanceId_quotaType: {
            instanceId,
            quotaType
          }
        },
        data: {
          currentUsage: {
            increment: amount
          },
          updatedAt: now
        }
      })

      return {
        allowed: true,
        remaining: quota.maxAllowed - updatedQuota.currentUsage
      }

    } catch (error) {
      console.error('Quota consumption error:', error)
      // En cas d'erreur, on autorise (fail-open) pour ne pas bloquer les services
      return { allowed: true, remaining: -1 }
    }
  }

  /**
   * Obtient l'utilisation actuelle des quotas pour une instance
   */
  static async getQuotaUsage(instanceId: string) {
    try {
      const quotas = await prisma.quotaUsage.findMany({
        where: { instanceId },
        orderBy: { quotaType: 'asc' }
      })

      return quotas.map(quota => {
        const now = new Date()
        const isExpired = quota.resetDate < now
        
        return {
          quotaType: quota.quotaType,
          currentUsage: isExpired ? 0 : quota.currentUsage,
          maxAllowed: quota.maxAllowed,
          remaining: isExpired ? quota.maxAllowed : Math.max(0, quota.maxAllowed - quota.currentUsage),
          resetDate: quota.resetDate,
          isExpired,
          usagePercentage: isExpired ? 0 : Math.round((quota.currentUsage / quota.maxAllowed) * 100)
        }
      })
    } catch (error) {
      console.error('Failed to get quota usage:', error)
      return []
    }
  }

  /**
   * Remet à zéro un quota spécifique
   */
  static async resetQuota(instanceId: string, quotaType: string) {
    const newResetDate = this.getNextResetDate(quotaType)
    
    await prisma.quotaUsage.update({
      where: {
        instanceId_quotaType: {
          instanceId,
          quotaType
        }
      },
      data: {
        currentUsage: 0,
        resetDate: newResetDate,
        updatedAt: new Date()
      }
    })
    
    console.log(`🔄 Reset quota ${quotaType} for instance ${instanceId}`)
  }

  /**
   * Met à jour les limites de quota suite à un changement de plan
   */
  static async updateQuotaLimits(instanceId: string, newPlan: string) {
    const newLimits = this.getQuotaLimitsByPlan(newPlan)
    
    try {
      await prisma.$transaction(
        Object.entries(newLimits).map(([quotaType, limit]) =>
          prisma.quotaUsage.upsert({
            where: {
              instanceId_quotaType: {
                instanceId,
                quotaType
              }
            },
            update: {
              maxAllowed: limit,
              updatedAt: new Date()
            },
            create: {
              instanceId,
              quotaType,
              maxAllowed: limit,
              currentUsage: 0,
              resetDate: this.getNextResetDate(quotaType)
            }
          })
        )
      )
      
      console.log(`✅ Updated quota limits for instance ${instanceId} to plan ${newPlan}`)
    } catch (error) {
      console.error('Failed to update quota limits:', error)
      throw new Error('Failed to update quota limits')
    }
  }

  /**
   * Tâche de maintenance : remet à zéro tous les quotas expirés
   */
  static async resetExpiredQuotas(): Promise<number> {
    try {
      const now = new Date()
      
      const expiredQuotas = await prisma.quotaUsage.findMany({
        where: {
          resetDate: {
            lt: now
          },
          currentUsage: {
            gt: 0
          }
        }
      })

      let resetCount = 0
      
      for (const quota of expiredQuotas) {
        const newResetDate = this.getNextResetDate(quota.quotaType)
        
        await prisma.quotaUsage.update({
          where: { id: quota.id },
          data: {
            currentUsage: 0,
            resetDate: newResetDate,
            updatedAt: now
          }
        })
        
        resetCount++
      }

      if (resetCount > 0) {
        console.log(`🔄 Reset ${resetCount} expired quotas`)
      }
      
      return resetCount
    } catch (error) {
      console.error('Failed to reset expired quotas:', error)
      return 0
    }
  }

  /**
   * Obtient les statistiques d'utilisation de quota sur une période
   */
  static async getQuotaStats(instanceId: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Récupérer les logs de messages pour calculer l'utilisation historique
      const messageLogs = await prisma.messageLog.findMany({
        where: {
          instanceId,
          createdAt: {
            gte: startDate
          },
          status: 'sent'
        },
        select: {
          createdAt: true,
          messageType: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Grouper par jour
      const dailyStats: { [key: string]: number } = {}
      
      messageLogs.forEach(log => {
        const dateKey = log.createdAt.toISOString().split('T')[0]
        dailyStats[dateKey] = (dailyStats[dateKey] || 0) + 1
      })

      // Calculer les moyennes
      const totalMessages = messageLogs.length
      const averagePerDay = totalMessages / days
      
      // Types de messages
      const messageTypes: { [key: string]: number } = {}
      messageLogs.forEach(log => {
        messageTypes[log.messageType] = (messageTypes[log.messageType] || 0) + 1
      })

      return {
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days
        },
        totals: {
          messages: totalMessages,
          averagePerDay: Math.round(averagePerDay * 100) / 100
        },
        dailyBreakdown: dailyStats,
        messageTypes,
        currentQuotas: await this.getQuotaUsage(instanceId)
      }
    } catch (error) {
      console.error('Failed to get quota stats:', error)
      return null
    }
  }

  // =============== MÉTHODES PRIVÉES ===============

  /**
   * Obtient les limites de quota selon le plan utilisateur
   */
  private static getQuotaLimitsByPlan(plan: string): { [key: string]: number } {
    const limits = {
      free: {
        messages_per_day: 100,
        messages_per_month: 1000
      },
      starter: {
        messages_per_day: 1000,
        messages_per_month: 15000
      },
      pro: {
        messages_per_day: 10000,
        messages_per_month: 200000
      },
      enterprise: {
        messages_per_day: 100000,
        messages_per_month: 2000000
      }
    }

    return limits[plan as keyof typeof limits] || limits.free
  }

  /**
   * Calcule la prochaine date de remise à zéro selon le type de quota
   */
  private static getNextResetDate(quotaType: string): Date {
    const now = new Date()
    
    switch (quotaType) {
      case 'messages_per_day':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return tomorrow
        
      case 'messages_per_month':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        return nextMonth
        
      default:
        // Par défaut, remise à zéro quotidienne
        const defaultTomorrow = new Date(now)
        defaultTomorrow.setDate(defaultTomorrow.getDate() + 1)
        defaultTomorrow.setHours(0, 0, 0, 0)
        return defaultTomorrow
    }
  }
}
