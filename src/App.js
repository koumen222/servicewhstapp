import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/stores/authStore';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import CreateInstance from '@/pages/CreateInstance';
import InstanceDetail from '@/pages/InstanceDetail';
function ProtectedLayout({ children }) {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated)
        return _jsx(Navigate, { to: "/login", replace: true });
    return (_jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [_jsx(Navbar, {}), _jsx("main", { children: children })] }));
}
function PublicRoute({ children }) {
    const { isAuthenticated } = useAuthStore();
    if (isAuthenticated)
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsxs(BrowserRouter, { children: [_jsx(Toaster, { position: "top-right", richColors: true, closeButton: true }), _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(PublicRoute, { children: _jsx(Login, {}) }) }), _jsx(Route, { path: "/register", element: _jsx(PublicRoute, { children: _jsx(Register, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedLayout, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/instances/create", element: _jsx(ProtectedLayout, { children: _jsx(CreateInstance, {}) }) }), _jsx(Route, { path: "/instance/:instanceName", element: _jsx(ProtectedLayout, { children: _jsx(InstanceDetail, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] })] }));
}
