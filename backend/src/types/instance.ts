export interface WhatsAppInstance {
  _id?: string
  instanceId: string        // ID unique (nom choisi)
  instanceName: string       // Nom affiché
  apiKey: string            // Clé API Evolution
  hash: string              // Hash secret (même que apiKey)
  status: string           // Statut de connexion
  integration?: string      // "WHATSAPP-BAILEYS"
  qrcodeBase64?: string     // QR code en base64
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateInstanceResponse {
  success: boolean
  data: {
    instance: {
      instanceName: string
      instanceId: string
      status: string
    }
    hash: {
      apikey: string
    }
    qrcode?: {
      base64: string
      count: number
    }
  }
  dbId?: string
}

export interface RefreshQRResponse {
  success: boolean
  qrcode: {
    base64: string
  }
  pairingCode?: string
  count: number
}

export interface CheckConnectionResponse {
  success: boolean
  connected: boolean
  instanceId: string
  status: string
  fullData: {
    instance: {
      state: string
      connectionStatus: string
    }
  }
}

export interface SendMessageRequest {
  to: string
  message: string
}

export interface SendMessageResponse {
  success: boolean
  evolution: {
    key: {
      remoteJid: string
      id: string
    }
  }
  instanceId: string
  to: string
  message: string
}
