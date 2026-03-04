import React from 'react'

interface InstanceInfoProps {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
  name: string
  status: string
}

export const InstanceInfo: React.FC<InstanceInfoProps> = ({
  apiUrl,
  idInstance,
  apiTokenInstance,
  name,
  status
}) => {
  const maskToken = (token: string) => {
    if (token.length <= 8) return '*'.repeat(token.length)
    return token.slice(0, 4) + '*'.repeat(40) + token.slice(-4)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'connected':
        return 'text-green-600'
      case 'expired':
      case 'disconnected':
        return 'text-red-600'
      case 'pending':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Instance Information</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">API URL</span>
          <span className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
            {apiUrl}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Instance ID</span>
          <span className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
            {idInstance}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">API Token</span>
          <span className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
            {maskToken(apiTokenInstance)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Name</span>
          <span className="text-sm text-gray-900">
            {name}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Status</span>
          <span className={`text-sm font-medium ${getStatusColor(status)}`}>
            {status || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  )
}
