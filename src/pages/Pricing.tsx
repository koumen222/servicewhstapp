import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, X, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { initiatePayment } from '@/lib/api'
import { toast } from 'sonner'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    instances: 1,
    features: ['1 instance WhatsApp', 'API REST complète', 'Dashboard temps réel', 'QR Code / Pairing Code'],
    missing: ['Support prioritaire', 'Webhooks avancés', 'Multi-équipe'],
    color: 'border-border',
    cta: 'Commencer gratuitement',
    highlight: false,
  },
  {
    key: 'starter',
    name: 'Starter',
    price: 4990,
    instances: 3,
    features: ['3 instances WhatsApp', 'API REST complète', 'Dashboard temps réel', 'QR Code / Pairing Code', 'Support email'],
    missing: ['Webhooks avancés', 'Multi-équipe'],
    color: 'border-emerald-400',
    cta: 'Souscrire au Starter',
    highlight: true,
    badge: 'Populaire',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 14990,
    instances: 10,
    features: ['10 instances WhatsApp', 'API REST complète', 'Dashboard temps réel', 'QR Code / Pairing Code', 'Support prioritaire', 'Webhooks avancés'],
    missing: ['Multi-équipe'],
    color: 'border-blue-400',
    cta: 'Souscrire au Pro',
    highlight: false,
    badge: 'Recommandé',
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 49990,
    instances: 100,
    features: ['100+ instances WhatsApp', 'API REST complète', 'Dashboard temps réel', 'QR Code / Pairing Code', 'Support dédié 24/7', 'Webhooks avancés', 'Multi-équipe'],
    missing: [],
    color: 'border-purple-400',
    cta: 'Souscrire Enterprise',
    highlight: false,
    badge: 'Illimité',
  },
]

export default function Pricing() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planKey: string) => {
    if (!isAuthenticated) {
      navigate('/register')
      return
    }
    if (planKey === 'free') {
      navigate('/dashboard')
      return
    }
    if (user?.plan === planKey) {
      toast.info('Vous êtes déjà sur ce plan')
      return
    }

    setLoadingPlan(planKey)
    try {
      const data = await initiatePayment(planKey)
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.paymentUrl
      form.target = '_self'
      Object.entries(data.payload).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = typeof value === 'object' ? JSON.stringify(value) : String(value)
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } catch {
      toast.error('Erreur lors de l\'initiation du paiement')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            WA Manager
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/login">Connexion</Link></Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                  <Link to="/register">S'inscrire</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {isAuthenticated && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au dashboard
          </Button>
        )}

        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Commencez gratuitement, évoluez quand vous en avez besoin. Tous les plans incluent l'accès complet à l'API.
          </p>
          {isAuthenticated && user?.plan && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              Plan actuel : <strong>{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(plan => {
            const isCurrent = user?.plan === plan.key
            return (
              <div
                key={plan.key}
                className={`relative p-6 rounded-2xl border-2 bg-card flex flex-col transition-shadow hover:shadow-lg ${plan.color} ${plan.highlight ? 'shadow-lg scale-[1.02]' : ''}`}
              >
                {plan.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap ${plan.key === 'enterprise' ? 'bg-purple-600' : plan.key === 'pro' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                    {plan.badge}
                  </span>
                )}

                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'Gratuit' : plan.price.toLocaleString()}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground text-sm mb-1">FCFA/mois</span>}
                  </div>
                </div>

                <ul className="space-y-2 text-sm mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground/50">
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.key !== 'free' && !isCurrent ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  variant={plan.key === 'free' || isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || loadingPlan === plan.key}
                  onClick={() => handleSubscribe(plan.key)}
                >
                  {loadingPlan === plan.key ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Redirection...</>
                  ) : isCurrent ? 'Plan actuel' : plan.cta}
                </Button>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: 'Puis-je changer de plan à tout moment ?', r: 'Oui, vous pouvez upgrader votre plan à tout moment. Le changement est effectif immédiatement.' },
              { q: 'Le paiement est-il sécurisé ?', r: 'Oui, les paiements sont traités par MoneyFusion, une plateforme de paiement sécurisée et certifiée.' },
              { q: 'Qu\'est-ce qu\'une instance WhatsApp ?', r: 'Une instance correspond à un numéro WhatsApp connecté. Chaque instance est indépendante et isolée.' },
              { q: 'Y a-t-il un essai gratuit ?', r: 'Oui ! Le plan Free est gratuit à vie avec 1 instance WhatsApp. Pas besoin de carte de crédit.' },
            ].map(faq => (
              <div key={faq.q} className="p-5 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
