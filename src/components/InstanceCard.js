import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Wifi, WifiOff, Loader2, Trash2, LogOut, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';
import { useInstancesStore } from '@/stores/instancesStore';
const statusConfig = {
    open: { label: 'Connecté', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: Wifi },
    close: { label: 'Déconnecté', color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: WifiOff },
    connecting: { label: 'Connexion...', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40', icon: Loader2 },
    qrcode: { label: 'QR en attente', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40', icon: Loader2 },
    pairingCode: { label: 'Code appairage', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/40', icon: Loader2 },
};
export function InstanceCard({ instance }) {
    const { logout, remove } = useInstancesStore();
    const [loadingAction, setLoadingAction] = useState(null);
    const cfg = statusConfig[instance.status] ?? statusConfig.close;
    const StatusIcon = cfg.icon;
    const handleLogout = async (e) => {
        e.preventDefault();
        setLoadingAction('logout');
        try {
            await logout(instance.instanceName);
            toast.success(`Instance "${instance.instanceName}" déconnectée`);
        }
        catch {
            toast.error('Erreur lors de la déconnexion');
        }
        finally {
            setLoadingAction(null);
        }
    };
    const handleDelete = async (e) => {
        e.preventDefault();
        if (!confirm(`Supprimer définitivement "${instance.instanceName}" ?`))
            return;
        setLoadingAction('delete');
        try {
            await remove(instance.instanceName);
            toast.success(`Instance "${instance.instanceName}" supprimée`);
        }
        catch {
            toast.error('Erreur lors de la suppression');
        }
        finally {
            setLoadingAction(null);
        }
    };
    return (_jsx(Link, { to: `/instance/${instance.instanceName}`, className: "block group", children: _jsx(Card, { className: "hover:shadow-md transition-all duration-200 border-border hover:border-emerald-300 dark:hover:border-emerald-700", children: _jsx(CardContent, { className: "p-5", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsxs("div", { className: "relative flex-shrink-0", children: [instance.profilePictureUrl ? (_jsx("img", { src: instance.profilePictureUrl, alt: "", className: "w-12 h-12 rounded-full object-cover" })) : (_jsx("div", { className: "w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center", children: _jsx("span", { className: "text-emerald-700 dark:text-emerald-300 font-bold text-lg", children: instance.instanceName.charAt(0).toUpperCase() }) })), _jsx("span", { className: `absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${instance.status === 'open' ? 'bg-emerald-500' : 'bg-gray-300'}` })] }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-semibold text-foreground truncate", children: instance.instanceName }), instance.profileName && (_jsx("p", { className: "text-xs text-muted-foreground truncate", children: instance.profileName })), _jsxs("div", { className: `inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`, children: [_jsx(StatusIcon, { className: `w-3 h-3 ${instance.status === 'connecting' || instance.status === 'qrcode' ? 'animate-spin' : ''}` }), cfg.label] })] })] }), _jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity", onClick: handleLogout, disabled: !!loadingAction, title: "D\u00E9connecter", children: loadingAction === 'logout' ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(LogOut, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive", onClick: handleDelete, disabled: !!loadingAction, title: "Supprimer", children: loadingAction === 'delete' ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Trash2, { className: "w-4 h-4" }) }), _jsx(ExternalLink, { className: "w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" })] })] }) }) }) }));
}
