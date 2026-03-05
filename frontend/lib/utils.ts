import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string): string {
  const colors = [
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Validate if an instance ID is valid for API calls
 * @param id - Instance ID to validate
 * @returns true if ID is valid (non-empty string or UUID)
 */
export function isValidInstanceId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length === 0) return false;
  return true;
}

/**
 * Format instance ID for display in UI
 * Extracts only digits and limits to 6 characters for cleaner display
 * @param id - Instance ID (can be UUID, 5-digit number, or custom name)
 * @returns Formatted ID for display (original if no digits, or first 6 digits)
 */
export function formatInstanceIdForDisplay(id: string): string {
  if (!id) return 'N/A';
  
  // If it's a 5-digit number, show as-is
  if (/^\d{5}$/.test(id)) {
    return `#${id}`;
  }
  
  // If it's a UUID, show first 8 chars
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return `#${id.substring(0, 8)}`;
  }
  
  // For custom names or old format, extract digits if any
  const digits = id.replace(/\D/g, '');
  if (digits.length > 0) {
    return `#${digits.slice(0, 6)}`;
  }
  
  // Fallback: show first 8 chars of original
  return id.substring(0, 8);
}
