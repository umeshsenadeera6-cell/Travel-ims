import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Eye, Pencil, Plus, StickyNote, UserPlus, RefreshCw, Inbox } from 'lucide-react';
import { INQUIRY_STATUSES, PRIORITIES, SOURCES, type Inquiry } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTableState } from '@/hooks/useTableState';
import { useInquiryActions } from '@/components/inquiry/useInquiryActions';
import { FollowUpCell } from '@/components/inquiry/FollowUpCell';
import {
  ActionMenu, Avatar, Button, Card, DataTable, DATE_RANGE_OPTIONS, EmptyState, FilterBar, matchDateRange, PageHeader, Pagination, PriorityBadge, Spinner, StatusBadge, TypeBadge, type Column,
} from '@/components/ui';
import { formatDate, relativeDay, todayISO } from '@/utils/date';
import { destinationKey, inquiryCountry, inquiryDestination, travelerCount, travelStart } from '@/utils/inquiry';
import { PRIORITY_META } from '@/utils/constants';
import { executivesFor } from '@/utils/departments';


type Scope = 'Inbound' | 'Outbound' | 'Mine';

const SORTS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'nextFollowUp:asc', label: 'Next follow-up' },
  { value: 'priority:asc', label: 'Priority (high → low)' },
  { value: 'travel:asc', label: 'Travel date' },
  { value: 'customer:asc', label: 'Customer A–Z' },
];

