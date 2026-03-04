import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, MessageSquare, LayoutDashboard, Moon, Sun, Plus, User, CreditCard, Shield, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import NotificationBell from '@/components/NotificationBell'

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  free:       { label: 'Free',       color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  starter:    { label: 'Starter',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  pro:        { label: 'Pro',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
}

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    toast.success('Déconnecté')
    navigate('/login')
  }

  const plan = user?.plan ?? 'free'
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline text-foreground">WA Manager</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/instances/create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle instance</span>
            </Link>
          </Button>
          {user?.isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin" className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {user && <NotificationBell />}

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium leading-none">{user.name}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border bg-background shadow-lg py-1.5 z-50">
                  <div className="px-3 py-2 border-b mb-1">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <Link to="/account" className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" /> Mon compte
                  </Link>
                  <Link to="/pricing" className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors">
                    <CreditCard className="w-4 h-4 text-muted-foreground" /> Abonnements
                  </Link>
                  {user.isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-purple-600 dark:text-purple-400">
                      <Shield className="w-4 h-4" /> Panel Admin
                    </Link>
                  )}
                  <div className="border-t mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left hover:bg-muted transition-colors text-red-500"
                    >
                      <LogOut className="w-4 h-4" /> Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
