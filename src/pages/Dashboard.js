import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Loader2, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstanceCard } from '@/components/InstanceCard';
import { useInstancesStore } from '@/stores/instancesStore';
import { useAuthStore } from '@/stores/authStore';
export default function Dashboard() {
    const { user } = useAuthStore();
    const { instances, loading, fetchAll } = useInstancesStore();
    useEffect(() => { fetchAll(); }, [fetchAll]);
    const connected = instances.filter((i) => i.status === 'open').length;
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8 space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-foreground", children: ["Bonjour, ", user?.name, " \uD83D\uDC4B"] }), _jsx("p", { className: "text-muted-foreground mt-1", children: instances.length === 0
                                    ? 'Aucune instance — créez-en une pour commencer'
                                    : `${instances.length} instance${instances.length > 1 ? 's' : ''} · ${connected} connectée${connected > 1 ? 's' : ''}` })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: () => fetchAll(), disabled: loading, title: "Actualiser", children: _jsx(RefreshCw, { className: `w-4 h-4 ${loading ? 'animate-spin' : ''}` }) }), _jsx(Button, { asChild: true, className: "bg-emerald-600 hover:bg-emerald-700", children: _jsxs(Link, { to: "/instances/create", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Nouvelle instance"] }) })] })] }), instances.length > 0 && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
                    { label: 'Total', value: instances.length, color: 'text-foreground' },
                    { label: 'Connectées', value: connected, color: 'text-emerald-600' },
                    { label: 'En attente', value: instances.filter((i) => i.status === 'qrcode').length, color: 'text-blue-500' },
                    { label: 'Déconnectées', value: instances.filter((i) => i.status === 'close').length, color: 'text-gray-400' },
                ].map((s) => (_jsxs("div", { className: "bg-card border border-border rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: s.label }), _jsx("p", { className: `text-2xl font-bold mt-1 ${s.color}`, children: s.value })] }, s.label))) })), loading && instances.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-48", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-muted-foreground" }) })) : instances.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-4 text-center border-2 border-dashed border-border rounded-2xl", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center", children: _jsx(Wifi, { className: "w-8 h-8 text-emerald-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-foreground", children: "Aucune instance WhatsApp" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Cr\u00E9ez votre premi\u00E8re instance pour commencer \u00E0 envoyer des messages" })] }), _jsx(Button, { asChild: true, className: "bg-emerald-600 hover:bg-emerald-700", children: _jsxs(Link, { to: "/instances/create", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Cr\u00E9er une instance"] }) })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: instances.map((instance) => (_jsx(InstanceCard, { instance: instance }, instance.instanceName))) }))] }));
}
