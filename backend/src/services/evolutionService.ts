import axios, { AxiosInstance } from 'axios'

export class EvolutionService {
  private client: AxiosInstance

  constructor() {
    const baseURL = process.env.EVOLUTION_API_URL
    const apikey = process.env.EVOLUTION_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

    if (!baseURL || !apikey) {
      throw new Error('Evolution API credentials not configured')
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'apikey': apikey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
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

  async connectInstance(instanceId: string) {
    try {
      const { data } = await this.client.get(`/instance/connect/${instanceId}`)
      return data
    } catch (error: any) {
      console.error('[Evolution] connectInstance error:', error.response?.data || error.message)
      throw error
    }
  }

  async checkConnection(instanceId: string) {
    try {
      const { data } = await this.client.get(`/instance/connection/${instanceId}`)
      return data
    } catch (error: any) {
      console.error('[Evolution] checkConnection error:', error.response?.data || error.message)
      throw error
    }
  }

  async sendTextMessage(instanceId: string, to: string, message: string) {
    try {
      const { data } = await this.client.post(`/message/sendText/${instanceId}`, { number: to, textMessage: message })
      return data
    } catch (error: any) {
      console.error('[Evolution] sendTextMessage error:', error.response?.data || error.message)
      throw error
    }
  }

  async deleteInstance(instanceId: string) {
    try {
      const { data } = await this.client.delete(`/instance/delete/${instanceId}`)
      return data
    } catch (error: any) {
      console.error('[Evolution] deleteInstance error:', error.response?.data || error.message)
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
}
