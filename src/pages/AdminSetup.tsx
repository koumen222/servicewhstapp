import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, User, Mail, Lock, Eye, EyeOff, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/authStore'

const AdminSetup: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [mode, setMode] = useState<'create' | 'login'>('create')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: 'Admin',
    email: 'admin@whatsapp-saas.com',
    password: 'admin123456'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'create') {
        // Créer un compte admin
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            isAdmin: true
          })
        })

        if (response.ok) {
          toast.success('Compte administrateur créé avec succès!')
          setMode('login')
          return
        } else {
          const data = await response.json()
          toast.error(data.error || 'Erreur lors de la création du compte')
          return
        }
      } else {
        // Se connecter
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Vérifier si l'utilisateur est admin
          if (!data.user.isAdmin) {
            toast.error('Cet utilisateur n\'a pas les privilèges administrateur')
            return
          }

          login(data.user, data.token)
          toast.success('Connexion administrateur réussie!')
          navigate('/admin')
        } else {
          const data = await response.json()
          toast.error(data.error || 'Erreur de connexion')
        }
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur')
      console.error('Admin setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const prefillTestData = () => {
    setFormData({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: 'admin123456'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Administration
            </h1>
            <p className="text-white/70">
              {mode === 'create' 
                ? 'Créer un compte administrateur' 
                : 'Connexion administrateur'
              }
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex mt-6 bg-white/10 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'create'
                  ? 'bg-white text-gray-900'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Créer Admin
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Se connecter
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {/* Quick Fill Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={prefillTestData}
              className="w-full py-2 px-4 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-200 text-sm hover:bg-blue-600/30 transition-colors"
            >
              🚀 Données de test rapide
            </button>
          </div>

          {mode === 'create' && (
            <div className="mb-4">
              <label className="block text-white/80 text-sm font-medium mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nom complet
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Super Admin"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email administrateur
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Lock className="h-4 w-4 inline mr-1" />
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {mode === 'create' && (
              <p className="text-white/50 text-xs mt-1">Minimum 6 caractères</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {mode === 'create' ? 'Création...' : 'Connexion...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Shield className="h-5 w-5 mr-2" />
                {mode === 'create' ? 'Créer Admin' : 'Se connecter'}
              </div>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <p className="text-blue-200 text-sm font-medium">Information</p>
                <p className="text-blue-200/70 text-xs mt-1">
                  {mode === 'create' 
                    ? 'Créez votre compte administrateur pour gérer la plateforme'
                    : 'Connectez-vous avec vos identifiants administrateur'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Back to App */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-white/60 hover:text-white text-sm underline transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminSetup
