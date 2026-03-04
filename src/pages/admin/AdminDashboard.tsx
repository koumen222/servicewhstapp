import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Activity, CreditCard, TrendingUp, BarChart3, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminGetStats, adminGetPayments } from '@/lib/api'
import { toast } from 'sonner'
import type { AdminStats, AdminUser, Payment } from '@/lib/types'

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-200 dark:bg-gray-700',
  starter: 'bg-emerald-400',
  pro: 'bg-blue-400',
  enterprise: 'bg-purple-400',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [planStats, setPlanStats] = useState<{ plan: string; count: number }[]>([])
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<(Payment & { user?: { name: string; email: string } })[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [statsData, paymentsData] = await Promise.all([
        adminGetStats(),
        adminGetPayments().catch(() => ({ payments: [] })),
      ])
      setStats(statsData.stats)
      setPlanStats(statsData.planStats ?? [])
      setRecentUsers(statsData.recentUsers ?? [])
      setPayments(paymentsData.payments ?? [])
    } catch {
      toast.error('Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statCards = [
    { label: 'Utilisateurs',  value: stats?.totalUsers ?? 0,    icon: Users,     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Instances',     value: stats?.totalInstances ?? 0, icon: Activity,  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Paiements',     value: stats?.totalPayments ?? 0,  icon: CreditCard,color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-950/20' },
    { label: 'Revenus (FCFA)',value: (stats?.revenue ?? 0).toLocaleString(), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Panel Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
            <Link to="/admin/users">Gérer les utilisateurs</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{s.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition par plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {planStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune donnée</p>
                ) : (
                  planStats.map(p => {
                    const total = planStats.reduce((a, b) => a + b.count, 0)
                    const pct = total > 0 ? Math.round((p.count / total) * 100) : 0
                    return (
                      <div key={p.plan} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{p.plan}</span>
                          <span className="text-muted-foreground">{p.count} utilisateurs ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${PLAN_COLORS[p.plan] ?? 'bg-gray-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Derniers inscrits
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/users" className="text-xs text-emerald-600">Voir tous →</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun utilisateur</p>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-600">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                            u.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                            u.plan === 'starter' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.plan}
                          </span>
                          <div className={`text-xs mt-0.5 ${u.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {u.isActive ? 'Actif' : 'Suspendu'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Derniers paiements</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement enregistré</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 pr-4 font-medium">Utilisateur</th>
                        <th className="pb-2 pr-4 font-medium">Plan</th>
                        <th className="pb-2 pr-4 font-medium">Montant</th>
                        <th className="pb-2 pr-4 font-medium">Statut</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0, 10).map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4">
                            <div className="font-medium">{p.user?.name ?? '-'}</div>
                            <div className="text-xs text-muted-foreground">{p.user?.email ?? '-'}</div>
                          </td>
                          <td className="py-2 pr-4 capitalize font-medium">{p.plan}</td>
                          <td className="py-2 pr-4 font-semibold">{p.amount?.toLocaleString()} {p.currency}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                              p.status === 'failed' ? 'bg-red-100 text-red-700' :
                              p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {p.status === 'success' ? 'Réussi' : p.status === 'failed' ? 'Échoué' : p.status === 'pending' ? 'En attente' : p.status}
                            </span>
                          </td>
                          <td className="py-2 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
