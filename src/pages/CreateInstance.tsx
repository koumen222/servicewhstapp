import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createInstance, connectInstance } from '@/lib/api'

export default function CreateInstance() {
  const navigate = useNavigate()
  const [instanceName, setInstanceName] = useState('')
  const [loading, setLoading] = useState(false)

  const slugify = (v: string) => v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = slugify(instanceName)
    if (!name) { toast.error('Nom invalide'); return }

    setLoading(true)
    try {
      await createInstance({ instanceName: name, integration: 'WHATSAPP-BAILEYS', qrcode: true })
      toast.success(`Instance "${name}" créée !`)
      // Connecter immédiatement pour obtenir le QR
      await connectInstance(name).catch(() => null)
      navigate(`/instance/${name}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Nouvelle instance</CardTitle>
              <CardDescription>Créez une connexion WhatsApp</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nom de l'instance
              </label>
              <Input
                placeholder="ex: mon-shop, support-client"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                required
                autoFocus
              />
              {instanceName && (
                <p className="text-xs text-muted-foreground">
                  Identifiant : <span className="font-mono text-emerald-600">{slugify(instanceName)}</span>
                </p>
              )}
            </div>

            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Ce qui va se passer :</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Création de l'instance sur Evolution API</li>
                <li>Génération d'un QR code à scanner</li>
                <li>Redirection vers la page de connexion</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !instanceName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Créer et générer le QR
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
