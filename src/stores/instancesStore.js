import { create } from 'zustand';
import { fetchInstances, logoutInstance, deleteInstance } from '@/lib/api';
export const useInstancesStore = create((set, get) => ({
    instances: [],
    loading: false,
    error: null,
    fetchAll: async () => {
        set({ loading: true, error: null });
        try {
            const data = await fetchInstances();
            const instances = data.map((d) => ({
                instanceName: d.instance?.instanceName ?? '',
                status: d.instance?.status ?? 'close',
                profileName: d.profileName,
                profilePictureUrl: d.profilePictureUrl,
                ownerJid: d.owner,
            }));
            set({ instances, loading: false });
        }
        catch {
            set({ error: 'Impossible de charger les instances', loading: false });
        }
    },
    logout: async (instanceName) => {
        await logoutInstance(instanceName);
        await get().fetchAll();
    },
    remove: async (instanceName) => {
        await deleteInstance(instanceName);
        set((s) => ({ instances: s.instances.filter((i) => i.instanceName !== instanceName) }));
    },
}));
