'use client'

import { useState } from 'react'
import { integrationsApi } from '@/lib/api'

interface WhatsAppConfig {
  instanceName: string
  instanceId: string
  apiKey: string
  connected: boolean
  verifiedAt?: string
}

export default function WhatsAppIntegration() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    instanceName: '',
    instanceId: '',
    apiKey: '',
    connected: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testNumber, setTestNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testLoading, setTestLoading] = useState(false)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    console.log("\n🔌 Connecting WhatsApp instance...")
    console.log("Instance Name:", config.instanceName)
    console.log("Instance ID:", config.instanceId)

    try {
      const response = await integrationsApi.connectWhatsApp(
        config.instanceName,
        config.instanceId,
        config.apiKey
      )

      console.log("✅ Connection successful:", response.data)

      setConfig({
        ...config,
        connected: true,
        verifiedAt: response.data.data?.verifiedAt
      })
      setSuccess('Instance WhatsApp connectée avec succès !')
    } catch (err: any) {
      console.error("❌ Échec de la connexion :", err)
      const errorMessage = err.response?.data?.message || err.message || 'La connexion a échoué'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleTestMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestLoading(true)
    setError(null)
    setSuccess(null)

    console.log("\n📤 Envoi du message de test...")
    console.log("Numéro :", testNumber)
    console.log("Message :", testMessage)

    try {
      const response = await integrationsApi.testWhatsAppMessage(
        config.instanceId,
        config.apiKey,
        testNumber,
        testMessage
      )

      console.log("✅ Message de test envoyé :", response.data)
      setSuccess('Message de test envoyé avec succès !')
      setTestNumber('')
      setTestMessage('')
    } catch (err: any) {
      console.error("❌ Échec du message de test :", err)
      const errorMessage = err.response?.data?.message || err.message || 'Échec de l\'envoi du message de test'
      setError(errorMessage)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Intégration WhatsApp</h3>
        <p className="text-[12px] text-[#5a7a5a] mb-6">
          Connectez votre instance WhatsApp existante pour activer les fonctionnalités de messagerie.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
            <p className="text-red-400 text-[12px]">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-800/30 rounded-lg">
            <p className="text-green-400 text-[12px]">{success}</p>
          </div>
        )}

        {!config.connected ? (
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Nom de l'instance
              </label>
              <input
                type="text"
                value={config.instanceName}
                onChange={(e) => setConfig({ ...config, instanceName: e.target.value })}
                placeholder="Support Client"
                className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                ID de l'instance
              </label>
              <input
                type="text"
                value={config.instanceId}
                onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                placeholder="ID de votre instance"
                className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Clé API
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="votre_cle_api"
                className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                required
              />
              <p className="mt-1.5 text-[11px] text-[#5a7a5a]">
                Votre clé API d'instance provenant du service WhatsApp SaaS
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#25D366] text-white py-2.5 px-4 rounded-lg text-[12px] font-medium hover:bg-[#20bd5a] disabled:bg-[#2a2a2a] disabled:text-[#5a5a5a] disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Connexion...' : 'Connecter l\'instance WhatsApp'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2 text-[13px]">✅ Connecté</h3>
              <div className="text-[12px] text-green-300/80 space-y-1">
                <p><strong>Instance :</strong> {config.instanceName}</p>
                <p><strong>ID :</strong> {config.instanceId}</p>
                {config.verifiedAt && (
                  <p><strong>Vérifié le :</strong> {new Date(config.verifiedAt).toLocaleString('fr-FR')}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setConfig({ instanceName: '', instanceId: '', apiKey: '', connected: false })}
              className="w-full bg-[#2a2a2a] text-white py-2.5 px-4 rounded-lg text-[12px] font-medium hover:bg-[#3a3a3a] transition-colors"
            >
              Déconnecter
            </button>
          </div>
        )}
      </div>

      {config.connected && (
        <div className="rounded-lg p-6" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
          <h3 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Message de test</h3>
          <p className="text-[12px] text-[#5a7a5a] mb-6">
            Envoyez un message de test pour vérifier que l'intégration fonctionne correctement.
          </p>

          <form onSubmit={handleTestMessage} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Numéro de téléphone
              </label>
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+2250701020304"
                className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                required
              />
              <p className="mt-1.5 text-[11px] text-[#5a7a5a]">
                Inclure l'indicatif pays (ex: +225 pour la Côte d'Ivoire)
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Bonjour, ceci est un message de test !"
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="w-full bg-[#25D366] text-white py-2.5 px-4 rounded-lg text-[12px] font-medium hover:bg-[#20bd5a] disabled:bg-[#2a2a2a] disabled:text-[#5a5a5a] disabled:cursor-not-allowed transition-colors"
            >
              {testLoading ? 'Envoi...' : 'Envoyer le message de test'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-2 text-[12px]">📋 Comment ça marche</h3>
        <ul className="text-[11px] text-blue-300/70 space-y-1 list-disc list-inside">
          <li>Votre instance doit déjà exister dans le service WhatsApp SaaS</li>
          <li>La clé API identifie et authentifie votre instance spécifique</li>
          <li>Les messages sont envoyés via le service SaaS vers l'API Evolution</li>
          <li>Tous les journaux sont disponibles dans le tableau de bord du service SaaS</li>
        </ul>
      </div>
    </div>
  )
}
