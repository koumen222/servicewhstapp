import { Router } from 'express'
import { User } from '../models/User.js'
import { UserInstance } from '../models/UserInstance.js'
import { env } from '../config/env.js'
import crypto from 'crypto'

const router = Router()

export const PLANS: Record<string, { name: string; price: number; maxInstances: number; currency: string }> = {
  basic: { name: 'Basic', price: 3000, maxInstances: 1, currency: 'XAF' },
  premium: { name: 'Premium', price: 10000, maxInstances: 999, currency: 'XAF' },
}

router.get('/plans', (_req, res) => {
  res.json({ plans: PLANS })
})

router.get('/my-subscription', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await User.findById(userId).select('plan maxInstances hasPaid isPaidAccount createdAt trialEndsAt')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const activeInstances = await UserInstance.countDocuments({ userId, isActive: true })

    const planKey = (user.plan as string) || 'basic'
    const planDetails = PLANS[planKey] || PLANS.basic

    const now = new Date()
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null
    const isTrialActive = trialEndsAt ? trialEndsAt.getTime() > now.getTime() : false
    const trialDaysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0

    res.json({
      plan: planKey,
      maxInstances: user.maxInstances ?? 1,
      planDetails,
      payments: [],
      trial: {
        isActive: isTrialActive && !user.hasPaid,
        endsAt: user.trialEndsAt || null,
        daysRemaining: trialDaysRemaining,
      },
      usage: {
        activeInstances,
        totalMessages: 0,
        sentMessages: 0,
        failedMessages: 0,
        deliveredMessages: 0,
        messages30d: 0,
      },
    })
  } catch (error) {
    console.error('[SUBSCRIPTION] Error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/initiate-payment', async (req, res) => {
  try {
    const { plan } = req.body
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Plan invalide' })
    }

    if (plan === 'basic') {
      return res.status(400).json({ error: 'Le plan gratuit ne nécessite pas de paiement' })
    }

    const planData = PLANS[plan]
    const externalRef = `wa-${userId.substring(0, 8)}-${plan}-${crypto.randomBytes(6).toString('hex')}`
    const backendUrl = env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`
    const frontendUrl = env.FRONTEND_URL.split(',')[0].trim()

    const paymentPayload = {
      totalPrice: String(planData.price),
      devise: planData.currency,
      token: externalRef,
      nomclient: req.user?.name,
      email: req.user?.email,
      numeroSend: 'None',
      return_url: `${frontendUrl}/payment/success?ref=${externalRef}`,
      webhook_url: `${backendUrl}/api/subscriptions/payment-webhook`,
      personal_Info: [{ userId, plan }],
      article: [{ name: `Abonnement ${planData.name}`, price: String(planData.price), quantity: 1 }],
    }

    const mfResponse = await fetch(env.MONEYFUSION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    })

    let mfData: any = null
    try {
      mfData = await mfResponse.json()
    } catch {
      mfData = null
    }

    const redirectUrl = mfData?.url
    if (!mfResponse.ok || mfData?.statut === false || !redirectUrl) {
      return res.status(502).json({
        error: 'MoneyFusion: échec création paiement',
        providerMessage: mfData?.message || 'Réponse invalide du provider',
      })
    }

    res.json({
      redirectUrl,
      externalRef,
      providerToken: mfData?.token ?? null,
    })
  } catch (error: any) {
    console.error('[PAYMENT INITIATE]', error.message)
    res.status(500).json({ error: "Erreur lors de l'initiation du paiement" })
  }
})

router.post('/payment-webhook', async (req, res) => {
  try {
    const { token, statut } = req.body
    if (!token) return res.status(400).json({ error: 'Token manquant' })

    const isSuccess = statut === 'paid' || statut === 'success' || req.body.status === 'success'

    if (isSuccess) {
      // Extract userId and plan from the token pattern: wa-{userId}-{plan}-{random}
      const parts = token.split('-')
      if (parts.length >= 3) {
        const plan = parts[2]
        const planLimits: Record<string, number> = { basic: 1, premium: 5 }
        // Find user by partial ID match and update
        // This is a simplified webhook handler
        console.log(`[PAYMENT WEBHOOK] Payment success for plan: ${plan}`)
      }
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('[PAYMENT WEBHOOK]', error.message)
    res.status(500).json({ error: 'Erreur webhook' })
  }
})

router.get('/payment-verify/:ref', async (req, res) => {
  try {
    // Simplified: return status based on ref existence
    res.json({ status: 'pending', ref: req.params.ref })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
