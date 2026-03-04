import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { verifyPayment } from '@/lib/api'

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const ref = params.get('ref')
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const [plan, setPlan] = useState<string>('')

  useEffect(() => {
    if (!ref) { setStatus('failed'); return }
    const check = async () => {
      try {
        const data = await verifyPayment(ref)
        setPlan(data.plan ?? '')
        setStatus(data.status === 'success' ? 'success' : data.status === 'failed' ? 'failed' : 'pending')
      } catch {
        setStatus('failed')
      }
    }
    check()
  }, [ref])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center p-8 rounded-2xl border bg-card shadow-lg space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-emerald-500 mx-auto" />
            <h1 className="text-xl font-bold">Vérification du paiement...</h1>
            <p className="text-muted-foreground text-sm">Veuillez patienter quelques secondes.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h1 className="text-2xl font-bold">Paiement réussi !</h1>
            <p className="text-muted-foreground">
              Votre abonnement <strong className="capitalize text-foreground">{plan}</strong> est maintenant actif.
              Profitez de toutes les fonctionnalités de votre nouveau plan.
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link to="/dashboard" className="flex items-center justify-center gap-2">
                Aller au Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Paiement échoué</h1>
            <p className="text-muted-foreground">
              Votre paiement n'a pas pu être traité. Aucun montant n'a été débité.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/pricing">Réessayer</Link>
              </Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </>
        )}
        {status === 'pending' && (
          <>
            <Loader2 className="w-16 h-16 text-yellow-500 mx-auto" />
            <h1 className="text-2xl font-bold">Paiement en cours</h1>
            <p className="text-muted-foreground">
              Votre paiement est en cours de traitement. Votre compte sera mis à jour automatiquement une fois confirmé.
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link to="/dashboard">Aller au Dashboard</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
