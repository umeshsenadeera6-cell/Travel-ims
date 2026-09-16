import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet, FileText, Filter, X } from 'lucide-react';
import { INQUIRY_STATUSES, SOURCES, type Inquiry } from '@/types';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { DEPT_META, executivesFor } from '@/utils/departments';
import { PRIORITIES } from '@/types';
import { analytics } from '@/services/analyticsService';
import { Avatar, Button, Card, CardHeader, Field, Input, KpiCard, PageHeader, Pagination, PriorityBadge, Select, Spinner, StatusBadge, Tabs, TypeBadge } from '@/components/ui';
import { Funnel, GroupedBarChart, HBarChart, SplitDonut, TrendChart } from '@/components/charts/Charts';
import { destinationKey, inquiryDestination, travelerCount } from '@/utils/inquiry';
import { formatDate, toISODate, addDays } from '@/utils/date';
import { downloadCSV } from '@/utils/export';
import { CONFIRMED_STATUSES } from '@/utils/constants';
import { Inbox, BadgeCheck, FileText as FileIcon, Percent } from 'lucide-react';

type ReportTab = 'inquiry' | 'conversion' | 'executive' | 'source';

interface Filters { from: string; to: string; type: string; status: string; source: string; exec: string; destination: string }
const blank: Filters = { from: '', to: '', type: '', status: '', source: '', exec: '', destination: '' };

