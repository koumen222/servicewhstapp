import axios from 'axios';
import { toast } from 'sonner';
// ── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';
// ── Client Axios ─────────────────────────────────────────────────────────────
export const apiClient = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});
// Intercepteur : ajoute le token JWT automatiquement
apiClient.interceptors.request.use((config) => {
    const authData = localStorage.getItem('wasa_auth');
    if (authData) {
        try {
            const { state } = JSON.parse(authData);
            if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        }
        catch { }
    }
    return config;
});
// Intercepteur : gestion globale des erreurs
apiClient.interceptors.response.use((res) => res, (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message ??
        error.response?.data?.error ??
        error.message ??
        'Erreur inconnue';
    if (status === 401) {
        toast.error('Session expirée — reconnectez-vous');
        localStorage.removeItem('wasa_auth');
        if (window.location.pathname !== '/login')
            window.location.href = '/login';
    }
    else if (status === 403) {
        toast.error(msg);
    }
    else if (status === 404) {
        toast.error(`Ressource introuvable: ${msg}`);
    }
    else if (status === 422 || status === 400) {
        toast.error(`Données invalides: ${msg}`);
    }
    else if (status === 429) {
        toast.error('Limite de requêtes atteinte — réessayez dans quelques secondes');
    }
    else if (status && status >= 500) {
        toast.error(`Erreur serveur (${status}): ${msg}`);
    }
    return Promise.reject(error);
});
// ── Endpoints Auth ────────────────────────────────────────────────────────────
export const login = (email, password) => apiClient.post('/api/auth/login', { email, password }).then((r) => r.data);
export const register = (name, email, password) => apiClient.post('/api/auth/register', { name, email, password }).then((r) => r.data);
// ── Endpoints Instances (via proxy backend) ──────────────────────────────────
/** Crée une nouvelle instance WhatsApp */
export const createInstance = (payload) => apiClient.post('/api/instance/create', payload).then((r) => r.data);
/** Récupère toutes les instances de l'utilisateur connecté */
export const fetchInstances = () => apiClient.get('/api/instance/fetchInstances').then((r) => r.data);
/** Connecte une instance et retourne QR ou pairingCode */
export const connectInstance = (instanceName) => apiClient.get(`/api/instance/connect/${instanceName}`).then((r) => r.data);
/** Recharge le QR code d'une instance */
export const fetchQRCode = (instanceName) => apiClient.get(`/api/instance/qrcode/${instanceName}`).then((r) => r.data);
/** Statut de connexion d'une instance */
export const getConnectionState = (instanceName) => apiClient
    .get(`/api/instance/connectionState/${instanceName}`)
    .then((r) => r.data);
/** Envoie un message texte */
export const sendTextMessage = (instanceName, payload) => apiClient.post(`/api/message/sendText/${instanceName}`, payload).then((r) => r.data);
/** Déconnecte une instance */
export const logoutInstance = (instanceName) => apiClient.delete(`/api/instance/logout/${instanceName}`).then((r) => r.data);
/** Supprime définitivement une instance */
export const deleteInstance = (instanceName) => apiClient.delete(`/api/instance/delete/${instanceName}`).then((r) => r.data);
