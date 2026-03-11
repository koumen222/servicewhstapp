export function buildInstanceName(userId: string, customName: string): string {
  // Normalize custom name: lowercase, replace spaces with hyphens, remove special chars
  const normalizedName = customName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .substring(0, 20) // Limit length
  
  // Generate 3-digit random suffix
  const randomSuffix = Math.floor(100 + Math.random() * 900).toString()
  
  // Combine: normalized-name + random suffix
  return `${normalizedName}-${randomSuffix}`
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