export default function InquiriesPage({ scope: view }: { scope: Scope }) {
  const { user, can, scope: dept, canWorkIn } = useAuth();
  const scope = view;
  const navigate = useNavigate();
  const { data, loading } = useWorkspaceData();
  const { run, modals } = useInquiryActions();

  const items = useMemo(() => {
    if (!data || !user) return [];
    if (scope === 'Mine') return data.inquiries.filter((i) => i.assignedTo === user.id);
    return data.inquiries.filter((i) => i.type === scope);
  }, [data, scope, user]);

  const users = useMemo(() => new Map((data?.users ?? []).map((u) => [u.id, u])), [data]);
  const execs = executivesFor(data?.users ?? [], view === 'Mine' ? dept : view);
  const destinations = useMemo(() => [...new Set(items.map(destinationKey))].sort(), [items]);

  const t = useTableState<Inquiry>({
    items,
    searchFields: (i) => [i.id, i.customerName, i.email, i.phone, inquiryDestination(i), i.outbound?.packageName, inquiryCountry(i)],
    filterFns: {
      date: (i, v) => matchDateRange(i.createdAt, v),
      status: (i, v) => i.status === v,
      priority: (i, v) => i.priority === v,
      assignedTo: (i, v) => (v === '__none' ? !i.assignedTo : i.assignedTo === v),
      source: (i, v) => i.source === v,
      destination: (i, v) => destinationKey(i) === v,
      type: (i, v) => i.type === v,
    },
    sorters: {
      createdAt: (i) => i.createdAt,
      nextFollowUp: (i) => i.nextFollowUp ?? '9999',
      priority: (i) => Object.keys(PRIORITY_META).indexOf(i.priority),
      travel: (i) => travelStart(i),
      customer: (i) => i.customerName,
      id: (i) => i.id,
      status: (i) => INQUIRY_STATUSES.indexOf(i.status),
    },
    initialSort: { key: 'createdAt', dir: 'desc' },
  });

  if (loading || !data) return <Spinner />;

  const actions = (i: Inquiry) => [
    { label: 'View', icon: <Eye />, onClick: () => navigate(`/inquiries/${i.id}`) },
    { label: 'Edit', icon: <Pencil />, onClick: () => navigate(`/inquiries/${i.id}/edit`), hidden: !can('inquiry.edit') },
    { label: 'Assign', icon: <UserPlus />, onClick: () => run('assign', i), hidden: !can('inquiry.assign') },
    { label: 'Change status', icon: <RefreshCw />, onClick: () => run('status', i), hidden: !can('inquiry.edit') },
    { label: 'Follow-up', icon: <CalendarPlus />, onClick: () => run('followup', i), hidden: !can('followup.manage') },
    { label: 'Add Note', icon: <StickyNote />, onClick: () => run('note', i), hidden: !can('inquiry.edit') },
  ];

  const assignee = (i: Inquiry) => {
    const u = users.get(i.assignedTo ?? '');
    return u ? (
      <span className="inline-flex items-center gap-2"><Avatar name={u.name} color={u.avatarColor} size="sm" />{u.name.split(' ')[0]}</span>
    ) : (
      <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500">Unassigned</span>
    );
  };

  const idCell = (i: Inquiry) => (
    <div>
      <p className="font-semibold text-brand-700">{i.id}</p>
      {scope === 'Mine' && <div className="mt-0.5"><TypeBadge type={i.type} /></div>}
    </div>
  );
  const customerCell = (i: Inquiry) => (
    <div className="max-w-[180px]">
      <p className="truncate font-medium text-slate-800">{i.customerName}</p>
      <p className="truncate text-xs text-slate-500">{i.email}</p>
    </div>
  );

  const inboundCols: Column<Inquiry>[] = [
    { key: 'id', header: 'Inquiry ID', render: idCell, sortKey: 'id' },
    { key: 'date', header: 'Date', render: (i) => formatDate(i.createdAt), sortKey: 'createdAt' },
    { key: 'customer', header: 'Customer', render: customerCell, sortKey: 'customer' },
    { key: 'country', header: 'Country', render: (i) => inquiryCountry(i) },
    { key: 'dest', header: 'Destination', render: (i) => <span className="block max-w-[150px] truncate" title={inquiryDestination(i)}>{inquiryDestination(i)}</span> },
    { key: 'pax', header: 'Travelers', render: (i) => <span className="tabular-nums">{travelerCount(i)}</span>, align: 'center' },
    { key: 'source', header: 'Source', render: (i) => i.source },
    { key: 'assigned', header: 'Assigned To', render: assignee },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} />, sortKey: 'status' },
    { key: 'priority', header: 'Priority', render: (i) => <PriorityBadge priority={i.priority} />, sortKey: 'priority' },
    { key: 'fu', header: 'Next Follow-up', render: (i) => <FollowUpCell date={i.nextFollowUp} />, sortKey: 'nextFollowUp' },
    { key: 'actions', header: <span className="sr-only">Actions</span>, render: (i) => <ActionMenu items={actions(i)} />, align: 'right', sticky: true },
  ];

  const outboundCols: Column<Inquiry>[] = [
    { key: 'id', header: 'Inquiry ID', render: idCell, sortKey: 'id' },
    { key: 'date', header: 'Date', render: (i) => formatDate(i.createdAt), sortKey: 'createdAt' },
    { key: 'customer', header: 'Customer', render: customerCell, sortKey: 'customer' },
    { key: 'dest', header: 'Destination', render: (i) => inquiryDestination(i) },
    { key: 'travel', header: 'Travel Date', render: (i) => formatDate(travelStart(i)), sortKey: 'travel' },
    { key: 'pax', header: 'Travelers', render: (i) => <span className="tabular-nums">{travelerCount(i)}</span>, align: 'center' },
    { key: 'package', header: 'Package', render: (i) => <span className="block max-w-[170px] truncate">{i.outbound?.packageName ?? '—'}</span> },
    { key: 'source', header: 'Source', render: (i) => i.source },
    { key: 'assigned', header: 'Assigned To', render: assignee },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} />, sortKey: 'status' },
    { key: 'priority', header: 'Priority', render: (i) => <PriorityBadge priority={i.priority} />, sortKey: 'priority' },
    { key: 'fu', header: 'Next Follow-up', render: (i) => <FollowUpCell date={i.nextFollowUp} />, sortKey: 'nextFollowUp' },
    { key: 'actions', header: <span className="sr-only">Actions</span>, render: (i) => <ActionMenu items={actions(i)} />, align: 'right', sticky: true },
  ];

  const mineCols: Column<Inquiry>[] = [
    inboundCols[0], inboundCols[1], inboundCols[2], inboundCols[4],
    { key: 'travel', header: 'Travel Date', render: (i) => formatDate(travelStart(i)), sortKey: 'travel' },
    inboundCols[5], inboundCols[6], inboundCols[8], inboundCols[9], inboundCols[10], inboundCols[11],
  ];

  const columns = scope === 'Inbound' ? inboundCols : scope === 'Outbound' ? outboundCols : mineCols;
  const title = scope === 'Mine' ? 'My Inquiries' : `${scope} Inquiries`;
  const subtitle =
    scope === 'Inbound' ? 'Inbound Department · foreign travellers planning tours in Sri Lanka' : scope === 'Outbound' ? 'Outbound Department · Sri Lankans travelling abroad' : user?.role === 'Sales Executive' ? 'Only inquiries assigned to you are shown' : 'Inquiries assigned to you';
  const newPath = scope === 'Outbound' ? '/inquiries/outbound/new' : '/inquiries/inbound/new';

  const filters = [
    { key: 'date', label: 'Date', type: 'date' as const, options: DATE_RANGE_OPTIONS },
    ...(scope === 'Mine' && user?.department === 'All' ? [{ key: 'type', label: 'Type', options: ['Inbound', 'Outbound'] }] : []),
    { key: 'status', label: 'Status', options: INQUIRY_STATUSES },
    { key: 'priority', label: 'Priority', options: PRIORITIES },
    ...(scope !== 'Mine' && user?.role !== 'Sales Executive' ? [{ key: 'assignedTo', label: 'Assigned executive', options: [{ value: '__none', label: 'Unassigned' }, ...execs.map((e) => ({ value: e.id, label: e.name }))] }] : []),
    { key: 'source', label: 'Source', options: SOURCES },
    { key: 'destination', label: 'Destination', options: destinations },
  ];

  const sortValue = t.sort ? `${t.sort.key}:${t.sort.dir}` : '';

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${subtitle} · ${items.length} total`}
        actions={
          can('inquiry.create') && (
            scope === 'Mine' ? (
              <>
                {canWorkIn('Outbound') && <Button variant={canWorkIn('Inbound') ? 'secondary' : 'primary'} icon={<Plus className="size-4" />} onClick={() => navigate('/inquiries/outbound/new')}>New Outbound</Button>}
                {canWorkIn('Inbound') && <Button icon={<Plus className="size-4" />} onClick={() => navigate('/inquiries/inbound/new')}>New Inbound</Button>}
              </>
            ) : (
              <Button icon={<Plus className="size-4" />} onClick={() => navigate(newPath)}>New {scope} Inquiry</Button>
            )
          )
        }
      />

      <Card padded={false} className="overflow-hidden">
        <FilterBar
          search={t.search}
          onSearch={t.setSearch}
          placeholder="Search by ID, customer, email, phone or destination…"
          filters={filters}
          values={t.filters}
          onFilter={t.setFilter}
          onClear={t.clearFilters}
          activeCount={t.activeFilterCount}
          sortOptions={SORTS}
          sortValue={sortValue}
          onSort={(v) => { const [key, dir] = v.split(':'); t.setSort({ key, dir: dir as 'asc' | 'desc' }); }}
        />
        <DataTable
          columns={columns}
          rows={t.pageItems}
          rowKey={(i) => i.id}
          onRowClick={(i) => navigate(`/inquiries/${i.id}`)}
          sort={t.sort}
          onSort={t.toggleSort}
          empty={
            <EmptyState
              icon={<Inbox className="size-5" />}
              title={items.length ? 'No inquiries match your filters' : 'No inquiries yet'}
              description={items.length ? 'Try a different search term or clear the filters.' : 'New inquiries will appear here.'}
              action={items.length ? <Button variant="secondary" onClick={t.clearFilters}>Clear filters</Button> : undefined}
            />
          }
          mobileCard={(i) => (
            <div className="flex gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-brand-700">{i.id}</span>
                  {scope === 'Mine' && <TypeBadge type={i.type} />}
                  <PriorityBadge priority={i.priority} />
                </div>
                <p className="font-medium text-slate-900">{i.customerName}</p>
                <p className="text-xs text-slate-500">
                  {inquiryDestination(i)} · {travelerCount(i)} pax · {formatDate(travelStart(i))}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <StatusBadge status={i.status} />
                  <span className="text-xs text-slate-500">{users.get(i.assignedTo ?? '')?.name ?? 'Unassigned'}</span>
                </div>
                {i.nextFollowUp && <p className={`text-xs ${i.nextFollowUp < todayISO() ? 'font-semibold text-red-600' : 'text-slate-500'}`}>Next follow-up: {formatDate(i.nextFollowUp, { day: '2-digit', month: 'short' })} · {relativeDay(i.nextFollowUp)}</p>}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ActionMenu items={actions(i)} />
              </div>
            </div>
          )}
        />
        <Pagination page={t.page} pageCount={t.pageCount} total={t.filtered.length} pageSize={t.pageSize} onPage={t.setPage} onPageSize={t.setPageSize} />
      </Card>
      {modals}
    </div>
  );
}
