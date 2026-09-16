import { useState, type ReactNode } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cx } from '@/utils/format';
import { Button } from './Button';

export interface FilterDef {
  key: string;
  label: string;
  options: ReadonlyArray<string | { value: string; label: string }>;
  type?: 'select' | 'date';
}

interface Props {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  filters: FilterDef[];
  values: Record<string, string>;
  onFilter: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
  sortOptions?: Array<{ value: string; label: string }>;
  sortValue?: string;
  onSort?: (value: string) => void;
  extra?: ReactNode;
}

export function FilterBar({ search, onSearch, placeholder = 'Search…', filters, values, onFilter, onClear, activeCount, sortOptions, sortValue, onSort, extra }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="input pl-9" aria-label="Search" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sortOptions && onSort && (
            <select value={sortValue} onChange={(e) => onSort(e.target.value)} className="input h-10 w-auto py-0 text-sm" aria-label="Sort">
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          <Button variant={open || activeCount > (search ? 1 : 0) ? 'subtle' : 'secondary'} icon={<SlidersHorizontal className="size-4" />} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            Filters
            {activeCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[11px] leading-5 text-white">{activeCount}</span>}
          </Button>
          {activeCount > 0 && (
            <Button variant="ghost" icon={<X className="size-4" />} onClick={onClear}>
              Clear
            </Button>
          )}
          {extra}
        </div>
      </div>
      <div className={cx('mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6', !open && 'hidden')}>
        {filters.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{f.label}</span>
            {f.type === 'date' ? (
              <select value={values[f.key] ?? ''} onChange={(e) => onFilter(f.key, e.target.value)} className="input">
                <option value="">Any time</option>
                {f.options.map((o) => {
                  const opt = typeof o === 'string' ? { value: o, label: o } : o;
                  return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                })}
              </select>
            ) : (
              <select value={values[f.key] ?? ''} onChange={(e) => onFilter(f.key, e.target.value)} className="input">
                <option value="">All</option>
                {f.options.map((o) => {
                  const opt = typeof o === 'string' ? { value: o, label: o } : o;
                  return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                })}
              </select>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
];

export function matchDateRange(iso: string, range: string): boolean {
  if (!range) return true;
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === 'today') return d >= start;
  if (range === 'year') return d.getFullYear() === now.getFullYear();
  const days = Number(range.replace('d', ''));
  start.setDate(start.getDate() - (days - 1));
  return d >= start;
}
