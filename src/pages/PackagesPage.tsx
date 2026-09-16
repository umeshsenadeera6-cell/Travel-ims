import { useEffect, useState } from 'react';
import { Map, Pencil, Plus, Trash2, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { CURRENCIES, type Currency, type InquiryType, type PackageStatus, type TourPackage } from '@/types';
import { packageService, settingsService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useTableState } from '@/hooks/useTableState';
import { ActionMenu, Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, Field, FilterBar, Input, Modal, PageHeader, Pagination, Select, Spinner, Tabs, Textarea, type Column } from '@/components/ui';
import { formatMoney } from '@/utils/format';

const STATUS_TONE = { Active: 'green', Draft: 'amber', Archived: 'gray' } as const;

export default function PackagesPage() {
  const { can, scope } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<InquiryType>(() => settingsService.getPrefs().lastPackagesTab);
  const { data = [], loading } = useServiceQuery(() => packageService.list());
  const [editing, setEditing] = useState<Partial<TourPackage> | null>(null);
  const [deleting, setDeleting] = useState<TourPackage | null>(null);
  useEffect(() => settingsService.setPrefs({ lastPackagesTab: tab }), [tab]);

  const activeTab: InquiryType = scope === 'All' ? tab : scope;
  const items = data.filter((p) => p.type === activeTab);
  const t = useTableState<TourPackage>({
    items,
    searchFields: (p) => [p.name, p.destination, p.highlights],
    filterFns: { status: (p, v) => p.status === v, duration: (p, v) => (v === 'short' ? p.durationDays > 0 && p.durationDays <= 6 : v === 'long' ? p.durationDays > 6 : p.durationDays === 0) },
    sorters: { name: (p) => p.name, days: (p) => p.durationDays, price: (p) => p.startingPrice },
    initialSort: { key: 'name', dir: 'asc' },
  });
  if (loading) return <Spinner />;
  const manage = can('package.manage');

  const columns: Column<TourPackage>[] = [
    { key: 'name', header: 'Package Name', sortKey: 'name', render: (p) => <div><p className="font-medium text-slate-800">{p.name}</p><p className="max-w-[260px] truncate text-xs text-slate-500">{p.highlights}</p></div> },
    { key: 'dest', header: 'Destination', render: (p) => <span className="block max-w-[240px] truncate" title={p.destination}>{p.destination}</span> },
    { key: 'dur', header: 'Duration', sortKey: 'days', render: (p) => (p.durationDays ? `${p.durationDays} days` : 'Flexible') },
    { key: 'nights', header: 'Nights', align: 'center', render: (p) => p.nights || '—' },
    { key: 'price', header: 'Starting Price', sortKey: 'price', align: 'right', render: (p) => <span className="font-semibold tabular-nums">{p.startingPrice ? p.startingPrice.toLocaleString() : 'On request'}</span> },
    { key: 'cur', header: 'Currency', render: (p) => p.currency },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={STATUS_TONE[p.status]} dot>{p.status}</Badge> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', sticky: true, render: (p) => manage ? <ActionMenu items={[{ label: 'Edit', icon: <Pencil />, onClick: () => setEditing(p) }, { label: 'Delete', icon: <Trash2 />, danger: true, onClick: () => setDeleting(p) }]} /> : null },
  ];

  return (
    <div>
      <PageHeader title="Tours & Packages" subtitle="Standard itineraries used in inquiries and quotations" actions={manage && <Button icon={<Plus className="size-4" />} onClick={() => setEditing({ type: activeTab, currency: activeTab === 'Inbound' ? 'USD' : 'LKR', status: 'Active' })}>New {activeTab} Package</Button>} />
      <Tabs className="mb-4" value={activeTab} onChange={setTab} tabs={[
        ...[

        { value: 'Inbound' as const, label: 'Inbound Packages', count: data.filter((p) => p.type === 'Inbound').length, icon: <PlaneLanding className="size-4" /> },
        { value: 'Outbound' as const, label: 'Outbound Packages', count: data.filter((p) => p.type === 'Outbound').length, icon: <PlaneTakeoff className="size-4" /> },
        ].filter((t) => scope === 'All' || t.value === scope),
      ]} />
      <Card padded={false} className="overflow-hidden">
        <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Search packages…"
          filters={[{ key: 'status', label: 'Status', options: ['Active', 'Draft', 'Archived'] }, { key: 'duration', label: 'Duration', options: [{ value: 'short', label: 'Up to 6 days' }, { value: 'long', label: '7+ days' }, { value: 'flex', label: 'Flexible' }] }]}
          values={t.filters} onFilter={t.setFilter} onClear={t.clearFilters} activeCount={t.activeFilterCount} />
        <DataTable columns={columns} rows={t.pageItems} rowKey={(p) => p.id} sort={t.sort} onSort={t.toggleSort}
          onRowClick={manage ? (p) => setEditing(p) : undefined}
          empty={<EmptyState icon={<Map className="size-5" />} title="No packages found" />}
          mobileCard={(p) => (
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="font-medium text-slate-900">{p.name}</p><Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge></div>
                <p className="truncate text-xs text-slate-500">{p.destination}</p>
                <p className="mt-1 text-sm"><b className="tabular-nums">{p.startingPrice ? formatMoney(p.startingPrice, p.currency) : 'On request'}</b> <span className="text-xs text-slate-500">· {p.durationDays ? `${p.durationDays}D/${p.nights}N` : 'Flexible'}</span></p>
              </div>
            </div>
          )} />
        <Pagination page={t.page} pageCount={t.pageCount} total={t.filtered.length} pageSize={t.pageSize} onPage={t.setPage} onPageSize={t.setPageSize} />
      </Card>
      <PackageModal pkg={editing} onClose={() => setEditing(null)} onSaved={(n) => toast(n)} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} danger title="Delete package?" confirmLabel="Delete" message={<>“{deleting?.name}” will be removed. Existing inquiries keep their package name.</>}
        onConfirm={async () => { if (deleting) { await packageService.remove(deleting.id); toast('Package deleted'); } }} />
    </div>
  );
}

