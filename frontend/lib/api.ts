import axios from "axios";

// Détection automatique de l'environnement
const getBaseURL = () => {
  // Si on est côté serveur (SSR), utiliser la variable d'environnement
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }
  
  // Côté client : détecter si on est en local ou en production
  const hostname = window.location.hostname;
  
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Environnement local
    return "http://localhost:8080";
  } else {
    // Environnement de production
    return "https://api.ecomcookpit.site";
  }
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
//  Uses instanceManagement.ts routes (by DB id)
export const instancesApi = {
  /** GET /api/instances/instances — list all user instances */
  getAll: () => api.get("/api/instances/instances"),

  /** POST /api/instances/create-instance — { customName, integration? } */
  create: (customName: string, integration = "WHATSAPP-BAILEYS") =>
    api.post("/api/instances/create-instance", { customName, integration }),

  /** DELETE /api/instances/instances/:id */
  delete: (id: string) => api.delete(`/api/instances/instances/${id}`),

  /** POST /api/instances/instances/:id/restart */
  restart: (id: string) => api.post(`/api/instances/instances/${id}/restart`),

  /** GET /api/instances/instances/:id/qr-code */
  getQRCode: (id: string) => api.get(`/api/instances/instances/${id}/qr-code`),
};

// ─── Instance Routes  /api/instance/* ───────────────────────────────────────
//  Uses instances.ts routes (by customName)
export const instanceApi = {
  /** GET /api/instance/fetchInstances */
  fetchAll: () => api.get("/api/instance/fetchInstances"),

  /** POST /api/instance/create — { instanceName, integration?, qrcode? } */
  create: (instanceName: string, integration = "WHATSAPP-BAILEYS", qrcode = true) =>
    api.post("/api/instance/create", { instanceName, integration, qrcode }),

  /** GET /api/instance/status/:instanceName — reliable polling endpoint */
  getStatus: (instanceName: string) =>
    api.get(`/api/instance/status/${encodeURIComponent(instanceName)}`),

  /** GET /api/instance/connectionState/:instanceName */
  getState: (instanceName: string) =>
    api.get(`/api/instance/connectionState/${encodeURIComponent(instanceName)}`),

  /** GET /api/instance/qrcode/:instanceName */
  getQRCode: (instanceName: string) =>
    api.get(`/api/instance/qrcode/${encodeURIComponent(instanceName)}`),

  /** POST /api/instance/connect-phone — { instanceName, phoneNumber } */
  connectPhone: (instanceName: string, phoneNumber: string) =>
    api.post("/api/instance/connect-phone", { instanceName, phoneNumber }),

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
