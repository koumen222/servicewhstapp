import { prisma } from './prisma.js'

export async function prismaRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Retry on connection errors or read errors
      const shouldRetry = 
        error.message.includes('could not read block') ||
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.code === 'ECONNRESET'
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error
      }
      
      console.warn(`[PRISMA_RETRY] Attempt ${attempt}/${maxRetries} failed:`, error.message)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}

// Wrapper for common operations
export const prismaWithRetry = {
  user: {
    findMany: (args: any) => prismaRetry(() => prisma.user.findMany(args)),
    findUnique: (args: any) => prismaRetry(() => prisma.user.findUnique(args)),
    findFirst: (args: any) => prismaRetry(() => prisma.user.findFirst(args)),
    count: (args?: any) => prismaRetry(() => prisma.user.count(args)),
    create: (args: any) => prismaRetry(() => prisma.user.create(args)),
    update: (args: any) => prismaRetry(() => prisma.user.update(args)),
    delete: (args: any) => prismaRetry(() => prisma.user.delete(args)),
  },
  instance: {
    findMany: (args: any) => prismaRetry(() => prisma.instance.findMany(args)),
    findUnique: (args: any) => prismaRetry(() => prisma.instance.findUnique(args)),
    findFirst: (args: any) => prismaRetry(() => prisma.instance.findFirst(args)),
    count: (args?: any) => prismaRetry(() => prisma.instance.count(args)),
    create: (args: any) => prismaRetry(() => prisma.instance.create(args)),
    update: (args: any) => prismaRetry(() => prisma.instance.update(args)),
    delete: (args: any) => prismaRetry(() => prisma.instance.delete(args)),
  }
}