function PackageModal({ pkg, onClose, onSaved }: { pkg: Partial<TourPackage> | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState<Partial<TourPackage>>({});
  useEffect(() => { if (pkg) setForm({ name: '', destination: '', durationDays: 0, nights: 0, startingPrice: 0, highlights: '', ...pkg }); }, [pkg]);
  const set = <K extends keyof TourPackage>(k: K, v: TourPackage[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    if (pkg?.id) await packageService.update(pkg.id, form);
    else await packageService.create(form as Omit<TourPackage, 'id'>);
    onSaved(pkg?.id ? 'Package updated' : 'Package created');
    onClose();
  };
  return (
    <Modal open={!!pkg} onClose={onClose} title={pkg?.id ? 'Edit package' : `New ${pkg?.type ?? ''} package`} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!form.name?.trim() || !form.destination?.trim()}>Save package</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Package name" required className="sm:col-span-2"><Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Destination" required className="sm:col-span-2"><Input value={form.destination ?? ''} onChange={(e) => set('destination', e.target.value)} placeholder="e.g. Kandy · Ella · Yala" /></Field>
        <Field label="Duration (days)"><Input type="number" min={0} value={form.durationDays ?? 0} onChange={(e) => { const d = Number(e.target.value); setForm((f) => ({ ...f, durationDays: d, nights: Math.max(0, d - 1) })); }} /></Field>
        <Field label="Nights"><Input type="number" min={0} value={form.nights ?? 0} onChange={(e) => set('nights', Number(e.target.value))} /></Field>
        <div className="grid grid-cols-[100px_1fr] gap-2">
          <Field label="Currency"><Select options={CURRENCIES} value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)} /></Field>
          <Field label="Starting price"><Input type="number" min={0} value={form.startingPrice ?? 0} onChange={(e) => set('startingPrice', Number(e.target.value))} /></Field>
        </div>
        <Field label="Status"><Select options={['Active', 'Draft', 'Archived']} value={form.status} onChange={(e) => set('status', e.target.value as PackageStatus)} /></Field>
        <Field label="Highlights" className="sm:col-span-2"><Textarea value={form.highlights ?? ''} onChange={(e) => set('highlights', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
