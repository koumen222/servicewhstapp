import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Loader2, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InstanceCard } from '@/components/InstanceCard'
import { useInstancesStore } from '@/stores/instancesStore'
import { useAuthStore } from '@/stores/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { instances, loading, fetchAll } = useInstancesStore()

  useEffect(() => { fetchAll() }, [fetchAll])

  const connected = instances.filter((i) => i.status === 'open').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bonjour, {user?.name} 👋</h2>
          <p className="text-muted-foreground mt-1">
            {instances.length === 0
              ? 'Aucune instance — créez-en une pour commencer'
              : `${instances.length} instance${instances.length > 1 ? 's' : ''} · ${connected} connectée${connected > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchAll()} disabled={loading} title="Actualiser">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/instances/create">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle instance
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {instances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: instances.length,                                    color: 'text-foreground' },
            { label: 'Connectées',  value: connected,                                           color: 'text-emerald-600' },
            { label: 'En attente',  value: instances.filter((i) => i.status === 'qrcode').length, color: 'text-blue-500' },
            { label: 'Déconnectées',value: instances.filter((i) => i.status === 'close').length,  color: 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Instance list */}
      {loading && instances.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
            <Wifi className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Aucune instance WhatsApp</p>
            <p className="text-sm text-muted-foreground mt-1">Créez votre première instance pour commencer à envoyer des messages</p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/instances/create">
              <Plus className="w-4 h-4 mr-2" />
              Créer une instance
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <InstanceCard key={instance.instanceName} instance={instance} />
          ))}
        </div>
      )}
    </div>
  )
}
