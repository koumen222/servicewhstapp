import axios, { AxiosInstance } from 'axios'
import { env } from '../config/env.js'

class EvolutionAPI {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: env.EVOLUTION_API_URL,
      headers: {
        'apikey': env.EVOLUTION_MASTER_API_KEY || env.EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  async createInstance(instanceName: string, integration = 'WHATSAPP-BAILEYS', qrcode = true) {
    try {
      const { data } = await this.client.post('/instance/create', { instanceName, integration, qrcode })
      return data
    } catch (error: any) {
      console.error('[Evolution] createInstance error:', error.response?.data || error.message)
      throw error
    }
  }

  async fetchInstances() {
    try {
      const { data } = await this.client.get('/instance/fetchInstances')
      return data
    } catch (error: any) {
      console.error('[Evolution] fetchInstances error:', error.response?.data || error.message)
      throw error
    }
  }

  async getConnectionState(instanceName: string) {
    try {
      const { data } = await this.client.get(`/instance/connectionState/${instanceName}`)
      return data
    } catch (error: any) {
      // If instance doesn't exist in Evolution API, treat as disconnected instead of throwing
      if (error.response?.status === 404) {
        console.warn(`[Evolution] getConnectionState: instance ${instanceName} not found in Evolution API, treating as disconnected`)
        return { instance: { state: 'close' } }
      }
      console.error('[Evolution] getConnectionState error:', error.response?.data || error.message)
      throw error
    }
  }

  async connectInstance(instanceName: string) {
    try {
      const { data } = await this.client.get(`/instance/connect/${instanceName}`)
      return data
    } catch (error: any) {
      console.error('[Evolution] connectInstance error:', error.response?.data || error.message)
      throw error
    }
  }

  async fetchQRCode(instanceName: string) {
    try {
      const { data } = await this.client.get(`/instance/connect/${instanceName}`)
      return data
    } catch (error: any) {
      // If instance is already connected, Evolution API returns 4xx — treat as "no QR needed"
      const status = error.response?.status
      const msg: string = error.response?.data?.message || error.response?.data?.error || ''
      if (
        status === 400 ||
        msg.toLowerCase().includes('connected') ||
        msg.toLowerCase().includes('open') ||
        msg.toLowerCase().includes('already')
      ) {
        console.log('[Evolution] fetchQRCode: instance already connected, returning null')
        return { qrcode: { base64: null }, pairingCode: null, count: 0, alreadyConnected: true }
      }
      console.error('[Evolution] fetchQRCode error:', error.response?.data || error.message)
      throw error
    }
  }

  async connectWithPhoneNumber(instanceName: string, phoneNumber: string) {
    try {
      const { data } = await this.client.post(`/instance/pairingCode/${instanceName}`, {
        phoneNumber,
      })
      return data
    } catch (error: any) {
      console.error('[Evolution] connectWithPhoneNumber error:', error.response?.data || error.message)
      throw error
    }
  }

  async sendTextMessage(instanceName: string, number: string, text: string) {
    try {
      const { data } = await this.client.post(`/message/sendText/${instanceName}`, { number, text })
      return data
    } catch (error: any) {
      console.error('[Evolution] sendTextMessage error:', error.response?.data || error.message)
      throw error
    }
  }

  async getChats(instanceName: string) {
    try {
      const { data } = await this.client.post(`/chat/findChats/${instanceName}`, {})
      return data
    } catch (error: any) {
      console.error('[Evolution] getChats error:', error.response?.data || error.message)
      throw error
    }
  }

  async getChatMessages(instanceName: string, remoteJid: string, limit = 50) {
    try {
      const { data } = await this.client.post(`/chat/findMessages/${instanceName}`, {
        where: { key: { remoteJid } },
        limit,
      })
      return data
    } catch (error: any) {
      console.error('[Evolution] getChatMessages error:', error.response?.data || error.message)
      throw error
    }
  }

  async logoutInstance(instanceName: string) {
    try {
      const { data } = await this.client.delete(`/instance/logout/${instanceName}`)
      return data
    } catch (error: any) {
      console.error('[Evolution] logoutInstance error:', error.response?.data || error.message)
      throw error
    }
  }

  async deleteInstance(instanceName: string) {
    try {
      const { data } = await this.client.delete(`/instance/delete/${instanceName}`)
      return data
    } catch (error: any) {
      console.error('[Evolution] deleteInstance error:', error.response?.data || error.message)
      throw error
    }
  }

  async setWebhook(instanceName: string, webhookUrl: string) {
    try {
      const { data } = await this.client.post(`/webhook/set/${instanceName}`, {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: true,
        webhookBase64: false,
        events: [
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE'
        ]
      })
      console.log(`[Evolution] Webhook configured for ${instanceName}: ${webhookUrl}`)
      return data
    } catch (error: any) {
      console.error('[Evolution] setWebhook error:', error.response?.data || error.message)
      throw error
    }
  }
}

export const evolutionAPI = new EvolutionAPI()
