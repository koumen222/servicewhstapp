import axios, { AxiosInstance, AxiosError } from 'axios'
import { toast } from 'sonner'
import type {
  CreateInstancePayload,
  CreateInstanceResponse,
  FetchInstancesResponse,
  QRCodeResponse,
  SendTextPayload,
  SendTextResponse,
  InstanceCredentials,
} from './types'

// ── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

// ── Client Axios ─────────────────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

console.log('🔧 [API] Backend URL:', BACKEND_URL)

// Intercepteur : ajoute le token JWT automatiquement + logs requêtes
apiClient.interceptors.request.use((config) => {
  let token: string | null = null

  // Format Zustand persist
  const authData = localStorage.getItem('wasa_auth')
  if (authData) {
    try {
      const { state } = JSON.parse(authData)
      token = typeof state?.token === 'string' ? state.token : null
    } catch {}
  }

  // Fallback legacy
  if (!token) {
    token = localStorage.getItem('token')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  console.log(`🟡 [API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data ?? '')
  return config
})

// Intercepteur : gestion globale des erreurs + logs réponses
apiClient.interceptors.response.use(
  (res) => {
    console.log(`🟢 [API] ${res.status} ${res.config.url}`, res.data)
    return res
  },
  (error: AxiosError<{ message?: string; error?: string }>) => {
    console.error(`🔴 [API] ${error.response?.status ?? 'ERR'} ${error.config?.url}`, error.response?.data ?? error.message)
    const status = error.response?.status
    const msg =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Erreur inconnue'

    if (status === 401) {
      toast.error('Session expirée — reconnectez-vous')
      localStorage.removeItem('wasa_auth')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    } else if (status === 403) {
      toast.error(msg)
    } else if (status === 404) {
      toast.error(`Ressource introuvable: ${msg}`)
    } else if (status === 422 || status === 400) {
      toast.error(`Données invalides: ${msg}`)
    } else if (status === 429) {
      toast.error('Limite de requêtes atteinte — réessayez dans quelques secondes')
    } else if (status && status >= 500) {
      toast.error(`Erreur serveur (${status}): ${msg}`)
    }

    return Promise.reject(error)
  }
)

// ── Endpoints Auth ────────────────────────────────────────────────────────────

export const login = (email: string, password: string) =>
  apiClient.post<{ token: string; user: any }>('/api/auth/login', { email, password }).then((r) => r.data)

export const register = (name: string, email: string, password: string) =>
  apiClient.post<{ token: string; user: any }>('/api/auth/register', { name, email, password }).then((r) => r.data)

// ── Endpoints Instances (via proxy backend) ──────────────────────────────────

/** Crée une nouvelle instance WhatsApp */
export const createInstance = (payload: CreateInstancePayload) => {
  console.log('🟡 [createInstance]', payload)
  return apiClient.post<CreateInstanceResponse>('/api/instance/create', payload).then((r) => {
    console.log('🟢 [createInstance] success', r.data)
    return r.data
  }).catch((err) => { console.error('🔴 [createInstance] error', err.response?.data ?? err.message); throw err })
}

/** Récupère toutes les instances de l'utilisateur connecté */
export const fetchInstances = () => {
  console.log('🟡 [fetchInstances]')
  return apiClient.get<FetchInstancesResponse[]>('/api/instance/fetchInstances').then((r) => {
    console.log('🟢 [fetchInstances]', r.data.length, 'instances', r.data)
    return r.data
  }).catch((err) => { console.error('🔴 [fetchInstances] error', err.response?.data ?? err.message); throw err })
}

/** Connecte une instance et retourne QR ou pairingCode */
export const connectInstance = (instanceName: string) => {
  console.log('🟡 [connectInstance]', instanceName)
  return apiClient.get<QRCodeResponse>(`/api/instance/connect/${instanceName}`).then((r) => {
    console.log('🟢 [connectInstance] response keys:', Object.keys(r.data), r.data)
    return r.data
  }).catch((err) => { console.error('🔴 [connectInstance] error', err.response?.data ?? err.message); throw err })
}

/** Recharge le QR code d'une instance */
export const fetchQRCode = (instanceName: string) => {
  console.log('🟡 [fetchQRCode]', instanceName)
  return apiClient.get<QRCodeResponse>(`/api/instance/qrcode/${instanceName}`).then((r) => {
    console.log('🟢 [fetchQRCode] keys:', Object.keys(r.data), '| base64 length:', (r.data.base64 ?? r.data.code ?? '').length, r.data)
    return r.data
  }).catch((err) => { console.error('🔴 [fetchQRCode] error', err.response?.data ?? err.message); throw err })
}

/** Statut de connexion d'une instance */
export const getConnectionState = (instanceName: string) => {
  console.log('🟡 [getConnectionState]', instanceName)
  return apiClient
    .get<{ instance: { instanceName: string; state: string } }>(`/api/instance/connectionState/${instanceName}`)
    .then((r) => {
      console.log('🟢 [getConnectionState]', instanceName, '→', r.data?.instance?.state, r.data)
      return r.data
    }).catch((err) => { console.error('🔴 [getConnectionState] error', err.response?.data ?? err.message); throw err })
}

/** Envoie un message texte */
export const sendTextMessage = (instanceName: string, payload: SendTextPayload) => {
  console.log('🟡 [sendTextMessage]', instanceName, payload)
  return apiClient.post<SendTextResponse>(`/api/message/sendText/${instanceName}`, payload).then((r) => {
    console.log('🟢 [sendTextMessage] sent', r.data)
    return r.data
  }).catch((err) => { console.error('🔴 [sendTextMessage] error', err.response?.data ?? err.message); throw err })
}

/** Déconnecte une instance */
export const logoutInstance = (instanceName: string) => {
  console.log('🟡 [logoutInstance]', instanceName)
  return apiClient.delete(`/api/instance/logout/${instanceName}`).then((r) => {
    console.log('🟢 [logoutInstance] done', r.data)
    return r.data
  }).catch((err) => { console.error('🔴 [logoutInstance] error', err.response?.data ?? err.message); throw err })
}

/** Supprime définitivement une instance */
export const deleteInstance = (instanceName: string) => {
  console.log('🟡 [deleteInstance]', instanceName)
  return apiClient.delete(`/api/instance/delete/${instanceName}`).then((r) => {
    console.log('🟢 [deleteInstance] done', r.data)
    return r.data
  }).catch((err) => { console.error('🔴 [deleteInstance] error', err.response?.data ?? err.message); throw err })
}

/** Récupère les informations d'accès API d'une instance */
export const getInstanceCredentials = (instanceName: string) => {
  console.log('🟡 [getInstanceCredentials]', instanceName)
  return apiClient.get<InstanceCredentials>(`/api/instance/credentials/${instanceName}`).then((r) => {
    console.log('🟢 [getInstanceCredentials] got credentials:', { url: r.data.evolutionApiUrl, hasApiKey: !!r.data.apiKey })
    return r.data
  }).catch((err) => { console.error('🔴 [getInstanceCredentials] error', err.response?.data ?? err.message); throw err })
}
