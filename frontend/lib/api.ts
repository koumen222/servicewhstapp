import axios from "axios";

// Détection automatique de l'URL backend
const getBaseURL = () => {
  // 1. Priorité à la variable d'environnement
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Détection automatique basée sur l'environnement
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // En production (domaine personnalisé)
    if (hostname === 'zechat.site' || hostname === 'www.zechat.site' || hostname === 'ecomcookpit.site' || hostname === 'www.ecomcookpit.site') {
      return 'https://api.ecomcookpit.site';
    }
    
    // En développement local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  
  // 3. Fallback par défaut
  return 'http://localhost:3001';
};

const BASE_URL = getBaseURL();

// Log de l'URL API utilisée pour debug
console.log(`🚀 API Base URL initialized to: ${BASE_URL}`);

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { 
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  timeout: 30000,
});

// Fusionner les intercepteurs request (debug + auth)
api.interceptors.request.use(
  (config) => {
    // Log de la requête
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Ajouter le token d'authentification
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Auth error codes that require logout
const AUTH_ERROR_CODES = ['MISSING_AUTH_TOKEN', 'EMPTY_TOKEN', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'AUTH_ERROR'];

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    console.error(`❌ API Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'NETWORK'}`);
    if (error.code === 'ERR_CONNECTION_REFUSED') {
      console.error('💀 Connection refused - Backend is not running!');
    }
    
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      // Only logout if it's a genuine auth token error (not a business-logic 401)
      if (!errorCode || AUTH_ERROR_CODES.includes(errorCode)) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          // Also clear the auth cookie to prevent redirect loops
          document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Removed cache to prevent infinite loops

// ─── Auth  POST /api/auth/* ──────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; plan: string; maxInstances: number } }>(
      "/api/auth/login", { email, password }
    ),
  register: (email: string, name: string, password: string) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; plan: string; maxInstances: number } }>(
      "/api/auth/register", { email, name, password }
    ),
};

// ─── Instance Management  /api/instances/* ──────────────────────────────────
//  Uses MongoDB WhatsApp instance routes
export const instancesApi = {
  /** GET /api/instances — list all WhatsApp instances (MongoDB) */
  getAll: async () => {
    const res = await api.get("/api/instances");

    // Si backend renvoie déjà le format attendu, on le garde tel quel
    if (Array.isArray(res.data?.data?.instances)) {
      return res;
    }

    // Fallback legacy minimal
    const rawInstances = Array.isArray(res.data?.instances) ? res.data.instances : [];
    const instances = rawInstances.map((item: any) => ({
      id: item.id || item._id || item.instanceId,
      name: item.name || item.customName || item.instanceName,
      instanceName: item.instanceName,
      instanceToken: item.instanceToken || item.apiKey || null,
      status: item.status,
      connectionStatus: item.connectionStatus || item.status,
      profileName: item.profileName ?? null,
      profilePictureUrl: item.profilePictureUrl ?? null,
      createdAt: item.createdAt,
      lastUsed: item.lastUsed ?? item.updatedAt ?? null,
      apiKeys: item.apiKeys ?? [],
      quotas: item.quotas ?? [],
      stats: item.stats ?? { messagesLast30Days: 0, totalApiKeys: 0 },
    }));

    return {
      ...res,
      data: {
        success: true,
        data: {
          instances,
          summary: {
            totalInstances: instances.length,
            activeInstances: instances.filter((i: any) => i.connectionStatus === "connected" || i.status === "open").length,
            maxAllowed: res.data?.data?.summary?.maxAllowed ?? 0,
          },
        },
      },
    };
  },

  /** POST /api/create-instance — create WhatsApp instance via MongoDB */
  create: async (instanceName: string, integration = "WHATSAPP-BAILEYS") => {
    // Conserver les données backend/Evolution sans forcer de valeurs artificielles
    return api.post("/api/create-instance", { instanceName, integration });
  },

  /** POST /api/refresh-qr/:instanceId */
  refreshQR: (instanceId: string) => api.post(`/api/refresh-qr/${instanceId}`),

  /** POST /api/check-connection/:instanceId */
  checkConnection: (instanceId: string) => api.post(`/api/check-connection/${instanceId}`),

  /** POST /api/send-message/:instanceId */
  sendMessage: (instanceId: string, to: string, message: string) => 
    api.post(`/api/send-message/${instanceId}`, { to, message }),

  /** DELETE /api/instances/:instanceName - delete instance via MongoDB */
  delete: (instanceName: string) => api.delete(`/api/instances/${instanceName}`),

  /** POST /api/instances/:id/restart (legacy - remove if not used) */
  restart: (id: string) => api.post(`/api/instances/${id}/restart`),

  /** GET /api/instances/:id/qr-code (legacy - remove if not used) */
  getQRCode: (id: string) => api.get(`/api/instances/${id}/qr-code`),
};

