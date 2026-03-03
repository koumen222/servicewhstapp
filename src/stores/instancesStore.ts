import { create } from 'zustand'
import type { EvolutionInstance } from '@/lib/types'
import { fetchInstances, logoutInstance, deleteInstance } from '@/lib/api'

interface InstancesState {
  instances: EvolutionInstance[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  logout: (instanceName: string) => Promise<void>
  remove: (instanceName: string) => Promise<void>
}

export const useInstancesStore = create<InstancesState>((set, get) => ({
  instances: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const data = await fetchInstances()
      const instances: EvolutionInstance[] = data.map((d) => ({
        instanceName: d.instance?.instanceName ?? '',
        status: (d.instance as EvolutionInstance)?.status ?? 'close',
        profileName: d.profileName,
        profilePictureUrl: d.profilePictureUrl,
        ownerJid: d.owner,
      }))
      set({ instances, loading: false })
    } catch {
      set({ error: 'Impossible de charger les instances', loading: false })
    }
  },

  logout: async (instanceName) => {
    await logoutInstance(instanceName)
    await get().fetchAll()
  },

  remove: async (instanceName) => {
    await deleteInstance(instanceName)
    set((s) => ({ instances: s.instances.filter((i) => i.instanceName !== instanceName) }))
  },
}))
