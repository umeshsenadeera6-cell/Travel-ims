import { useEffect, useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export interface TableStateOptions<T> {
  items: T[];
  searchFields: (item: T) => Array<string | number | undefined | null>;
  filterFns?: Record<string, (item: T, value: string) => boolean>;
  sorters?: Record<string, (item: T) => string | number>;
  initialSort?: { key: string; dir: SortDir };
  pageSize?: number;
}

/** Search + filters + sort + pagination for any list page. */
export function useTableState<T>({ items, searchFields, filterFns = {}, sorters = {}, initialSort, pageSize = 10 }: TableStateOptions<T>) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | undefined>(initialSort);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let out = items.filter((item) => {
      if (term && !searchFields(item).some((v) => String(v ?? '').toLowerCase().includes(term))) return false;
      return Object.entries(filters).every(([k, v]) => !v || !filterFns[k] || filterFns[k](item, v));
    });
    if (sort && sorters[sort.key]) {
      const get = sorters[sort.key];
      out = [...out].sort((a, b) => {
        const av = get(a), bv = get(b);
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  useEffect(() => setPage(1), [search, filters, size]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = filtered.slice((page - 1) * size, page * size);
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  return {
    search, setSearch,
    filters, setFilter: (key: string, value: string) => setFilters((f) => ({ ...f, [key]: value })),
    clearFilters: () => { setFilters({}); setSearch(''); },
    sort, setSort,
    toggleSort: (key: string) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })),
    page, setPage, pageSize: size, setPageSize: setSize, pageCount,
    filtered, pageItems, activeFilterCount,
  };
}
