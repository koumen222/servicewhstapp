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
      const { data } = await this.client.get(`/chat/findChats/${instanceName}`)
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
}

export const evolutionAPI = new EvolutionAPI()
