import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarClock, CalendarDays, CheckCircle2, Pencil, TriangleAlert } from 'lucide-react';
import type { FollowUp } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTableState } from '@/hooks/useTableState';
import { FollowUpModal } from '@/components/inquiry/FollowUpModal';
import { ActionMenu, Avatar, Badge, Card, DataTable, EmptyState, FilterBar, KpiCard, PageHeader, Pagination, PriorityBadge, Spinner, Tabs, type Column } from '@/components/ui';
import { FOLLOWUP_TYPES, PRIORITY_META } from '@/utils/constants';
import { PRIORITIES } from '@/types';
import { formatDate, formatTime, relativeDay, todayISO } from '@/utils/date';
import { cx } from '@/utils/format';
import { executivesFor } from '@/utils/departments';

type Section = 'today' | 'overdue' | 'upcoming' | 'completed';

export default function FollowUpsPage() {
  const { user, can, scope } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useWorkspaceData();
  const [section, setSection] = useState<Section>('today');
  const [modal, setModal] = useState<{ fu: FollowUp; mode: 'edit' | 'reschedule' | 'complete' } | null>(null);
  const today = todayISO();

  const inqById = useMemo(() => new Map((data?.inquiries ?? []).map((i) => [i.id, i])), [data]);
  const userById = useMemo(() => new Map((data?.users ?? []).map((u) => [u.id, u])), [data]);
  const groups = useMemo(() => {
    const f = data?.followups ?? [];
    return {
      today: f.filter((x) => x.status === 'Pending' && x.date === today),
      overdue: f.filter((x) => x.status === 'Pending' && x.date < today),
      upcoming: f.filter((x) => x.status === 'Pending' && x.date > today),
      completed: f.filter((x) => x.status === 'Completed').sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date)),
    };
  }, [data, today]);

  const execs = executivesFor(data?.users ?? [], scope);
  const t = useTableState<FollowUp>({
    items: groups[section],
    searchFields: (f) => [f.customerName, f.inquiryId, f.notes, userById.get(f.assignedTo ?? '')?.name],
    filterFns: {
      type: (f, v) => f.type === v,
      assignedTo: (f, v) => f.assignedTo === v,
      inquiryType: (f, v) => inqById.get(f.inquiryId)?.type === v,
      priority: (f, v) => inqById.get(f.inquiryId)?.priority === v,
    },
    sorters: {
      date: (f) => `${f.date} ${f.time}`,
      customer: (f) => f.customerName,
      priority: (f) => Object.keys(PRIORITY_META).indexOf(inqById.get(f.inquiryId)?.priority ?? 'Low'),
    },
  });

  if (loading || !data) return <Spinner />;

  const actions = (f: FollowUp) =>
    f.status === 'Pending' && can('followup.manage')
      ? [
          { label: 'Complete', icon: <CheckCircle2 />, onClick: () => setModal({ fu: f, mode: 'complete' }) },
          { label: 'Reschedule', icon: <CalendarClock />, onClick: () => setModal({ fu: f, mode: 'reschedule' }) },
          { label: 'Edit', icon: <Pencil />, onClick: () => setModal({ fu: f, mode: 'edit' }) },
        ]
      : [];

  const columns: Column<FollowUp>[] = [
    { key: 'customer', header: 'Customer', sortKey: 'customer', render: (f) => <span className="font-medium text-slate-800">{f.customerName}</span> },
    { key: 'inq', header: 'Inquiry ID', render: (f) => <Link to={`/inquiries/${f.inquiryId}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-brand-700 hover:underline">{f.inquiryId}</Link> },
    { key: 'date', header: 'Follow-up Date', sortKey: 'date', render: (f) => (
      <div className="leading-tight">
        <p className={cx(f.status === 'Pending' && f.date < today && 'font-semibold text-red-600')}>{formatDate(f.date)}</p>
        {f.status === 'Pending' && <p className={cx('text-[11px]', f.date < today ? 'text-red-500' : 'text-slate-400')}>{relativeDay(f.date)}</p>}
      </div>
    ) },
    { key: 'time', header: 'Time', render: (f) => formatTime(f.time) },
    { key: 'exec', header: 'Sales Executive', render: (f) => { const u = userById.get(f.assignedTo ?? ''); return u ? <span className="inline-flex items-center gap-2"><Avatar name={u.name} color={u.avatarColor} size="sm" />{u.name}</span> : '—'; } },
    { key: 'type', header: 'Type', render: (f) => f.type },
    { key: 'priority', header: 'Priority', sortKey: 'priority', render: (f) => { const i = inqById.get(f.inquiryId); return i ? <PriorityBadge priority={i.priority} /> : null; } },
    { key: 'status', header: 'Status', render: (f) => <Badge tone={f.status === 'Completed' ? 'green' : f.date < today ? 'red' : f.date === today ? 'amber' : 'blue'} dot>{f.status === 'Completed' ? 'Completed' : f.date < today ? 'Overdue' : f.date === today ? 'Due today' : 'Scheduled'}</Badge> },
    { key: 'notes', header: 'Notes', render: (f) => <span className="block max-w-[260px] truncate text-slate-500" title={f.outcome || f.notes}>{f.outcome || f.notes}</span> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', sticky: true, render: (f) => <ActionMenu items={actions(f)} /> },
  ];

  return (
    <div>
      <PageHeader title="Follow-ups" subtitle={user?.role === 'Sales Executive' ? 'Your scheduled customer touchpoints' : 'Customer touchpoints across the sales team'} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Today's Follow-ups" value={groups.today.length} icon={<CalendarDays className="size-5" />} tone="amber" onClick={() => setSection('today')} />
        <KpiCard label="Overdue" value={groups.overdue.length} icon={<TriangleAlert className="size-5" />} tone="red" onClick={() => setSection('overdue')} />
        <KpiCard label="Upcoming" value={groups.upcoming.length} icon={<CalendarClock className="size-5" />} tone="blue" onClick={() => setSection('upcoming')} />
        <KpiCard label="Completed" value={groups.completed.length} icon={<CalendarCheck className="size-5" />} tone="emerald" onClick={() => setSection('completed')} />
      </div>

      <Tabs
        className="mb-4"
        value={section}
        onChange={setSection}
        tabs={[
          { value: 'today', label: "Today's Follow-ups", count: groups.today.length },
          { value: 'overdue', label: 'Overdue', count: groups.overdue.length },
          { value: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
          { value: 'completed', label: 'Completed', count: groups.completed.length },
        ]}
      />

      {section === 'overdue' && groups.overdue.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <TriangleAlert className="size-4" /> These follow-ups are past their due date — contact the customers as soon as possible.
        </div>
      )}

      <Card padded={false} className="overflow-hidden">
        <FilterBar
          search={t.search}
          onSearch={t.setSearch}
          placeholder="Search customer, inquiry ID or notes…"
          filters={[
            { key: 'type', label: 'Follow-up type', options: FOLLOWUP_TYPES },
            { key: 'priority', label: 'Priority', options: PRIORITIES },
            ...(user?.role !== 'Sales Executive' ? [{ key: 'assignedTo', label: 'Sales executive', options: execs.map((e) => ({ value: e.id, label: e.name })) }] : []),
            ...(scope === 'All' ? [{ key: 'inquiryType', label: 'Inbound / Outbound', options: ['Inbound', 'Outbound'] }] : []),
          ]}
          values={t.filters}
          onFilter={t.setFilter}
          onClear={t.clearFilters}
          activeCount={t.activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={t.pageItems}
          rowKey={(f) => f.id}
          sort={t.sort}
          onSort={t.toggleSort}
          onRowClick={(f) => navigate(`/inquiries/${f.inquiryId}`)}
          rowClassName={(f) => (f.status === 'Pending' && f.date < today ? 'bg-red-50/50 border-l-2 border-l-red-400' : undefined)}
          empty={<EmptyState icon={<CalendarCheck className="size-5" />} title={section === 'overdue' ? 'Nothing overdue' : 'No follow-ups here'} description={section === 'today' ? 'No follow-ups are due today.' : 'Try another section or adjust filters.'} />}
          mobileCard={(f) => (
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{f.customerName}</p>
                  {f.status === 'Pending' && f.date < today && <Badge tone="red">Overdue</Badge>}
                </div>
                <p className="text-xs text-slate-500">{f.inquiryId} · {f.type} · {userById.get(f.assignedTo ?? '')?.name ?? 'Unassigned'}</p>
                <p className={cx('mt-1 text-sm', f.status === 'Pending' && f.date < today ? 'font-semibold text-red-600' : 'text-slate-700')}>{formatDate(f.date)} · {formatTime(f.time)}</p>
                {(f.outcome || f.notes) && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{f.outcome || f.notes}</p>}
              </div>
              <div onClick={(e) => e.stopPropagation()}><ActionMenu items={actions(f)} /></div>
            </div>
          )}
        />
        <Pagination page={t.page} pageCount={t.pageCount} total={t.filtered.length} pageSize={t.pageSize} onPage={t.setPage} onPageSize={t.setPageSize} />
      </Card>
      <FollowUpModal open={!!modal} onClose={() => setModal(null)} followup={modal?.fu} mode={modal?.mode} />
    </div>
  );
}
