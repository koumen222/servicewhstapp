import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL || '',
  MONEYFUSION_URL: process.env.MONEYFUSION_URL || 'https://www.pay.moneyfusion.net/Scalor/8ad75171bd8f7d55/pay/',
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
  EVOLUTION_MASTER_API_KEY: process.env.EVOLUTION_MASTER_API_KEY || process.env.EVOLUTION_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://zechat.site,http://localhost:5173,http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || '',
}

// Logs de débogage pour Evolution API
console.log('\n🔧 Evolution API Configuration:')
console.log('EVOLUTION_API_URL:', process.env.EVOLUTION_API_URL || '(not set)')
console.log('EVOLUTION_API_KEY:', process.env.EVOLUTION_API_KEY ? `${process.env.EVOLUTION_API_KEY.substring(0, 10)}...` : '(not set)')
console.log('EVOLUTION_MASTER_API_KEY:', process.env.EVOLUTION_MASTER_API_KEY ? `${process.env.EVOLUTION_MASTER_API_KEY.substring(0, 10)}...` : '(not set)')

if (!env.EVOLUTION_API_URL || !env.EVOLUTION_MASTER_API_KEY) {
  console.error('❌ ERROR: EVOLUTION_API_URL or EVOLUTION_MASTER_API_KEY not set!')
  console.error('   EVOLUTION_API_URL:', env.EVOLUTION_API_URL || '(empty)')
  console.error('   EVOLUTION_MASTER_API_KEY:', env.EVOLUTION_MASTER_API_KEY || '(empty)')
} else {
  console.log('✅ Evolution API configuration loaded successfully\n')
}
