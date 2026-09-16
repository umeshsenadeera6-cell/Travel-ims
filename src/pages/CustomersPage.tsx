import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, Users } from 'lucide-react';
import type { Customer, CustomerStatus } from '@/types';
import type { CustomerWithStats } from '@/services/customerService';
import { customerService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useTableState } from '@/hooks/useTableState';
import { ActionMenu, Avatar, Badge, Button, Card, DataTable, DATE_RANGE_OPTIONS, EmptyState, Field, FilterBar, Input, matchDateRange, Modal, PageHeader, Pagination, Select, Spinner, Textarea, type Column } from '@/components/ui';
import { formatDate } from '@/utils/date';
import { COUNTRIES } from '@/utils/constants';

const STATUS_TONE = { Active: 'green', VIP: 'violet', Inactive: 'gray' } as const;
export const CustomerStatusBadge = ({ status }: { status: CustomerStatus }) => <Badge tone={STATUS_TONE[status]} dot>{status}</Badge>;

export default function CustomersPage() {
  const { can, scope, user } = useAuth();
  const isSales = user?.role === 'Sales Executive';
  const navigate = useNavigate();
  const { data, loading } = useWorkspaceData();
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  // Sales executives: customer stats only count their own inquiries and bookings.
  const items = useMemo(() => {
    const list = data?.customers ?? [];
    if (!isSales || !data) return list;
    return list.map((c) => {
      const mine = data.inquiries.filter((i) => i.customerId === c.id);
      return { ...c, totalInquiries: mine.length, totalBookings: data.bookings.filter((b) => b.customerId === c.id && b.bookingStatus !== 'Cancelled').length, lastInquiry: mine.map((i) => i.createdAt).sort().at(-1) ?? null };
    });
  }, [data, isSales]);
  const countries = useMemo(() => [...new Set(items.map((c) => c.country))].sort(), [items]);

  const t = useTableState<CustomerWithStats>({
    items,
    searchFields: (c) => [c.name, c.email, c.phone, c.whatsapp, c.country, c.nicPassport],
    filterFns: {
      date: (c, v) => !!c.lastInquiry && matchDateRange(c.lastInquiry, v),
      status: (c, v) => c.status === v,
      segment: (c, v) => c.segment === v,
      country: (c, v) => c.country === v,
      bookings: (c, v) => (v === 'yes' ? c.totalBookings > 0 : c.totalBookings === 0),
    },
    sorters: { name: (c) => c.name, inquiries: (c) => c.totalInquiries, bookings: (c) => c.totalBookings, last: (c) => c.lastInquiry ?? '' },
    initialSort: { key: 'last', dir: 'desc' },
  });

  if (loading || !data) return <Spinner />;
  const manage = can('customer.manage');

  const columns: Column<CustomerWithStats>[] = [
    { key: 'name', header: 'Customer', sortKey: 'name', render: (c) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={c.name} color={c.segment === 'Inbound' ? '#188c67' : '#c8962e'} />
        <div><p className="font-medium text-slate-800">{c.name}</p><p className="text-xs text-slate-500">{c.segment}</p></div>
      </div>
    ) },
    { key: 'country', header: 'Country', render: (c) => c.country },
    { key: 'phone', header: 'Phone', render: (c) => c.phone },
    { key: 'wa', header: 'WhatsApp', render: (c) => c.whatsapp },
    { key: 'email', header: 'Email', render: (c) => <span className="text-slate-600">{c.email}</span> },
    { key: 'inq', header: 'Total Inquiries', sortKey: 'inquiries', align: 'center', render: (c) => <span className="tabular-nums">{c.totalInquiries}</span> },
    { key: 'bk', header: 'Total Bookings', sortKey: 'bookings', align: 'center', render: (c) => <span className="tabular-nums">{c.totalBookings}</span> },
    { key: 'last', header: 'Last Inquiry', sortKey: 'last', render: (c) => formatDate(c.lastInquiry) },
    { key: 'status', header: 'Status', render: (c) => <CustomerStatusBadge status={c.status} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', sticky: true, render: (c) => (
      <ActionMenu items={[
        { label: 'View profile', icon: <Eye />, onClick: () => navigate(`/customers/${c.id}`) },
        { label: 'Edit', icon: <Pencil />, onClick: () => setEditing(c), hidden: !manage },
      ]} />
    ) },
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle={isSales ? `${items.length} customers from your assigned inquiries` : scope === 'All' ? `${items.length} customers · inbound travellers and Sri Lankan outbound clients` : `${items.length} ${scope} Department customers`} actions={manage && !isSales && <Button icon={<Plus className="size-4" />} onClick={() => setEditing({ segment: scope === 'Outbound' ? 'Outbound' : 'Inbound', country: scope === 'Outbound' ? 'Sri Lanka' : '', nationality: scope === 'Outbound' ? 'Sri Lankan' : '', status: 'Active' })}>Add Customer</Button>} />
      <Card padded={false} className="overflow-hidden">
        <FilterBar
          search={t.search}
          onSearch={t.setSearch}
          placeholder="Search name, email, phone, passport…"
          filters={[
            { key: 'date', label: 'Last inquiry', type: 'date', options: DATE_RANGE_OPTIONS },
            ...(scope === 'All' ? [{ key: 'segment', label: 'Department', options: ['Inbound', 'Outbound'] }] : []),
            { key: 'status', label: 'Status', options: ['Active', 'VIP', 'Inactive'] },
            { key: 'country', label: 'Country', options: countries },
            { key: 'bookings', label: 'Has bookings', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
          ]}
          values={t.filters}
          onFilter={t.setFilter}
          onClear={t.clearFilters}
          activeCount={t.activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={t.pageItems}
          rowKey={(c) => c.id}
          sort={t.sort}
          onSort={t.toggleSort}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          empty={<EmptyState icon={<Users className="size-5" />} title="No customers found" />}
          mobileCard={(c) => (
            <div className="flex items-center gap-3">
              <Avatar name={c.name} color={c.segment === 'Inbound' ? '#188c67' : '#c8962e'} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="font-medium text-slate-900">{c.name}</p><CustomerStatusBadge status={c.status} /></div>
                <p className="truncate text-xs text-slate-500">{c.country} · {c.phone}</p>
                <p className="text-xs text-slate-500">{c.totalInquiries} inquiries · {c.totalBookings} bookings · last {formatDate(c.lastInquiry)}</p>
              </div>
            </div>
          )}
        />
        <Pagination page={t.page} pageCount={t.pageCount} total={t.filtered.length} pageSize={t.pageSize} onPage={t.setPage} onPageSize={t.setPageSize} />
      </Card>
      <CustomerModal customer={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function CustomerModal({ customer, onClose }: { customer: Partial<Customer> | null; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<Partial<Customer>>({});
  const [key, setKey] = useState<string | undefined>();
  if (customer && key !== (customer.id ?? 'new')) {
    setForm({ name: '', email: '', phone: '', whatsapp: '', country: '', nationality: '', notes: '', ...customer });
    setKey(customer.id ?? 'new');
  }
  if (!customer && key) setKey(undefined);
  const { scope } = useAuth();
  const segmentOptions = scope === 'All' ? ['Inbound', 'Outbound'] : [scope];
  const set = (k: keyof Customer, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    const payload = { ...form, whatsapp: form.whatsapp || form.phone } as Customer;
    if (customer?.id) await customerService.update(customer.id, payload);
    else {
      const defaults: Omit<Customer, 'id' | 'createdAt'> = { name: '', email: '', phone: '', whatsapp: '', country: '', nationality: '', notes: '', segment: 'Inbound', status: 'Active' };
      await customerService.create(Object.assign(defaults, payload));
    }
    toast(customer?.id ? 'Customer updated' : 'Customer added');
    onClose();
  };
  return (
    <Modal open={!!customer} onClose={onClose} title={customer?.id ? 'Edit customer' : 'Add customer'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!form.name?.trim() || !(form.phone || form.email)}>Save</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" required><Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Department"><Select options={segmentOptions} value={form.segment} onChange={(e) => set('segment', e.target.value)} disabled={segmentOptions.length === 1} /></Field>
        <Field label="Country"><Select options={COUNTRIES} placeholder="Select" value={form.country} onChange={(e) => set('country', e.target.value)} /></Field>
        <Field label="Nationality"><Input value={form.nationality ?? ''} onChange={(e) => set('nationality', e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="WhatsApp"><Input value={form.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
        <Field label="NIC / Passport"><Input value={form.nicPassport ?? ''} onChange={(e) => set('nicPassport', e.target.value)} /></Field>
        <Field label="Status"><Select options={['Active', 'VIP', 'Inactive']} value={form.status} onChange={(e) => set('status', e.target.value)} /></Field>
        <Field label="Profile notes" className="sm:col-span-2"><Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
