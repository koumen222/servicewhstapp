// ── Types basés sur la doc Evolution API v2.x ──────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  token: string
}

export interface EvolutionInstance {
  instanceName: string
  instanceId?: string
  status: 'open' | 'close' | 'connecting' | 'qrcode' | 'pairingCode'
  serverUrl?: string
  apikey?: string
  integration?: string
  profilePictureUrl?: string
  profileName?: string
  profileStatus?: string
  ownerJid?: string
  lastActivity?: string
}

export interface InstanceConnectionState {
  instance: {
    instanceName: string
    state: 'open' | 'close' | 'connecting'
  }
}

export interface QRCodeResponse {
  pairingCode?: string | null
  code?: string | null
  base64?: string | null
  count?: number
  qrcode?: {
    pairingCode?: string | null
    code?: string | null
    base64?: string | null
    count?: number
  }
}

export interface CreateInstancePayload {
  instanceName: string
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'
  qrcode?: boolean
  number?: string
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string
    instanceId: string
    status: string
    integration: string
  }
  hash: {
    apikey: string
  }
  settings: Record<string, unknown>
  qrcode?: {
    pairingCode: string | null
    code: string
    count: number
  }
}

export interface SendTextPayload {
  number: string
  text: string
}

export interface SendTextResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: {
    conversation?: string
  }
  messageType: string
  status: string
}

export interface FetchInstancesResponse {
  instance: EvolutionInstance
  owner?: string
  profileName?: string
  profilePictureUrl?: string
  connectionStatus?: string
}

export interface ApiError {
  status: number
  message: string
  error?: string
}

export interface InstanceCredentials {
  instanceName: string
  fullInstanceName: string
  evolutionApiUrl: string
  apiKey: string
  status: string
  createdAt: string
}
