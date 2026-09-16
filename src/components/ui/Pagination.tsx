import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/utils/format';

export function Pagination({ page, pageCount, total, pageSize, onPage, onPageSize }: { page: number; pageCount: number; total: number; pageSize: number; onPage: (p: number) => void; onPageSize?: (s: number) => void }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pages: Array<number | '…'> = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row">
      <div className="flex items-center gap-3 text-slate-500">
        <span>
          Showing <b className="font-medium text-slate-700">{from}–{to}</b> of <b className="font-medium text-slate-700">{total}</b>
        </span>
        {onPageSize && (
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs" aria-label="Rows per page">
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cx('min-w-8 rounded-md px-2 py-1 text-sm font-medium tabular-nums', p === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
            >
              {p}
            </button>
          ),
        )}
        <button disabled={page === pageCount} onClick={() => onPage(page + 1)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}
