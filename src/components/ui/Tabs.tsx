import type { ReactNode } from 'react';
import { cx } from '@/utils/format';

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: Array<{ value: T; label: ReactNode; count?: number; icon?: ReactNode }>; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('scrollbar-thin -mb-px flex gap-1 overflow-x-auto border-b border-slate-200', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            'flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
            value === t.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
          )}
        >
          {t.icon}
          {t.label}
          {t.count !== undefined && (
            <span className={cx('rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold', value === t.value ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx('rounded-md px-2.5 py-1 text-xs font-medium transition', value === o.value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
