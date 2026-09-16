import type { Currency } from '@/types';

export function formatMoney(amount: number, currency: Currency = 'USD'): string {
  const digits = currency === 'LKR' ? 0 : 0;
  return `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function compactNumber(n: number): string {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Indicative FX rates used for consolidated (USD) reporting in Phase 1. */
export const USD_RATES: Record<Currency, number> = { USD: 1, EUR: 1.09, GBP: 1.27, AUD: 0.66, LKR: 1 / 300 };
export const toUSD = (amount: number, c: Currency) => amount * USD_RATES[c];

export function percent(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