// ─── Instance Routes  /api/instance/* ───────────────────────────────────────
//  Uses instances.ts routes (by instanceName - the real ID)
export const instanceApi = {
  /** GET /api/instance/fetchInstances */
  fetchAll: () => api.get("/api/instance/fetchInstances"),

  /** POST /api/instance/create — { instanceName, integration?, qrcode? } */
  create: (instanceName: string, integration = "WHATSAPP-BAILEYS", qrcode = true) => {
    if (!instanceName?.trim()) {
      return Promise.reject(new Error('Instance name is required'));
    }
    return api.post("/api/instance/create", { instanceName, integration, qrcode });
  },

  /** GET /api/instances/:instanceName — get single instance with status */
  getStatus: (instanceName: string) => {
    if (!instanceName?.trim()) {
      console.error('❌ Invalid instanceName for status check:', instanceName);
      return Promise.reject(new Error('Instance name is required for status check'));
    }
    if (instanceName === 'ssss' || instanceName.length < 3) {
      console.error('❌ Invalid instanceName detected:', instanceName);
      return Promise.reject(new Error(`Invalid instance name: ${instanceName}`));
    }
    return api.get(`/api/instances/${encodeURIComponent(instanceName)}`);
  },

  /** GET /api/instance/connectionState/:instanceName */
  getState: (instanceName: string) => {
    if (!instanceName?.trim()) {
      console.error('❌ Invalid instanceName for state check:', instanceName);
      return Promise.reject(new Error('Instance name is required for state check'));
    }
    if (instanceName === 'ssss' || instanceName.length < 3) {
      console.error('❌ Invalid instanceName detected:', instanceName);
      return Promise.reject(new Error(`Invalid instance name: ${instanceName}`));
    }
    return api.get(`/api/instance/connectionState/${encodeURIComponent(instanceName)}`);
  },

  /** GET /api/instance/qrcode/:instanceName */
  getQRCode: (instanceName: string) => {
    if (!instanceName?.trim()) {
      console.error('❌ Invalid instanceName for QR code:', instanceName);
      return Promise.reject(new Error('Instance name is required for QR code'));
    }
    if (instanceName === 'ssss' || instanceName.length < 3) {
      console.error('❌ Invalid instanceName detected:', instanceName);
      return Promise.reject(new Error(`Invalid instance name: ${instanceName}`));
    }
    
    console.log('🔍 Fetching QR code for instance:', instanceName);
    return api.get(`/api/instances/${encodeURIComponent(instanceName)}/qr-code`)
      .catch((error) => {
        const status = error?.response?.status;
        const errorData = error?.response?.data;
        
        if (status === 404) {
          console.error(`❌ 404 - Instance QR code not found: ${instanceName}`);
          console.error('   Raison: L\'instance n\'existe pas ou n\'est pas démarrée sur le serveur Evolution API');
        } else if (status === 500) {
          console.error(`❌ 500 - Server error for QR code: ${instanceName}`);
          console.error('   Raison:', errorData?.message || 'Erreur interne du serveur');
        } else if (status === 401 || status === 403) {
          console.error(`❌ ${status} - Unauthorized for QR code: ${instanceName}`);
          console.error('   Raison: Token invalide ou permissions insuffisantes');
        } else {
          console.error(`❌ QR code error (${status || 'unknown'}):`, errorData?.message || error?.message);
          console.error('   Instance:', instanceName);
        }
        
        throw error;
      });
  },

  /** POST /api/instance/connect-phone — { instanceName, phoneNumber } */
  connectPhone: (instanceName: string, phoneNumber: string) => {
    if (!instanceName?.trim() || !phoneNumber?.trim()) {
      return Promise.reject(new Error('Instance name and phone number are required'));
    }
    return api.post("/api/instance/connect-phone", { instanceName, phoneNumber });
  },

  /** POST /api/instance/send-message — { instanceName, number, message } */
  sendMessage: (instanceName: string, number: string, message: string) =>
    api.post("/api/instance/send-message", { instanceName, number, message }),

  /** GET /api/instance/chats/:instanceName */
  getChats: (instanceName: string) =>
    api.get(`/api/instance/chats/${encodeURIComponent(instanceName)}`),

  /** GET /api/instance/chats/:instanceName/:remoteJid/messages */
  getChatMessages: (instanceName: string, remoteJid: string, limit = 50) =>
    api.get(`/api/instance/chats/${encodeURIComponent(instanceName)}/${encodeURIComponent(remoteJid)}/messages`, { params: { limit } }),

  /** DELETE /api/instance/logout/:instanceName */
  logout: (instanceName: string) =>
    api.delete(`/api/instance/logout/${encodeURIComponent(instanceName)}`),

  /** DELETE /api/instance/delete/:instanceName */
  delete: (instanceName: string) =>
    api.delete(`/api/instance/delete/${encodeURIComponent(instanceName)}`),

  /** GET /api/instance/credentials/:instanceName */
  getCredentials: (instanceName: string) =>
    api.get(`/api/instance/credentials/${encodeURIComponent(instanceName)}`),

  /** GET /api/instance/stats/:instanceName */
  getStats: (instanceName: string) =>
    api.get(`/api/instance/stats/${encodeURIComponent(instanceName)}`),
};

