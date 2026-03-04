import React, { useState } from 'react'
import { X, User, Mail, Shield, Edit3 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

interface User {
  id: string
  name: string
  email: string
  plan: string
  maxInstances: number
  isActive: boolean
  isAdmin?: boolean
  createdAt: string
  updatedAt: string
}

interface EditUserModalProps {
  user: User
  onClose: () => void
  onSuccess: () => void
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const { token, user: currentUser } = useAuthStore()
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    plan: user.plan,
    maxInstances: user.maxInstances,
    isActive: user.isActive,
    isAdmin: user.isAdmin || false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const plans = [
    { value: 'free', label: 'Free', description: '50 messages/jour, 1 instance', instances: 1 },
    { value: 'starter', label: 'Starter', description: '500 messages/jour, 3 instances', instances: 3 },
    { value: 'pro', label: 'Pro', description: '2000 messages/jour, 10 instances', instances: 10 },
    { value: 'enterprise', label: 'Enterprise', description: 'Illimité', instances: 100 }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        if (data.details) {
          // Erreurs de validation Zod
          const validationErrors: Record<string, string> = {}
          data.details.forEach((error: any) => {
            if (error.path.length > 0) {
              validationErrors[error.path[0]] = error.message
            }
          })
          setErrors(validationErrors)
        } else {
          setErrors({ general: data.error || 'Erreur lors de la mise à jour' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Erreur de connexion au serveur' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    let newValue: any = value
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked
    } else if (type === 'number') {
      newValue = parseInt(value) || 0
    }
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue }
      
      // Auto-ajuster maxInstances quand le plan change
      if (name === 'plan') {
        const selectedPlan = plans.find(p => p.value === value)
        if (selectedPlan) {
          updated.maxInstances = selectedPlan.instances
        }
      }
      
      return updated
    })
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const isCurrentUser = user.id === currentUser?.id
  const canEditAdmin = !isCurrentUser || !formData.isAdmin // Empêcher de se retirer ses propres droits admin

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Edit3 className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Modifier {user.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {isCurrentUser && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600">
                <Shield className="h-4 w-4 inline mr-1" />
                Vous modifiez votre propre profil
              </p>
            </div>
          )}

          {/* Nom */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Nom complet
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Adresse email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Plan */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan d'abonnement
            </label>
            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {plans.map((plan) => (
                <option key={plan.value} value={plan.value}>
                  {plan.label} - {plan.description}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre d'instances max */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre maximum d'instances
            </label>
            <input
              type="number"
              name="maxInstances"
              value={formData.maxInstances}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ajusté automatiquement selon le plan sélectionné
            </p>
          </div>

          {/* Options */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Compte actif
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleChange}
                disabled={isCurrentUser && formData.isAdmin} // Empêcher de se retirer ses droits admin
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700">
                <Shield className="h-4 w-4 inline mr-1 text-orange-500" />
                Privilèges administrateur
                {isCurrentUser && formData.isAdmin && (
                  <span className="text-xs text-gray-500 block">
                    (Vous ne pouvez pas retirer vos propres privilèges)
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Informations sur l'utilisateur */}
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Informations</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>ID: {user.id}</div>
              <div>Créé le: {new Date(user.createdAt).toLocaleDateString('fr-FR')}</div>
              <div>Modifié le: {new Date(user.updatedAt).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserModal
