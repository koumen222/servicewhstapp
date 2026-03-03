import { Link } from 'react-router-dom'
import { Wifi, WifiOff, Loader2, Trash2, LogOut, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { EvolutionInstance } from '@/lib/types'
import { useState } from 'react'
import { toast } from 'sonner'
import { useInstancesStore } from '@/stores/instancesStore'

interface Props {
  instance: EvolutionInstance
}

const statusConfig = {
  open:        { label: 'Connecté',      color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: Wifi },
  close:       { label: 'Déconnecté',    color: 'text-gray-400',    bg: 'bg-gray-100 dark:bg-gray-800',          icon: WifiOff },
  connecting:  { label: 'Connexion...',  color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-900/40',     icon: Loader2 },
  qrcode:      { label: 'QR en attente', color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/40',       icon: Loader2 },
  pairingCode: { label: 'Code appairage',color: 'text-purple-500',  bg: 'bg-purple-100 dark:bg-purple-900/40',  icon: Loader2 },
} as const

export function InstanceCard({ instance }: Props) {
  const { logout, remove } = useInstancesStore()
  const [loadingAction, setLoadingAction] = useState<'logout' | 'delete' | null>(null)
  const cfg = statusConfig[instance.status] ?? statusConfig.close
  const StatusIcon = cfg.icon

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoadingAction('logout')
    try {
      await logout(instance.instanceName)
      toast.success(`Instance "${instance.instanceName}" déconnectée`)
    } catch {
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm(`Supprimer définitivement "${instance.instanceName}" ?`)) return
    setLoadingAction('delete')
    try {
      await remove(instance.instanceName)
      toast.success(`Instance "${instance.instanceName}" supprimée`)
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Link to={`/instance/${instance.instanceName}`} className="block group">
      <Card className="hover:shadow-md transition-all duration-200 border-border hover:border-emerald-300 dark:hover:border-emerald-700">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Avatar + Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                {instance.profilePictureUrl ? (
                  <img src={instance.profilePictureUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold text-lg">
                      {instance.instanceName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${instance.status === 'open' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{instance.instanceName}</p>
                {instance.profileName && (
                  <p className="text-xs text-muted-foreground truncate">{instance.profileName}</p>
                )}
                <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  <StatusIcon className={`w-3 h-3 ${instance.status === 'connecting' || instance.status === 'qrcode' ? 'animate-spin' : ''}`} />
                  {cfg.label}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleLogout} disabled={!!loadingAction} title="Déconnecter">
                {loadingAction === 'logout' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={handleDelete} disabled={!!loadingAction} title="Supprimer">
                {loadingAction === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
