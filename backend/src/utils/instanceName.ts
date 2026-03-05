export function buildInstanceName(userId: string, customName: string): string {
  // Generate 5-digit random number (10000-99999)
  const randomId = Math.floor(10000 + Math.random() * 90000).toString()
  return randomId
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
