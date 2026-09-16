/**
 * Storage adapter — the ONLY module that touches localStorage.
 *
 * Phase 2: replace the repository implementation below with HTTP calls
 * (e.g. fetch(`/api/${collection}`)) and keep the same Promise-based
 * signatures. Components and hooks will not need to change.
 */
import { buildSeedData } from '@/data/mockData';

const NS = 'serendib-ims:v2:'; // v2: Inbound & Outbound departments
const SEED_FLAG = `${NS}seeded`;
const LATENCY_MS = 60; // tiny simulated network latency

export type CollectionKey =
  | 'users' | 'customers' | 'inquiries' | 'followups' | 'quotations'
  | 'bookings' | 'packages' | 'notes' | 'activities';

const memoryFallback = new Map<string, string>();

function rawGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}
function rawSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memoryFallback.set(key, value);
  }
}
function rawRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    memoryFallback.delete(key);
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = rawGet(NS + key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
export function writeJSON<T>(key: string, value: T) {
  rawSet(NS + key, JSON.stringify(value));
}
export function removeKey(key: string) {
  rawRemove(NS + key);
}

// ── Change notifications (lets hooks refetch after mutations) ─────
type Listener = (key: string) => void;
const listeners = new Set<Listener>();
export const dataEvents = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(key: string) {
    listeners.forEach((l) => l(key));
  },
};

export const delay = <T,>(value: T, ms = LATENCY_MS) => new Promise<T>((r) => setTimeout(() => r(value), ms));

// ── Seeding ──────────────────────────────────────────────────────
export function ensureSeeded(force = false) {
  if (!force && rawGet(SEED_FLAG)) return;
  const seed = buildSeedData();
  (Object.keys(seed) as Array<keyof typeof seed>).forEach((k) => writeJSON(k, seed[k]));
  rawSet(SEED_FLAG, new Date().toISOString());
}

export function resetDemoData() {
  ensureSeeded(true);
  dataEvents.emit('*');
}

// ── Generic repository ──────────────────────────────────────────
export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
  /** synchronous snapshot — used internally by services only */
  snapshot(): T[];
}

export function createRepository<T extends { id: string }>(key: CollectionKey): Repository<T> {
  const load = () => readJSON<T[]>(key, []);
  const save = (items: T[]) => {
    writeJSON(key, items);
    dataEvents.emit(key);
  };
  return {
    snapshot: load,
    async list() {
      return delay(load());
    },
    async get(id) {
      return delay(load().find((x) => x.id === id));
    },
    async create(item) {
      const items = load();
      items.push(item);
      save(items);
      return delay(item);
    },
    async update(id, patch) {
      const items = load();
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error(`${key}: record ${id} not found`);
      items[idx] = { ...items[idx], ...patch };
      save(items);
      return delay(items[idx]);
    },
    async remove(id) {
      save(load().filter((x) => x.id !== id));
      return delay(undefined);
    },
  };
}
