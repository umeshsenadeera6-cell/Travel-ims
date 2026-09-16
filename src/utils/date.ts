/** Date helpers. All stored dates are ISO strings (YYYY-MM-DD for dates). */

export const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(base: Date | string, days: number): Date {
  const d = typeof base === 'string' ? parseDate(base) : new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysFromToday(days: number): string {
  return toISODate(addDays(new Date(), days));
}

/** Parse YYYY-MM-DD as a local date (avoids UTC shift). */
export function parseDate(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

export function diffDays(a: string, b: string): number {
  const ms = parseDate(a).setHours(0, 0, 0, 0) - parseDate(b).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function formatDate(s?: string | null, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }): string {
  if (!s) return '—';
  const d = parseDate(s);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', opts);
}

export function formatDateTime(s?: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatTime(t?: string): string {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ampm}`;
}

export function relativeDay(s?: string | null): string {
  if (!s) return '—';
  const diff = diffDays(s, todayISO());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${-diff}d overdue`;
  return `in ${diff}d`;
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export function nightsBetween(from?: string, to?: string): number {
  if (!from || !to) return 0;
  return Math.max(0, diffDays(to, from));
}
