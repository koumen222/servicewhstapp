import { prisma } from '../lib/prisma.js'

// Définition des limites par plan
export const PLAN_LIMITS = {
  free: {
    messagesPerDay: 50,
    messagesPerMonth: 500,
    instancesMax: 1
  },
  starter: {
    messagesPerDay: 500,
    messagesPerMonth: 100000,
    instancesMax: 1
  },
  pro: {
    messagesPerDay: 5000,
    messagesPerMonth: 1000000,
    instancesMax: 5
  },
  enterprise: {
    messagesPerDay: -1, // illimité
    messagesPerMonth: -1, // illimité
    instancesMax: 10
  }
} as const

export type PlanType = keyof typeof PLAN_LIMITS

// Fonction pour obtenir ou créer un quota usage
export async function getOrCreateQuotaUsage(instanceId: string, quotaType: 'messages_per_day' | 'messages_per_month') {
  const now = new Date()
  let resetDate: Date
  
  if (quotaType === 'messages_per_day') {
    resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else {
    resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  // Chercher un quota existant
  let quota = await prisma.quotaUsage.findUnique({
    where: {
      instanceId_quotaType: {
        instanceId,
        quotaType
      }
    }
  })

  // Si le quota existe mais la date de reset est passée, le remettre à zéro
  if (quota && quota.resetDate <= now) {
    quota = await prisma.quotaUsage.update({
      where: { id: quota.id },
      data: {
        currentUsage: 0,
        resetDate
      }
    })
  }

  // Si pas de quota, en créer un
  if (!quota) {
    const instance = await prisma.instance.findUnique({
      where: { id: instanceId },
      include: { user: true }
    })

    if (!instance) throw new Error('Instance non trouvée')

    const limits = PLAN_LIMITS[instance.user.plan as PlanType]
    const maxAllowed = quotaType === 'messages_per_day' ? limits.messagesPerDay : limits.messagesPerMonth

    quota = await prisma.quotaUsage.create({
      data: {
        instanceId,
        quotaType,
        currentUsage: 0,
        maxAllowed,
        resetDate
      }
    })
  }

  return quota
}

// Vérifier si l'utilisateur peut envoyer des messages
export async function canSendMessage(instanceId: string): Promise<{ canSend: boolean, reason?: string, dailyUsage?: number, monthlyUsage?: number, dailyLimit?: number, monthlyLimit?: number }> {
  try {
    const [dailyQuota, monthlyQuota] = await Promise.all([
      getOrCreateQuotaUsage(instanceId, 'messages_per_day'),
      getOrCreateQuotaUsage(instanceId, 'messages_per_month')
    ])

    // Vérifier les limites (si -1 = illimité)
    if (dailyQuota.maxAllowed !== -1 && dailyQuota.currentUsage >= dailyQuota.maxAllowed) {
      return {
        canSend: false,
        reason: `Limite journalière atteinte (${dailyQuota.currentUsage}/${dailyQuota.maxAllowed})`,
        dailyUsage: dailyQuota.currentUsage,
        dailyLimit: dailyQuota.maxAllowed,
        monthlyUsage: monthlyQuota.currentUsage,
        monthlyLimit: monthlyQuota.maxAllowed
      }
    }

    if (monthlyQuota.maxAllowed !== -1 && monthlyQuota.currentUsage >= monthlyQuota.maxAllowed) {
      return {
        canSend: false,
        reason: `Limite mensuelle atteinte (${monthlyQuota.currentUsage}/${monthlyQuota.maxAllowed})`,
        dailyUsage: dailyQuota.currentUsage,
        dailyLimit: dailyQuota.maxAllowed,
        monthlyUsage: monthlyQuota.currentUsage,
        monthlyLimit: monthlyQuota.maxAllowed
      }
    }

    return {
      canSend: true,
      dailyUsage: dailyQuota.currentUsage,
      dailyLimit: dailyQuota.maxAllowed,
      monthlyUsage: monthlyQuota.currentUsage,
      monthlyLimit: monthlyQuota.maxAllowed
    }
  } catch (error) {
    console.error('[QUOTA] Erreur lors de la vérification:', error)
    return { canSend: false, reason: 'Erreur lors de la vérification des quotas' }
  }
}

// Incrémenter l'usage des quotas après envoi réussi
export async function incrementMessageUsage(instanceId: string): Promise<void> {
  try {
    await Promise.all([
      prisma.quotaUsage.update({
        where: {
          instanceId_quotaType: {
            instanceId,
            quotaType: 'messages_per_day'
          }
        },
        data: {
          currentUsage: {
            increment: 1
          }
        }
      }),
      prisma.quotaUsage.update({
        where: {
          instanceId_quotaType: {
            instanceId,
            quotaType: 'messages_per_month'
          }
        },
        data: {
          currentUsage: {
            increment: 1
          }
        }
      })
    ])
  } catch (error) {
    console.error('[QUOTA] Erreur lors de l\'incrémentation:', error)
  }
}

// Récupérer les statistiques d'usage
export async function getUsageStats(instanceId: string) {
  try {
    const [dailyQuota, monthlyQuota, totalMessages] = await Promise.all([
      getOrCreateQuotaUsage(instanceId, 'messages_per_day'),
      getOrCreateQuotaUsage(instanceId, 'messages_per_month'),
      prisma.messageLog.count({
        where: { instanceId }
      })
    ])

    // Messages envoyés aujourd'hui
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const messagesThisHour = await prisma.messageLog.count({
      where: {
        instanceId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // dernière heure
        }
      }
    })

    return {
      daily: {
        current: dailyQuota.currentUsage,
        limit: dailyQuota.maxAllowed,
        resetDate: dailyQuota.resetDate,
        percentage: dailyQuota.maxAllowed === -1 ? 0 : Math.round((dailyQuota.currentUsage / dailyQuota.maxAllowed) * 100)
      },
      monthly: {
        current: monthlyQuota.currentUsage,
        limit: monthlyQuota.maxAllowed,
        resetDate: monthlyQuota.resetDate,
        percentage: monthlyQuota.maxAllowed === -1 ? 0 : Math.round((monthlyQuota.currentUsage / monthlyQuota.maxAllowed) * 100)
      },
      total: totalMessages,
      thisHour: messagesThisHour,
      canSend: await canSendMessage(instanceId)
    }
  } catch (error) {
    console.error('[STATS] Erreur lors de la récupération des stats:', error)
    throw error
  }
}
