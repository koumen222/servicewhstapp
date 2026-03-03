export function buildInstanceName(userId: string, customName: string): string {
  const sanitized = customName.toLowerCase().replace(/[^a-z0-9-]/g, '')
  return `user_${userId.substring(0, 8)}_${sanitized}`
}

export function extractCustomName(fullInstanceName: string): string {
  const parts = fullInstanceName.split('_')
  return parts.slice(2).join('_')
}

export function parseInstanceName(fullInstanceName: string): { userId: string; customName: string } | null {
  const match = fullInstanceName.match(/^user_([a-f0-9]{8})_(.+)$/)
  if (!match) return null
  return {
    userId: match[1],
    customName: match[2]
  }
}
