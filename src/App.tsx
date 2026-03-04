import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/stores/authStore'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import CreateInstance from '@/pages/CreateInstance'
import InstanceDetail from '@/pages/InstanceDetail'
import Home from '@/pages/Home'
import Pricing from '@/pages/Pricing'
import Account from '@/pages/Account'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import PaymentSuccess from '@/pages/PaymentSuccess'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Auth */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Payment */}
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {/* Protected user */}
        <Route path="/dashboard"        element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/instances/create" element={<ProtectedLayout><CreateInstance /></ProtectedLayout>} />
        <Route path="/instance/:instanceName" element={<ProtectedLayout><InstanceDetail /></ProtectedLayout>} />
        <Route path="/account"          element={<ProtectedLayout><Account /></ProtectedLayout>} />

        {/* Admin */}
        <Route path="/admin"       element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

        {/* Default */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
