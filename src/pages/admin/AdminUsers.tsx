import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw, Shield, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminGetUsers, adminUpdateUser, adminDeleteUser } from '@/lib/api'
import { toast } from 'sonner'
import type { AdminUser } from '@/lib/types'

const PLANS = ['free', 'starter', 'pro', 'enterprise']
const PLAN_MAX: Record<string, number> = { free: 1, starter: 3, pro: 10, enterprise: 100 }

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async (p = page, s = search) => {
    setLoading(true)
    try {
      const data = await adminGetUsers(p, s)
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error('Impossible de charger les utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  const handlePlanChange = async (userId: string, plan: string) => {
    setActionId(userId)
    try {
      await adminUpdateUser(userId, { plan, maxInstances: PLAN_MAX[plan] })
      toast.success('Plan mis à jour')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan, maxInstances: PLAN_MAX[plan] } : u))
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setActionId(null)
    }
  }

  const handleToggleActive = async (userId: string, current: boolean) => {
    setActionId(userId)
    try {
      await adminUpdateUser(userId, { isActive: !current })
      toast.success(current ? 'Compte suspendu' : 'Compte réactivé')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !current } : u))
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Supprimer définitivement "${name}" ? Cette action est irréversible.`)) return
    setActionId(userId)
    try {
      await adminDeleteUser(userId)
      toast.success('Utilisateur supprimé')
      setUsers(prev => prev.filter(u => u.id !== userId))
      setTotal(prev => prev - 1)
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" /> Gestion des utilisateurs
            </h1>
            <p className="text-sm text-muted-foreground">{total} utilisateur{total > 1 ? 's' : ''} au total</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(page, search)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">Rechercher</Button>
      </form>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-3 pr-4 font-medium">Utilisateur</th>
                    <th className="pb-3 pr-4 font-medium">Plan</th>
                    <th className="pb-3 pr-4 font-medium">Instances</th>
                    <th className="pb-3 pr-4 font-medium">Statut</th>
                    <th className="pb-3 pr-4 font-medium">Inscrit le</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-600 flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={u.plan}
                          onChange={e => handlePlanChange(u.id, e.target.value)}
                          disabled={actionId === u.id}
                          className="text-xs border rounded px-2 py-1 bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {PLANS.map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm">
                          <span className="font-medium">{(u as any)._count?.instances ?? 0}</span>
                          <span className="text-muted-foreground"> / {u.maxInstances}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {u.isActive ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Suspendu
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={actionId === u.id}
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                            className={`text-xs h-7 px-2 ${u.isActive ? 'text-orange-500 hover:text-orange-600' : 'text-emerald-600 hover:text-emerald-700'}`}
                          >
                            {actionId === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : u.isActive ? 'Suspendre' : 'Réactiver'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={actionId === u.id}
                            onClick={() => handleDelete(u.id, u.name)}
                            className="text-xs h-7 px-2 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1, search) }}>
                  Précédent
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); load(page + 1, search) }}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
