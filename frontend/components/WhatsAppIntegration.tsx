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
      setSuccess('WhatsApp instance connected successfully!')
    } catch (err: any) {
      console.error("❌ Connection failed:", err)
      const errorMessage = err.response?.data?.message || err.message || 'Connection failed'
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

    console.log("\n📤 Sending test message...")
    console.log("Number:", testNumber)
    console.log("Message:", testMessage)

    try {
      const response = await integrationsApi.testWhatsAppMessage(
        config.instanceId,
        config.apiKey,
        testNumber,
        testMessage
      )

      console.log("✅ Test message sent:", response.data)
      setSuccess('Test message sent successfully!')
      setTestNumber('')
      setTestMessage('')
    } catch (err: any) {
      console.error("❌ Test message failed:", err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send test message'
      setError(errorMessage)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[14px] font-semibold text-white mb-2">WhatsApp Integration</h3>
        <p className="text-[12px] text-[#5a7a5a] mb-6">
          Connect your existing WhatsApp instance to enable messaging capabilities.
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
              <label className="block text-[12px] font-medium text-white mb-1.5">
                Instance Name
              </label>
              <input
                type="text"
                value={config.instanceName}
                onChange={(e) => setConfig({ ...config, instanceName: e.target.value })}
                placeholder="Support Client"
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg text-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder:text-[#3a3a3a]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white mb-1.5">
                Instance ID
              </label>
              <input
                type="text"
                value={config.instanceId}
                onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                placeholder="sssss"
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg text-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder:text-[#3a3a3a]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white mb-1.5">
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="ak_live_xxxxxxxxx"
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg text-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder:text-[#3a3a3a]"
                required
              />
              <p className="mt-1.5 text-[11px] text-[#5a7a5a]">
                Your instance API key from the WhatsApp SaaS service
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#25D366] text-white py-2.5 px-4 rounded-lg text-[12px] font-medium hover:bg-[#20bd5a] disabled:bg-[#2a2a2a] disabled:text-[#5a5a5a] disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Connecting...' : 'Connect WhatsApp Instance'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2 text-[13px]">✅ Connected</h3>
              <div className="text-[12px] text-green-300/80 space-y-1">
                <p><strong>Instance:</strong> {config.instanceName}</p>
                <p><strong>Instance ID:</strong> {config.instanceId}</p>
                {config.verifiedAt && (
                  <p><strong>Verified:</strong> {new Date(config.verifiedAt).toLocaleString()}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setConfig({ instanceName: '', instanceId: '', apiKey: '', connected: false })}
              className="w-full bg-[#2a2a2a] text-white py-2.5 px-4 rounded-lg text-[12px] font-medium hover:bg-[#3a3a3a] transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {config.connected && (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
          <h3 className="text-[14px] font-semibold text-white mb-2">Test Message</h3>
          <p className="text-[12px] text-[#5a7a5a] mb-6">
            Send a test message to verify the integration is working correctly.
          </p>

          <form onSubmit={handleTestMessage} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-white mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 bg-[#111] border border-[#1e1e1e] rounded-lg text-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder:text-[#3a3a3a]"
                required
              />
              <p className="mt-1.5 text-[11px] text-[#5a7a5a]">
                Include country code (e.g., +1 for US, +33 for France)
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white mb-1.5">
                Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Hello, this is a test message!"
                rows={4}
                className="w-full px-3 py-2 bg-[#111] border border-[#1e1e1e] rounded-lg text-white text-[12px] focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder:text-[#3a3a3a]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="w-full bg-[#25D366] text-white py-2.5 px-4 rounded-lg text-[12px] font-medium hover:bg-[#20bd5a] disabled:bg-[#2a2a2a] disabled:text-[#5a5a5a] disabled:cursor-not-allowed transition-colors"
            >
              {testLoading ? 'Sending...' : 'Send Test Message'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-2 text-[12px]">📋 How it works</h3>
        <ul className="text-[11px] text-blue-300/70 space-y-1 list-disc list-inside">
          <li>Your instance must already exist in the WhatsApp SaaS service</li>
          <li>The API key identifies and authenticates your specific instance</li>
          <li>Messages are sent through the SaaS service to Evolution API</li>
          <li>All logs are available in the SaaS service dashboard</li>
        </ul>
      </div>
    </div>
  )
}
