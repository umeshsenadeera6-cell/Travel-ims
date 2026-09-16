import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Eye, FileText, Mail, Pencil, Plus, XCircle, Clock } from 'lucide-react';
import type { Quotation, QuotationStatus } from '@/types';
import { quotationService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTableState } from '@/hooks/useTableState';
import { QuotationModal } from '@/components/inquiry/QuotationModal';
import { QuotationPreview } from '@/components/inquiry/QuotationPreview';
import { ActionMenu, Button, Card, DataTable, DATE_RANGE_OPTIONS, EmptyState, FilterBar, KpiCard, matchDateRange, PageHeader, Pagination, QuotationBadge, Spinner, type Column } from '@/components/ui';
import { formatDate } from '@/utils/date';
import { compactNumber, formatMoney, toUSD } from '@/utils/format';
import { CURRENCIES } from '@/types';
import { executivesFor } from '@/utils/departments';

const STATUSES: QuotationStatus[] = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

export default function QuotationsPage() {
  const { user, can, scope } = useAuth();
  const toast = useToast();
  const { data, loading } = useWorkspaceData();
  const [modal, setModal] = useState<{ q?: Quotation | null } | null>(null);
  const [preview, setPreview] = useState<Quotation | null>(null);

  const inqById = useMemo(() => new Map((data?.inquiries ?? []).map((i) => [i.id, i])), [data]);
  const items = data?.quotations ?? [];
  const execs = executivesFor(data?.users ?? [], scope);

  const t = useTableState<Quotation>({
    items,
    searchFields: (q) => [q.id, q.inquiryId, q.customerName, q.destination],
    filterFns: {
      date: (q, v) => matchDateRange(q.date, v),
      status: (q, v) => q.status === v,
      currency: (q, v) => q.currency === v,
      type: (q, v) => inqById.get(q.inquiryId)?.type === v,
      assignedTo: (q, v) => inqById.get(q.inquiryId)?.assignedTo === v,
      priority: (q, v) => inqById.get(q.inquiryId)?.priority === v,
    },
    sorters: { id: (q) => q.id, date: (q) => q.date, amount: (q) => toUSD(q.total, q.currency), customer: (q) => q.customerName },
    initialSort: { key: 'id', dir: 'desc' },
  });

  if (loading || !data) return <Spinner />;

  const setStatus = async (q: Quotation, s: QuotationStatus) => {
    await quotationService.setStatus(q.id, s, user);
    toast(`${q.id} marked as ${s}`);
  };
  const manage = can('quotation.manage');
  const actions = (q: Quotation) => [
    { label: 'Preview', icon: <Eye />, onClick: () => setPreview(q) },
    { label: 'Edit', icon: <Pencil />, onClick: () => setModal({ q }), hidden: !manage },
    { label: 'Mark as Sent', icon: <Mail />, onClick: () => setStatus(q, 'Sent'), hidden: !manage || q.status !== 'Draft' },
    { label: 'Mark as Accepted', icon: <BadgeCheck />, onClick: () => setStatus(q, 'Accepted'), hidden: !manage || !['Sent', 'Draft'].includes(q.status) },
    { label: 'Mark as Rejected', icon: <XCircle />, onClick: () => setStatus(q, 'Rejected'), hidden: !manage || q.status !== 'Sent' },
    { label: 'Mark as Expired', icon: <Clock />, onClick: () => setStatus(q, 'Expired'), hidden: !manage || q.status !== 'Sent' },
  ];

  const count = (s: QuotationStatus) => items.filter((q) => q.status === s).length;
  const pipelineUSD = items.filter((q) => q.status === 'Sent').reduce((s, q) => s + toUSD(q.total, q.currency), 0);

  const columns: Column<Quotation>[] = [
    { key: 'id', header: 'Quotation No', sortKey: 'id', render: (q) => <span className="font-semibold text-slate-800">{q.id}</span> },
    { key: 'inq', header: 'Inquiry ID', render: (q) => <Link to={`/inquiries/${q.inquiryId}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand-700 hover:underline">{q.inquiryId}</Link> },
    { key: 'customer', header: 'Customer', sortKey: 'customer', render: (q) => q.customerName },
    { key: 'dest', header: 'Destination', render: (q) => <span className="block max-w-[200px] truncate" title={q.destination}>{q.destination}</span> },
    { key: 'date', header: 'Date', sortKey: 'date', render: (q) => formatDate(q.date) },
    { key: 'amount', header: 'Amount', sortKey: 'amount', align: 'right', render: (q) => <span className="font-semibold tabular-nums">{q.total.toLocaleString()}</span> },
    { key: 'currency', header: 'Currency', render: (q) => q.currency },
    { key: 'status', header: 'Status', render: (q) => <QuotationBadge status={q.status} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', sticky: true, render: (q) => <ActionMenu items={actions(q)} /> },
  ];

  return (
    <div>
      <PageHeader title="Quotations" subtitle="Prepare, send and track customer quotations" actions={manage && <Button icon={<Plus className="size-4" />} onClick={() => setModal({})}>New Quotation</Button>} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Drafts" value={count('Draft')} icon={<FileText className="size-5" />} tone="slate" />
        <KpiCard label="Sent — awaiting reply" value={count('Sent')} icon={<Mail className="size-5" />} tone="blue" hint={`≈ USD ${compactNumber(pipelineUSD)} in pipeline`} />
        <KpiCard label="Accepted" value={count('Accepted')} icon={<BadgeCheck className="size-5" />} tone="emerald" />
        <KpiCard label="Rejected / Expired" value={count('Rejected') + count('Expired')} icon={<XCircle className="size-5" />} tone="red" />
      </div>
      <Card padded={false} className="overflow-hidden">
        <FilterBar
          search={t.search}
          onSearch={t.setSearch}
          placeholder="Search quotation no, inquiry, customer, destination…"
          filters={[
            { key: 'date', label: 'Date', type: 'date', options: DATE_RANGE_OPTIONS },
            { key: 'status', label: 'Status', options: STATUSES },
            ...(scope === 'All' ? [{ key: 'type', label: 'Inbound / Outbound', options: ['Inbound', 'Outbound'] }] : []),
            { key: 'currency', label: 'Currency', options: CURRENCIES },
            { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
            ...(user?.role !== 'Sales Executive' ? [{ key: 'assignedTo', label: 'Executive', options: execs.map((e) => ({ value: e.id, label: e.name })) }] : []),
          ]}
          values={t.filters}
          onFilter={t.setFilter}
          onClear={t.clearFilters}
          activeCount={t.activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={t.pageItems}
          rowKey={(q) => q.id}
          sort={t.sort}
          onSort={t.toggleSort}
          onRowClick={(q) => setPreview(q)}
          empty={<EmptyState icon={<FileText className="size-5" />} title="No quotations found" />}
          mobileCard={(q) => (
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-700">{q.id}</span><QuotationBadge status={q.status} /></div>
                <p className="mt-1 font-medium text-slate-900">{q.customerName}</p>
                <p className="truncate text-xs text-slate-500">{q.inquiryId} · {q.destination} · {formatDate(q.date)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">{formatMoney(q.total, q.currency)}</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}><ActionMenu items={actions(q)} /></div>
            </div>
          )}
        />
        <Pagination page={t.page} pageCount={t.pageCount} total={t.filtered.length} pageSize={t.pageSize} onPage={t.setPage} onPageSize={t.setPageSize} />
      </Card>
      <QuotationModal open={!!modal} onClose={() => setModal(null)} quotation={modal?.q ?? null} />
      <QuotationPreview open={!!preview} onClose={() => setPreview(null)} quotation={preview} />
    </div>
  );
}
