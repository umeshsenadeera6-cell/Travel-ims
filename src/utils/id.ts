export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

/** Build sequential business IDs like INB-2026-00001 from existing IDs. */
export function nextSequentialId(prefix: string, existing: string[], digits = 5, year = new Date().getFullYear()): string {
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const max = existing.reduce((m, id) => {
    const match = id.match(re);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(digits, '0')}`;
}
