import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RefreshCw, Loader2, LogOut, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRDisplay } from '@/components/QRDisplay';
import { getConnectionState, fetchQRCode, sendTextMessage, logoutInstance } from '@/lib/api';
export default function InstanceDetail() {
    const { instanceName } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('connecting');
    const [qrBase64, setQrBase64] = useState(null);
    const [pairingCode, setPairingCode] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [msgForm, setMsgForm] = useState({ number: '', text: '' });
    const [sending, setSending] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const statusRef = useRef(status);
    const loadQR = useCallback(async () => {
        if (!instanceName)
            return;
        setQrLoading(true);
        try {
            const data = await fetchQRCode(instanceName);
            const qrValue = data.base64 ?? data.code ?? data.qrcode?.base64 ?? data.qrcode?.code ?? null;
            const pairingValue = data.pairingCode ?? data.qrcode?.pairingCode ?? null;
            setQrBase64(qrValue);
            setPairingCode(pairingValue);
        }
        catch {
            toast.error('Impossible de charger le QR code');
        }
        finally {
            setQrLoading(false);
        }
    }, [instanceName]);
    const checkStatus = useCallback(async () => {
        if (!instanceName)
            return;
        try {
            const data = await getConnectionState(instanceName);
            const state = data.instance?.state ?? 'close';
            setStatus(state);
            if (state === 'open') {
                setQrBase64(null);
                setPairingCode(null);
            }
        }
        catch { /* silent */ }
    }, [instanceName]);
    // Chargement initial
    useEffect(() => {
        checkStatus();
        loadQR();
    }, [checkStatus, loadQR]);
    // Sync ref with current status
    useEffect(() => { statusRef.current = status; }, [status]);
    // Polling toutes les 5s — intervalle stable, pas réinitialisé à chaque changement de statut
    useEffect(() => {
        const interval = setInterval(() => {
            if (statusRef.current !== 'open')
                checkStatus();
        }, 5000);
        return () => clearInterval(interval);
    }, [checkStatus]);
    const handleSend = async (e) => {
        e.preventDefault();
        if (!instanceName || !msgForm.number || !msgForm.text)
            return;
        setSending(true);
        try {
            await sendTextMessage(instanceName, { number: msgForm.number, text: msgForm.text });
            toast.success('Message envoyé !');
            setMsgForm({ ...msgForm, text: '' });
        }
        catch {
            toast.error("Erreur lors de l'envoi");
        }
        finally {
            setSending(false);
        }
    };
    const handleLogout = async () => {
        if (!instanceName)
            return;
        setDisconnecting(true);
        try {
            await logoutInstance(instanceName);
            toast.success('Instance déconnectée');
            setStatus('close');
            loadQR();
        }
        catch {
            toast.error('Erreur lors de la déconnexion');
        }
        finally {
            setDisconnecting(false);
        }
    };
    const isConnected = status === 'open';
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate('/dashboard'), children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-foreground font-mono", children: instanceName }), _jsxs("div", { className: `flex items-center gap-1.5 mt-0.5 text-sm ${isConnected ? 'text-emerald-600' : 'text-muted-foreground'}`, children: [isConnected ? _jsx(Wifi, { className: "w-4 h-4" }) : _jsx(WifiOff, { className: "w-4 h-4" }), isConnected ? 'Connecté' : status === 'connecting' ? 'Connexion...' : 'Déconnecté'] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: checkStatus, children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Actualiser"] }), isConnected && (_jsxs(Button, { variant: "destructive", size: "sm", onClick: handleLogout, disabled: disconnecting, children: [disconnecting ? _jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : _jsx(LogOut, { className: "w-4 h-4 mr-2" }), "D\u00E9connecter"] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: isConnected ? '✅ Instance connectée' : '📱 Scanner le QR Code' }) }), _jsx(CardContent, { children: isConnected ? (_jsxs("div", { className: "flex flex-col items-center gap-4 py-6", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center", children: _jsx(Wifi, { className: "w-10 h-10 text-emerald-600" }) }), _jsx("p", { className: "text-sm text-muted-foreground text-center", children: "WhatsApp est connect\u00E9 et pr\u00EAt \u00E0 envoyer des messages" })] })) : (_jsx(QRDisplay, { qrBase64: qrBase64, pairingCode: pairingCode, onRefresh: loadQR, loading: qrLoading })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "\uD83D\uDCE4 Envoyer un message test" }) }), _jsx(CardContent, { children: !isConnected ? (_jsxs("div", { className: "flex flex-col items-center gap-3 py-8 text-muted-foreground text-sm text-center", children: [_jsx(WifiOff, { className: "w-8 h-8" }), _jsx("p", { children: "Connectez l'instance pour envoyer des messages" })] })) : (_jsxs("form", { onSubmit: handleSend, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Num\u00E9ro WhatsApp" }), _jsx(Input, { placeholder: "ex: 33612345678 (sans +)", value: msgForm.number, onChange: (e) => setMsgForm({ ...msgForm, number: e.target.value }), required: true }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Format : indicatif + num\u00E9ro (ex: 33612345678)" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Message" }), _jsx("textarea", { className: "flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none", placeholder: "Votre message...", value: msgForm.text, onChange: (e) => setMsgForm({ ...msgForm, text: e.target.value }), required: true })] }), _jsxs(Button, { type: "submit", className: "w-full bg-emerald-600 hover:bg-emerald-700", disabled: sending, children: [sending ? _jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : _jsx(Send, { className: "w-4 h-4 mr-2" }), "Envoyer"] })] })) })] })] })] }));
}
