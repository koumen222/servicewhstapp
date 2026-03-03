import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, LayoutDashboard, Moon, Sun, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
export function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }, [dark]);
    const handleLogout = () => {
        logout();
        toast.success('Déconnecté');
        navigate('/login');
    };
    return (_jsx("header", { className: "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 h-16 flex items-center justify-between", children: [_jsxs(Link, { to: "/dashboard", className: "flex items-center gap-2 font-bold text-lg", children: [_jsx("div", { className: "w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center", children: _jsx(MessageSquare, { className: "w-5 h-5 text-white" }) }), _jsx("span", { className: "hidden sm:inline text-foreground", children: "WA Manager" })] }), _jsxs("nav", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: _jsxs(Link, { to: "/dashboard", className: "flex items-center gap-2", children: [_jsx(LayoutDashboard, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Dashboard" })] }) }), _jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: _jsxs(Link, { to: "/instances/create", className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Nouvelle instance" })] }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [user && (_jsxs("span", { className: "hidden md:flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-xs", children: user.name.charAt(0).toUpperCase() }), user.name] })), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setDark(!dark), children: dark ? _jsx(Sun, { className: "w-4 h-4" }) : _jsx(Moon, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: handleLogout, title: "Se d\u00E9connecter", children: _jsx(LogOut, { className: "w-4 h-4" }) })] })] }) }));
}
