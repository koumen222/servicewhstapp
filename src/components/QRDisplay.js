import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function QRDisplay({ qrBase64, pairingCode, onRefresh, loading }) {
    const qrValue = qrBase64?.trim() ?? null;
    const getQrImageSrc = (value) => {
        if (value.startsWith('data:image/'))
            return value;
        const compactValue = value.replace(/\s+/g, '');
        const looksLikeBase64 = /^[A-Za-z0-9+/=]+$/.test(compactValue);
        if (looksLikeBase64)
            return `data:image/png;base64,${compactValue}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(value)}`;
    };
    if (pairingCode) {
        return (_jsxs("div", { className: "flex flex-col items-center gap-4 p-6", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Code d'appairage" }), _jsx("div", { className: "font-mono text-5xl font-bold tracking-[0.3em] text-foreground bg-muted px-8 py-6 rounded-2xl border-2 border-dashed border-border", children: pairingCode }), _jsx("p", { className: "text-xs text-muted-foreground text-center max-w-xs", children: "Ouvrez WhatsApp \u2192 Appareils li\u00E9s \u2192 Lier avec un num\u00E9ro de t\u00E9l\u00E9phone et entrez ce code" }), onRefresh && (_jsxs(Button, { variant: "outline", size: "sm", onClick: onRefresh, disabled: loading, children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}` }), "Actualiser"] }))] }));
    }
    if (qrValue) {
        return (_jsxs("div", { className: "flex flex-col items-center gap-4 p-6", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Scannez avec WhatsApp" }), _jsx("div", { className: "p-3 bg-white rounded-2xl shadow-md border border-border", children: _jsx("img", { src: getQrImageSrc(qrValue), alt: "QR Code WhatsApp", className: "w-64 h-64 object-contain" }) }), _jsx("p", { className: "text-xs text-muted-foreground text-center max-w-xs", children: "Ouvrez WhatsApp \u2192 Menu \u2192 Appareils li\u00E9s \u2192 Lier un appareil et scannez ce QR" }), onRefresh && (_jsxs(Button, { variant: "outline", size: "sm", onClick: onRefresh, disabled: loading, children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}` }), "Nouveau QR"] }))] }));
    }
    return (_jsxs("div", { className: "flex flex-col items-center gap-3 p-8 text-muted-foreground", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-muted flex items-center justify-center", children: _jsx(RefreshCw, { className: `w-8 h-8 ${loading ? 'animate-spin' : ''}` }) }), _jsx("p", { className: "text-sm", children: loading ? 'Génération du QR...' : 'Aucun QR disponible' }), onRefresh && !loading && (_jsx(Button, { variant: "outline", size: "sm", onClick: onRefresh, children: "G\u00E9n\u00E9rer QR" }))] }));
}
