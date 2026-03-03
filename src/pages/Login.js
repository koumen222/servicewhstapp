import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success('Bienvenue !');
            navigate('/dashboard');
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur de connexion');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4", children: _jsxs("div", { className: "w-full max-w-md space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg", children: _jsx(MessageSquare, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-foreground", children: "WA Manager" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "G\u00E9rez vos instances WhatsApp" })] })] }), _jsxs(Card, { className: "shadow-xl border-border/50", children: [_jsxs(CardHeader, { className: "space-y-1 pb-4", children: [_jsx(CardTitle, { className: "text-xl", children: "Connexion" }), _jsx(CardDescription, { children: "Entrez vos identifiants pour acc\u00E9der \u00E0 votre espace" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Email" }), _jsx(Input, { type: "email", placeholder: "vous@example.com", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true, autoComplete: "email" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Mot de passe" }), _jsx(Input, { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), required: true, autoComplete: "current-password" })] }), _jsxs(Button, { type: "submit", className: "w-full bg-emerald-600 hover:bg-emerald-700", disabled: loading, children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : null, "Se connecter"] })] }), _jsxs("p", { className: "text-center text-sm text-muted-foreground mt-4", children: ["Pas encore de compte ?", ' ', _jsx(Link, { to: "/register", className: "text-emerald-600 hover:underline font-medium", children: "S'inscrire" })] })] })] })] }) }));
}