export default function ReportsPage() {
  const { data, loading } = useWorkspaceData();
  const { scope } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<ReportTab>('inquiry');
  const [f, setF] = useState<Filters>({ ...blank, from: toISODate(addDays(new Date(), -179)) });
  const [page, setPage] = useState(1);
  const set = (k: keyof Filters, v: string) => { setF((x) => ({ ...x, [k]: v })); setPage(1); };

  const filtered = useMemo(() => {
    if (!data) return [] as Inquiry[];
    return data.inquiries.filter((i) => {
      const d = i.createdAt.slice(0, 10);
      if (f.from && d < f.from) return false;
      if (f.to && d > f.to) return false;
      if (f.type && i.type !== f.type) return false;
      if (f.status && i.status !== f.status) return false;
      if (f.source && i.source !== f.source) return false;
      if (f.exec && i.assignedTo !== f.exec) return false;
      if (f.destination && destinationKey(i) !== f.destination) return false;
      return true;
    });
  }, [data, f]);

  if (loading || !data) return <Spinner />;
  const execs = executivesFor(data.users, scope);
  const userById = new Map(data.users.map((u) => [u.id, u]));
  const destinations = [...new Set(data.inquiries.map(destinationKey))].sort();
  const funnel = analytics.funnel(filtered, data.quotations);
  const sources = analytics.bySource(filtered, data.quotations);
  const perf = analytics.executivePerformance(filtered, data.quotations, execs);
  const activeFilters = Object.entries(f).filter(([, v]) => v).length;
  const PAGE = 10;
  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE);

  const exportCsv = () => {
    if (tab === 'inquiry') downloadCSV('inquiry-report.csv', filtered.map((i) => ({ 'Inquiry ID': i.id, Date: i.createdAt.slice(0, 10), Type: i.type, Customer: i.customerName, Destination: inquiryDestination(i), Travelers: travelerCount(i), Source: i.source, 'Assigned To': userById.get(i.assignedTo ?? '')?.name ?? '', Status: i.status, Priority: i.priority })));
    if (tab === 'executive') downloadCSV('sales-executive-report.csv', perf.map((p) => ({ Executive: p.user.name, Assigned: p.assigned, Contacted: p.contacted, Quotations: p.quotations, Bookings: p.bookings, Lost: p.lost, 'Conversion %': p.conversion })));
    if (tab === 'source') downloadCSV('source-report.csv', sources.map((s) => ({ Source: s.name, Inquiries: s.value, Inbound: s.inbound, Outbound: s.outbound, Quotations: s.quotations, Bookings: s.bookings, 'Conversion %': s.conversion })));
    if (tab === 'conversion') downloadCSV('conversion-report.csv', [{ 'Total Inquiries': funnel.total, Contacted: funnel.contacted, Quotations: funnel.quotations, 'Confirmed Bookings': funnel.bookings, 'Conversion %': funnel.rate }]);
    toast('CSV exported');
  };

  const conv = (list: Inquiry[]) => (list.length ? Math.round((list.filter((i) => CONFIRMED_STATUSES.includes(i.status)).length / list.length) * 1000) / 10 : 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle={`${DEPT_META[scope].name} · inquiries, conversion, team performance and lead sources`}
        actions={
          <>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>CSV</Button>
            <Button variant="secondary" icon={<FileSpreadsheet className="size-4" />} onClick={() => toast('Excel export will be available in Phase 2', 'info')}>Excel</Button>
            <Button variant="secondary" icon={<FileText className="size-4" />} onClick={() => toast('PDF export will be available in Phase 2', 'info')}>PDF</Button>
          </>
        }
      />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Filter className="size-4 text-slate-400" /> Report filters</h2>
          {activeFilters > 0 && <Button size="sm" variant="ghost" icon={<X className="size-4" />} onClick={() => setF(blank)}>Clear filters</Button>}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Field label="From"><Input type="date" value={f.from} onChange={(e) => set('from', e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={f.to} onChange={(e) => set('to', e.target.value)} /></Field>
          {scope === 'All' && <Field label="Inbound / Outbound"><Select options={['Inbound', 'Outbound']} placeholder="All" value={f.type} onChange={(e) => set('type', e.target.value)} /></Field>}
          <Field label="Status"><Select options={INQUIRY_STATUSES} placeholder="All" value={f.status} onChange={(e) => set('status', e.target.value)} /></Field>
          <Field label="Source"><Select options={SOURCES} placeholder="All" value={f.source} onChange={(e) => set('source', e.target.value)} /></Field>
          <Field label="Executive"><Select options={execs.map((e) => ({ value: e.id, label: e.name }))} placeholder="All" value={f.exec} onChange={(e) => set('exec', e.target.value)} /></Field>
          <Field label="Destination"><Select options={destinations} placeholder="All" value={f.destination} onChange={(e) => set('destination', e.target.value)} /></Field>
        </div>
      </Card>

      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'inquiry', label: 'Inquiry Report' },
        { value: 'conversion', label: 'Conversion Report' },
        { value: 'executive', label: 'Sales Executive Report' },
        { value: 'source', label: 'Source Report' },
      ]} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Inquiries in range" value={funnel.total} icon={<Inbox className="size-5" />} tone="blue" />
        <KpiCard label="Quotations" value={funnel.quotations} icon={<FileIcon className="size-5" />} tone="violet" />
        <KpiCard label="Confirmed bookings" value={funnel.bookings} icon={<BadgeCheck className="size-5" />} />
        <KpiCard label="Conversion rate" value={`${funnel.rate}%`} icon={<Percent className="size-5" />} tone="gold" />
      </div>

      {tab === 'inquiry' && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardHeader title="Inquiries by month" subtitle="Within the selected filters" /><TrendChart data={analytics.trend(filtered, '6months')} series={scope === 'All' ? undefined : [scope]} /></Card>
            {scope === 'All'
              ? <Card><CardHeader title="Inbound vs Outbound" /><SplitDonut inbound={filtered.filter((i) => i.type === 'Inbound').length} outbound={filtered.filter((i) => i.type === 'Outbound').length} /></Card>
              : <Card><CardHeader title="By source" /><HBarChart data={[...sources].sort((a, b) => b.value - a.value)} /></Card>}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card><CardHeader title="By status" /><HBarChart data={analytics.byStatusGroup(filtered)} /></Card>
            <Card><CardHeader title="Top destinations" /><HBarChart data={analytics.byDestination(filtered, destinationKey).slice(0, 8)} /></Card>
          </div>
          <Card padded={false} className="overflow-hidden">
            <div className="p-5 pb-3"><CardHeader className="mb-0" title="Inquiry list" subtitle={`${filtered.length} inquiries match`} /></div>
            <div className="scrollbar-thin overflow-x-auto border-t border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80"><tr>{['Inquiry ID', 'Date', 'Type', 'Customer', 'Destination', 'Source', 'Executive', 'Status', 'Priority'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="td"><Link to={`/inquiries/${i.id}`} className="font-semibold text-brand-700 hover:underline">{i.id}</Link></td>
                      <td className="td">{formatDate(i.createdAt)}</td>
                      <td className="td"><TypeBadge type={i.type} /></td>
                      <td className="td">{i.customerName}</td>
                      <td className="td"><span className="block max-w-[180px] truncate">{inquiryDestination(i)}</span></td>
                      <td className="td">{i.source}</td>
                      <td className="td">{userById.get(i.assignedTo ?? '')?.name ?? '—'}</td>
                      <td className="td"><StatusBadge status={i.status} /></td>
                      <td className="td"><PriorityBadge priority={i.priority} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={Math.max(1, Math.ceil(filtered.length / PAGE))} total={filtered.length} pageSize={PAGE} onPage={setPage} />
          </Card>
        </>
      )}

      {tab === 'conversion' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Conversion funnel" subtitle="Total inquiries → quotations → confirmed bookings" />
            <Funnel steps={[{ label: 'Total inquiries', value: funnel.total }, { label: 'Contacted', value: funnel.contacted }, { label: 'Quotations sent', value: funnel.quotations }, { label: 'Confirmed bookings', value: funnel.bookings }]} />
            <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-50 p-4">
              <span className="text-sm font-medium text-brand-800">Overall conversion rate</span>
              <span className="text-3xl font-semibold text-brand-700 tabular-nums">{funnel.rate}%</span>
            </div>
          </Card>
          <Card>
            {scope === 'All' ? (
              <>
            <CardHeader title="Conversion by segment" />
            <table className="min-w-full">
              <thead className="border-y border-slate-100 bg-slate-50/80"><tr><th className="th">Segment</th><th className="th text-right">Inquiries</th><th className="th text-right">Quotations</th><th className="th text-right">Bookings</th><th className="th text-right">Conversion</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {(['Inbound', 'Outbound'] as const).map((type) => {
                  const list = filtered.filter((i) => i.type === type);
                  const fn = analytics.funnel(list, data.quotations);
                  return (
                    <tr key={type}><td className="td"><TypeBadge type={type} /></td><td className="td text-right tabular-nums">{fn.total}</td><td className="td text-right tabular-nums">{fn.quotations}</td><td className="td text-right tabular-nums">{fn.bookings}</td><td className="td text-right font-semibold tabular-nums">{fn.rate}%</td></tr>
                  );
                })}
              </tbody>
            </table>
              </>
            ) : (
              <>
                <CardHeader title="Conversion by priority" subtitle={DEPT_META[scope].name} />
                <table className="min-w-full">
                  <thead className="border-y border-slate-100 bg-slate-50/80"><tr><th className="th">Priority</th><th className="th text-right">Inquiries</th><th className="th text-right">Quotations</th><th className="th text-right">Bookings</th><th className="th text-right">Conversion</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {PRIORITIES.map((p) => {
                      const fn = analytics.funnel(filtered.filter((i) => i.priority === p), data.quotations);
                      return <tr key={p}><td className="td"><PriorityBadge priority={p} /></td><td className="td text-right tabular-nums">{fn.total}</td><td className="td text-right tabular-nums">{fn.quotations}</td><td className="td text-right tabular-nums">{fn.bookings}</td><td className="td text-right font-semibold tabular-nums">{fn.rate}%</td></tr>;
                    })}
                  </tbody>
                </table>
              </>
            )}
            <div className="mt-6">
              <CardHeader title="Lost & cancelled" subtitle="Inquiries that did not convert" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-red-700">Lost</p><p className="text-xl font-semibold text-red-700 tabular-nums">{filtered.filter((i) => i.status === 'Lost').length}</p></div>
                <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs text-slate-600">Cancelled</p><p className="text-xl font-semibold text-slate-700 tabular-nums">{filtered.filter((i) => i.status === 'Cancelled').length}</p></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'executive' && (
        <>
          <Card padded={false} className="overflow-hidden">
            <div className="p-5 pb-3"><CardHeader className="mb-0" title="Sales executive performance" subtitle="Assigned inquiries within the selected filters" /></div>
            <div className="scrollbar-thin overflow-x-auto border-t border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80"><tr>{['Executive', 'Assigned Inquiries', 'Contacted', 'Quotations', 'Bookings', 'Lost', 'Conversion Rate'].map((h, i) => <th key={h} className={`th ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {perf.map((p) => (
                    <tr key={p.user.id}>
                      <td className="td"><span className="flex items-center gap-2.5"><Avatar name={p.user.name} color={p.user.avatarColor} size="sm" /><span className="font-medium text-slate-800">{p.user.name}</span></span></td>
                      <td className="td text-right tabular-nums">{p.assigned}</td>
                      <td className="td text-right tabular-nums">{p.contacted}</td>
                      <td className="td text-right tabular-nums">{p.quotations}</td>
                      <td className="td text-right tabular-nums">{p.bookings}</td>
                      <td className="td text-right tabular-nums">{p.lost}</td>
                      <td className="td text-right"><span className="inline-flex items-center gap-2"><span className="hidden h-1.5 w-20 rounded-full bg-slate-100 sm:block"><span className="block h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, p.conversion)}%` }} /></span><b className="w-12 tabular-nums">{p.conversion}%</b></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card><CardHeader title="Bookings by executive" /><HBarChart data={perf.map((p) => ({ name: p.user.name, value: p.bookings }))} valueLabel="Bookings" /></Card>
            <Card><CardHeader title="Assigned inquiries by executive" /><HBarChart data={perf.map((p) => ({ name: p.user.name, value: p.assigned }))} /></Card>
          </div>
        </>
      )}

      {tab === 'source' && (
        <>
          {scope === 'All'
            ? <Card><CardHeader title="Inquiries by source" subtitle="Inbound vs outbound split per channel" /><GroupedBarChart data={sources} /></Card>
            : <Card><CardHeader title="Inquiries by source" subtitle={DEPT_META[scope].name} /><HBarChart data={[...sources].sort((a, b) => b.value - a.value)} /></Card>}
          <Card padded={false} className="overflow-hidden">
            <div className="p-5 pb-3"><CardHeader className="mb-0" title="Source comparison" /></div>
            <div className="scrollbar-thin overflow-x-auto border-t border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80"><tr>{['Source', 'Inquiries', ...(scope === 'All' ? ['Inbound', 'Outbound'] : []), 'Quotations', 'Bookings', 'Conversion'].map((h, i) => <th key={h} className={`th ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {[...sources].sort((a, b) => b.value - a.value).map((s) => (
                    <tr key={s.name}>
                      <td className="td font-medium text-slate-800">{s.name}</td>
                      <td className="td text-right tabular-nums">{s.value}</td>
                      {scope === 'All' && <td className="td text-right tabular-nums">{s.inbound}</td>}
                      {scope === 'All' && <td className="td text-right tabular-nums">{s.outbound}</td>}
                      <td className="td text-right tabular-nums">{s.quotations}</td>
                      <td className="td text-right tabular-nums">{s.bookings}</td>
                      <td className="td text-right font-semibold tabular-nums">{s.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Best converting channel: <b className="text-slate-700">{[...sources].filter((s) => s.value >= 3).sort((a, b) => b.conversion - a.conversion)[0]?.name ?? '—'}</b> · Overall {conv(filtered)}%</p>
          </Card>
        </>
      )}
    </div>
  );
}
