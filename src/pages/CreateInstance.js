import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createInstance, connectInstance } from '@/lib/api';
export default function CreateInstance() {
    const navigate = useNavigate();
    const [instanceName, setInstanceName] = useState('');
    const [loading, setLoading] = useState(false);
    const slugify = (v) => v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = slugify(instanceName);
        if (!name) {
            toast.error('Nom invalide');
            return;
        }
        setLoading(true);
        try {
            await createInstance({ instanceName: name, integration: 'WHATSAPP-BAILEYS', qrcode: true });
            toast.success(`Instance "${name}" créée !`);
            // Connecter immédiatement pour obtenir le QR
            await connectInstance(name).catch(() => null);
            navigate(`/instance/${name}`);
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-lg mx-auto px-4 py-12", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate(-1), className: "mb-6 -ml-2", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Retour"] }), _jsxs(Card, { className: "shadow-lg", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center", children: _jsx(Zap, { className: "w-5 h-5 text-emerald-600" }) }), _jsxs("div", { children: [_jsx(CardTitle, { children: "Nouvelle instance" }), _jsx(CardDescription, { children: "Cr\u00E9ez une connexion WhatsApp" })] })] }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Nom de l'instance" }), _jsx(Input, { placeholder: "ex: mon-shop, support-client", value: instanceName, onChange: (e) => setInstanceName(e.target.value), required: true, autoFocus: true }), instanceName && (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Identifiant : ", _jsx("span", { className: "font-mono text-emerald-600", children: slugify(instanceName) })] }))] }), _jsxs("div", { className: "rounded-xl bg-muted/50 border border-border p-4 space-y-2", children: [_jsx("p", { className: "text-xs font-semibold text-foreground", children: "Ce qui va se passer :" }), _jsxs("ul", { className: "text-xs text-muted-foreground space-y-1 list-disc list-inside", children: [_jsx("li", { children: "Cr\u00E9ation de l'instance sur Evolution API" }), _jsx("li", { children: "G\u00E9n\u00E9ration d'un QR code \u00E0 scanner" }), _jsx("li", { children: "Redirection vers la page de connexion" })] })] }), _jsx(Button, { type: "submit", className: "w-full bg-emerald-600 hover:bg-emerald-700", disabled: loading || !instanceName.trim(), children: loading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }), "Cr\u00E9ation en cours..."] })) : (_jsxs(_Fragment, { children: [_jsx(Zap, { className: "w-4 h-4 mr-2" }), "Cr\u00E9er et g\u00E9n\u00E9rer le QR"] })) })] }) })] })] }));
}
