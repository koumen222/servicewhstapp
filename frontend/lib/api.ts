import axios from "axios";

// Détection automatique de l'environnement
const getBaseURL = () => {
  // 1. Priorité à la variable d'environnement (si définie dans .env.local ou sur le serveur)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Si on est côté serveur (SSR) sans variable, fallback sur localhost
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }
  
  // 3. Côté client : détection par hostname
  const hostname = window.location.hostname;
  
  // Si on est sur un domaine de production connu
  if (hostname === "ecomcookpit.site" || hostname === "www.ecomcookpit.site" || hostname === "zechat.site" || hostname === "www.zechat.site") {
    return "https://api.ecomcookpit.site";
  }

  // Par défaut pour tout le reste (localhost, IP locale, domaines de test), utiliser le backend local
  return "http://localhost:3001";
};

const BASE_URL = getBaseURL();

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
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
