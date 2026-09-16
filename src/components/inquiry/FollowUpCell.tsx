import { formatDate, relativeDay, todayISO } from '@/utils/date';
import { cx } from '@/utils/format';

export function FollowUpCell({ date }: { date?: string | null }) {
  if (!date) return <span className="text-slate-400">—</span>;
  const today = todayISO();
  const overdue = date < today;
  const isToday = date === today;
  return (
    <div className="leading-tight">
      <p className={cx('text-sm', overdue ? 'font-semibold text-red-600' : isToday ? 'font-semibold text-amber-700' : 'text-slate-700')}>{formatDate(date, { day: '2-digit', month: 'short' })}</p>
      <p className={cx('text-[11px]', overdue ? 'text-red-500' : 'text-slate-400')}>{relativeDay(date)}</p>
    </div>
  );
}
