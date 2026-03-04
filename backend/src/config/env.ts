import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL || '',
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
}

if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) {
  console.warn('⚠️  EVOLUTION_API_URL or EVOLUTION_API_KEY not set')
}
