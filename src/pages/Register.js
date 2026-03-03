import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuthStore();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            toast.success('Compte créé avec succès !');
            navigate('/dashboard');
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4", children: _jsxs("div", { className: "w-full max-w-md space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg", children: _jsx(MessageSquare, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-foreground", children: "WA Manager" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Cr\u00E9ez votre compte gratuitement" })] })] }), _jsxs(Card, { className: "shadow-xl border-border/50", children: [_jsxs(CardHeader, { className: "space-y-1 pb-4", children: [_jsx(CardTitle, { className: "text-xl", children: "Cr\u00E9er un compte" }), _jsx(CardDescription, { children: "Remplissez le formulaire pour commencer" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Nom" }), _jsx(Input, { placeholder: "Votre nom", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Email" }), _jsx(Input, { type: "email", placeholder: "vous@example.com", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Mot de passe" }), _jsx(Input, { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), required: true, minLength: 6 })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-foreground", children: "Confirmer le mot de passe" }), _jsx(Input, { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.confirm, onChange: (e) => setForm({ ...form, confirm: e.target.value }), required: true })] }), _jsxs(Button, { type: "submit", className: "w-full bg-emerald-600 hover:bg-emerald-700", disabled: loading, children: [loading ? _jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }) : null, "Cr\u00E9er mon compte"] })] }), _jsxs("p", { className: "text-center text-sm text-muted-foreground mt-4", children: ["D\u00E9j\u00E0 un compte ?", ' ', _jsx(Link, { to: "/login", className: "text-emerald-600 hover:underline font-medium", children: "Se connecter" })] })] })] })] }) }));
}
