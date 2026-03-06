import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export const authApi = {
  register: (email: string, name: string, password: string) =>
    api.post('/api/auth/register', { email, name, password }),
  
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  me: () => api.get('/api/auth/me'),
}

export const instancesApiNew = {
  create: (customName?: string) =>
    api.post('/instances', { customName }),
  
  getAll: () => api.get('/instances'),
  
  getById: (instanceId: string) =>
    api.get(`/instances/${instanceId}`),
  
  delete: (instanceId: string) =>
    api.delete(`/instances/${instanceId}`),
}

export const externalApi = {
  sendMessage: (token: string, recipient: string, message: string) =>
    axios.post(
      `${API_URL}/api/v1/send-message`,
      { recipient, message },
      {
        headers: {
          'Authorization': `Instance-Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    ),
  
  getInstanceStatus: (token: string) =>
    axios.get(`${API_URL}/api/v1/instance-status`, {
      headers: {
        'Authorization': `Instance-Token ${token}`,
      },
    }),
}

export default api
