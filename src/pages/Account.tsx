import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, CreditCard, Shield, CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { getMySubscription } from '@/lib/api'
import { toast } from 'sonner'
import type { MySubscriptionResponse } from '@/lib/types'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:       { label: 'Free',       color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  starter:    { label: 'Starter',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  pro:        { label: 'Pro',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente', color: 'text-yellow-600' },
  success:   { label: 'Réussi',     color: 'text-emerald-600' },
  failed:    { label: 'Échoué',     color: 'text-red-600' },
  cancelled: { label: 'Annulé',     color: 'text-gray-500' },
}

export default function Account() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'subscription' | 'security'>('profile')
  const [subData, setSubData] = useState<MySubscriptionResponse | null>(null)
  const [subLoading, setSubLoading] = useState(false)

  useEffect(() => {
    if (tab === 'subscription') loadSubscription()
  }, [tab])

  const loadSubscription = async () => {
    setSubLoading(true)
    try {
      const data = await getMySubscription()
      setSubData(data)
    } catch {
      toast.error('Impossible de charger les informations d\'abonnement')
    } finally {
      setSubLoading(false)
    }
  }

  const planInfo = PLAN_LABELS[user?.plan ?? 'free']

  const tabs = [
    { key: 'profile',      label: 'Profil',      icon: User },
    { key: 'subscription', label: 'Abonnement',  icon: CreditCard },
    { key: 'security',     label: 'Sécurité',    icon: Shield },
  ] as const

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mon compte</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-2xl font-bold text-emerald-600">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-lg">{user?.name}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${planInfo.color}`}>
                  Plan {planInfo.label}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom complet</label>
              <Input value={user?.name ?? ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email ?? ''} readOnly className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="text-sm text-muted-foreground">Plan actuel</div>
                <div className="font-semibold">{planInfo.label}</div>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="text-sm text-muted-foreground">Instances max</div>
                <div className="font-semibold">{user?.maxInstances ?? 1}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Tab */}
      {tab === 'subscription' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Plan actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : subData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                    <div>
                      <div className="font-bold text-lg">{subData.planDetails.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {subData.planDetails.price === 0
                          ? 'Gratuit à vie'
                          : `${subData.planDetails.price.toLocaleString()} ${subData.planDetails.currency}/mois`}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${PLAN_LABELS[subData.plan]?.color}`}>
                      {PLAN_LABELS[subData.plan]?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg border">
                      <div className="text-muted-foreground">Instances incluses</div>
                      <div className="font-semibold">{subData.maxInstances}</div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="text-muted-foreground">Status</div>
                      <div className="font-semibold flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" /> Actif
                      </div>
                    </div>
                  </div>
                  {subData.plan !== 'enterprise' && (
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                      <Link to="/pricing" className="flex items-center justify-center gap-2">
                        Mettre à niveau mon plan <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <Button variant="outline" onClick={loadSubscription}>Recharger</Button>
              )}
            </CardContent>
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mon usage</CardTitle>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : subData?.usage ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <div className="text-muted-foreground">Messages envoyés</div>
                    <div className="font-semibold">{subData.usage.sentMessages.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <div className="text-muted-foreground">Messages livrés</div>
                    <div className="font-semibold">{subData.usage.deliveredMessages.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <div className="text-muted-foreground">Messages échoués</div>
                    <div className="font-semibold text-red-600">{subData.usage.failedMessages.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <div className="text-muted-foreground">Total messages</div>
                    <div className="font-semibold">{subData.usage.totalMessages.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <div className="text-muted-foreground">30 derniers jours</div>
                    <div className="font-semibold">{subData.usage.messages30d.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <div className="text-muted-foreground">Instances actives</div>
                    <div className="font-semibold">{subData.usage.activeInstances}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Pas encore de données d'usage</p>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : subData?.payments?.length ? (
                <div className="space-y-2">
                  {subData.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm capitalize">Plan {p.plan}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{p.amount.toLocaleString()} {p.currency}</div>
                        <div className={`text-xs font-medium ${STATUS_LABELS[p.status]?.color}`}>
                          {STATUS_LABELS[p.status]?.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement pour l'instant</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" /> Sécurité du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="font-medium mb-1">Authentification par email / mot de passe</div>
              <div className="text-sm text-muted-foreground">Votre compte est protégé par un mot de passe hashé en bcrypt.</div>
              <div className="flex items-center gap-2 mt-2 text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4" /> Compte sécurisé
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse email</label>
              <Input value={user?.email ?? ''} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">Contactez le support pour modifier votre email.</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Conseil :</strong> Ne partagez jamais vos tokens API ni vos credentials WhatsApp avec des tiers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
