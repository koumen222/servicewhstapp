import { create } from 'zustand';
import { fetchInstances, logoutInstance, deleteInstance } from '@/lib/api';
export const useInstancesStore = create((set, get) => ({
    instances: [],
    loading: false,
    error: null,
    fetchAll: async () => {
        console.log('📦 [instancesStore] fetchAll start');
        set({ loading: true, error: null });
        try {
            const data = await fetchInstances();
            console.log('📦 [instancesStore] raw fetchInstances response:', data);
            const instances = data.map((d) => {
                const inst = {
                    instanceName: d.instanceName ?? d.instance?.instanceName ?? '',
                    status: d.status ?? d.instance?.state ?? 'close',
                    profileName: d.profileName ?? d.instance?.profileName,
                    profilePictureUrl: d.profilePictureUrl ?? d.instance?.profilePictureUrl,
                    ownerJid: d.ownerJid ?? d.owner ?? d.instance?.ownerJid,
                };
                console.log('📦 [instancesStore] mapped:', inst);
                return inst;
            });
            console.log('🟢 [instancesStore] fetchAll done →', instances.length, 'instances');
            set({ instances, loading: false });
        }
        catch (err) {
            console.error('🔴 [instancesStore] fetchAll error:', err);
            set({ error: 'Impossible de charger les instances', loading: false });
        }
    },
    logout: async (instanceName) => {
        console.log('🟡 [instancesStore] logout', instanceName);
        try {
            await logoutInstance(instanceName);
            console.log('🟢 [instancesStore] logout done, refreshing...');
            await get().fetchAll();
        }
        catch (err) {
            console.error('🔴 [instancesStore] logout error:', err);
            throw err;
        }
    },
    remove: async (instanceName) => {
        console.log('🟡 [instancesStore] remove', instanceName);
        try {
            await deleteInstance(instanceName);
            console.log('🟢 [instancesStore] remove done');
            set((s) => ({ instances: s.instances.filter((i) => i.instanceName !== instanceName) }));
        }
        catch (err) {
            console.error('🔴 [instancesStore] remove error:', err);
            throw err;
        }
    },
}));
