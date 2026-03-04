"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Instance, Stats } from "@/lib/types";

interface AppState {
  user: User | null;
  instances: Instance[];
  stats: Stats | null;
  sidebarOpen: boolean;
  isLoadingInstances: boolean;

  setUser: (user: User | null) => void;
  setInstances: (instances: Instance[]) => void;
  setStats: (stats: Stats) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setLoadingInstances: (v: boolean) => void;
  addInstance: (instance: Instance) => void;
  removeInstance: (id: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      instances: [],
      stats: null,
      sidebarOpen: true,
      isLoadingInstances: false,

      setUser: (user) => set({ user }),
      setInstances: (instances) => set({ instances }),
      setStats: (stats) => set({ stats }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLoadingInstances: (isLoadingInstances) =>
        set({ isLoadingInstances }),
      addInstance: (instance) =>
        set((state) => ({ instances: [...state.instances, instance] })),
      removeInstance: (id) =>
        set((state) => ({
          instances: state.instances.filter((i) => i.id !== id),
        })),
      logout: () =>
        set({ user: null, instances: [], stats: null }),
    }),
    {
      name: "whatsapp-saas-store",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
