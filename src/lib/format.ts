// Formatting helpers shared across the app
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export function fullName(u: { firstName: string; lastName: string } | undefined | null): string {
  if (!u) return 'Unknown';
  return `${u.firstName} ${u.lastName}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

// Deterministic avatar gradient per user id
const AVATAR_GRADIENTS = [
  'from-rose-500 to-orange-400', 'from-violet-500 to-fuchsia-400', 'from-emerald-500 to-teal-400',
  'from-amber-500 to-yellow-400', 'from-sky-500 to-cyan-400', 'from-indigo-500 to-purple-400',
  'from-pink-500 to-rose-400', 'from-lime-500 to-green-400', 'from-cyan-500 to-blue-500',
  'from-orange-500 to-red-400',
];
export function avatarGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  MEMBER: 'Member',
};

export function visibilityLabel(v: string): string {
  switch (v) {
    case 'EVERYONE': return 'All members';
    case 'CONNECTIONS_ONLY': return 'Connections only';
    case 'ADMIN_ONLY': return 'Admins only';
    default: return v;
  }
}

export function parseCsv(text: string): { firstName: string; lastName: string; email: string }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: { firstName: string; lastName: string; email: string }[] = [];
  for (const line of lines) {
    const cells = line.split(/[,;\t]/).map(c => c.trim());
    if (cells.length < 3) continue;
    // Skip header rows
    if (cells[0].toLowerCase().includes('first') && cells[2].toLowerCase().includes('email')) continue;
    rows.push({ firstName: cells[0], lastName: cells[1], email: cells[2] });
  }
  return rows;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
