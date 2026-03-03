import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/lib/api';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: async (email, password) => {
        const response = await api.login(email, password);
        const user = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            token: response.token,
        };
        set({ user, token: response.token, isAuthenticated: true });
    },
    register: async (name, email, password) => {
        const response = await api.register(name, email, password);
        const user = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            token: response.token,
        };
        set({ user, token: response.token, isAuthenticated: true });
    },
    logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
    },
}), {
    name: 'wasa_auth',
    partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
}));
