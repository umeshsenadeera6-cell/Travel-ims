import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cx } from '@/utils/format';
import type { SortDir } from '@/hooks/useTableState';
import { EmptyState } from './Card';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortKey?: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
  sticky?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  mobileCard: (row: T) => ReactNode;
  sort?: { key: string; dir: SortDir };
  onSort?: (key: string) => void;
  empty?: ReactNode;
  rowClassName?: (row: T) => string | undefined;
}

/**
 * Responsive table: full data grid from `lg` up, stacked cards below.
 */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, mobileCard, sort, onSort, empty, rowClassName }: Props<T>) {
  if (rows.length === 0) return <>{empty ?? <EmptyState title="No records found" description="Try adjusting your search or filters." />}</>;
  return (
    <>
      <div className="scrollbar-thin hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.sortKey;
                return (
                  <th key={c.key} className={cx('th', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.sticky && 'sticky right-0 bg-slate-50', c.className)} scope="col">
                    {c.sortKey && onSort ? (
                      <button className={cx('inline-flex items-center gap-1 uppercase hover:text-slate-800', active && 'text-slate-800')} onClick={() => onSort(c.sortKey!)}>
                        {c.header}
                        {active ? sort!.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx('group transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-50/40', rowClassName?.(row))}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx('td', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.sticky && 'sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-[#f6fbf9]', c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 lg:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cx('px-4 py-3.5', onRowClick && 'cursor-pointer active:bg-slate-50', rowClassName?.(row))}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {mobileCard(row)}
          </li>
        ))}
      </ul>
    </>
  );
}
