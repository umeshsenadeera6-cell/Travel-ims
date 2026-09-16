import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, CreditCard, Eye, Luggage, Wallet, XCircle, Loader } from 'lucide-react';
import type { Booking, BookingStatus, PaymentStatus } from '@/types';
import { balanceAmount, bookingService, paidAmount } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTableState } from '@/hooks/useTableState';
import { PaymentModal } from '@/components/inquiry/BookingModals';
import { ActionMenu, BookingBadge, Card, ConfirmDialog, DataTable, EmptyState, FilterBar, KpiCard, PageHeader, Pagination, PaymentBadge, Spinner, type Column } from '@/components/ui';
import { formatDate, todayISO } from '@/utils/date';
import { compactNumber, formatMoney, toUSD } from '@/utils/format';
import { executivesFor } from '@/utils/departments';

export default function BookingsPage() {
  const { user, can, scope } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading } = useWorkspaceData();
  const [payFor, setPayFor] = useState<Booking | null>(null);
  const [cancel, setCancel] = useState<Booking | null>(null);
  const inqById = useMemo(() => new Map((data?.inquiries ?? []).map((i) => [i.id, i])), [data]);
  const items = data?.bookings ?? [];
  const execs = executivesFor(data?.users ?? [], scope);

  const t = useTableState<Booking>({
    items,
    searchFields: (b) => [b.id, b.inquiryId, b.customerName, b.packageName],
    filterFns: {
      paymentStatus: (b, v) => b.paymentStatus === v,
      bookingStatus: (b, v) => b.bookingStatus === v,
      type: (b, v) => inqById.get(b.inquiryId)?.type === v,
      travel: (b, v) => (v === 'upcoming' ? b.travelDate >= todayISO() : b.travelDate < todayISO()),
      assignedTo: (b, v) => inqById.get(b.inquiryId)?.assignedTo === v,
    },
    sorters: { id: (b) => b.id, travel: (b) => b.travelDate, total: (b) => toUSD(b.totalAmount, b.currency), balance: (b) => toUSD(balanceAmount(b), b.currency) },
    initialSort: { key: 'id', dir: 'desc' },
  });

  if (loading || !data) return <Spinner />;
  const manage = can('booking.manage');
  const setStatus = async (b: Booking, s: BookingStatus) => {
    await bookingService.setStatus(b.id, s, user);
    toast(`${b.id} marked as ${s}`);
  };
  const actions = (b: Booking) => [
    { label: 'View inquiry', icon: <Eye />, onClick: () => navigate(`/inquiries/${b.inquiryId}`) },
    { label: 'Record payment', icon: <CreditCard />, onClick: () => setPayFor(b), hidden: !manage || b.paymentStatus === 'Paid' || b.bookingStatus === 'Cancelled' },
    { label: 'Mark Processing', icon: <Loader />, onClick: () => setStatus(b, 'Processing'), hidden: !manage || b.bookingStatus !== 'Confirmed' },
    { label: 'Mark Confirmed', icon: <BadgeCheck />, onClick: () => setStatus(b, 'Confirmed'), hidden: !manage || b.bookingStatus !== 'Processing' },
    { label: 'Mark Completed', icon: <CheckCircle2 />, onClick: () => setStatus(b, 'Completed'), hidden: !manage || ['Completed', 'Cancelled'].includes(b.bookingStatus) },
    { label: 'Cancel booking', icon: <XCircle />, onClick: () => setCancel(b), danger: true, hidden: !manage || ['Completed', 'Cancelled'].includes(b.bookingStatus) },
  ];

  const active = items.filter((b) => b.bookingStatus !== 'Cancelled');
  const outstanding = active.reduce((s, b) => s + toUSD(balanceAmount(b), b.currency), 0);
  const value = active.reduce((s, b) => s + toUSD(b.totalAmount, b.currency), 0);

  const columns: Column<Booking>[] = [
    { key: 'id', header: 'Booking ID', sortKey: 'id', render: (b) => <span className="font-semibold text-slate-800">{b.id}</span> },
    { key: 'inq', header: 'Inquiry ID', render: (b) => <Link to={`/inquiries/${b.inquiryId}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand-700 hover:underline">{b.inquiryId}</Link> },
    { key: 'customer', header: 'Customer', render: (b) => <Link to={`/customers/${b.customerId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{b.customerName}</Link> },
    { key: 'package', header: 'Package', render: (b) => <span className="block max-w-[180px] truncate" title={b.packageName}>{b.packageName}</span> },
    { key: 'travel', header: 'Travel Date', sortKey: 'travel', render: (b) => formatDate(b.travelDate) },
    { key: 'pax', header: 'Travelers', align: 'center', render: (b) => b.travelers },
    { key: 'total', header: 'Total Amount', sortKey: 'total', align: 'right', render: (b) => <span className="tabular-nums">{formatMoney(b.totalAmount, b.currency)}</span> },
    { key: 'paid', header: 'Paid', align: 'right', render: (b) => <span className="text-emerald-700 tabular-nums">{paidAmount(b).toLocaleString()}</span> },
    { key: 'balance', header: 'Balance', sortKey: 'balance', align: 'right', render: (b) => <span className={`font-semibold tabular-nums ${balanceAmount(b) > 0 && b.bookingStatus !== 'Cancelled' ? 'text-red-600' : 'text-slate-500'}`}>{balanceAmount(b).toLocaleString()}</span> },
    { key: 'pay', header: 'Payment Status', render: (b) => <PaymentBadge status={b.paymentStatus} /> },
    { key: 'status', header: 'Booking Status', render: (b) => <BookingBadge status={b.bookingStatus} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', sticky: true, render: (b) => <ActionMenu items={actions(b)} /> },
  ];

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Confirmed trips, payments and balances" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Active bookings" value={active.length} icon={<Luggage className="size-5" />} />
        <KpiCard label="Booking value" value={`$${compactNumber(value)}`} icon={<Wallet className="size-5" />} tone="emerald" hint="USD equivalent" />
        <KpiCard label="Outstanding balance" value={`$${compactNumber(outstanding)}`} icon={<CreditCard className="size-5" />} tone="red" hint="USD equivalent" />
        <KpiCard label="Fully paid" value={items.filter((b) => b.paymentStatus === 'Paid').length} icon={<CheckCircle2 className="size-5" />} tone="blue" />
      </div>
      <Card padded={false} className="overflow-hidden">
        <FilterBar
          search={t.search}
          onSearch={t.setSearch}
          placeholder="Search booking, inquiry, customer or package…"
          filters={[
            { key: 'travel', label: 'Travel date', options: [{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }] },
            { key: 'paymentStatus', label: 'Payment status', options: ['Pending', 'Partial', 'Paid'] satisfies PaymentStatus[] },
            { key: 'bookingStatus', label: 'Booking status', options: ['Confirmed', 'Processing', 'Completed', 'Cancelled'] satisfies BookingStatus[] },
            ...(scope === 'All' ? [{ key: 'type', label: 'Inbound / Outbound', options: ['Inbound', 'Outbound'] }] : []),
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
          rowKey={(b) => b.id}
          sort={t.sort}
          onSort={t.toggleSort}
          onRowClick={(b) => navigate(`/inquiries/${b.inquiryId}`)}
          empty={<EmptyState icon={<Luggage className="size-5" />} title="No bookings found" />}
          mobileCard={(b) => (
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-700">{b.id}</span><BookingBadge status={b.bookingStatus} /><PaymentBadge status={b.paymentStatus} /></div>
                <p className="mt-1 font-medium text-slate-900">{b.customerName}</p>
                <p className="truncate text-xs text-slate-500">{b.packageName} · {formatDate(b.travelDate)} · {b.travelers} pax</p>
                <div className="mt-1.5 flex gap-4 text-xs">
                  <span>Total <b className="tabular-nums">{formatMoney(b.totalAmount, b.currency)}</b></span>
                  <span className="text-red-600">Balance <b className="tabular-nums">{balanceAmount(b).toLocaleString()}</b></span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}><ActionMenu items={actions(b)} /></div>
            </div>
          )}
        />
        <Pagination page={t.page} pageCount={t.pageCount} total={t.filtered.length} pageSize={t.pageSize} onPage={t.setPage} onPageSize={t.setPageSize} />
      </Card>
      <PaymentModal open={!!payFor} onClose={() => setPayFor(null)} booking={payFor} />
      <ConfirmDialog open={!!cancel} onClose={() => setCancel(null)} danger title="Cancel booking?" confirmLabel="Cancel booking" message={<>This will mark <b>{cancel?.id}</b> as cancelled and update the inquiry status.</>} onConfirm={() => cancel && setStatus(cancel, 'Cancelled')} />
    </div>
  );
}
