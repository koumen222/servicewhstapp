import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/types'
import * as api from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await api.login(email, password)
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          plan: response.user.plan,
          maxInstances: response.user.maxInstances,
          isAdmin: response.user.isAdmin ?? false,
          token: response.token,
        }
        set({ user, token: response.token, isAuthenticated: true })
      },

      register: async (name, email, password) => {
        const response = await api.register(name, email, password)
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          plan: response.user.plan,
          maxInstances: response.user.maxInstances,
          isAdmin: response.user.isAdmin ?? false,
          token: response.token,
        }
        set({ user, token: response.token, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'wasa_auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)
