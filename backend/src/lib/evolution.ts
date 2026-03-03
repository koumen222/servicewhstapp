import axios, { AxiosInstance } from 'axios'
import { env } from '../config/env.js'

class EvolutionAPI {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: env.EVOLUTION_API_URL,
      headers: {
        'apikey': env.EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
    })
  }

  async createInstance(instanceName: string, integration = 'WHATSAPP-BAILEYS', qrcode = true) {
    const { data } = await this.client.post('/instance/create', {
      instanceName,
      integration,
      qrcode,
    })
    return data
  }

  async fetchInstances() {
    const { data } = await this.client.get('/instance/fetchInstances')
    return data
  }

  async getConnectionState(instanceName: string) {
    const { data } = await this.client.get(`/instance/connectionState/${instanceName}`)
    return data
  }

  async connectInstance(instanceName: string) {
    const { data } = await this.client.get(`/instance/connect/${instanceName}`)
    return data
  }

  async fetchQRCode(instanceName: string) {
    const { data } = await this.client.get(`/instance/connect/${instanceName}`)
    return data
  }

  async sendTextMessage(instanceName: string, number: string, text: string) {
    const { data } = await this.client.post(`/message/sendText/${instanceName}`, {
      number,
      text,
    })
    return data
  }

  async logoutInstance(instanceName: string) {
    const { data } = await this.client.delete(`/instance/logout/${instanceName}`)
    return data
  }

  async deleteInstance(instanceName: string) {
    const { data } = await this.client.delete(`/instance/delete/${instanceName}`)
    return data
  }
}

export const evolutionAPI = new EvolutionAPI()
