import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, RefreshCw, Loader2, LogOut, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QRDisplay } from '@/components/QRDisplay'
import { getConnectionState, fetchQRCode, sendTextMessage, logoutInstance } from '@/lib/api'

export default function InstanceDetail() {
  const { instanceName } = useParams<{ instanceName: string }>()
  const navigate = useNavigate()

  const [status, setStatus] = useState<string>('connecting')
  const [qrBase64, setQrBase64] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [msgForm, setMsgForm] = useState({ number: '', text: '' })
  const [sending, setSending] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const statusRef = useRef(status)

  const loadQR = useCallback(async () => {
    if (!instanceName) return
    console.log('🟡 [InstanceDetail] loadQR start:', instanceName)
    setQrLoading(true)
    try {
      const data = await fetchQRCode(instanceName)
      console.log('🟢 [InstanceDetail] QR raw response:', data)
      const qrValue = data.base64 ?? data.code ?? data.qrcode?.base64 ?? data.qrcode?.code ?? null
      const pairingValue = data.pairingCode ?? data.qrcode?.pairingCode ?? null
      console.log('🟢 [InstanceDetail] qrValue length:', qrValue?.length ?? 0, '| pairingCode:', pairingValue)
      setQrBase64(qrValue)
      setPairingCode(pairingValue)
    } catch (err) {
      console.error('🔴 [InstanceDetail] loadQR error:', err)
      toast.error('Impossible de charger le QR code')
    } finally {
      setQrLoading(false)
    }
  }, [instanceName])

  const checkStatus = useCallback(async () => {
    if (!instanceName) return
    console.log('🟡 [InstanceDetail] checkStatus:', instanceName)
    try {
      const data = await getConnectionState(instanceName)
      const state = data.instance?.state ?? 'close'
      console.log('🟢 [InstanceDetail] state:', state, '| previous:', statusRef.current)
      setStatus(state)
      if (state === 'open') {
        console.log('🟢 [InstanceDetail] ✅ Connected! Clearing QR.')
        setQrBase64(null)
        setPairingCode(null)
      }
    } catch (err) {
      console.warn('🔴 [InstanceDetail] checkStatus error (silent):', err)
    }
  }, [instanceName])

  // Chargement initial
  useEffect(() => {
    console.log('📦 [InstanceDetail] mount, instance:', instanceName)
    checkStatus()
    loadQR()
  }, [checkStatus, loadQR])

  // Sync ref with current status
  useEffect(() => { statusRef.current = status }, [status])

  // Polling toutes les 5s — intervalle stable, pas réinitialisé à chaque changement de statut
  useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current !== 'open') {
        console.log('🔄 [InstanceDetail] polling checkStatus, current state:', statusRef.current)
        checkStatus()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [checkStatus])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instanceName || !msgForm.number || !msgForm.text) return
    console.log('🟡 [InstanceDetail] handleSend', { instanceName, number: msgForm.number })
    setSending(true)
    try {
      const result = await sendTextMessage(instanceName, { number: msgForm.number, text: msgForm.text })
      console.log('🟢 [InstanceDetail] message sent:', result)
      toast.success('Message envoyé !')
      setMsgForm({ ...msgForm, text: '' })
    } catch (err) {
      console.error('🔴 [InstanceDetail] handleSend error:', err)
      toast.error("Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  const handleLogout = async () => {
    if (!instanceName) return
    console.log('🟡 [InstanceDetail] handleLogout:', instanceName)
    setDisconnecting(true)
    try {
      const result = await logoutInstance(instanceName)
      console.log('🟢 [InstanceDetail] logout result:', result)
      toast.success('Instance déconnectée')
      setStatus('close')
      loadQR()
    } catch (err) {
      console.error('🔴 [InstanceDetail] logout error:', err)
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setDisconnecting(false)
    }
  }

  const isConnected = status === 'open'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">{instanceName}</h1>
            <div className={`flex items-center gap-1.5 mt-0.5 text-sm ${isConnected ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isConnected ? 'Connecté' : status === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={checkStatus}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          {isConnected && (
            <Button variant="destructive" size="sm" onClick={handleLogout} disabled={disconnecting}>
              {disconnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
              Déconnecter
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR / Statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isConnected ? '✅ Instance connectée' : '📱 Scanner le QR Code'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Wifi className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  WhatsApp est connecté et prêt à envoyer des messages
                </p>
              </div>
            ) : (
              <QRDisplay
                qrBase64={qrBase64}
                pairingCode={pairingCode}
                onRefresh={loadQR}
                loading={qrLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* Envoi de message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📤 Envoyer un message test</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground text-sm text-center">
                <WifiOff className="w-8 h-8" />
                <p>Connectez l'instance pour envoyer des messages</p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Numéro WhatsApp</label>
                  <Input
                    placeholder="ex: 33612345678 (sans +)"
                    value={msgForm.number}
                    onChange={(e) => setMsgForm({ ...msgForm, number: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Format : indicatif + numéro (ex: 33612345678)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    placeholder="Votre message..."
                    value={msgForm.text}
                    onChange={(e) => setMsgForm({ ...msgForm, text: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Envoyer
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
