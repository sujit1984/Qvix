import numeral from 'numeral';

/**
 * Format a large number for display (e.g. 1200000 -> "1.2M")
 */
export function formatViews(n: number): string {
  if (n >= 1_000_000) return numeral(n).format('0.0a').toUpperCase();
  if (n >= 1_000) return numeral(n).format('0a').toUpperCase();
  return String(n);
}

/**
 * Format duration seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Merge Tailwind class names safely */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
