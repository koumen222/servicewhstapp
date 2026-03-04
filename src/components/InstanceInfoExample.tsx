import React from 'react'
import { InstanceInfo } from './InstanceInfo'

export const InstanceInfoExample: React.FC = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <InstanceInfo
        apiUrl="https://7103.api.greenapi.com"
        idInstance="7103497791"
        apiTokenInstance="your-api-token-here"
        name="Instance 7103497791"
        status="Expired"
      />
    </div>
  )
}
