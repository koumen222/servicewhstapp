import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthRequest } from '../types/index.js'
import { env } from '../config/env.js'
import crypto from 'crypto'

const router = Router()

export const PLANS = {
  free:       { name: 'Free',       price: 0,     maxInstances: 1,   currency: 'XAF' },
  starter:    { name: 'Starter',    price: 4990,  maxInstances: 3,   currency: 'XAF' },
  pro:        { name: 'Pro',        price: 14990, maxInstances: 10,  currency: 'XAF' },
  enterprise: { name: 'Enterprise', price: 49990, maxInstances: 100, currency: 'XAF' },
}

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS })
})

router.get('/my-subscription', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true, maxInstances: true, createdAt: true },
    })

    const payments = await (prisma as any).payment?.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => [])

    res.json({
      plan: user?.plan ?? 'free',
      maxInstances: user?.maxInstances ?? 1,
      planDetails: PLANS[user?.plan as keyof typeof PLANS] ?? PLANS.free,
      payments: payments ?? [],
    })
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/initiate-payment', async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body
    const userId = req.user!.id

    if (!PLANS[plan as keyof typeof PLANS]) {
      return res.status(400).json({ error: 'Plan invalide' })
    }
    if (plan === 'free') {
      return res.status(400).json({ error: 'Le plan gratuit ne nécessite pas de paiement' })
    }

    const planData = PLANS[plan as keyof typeof PLANS]
    const externalRef = `wa-${userId.substring(0, 8)}-${plan}-${crypto.randomBytes(6).toString('hex')}`
    const backendUrl = env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`
    const frontendUrl = env.FRONTEND_URL.split(',')[0].trim()

    const paymentPayload = {
      // Champs compatibles avec la doc MoneyFusion/FusionPay
      totalPrice: String(planData.price),
      devise: planData.currency,
      token: externalRef,
      nomclient: req.user!.name,
      email: req.user!.email,
      numeroSend: 'None',
      return_url: `${frontendUrl}/payment/success?ref=${externalRef}`,
      webhook_url: `${backendUrl}/api/subscriptions/payment-webhook`,
      personal_Info: [{ userId, plan }],
      article: [{ name: `Abonnement ${planData.name}`, price: String(planData.price), quantity: 1 }],
    }

    const payment = await (prisma as any).payment?.create({
      data: {
        userId,
        amount: planData.price,
        currency: planData.currency,
        status: 'pending',
        plan,
        externalRef,
        paymentUrl: env.MONEYFUSION_URL,
        metadata: JSON.stringify({ plan, userId }),
      },
    }).catch(() => null)

    res.json({
      paymentUrl: env.MONEYFUSION_URL,
      payload: paymentPayload,
      externalRef,
      paymentId: payment?.id ?? null,
    })
  } catch (error: any) {
    console.error('[PAYMENT INITIATE]', error.message)
    res.status(500).json({ error: 'Erreur lors de l\'initiation du paiement' })
  }
})

router.post('/payment-webhook', async (req, res) => {
  try {
    const { token, statut } = req.body

    if (!token) return res.status(400).json({ error: 'Token manquant' })

    const isSuccess = statut === 'paid' || statut === 'success' || req.body.status === 'success'

    const payment = await (prisma as any).payment?.findUnique({
      where: { externalRef: token },
    }).catch(() => null)

    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' })

    await (prisma as any).payment?.update({
      where: { externalRef: token },
      data: { status: isSuccess ? 'success' : 'failed', updatedAt: new Date() },
    }).catch(() => null)

    if (isSuccess) {
      const planLimits: Record<string, number> = { free: 1, starter: 3, pro: 10, enterprise: 100 }
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.plan,
          maxInstances: planLimits[payment.plan] ?? 1,
        },
      })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('[PAYMENT WEBHOOK]', error.message)
    res.status(500).json({ error: 'Erreur webhook' })
  }
})

router.get('/payment-verify/:ref', async (req: AuthRequest, res) => {
  try {
    const payment = await (prisma as any).payment?.findUnique({
      where: { externalRef: req.params.ref, userId: req.user!.id },
    }).catch(() => null)

    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' })

    res.json({ status: payment.status, plan: payment.plan, amount: payment.amount })
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
