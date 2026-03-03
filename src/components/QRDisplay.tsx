import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  qrBase64?: string | null
  pairingCode?: string | null
  onRefresh?: () => void
  loading?: boolean
}

export function QRDisplay({ qrBase64, pairingCode, onRefresh, loading }: Props) {
  if (pairingCode) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">Code d'appairage</p>
        <div className="font-mono text-5xl font-bold tracking-[0.3em] text-foreground bg-muted px-8 py-6 rounded-2xl border-2 border-dashed border-border">
          {pairingCode}
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Ouvrez WhatsApp → Appareils liés → Lier avec un numéro de téléphone et entrez ce code
        </p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        )}
      </div>
    )
  }

  if (qrBase64) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">Scannez avec WhatsApp</p>
        <div className="p-3 bg-white rounded-2xl shadow-md border border-border">
          <img
            src={`data:image/png;base64,${qrBase64}`}
            alt="QR Code WhatsApp"
            className="w-64 h-64 object-contain"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Ouvrez WhatsApp → Menu → Appareils liés → Lier un appareil et scannez ce QR
        </p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Nouveau QR
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <RefreshCw className={`w-8 h-8 ${loading ? 'animate-spin' : ''}`} />
      </div>
      <p className="text-sm">{loading ? 'Génération du QR...' : 'Aucun QR disponible'}</p>
      {onRefresh && !loading && (
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Générer QR
        </Button>
      )}
    </div>
  )
}