// ─── Subscriptions  /api/subscriptions/* ────────────────────────────────────
export const subscriptionsApi = {
  /** GET /api/subscriptions/plans */
  getPlans: () => api.get("/api/subscriptions/plans"),

  /** GET /api/subscriptions/my-subscription — usage + payments + plan */
  getMySubscription: () => api.get("/api/subscriptions/my-subscription"),

  /** POST /api/subscriptions/initiate-payment — { plan } → { redirectUrl, externalRef } */
  initiatePayment: (plan: string) =>
    api.post("/api/subscriptions/initiate-payment", { plan }),

  /** GET /api/subscriptions/payment-verify/:ref */
  verifyPayment: (ref: string) =>
    api.get(`/api/subscriptions/payment-verify/${encodeURIComponent(ref)}`),
};

// ─── Notifications  /api/notifications/* ────────────────────────────────────
export const subscriptionApi = {
  getCurrent: () => api.get('/api/subscription'),
  initPayment: (plan: string) => api.post('/api/subscription/pay', { plan }),
};

export const notificationApi = {
  getAll: () => api.get('/api/notifications'),
  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
};

// Messages & Chats API
export const messagesApi = {
  sendMessage: (payload: any) => api.post('/api/messages/send', payload),
  getChats: (instanceId?: string) => api.get('/api/chats', { params: { instanceId } }),
  getChatMessages: (chatId: string, limit = 50, offset = 0) => 
    api.get(`/api/chats/${chatId}/messages`, { params: { limit, offset } }),
  markAsRead: (chatId: string, messageIds: string[]) => 
    api.post(`/api/chats/${chatId}/mark-read`, { messageIds }),
};

// Usage Stats API
export const usageApi = {
  /** GET /api/usage — global usage stats for authenticated user */
  getGlobal: () => api.get("/api/usage"),

  /** GET /api/instances/:instanceId/usage — usage stats for a specific instance */
  getInstance: (instanceId: string) =>
    api.get(`/api/instances/${encodeURIComponent(instanceId)}/usage`),
};

// Instance Connection Status API
export const connectionApi = {
  getStatus: (instanceName: string) => api.get(`/api/instance/status/${instanceName}`),
  getQRCode: (instanceId: string) => api.get(`/api/instances/${instanceId}/qr-code`),
  disconnect: (instanceId: string) => api.post(`/api/instances/${instanceId}/disconnect`),
  reconnect: (instanceId: string) => api.post(`/api/instances/${instanceId}/reconnect`),
};

// ─── API Key Management  /api/api-keys/* ────────────────────────────────────
export const apiKeysApi = {
  /** GET /api/api-keys?instanceId= — list all active keys */
  getAll: (instanceId?: string) =>
    api.get("/api/api-keys", { params: instanceId ? { instanceId } : undefined }),

  /** POST /api/api-keys — { instanceId, name?, permissions? } → full key returned once */
  create: (instanceId: string, name?: string, permissions?: string[]) =>
    api.post("/api/api-keys", { instanceId, name, permissions }),

  /** DELETE /api/api-keys/:id — revoke a key */
  revoke: (id: string) => api.delete(`/api/api-keys/${id}`),

  /** PATCH /api/api-keys/:id/permissions — update permissions */
  updatePermissions: (id: string, permissions: string[]) =>
    api.patch(`/api/api-keys/${id}/permissions`, { permissions }),

  /** GET /api/api-keys/:id/stats */
  getStats: (id: string) => api.get(`/api/api-keys/${id}/stats`),
};

// ─── Public API  /api/v1/* (API key auth, not JWT) ──────────────────────────
export const publicApi = {
  /** POST /api/v1/send-message — { number, text } with x-api-key header */
  sendMessage: (apiKey: string, number: string, text: string) =>
    api.post(
      "/api/v1/send-message",
      { number, text },
      { headers: { "x-api-key": apiKey } }
    ),
};

// ─── Integrations API  /api/integrations/* ──────────────────────────────────
export const integrationsApi = {
  /** POST /api/integrations/whatsapp/connect — { workspaceId?, instanceName, instanceId, apiKey } */
  connectWhatsApp: (instanceName: string, instanceId: string, apiKey: string, workspaceId?: string) =>
    api.post("/api/integrations/whatsapp/connect", { workspaceId, instanceName, instanceId, apiKey }),

  /** POST /api/integrations/whatsapp/test-message — { instanceId, apiKey, number, text } */
  testWhatsAppMessage: (instanceId: string, apiKey: string, number: string, text: string) =>
    api.post("/api/integrations/whatsapp/test-message", { instanceId, apiKey, number, text }),

  /** GET /api/integrations/whatsapp/status */
  getWhatsAppStatus: () => api.get("/api/integrations/whatsapp/status"),
};
