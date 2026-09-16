import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Inbox, UserPlus, PlaneLanding, PlaneTakeoff, Sparkles, CalendarClock, FileText, BadgeCheck, CircleX, ArrowRight, TriangleAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { analytics, type TrendRange } from '@/services/analyticsService';
import { Avatar, Button, Card, CardHeader, KpiCard, PageHeader, PriorityBadge, Segmented, Spinner, StatusBadge, TypeBadge, EmptyState } from '@/components/ui';
import { HBarChart, SplitDonut, TrendChart } from '@/components/charts/Charts';
import { formatTime, relativeDay, todayISO, timeAgo } from '@/utils/date';
import { compactNumber, cx } from '@/utils/format';
import { DEPARTMENTS, DEPT_META, executivesFor } from '@/utils/departments';
import { CLOSED_STATUSES } from '@/utils/constants';
import { destinationKey } from '@/utils/inquiry';

export default function DashboardPage() {
  const { user, scope, setScope, canSwitchDepartment } = useAuth();
  const { data, loading } = useWorkspaceData();
  const [range, setRange] = useState<TrendRange>('6months');
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!data) return null;
    return {
      kpi: analytics.kpis(data.inquiries, data.followups, data.quotations, data.bookings),
      trend: analytics.trend(data.inquiries, range),
      sources: analytics.bySource(data.inquiries, data.quotations).sort((a, b) => b.value - a.value),
      statuses: analytics.byStatusGroup(data.inquiries),
      execs: analytics.executivePerformance(data.inquiries, data.quotations, executivesFor(data.users, scope)),
      destinations: analytics.byDestination(data.inquiries, destinationKey).slice(0, 7),
      departments: DEPARTMENTS.map((d) => {
        const list = data.inquiries.filter((i) => i.type === d);
        const ids = new Set(list.map((i) => i.id));
        const k = analytics.kpis(list, data.followups, data.quotations, data.bookings);
        const f = analytics.funnel(list, data.quotations);
        return { dept: d, k, f, open: list.filter((i) => !CLOSED_STATUSES.includes(i.status)).length, unassigned: list.filter((i) => !i.assignedTo).length, manager: data.users.find((u) => u.role === 'Manager' && u.department === d), team: executivesFor(data.users, d).length, overdue: data.followups.filter((x) => ids.has(x.inquiryId) && x.status === 'Pending' && x.date < todayISO()).length };
      }),
    };
  }, [data, range, scope]);

  if (loading || !data || !stats || !user) return <Spinner />;
  const { kpi } = stats;
  const today = todayISO();
  const dueFollowups = data.followups.filter((f) => f.status === 'Pending' && f.date <= today).slice(0, 6);
  const recent = data.inquiries.slice(0, 6);
  const userById = new Map(data.users.map((u) => [u.id, u]));
  const firstName = user.name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isSales = user.role === 'Sales Executive';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={isSales ? `Here is how your assigned ${scope} inquiries are progressing.` : scope === 'All' ? 'Head office overview of the Inbound and Outbound departments.' : `Here is what is happening in the ${DEPT_META[scope].name} today.`}
      />

      {kpi.overdueFollowups > 0 && (
        <Link to="/followups" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 hover:bg-red-100/60">
          <TriangleAlert className="size-4 shrink-0" />
          <span className="flex-1"><b>{kpi.overdueFollowups} overdue follow-up{kpi.overdueFollowups > 1 ? 's' : ''}</b> need attention.</span>
          <ArrowRight className="size-4" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Inquiries" value={kpi.total} icon={<Inbox className="size-5" />} onClick={() => navigate(isSales ? '/inquiries/mine' : scope === 'Outbound' ? '/inquiries/outbound' : '/inquiries/inbound')} hint={isSales ? 'Assigned to you' : undefined} />
        {scope === 'All' ? (
          <>
            <KpiCard label="Inbound" value={kpi.inbound} icon={<PlaneLanding className="size-5" />} tone="emerald" onClick={() => navigate('/inquiries/inbound')} />
            <KpiCard label="Outbound" value={kpi.outbound} icon={<PlaneTakeoff className="size-5" />} tone="gold" onClick={() => navigate('/inquiries/outbound')} />
          </>
        ) : (
          <>
            <KpiCard label="Open Inquiries" value={data.inquiries.filter((i) => !CLOSED_STATUSES.includes(i.status)).length} icon={scope === 'Inbound' ? <PlaneLanding className="size-5" /> : <PlaneTakeoff className="size-5" />} tone={scope === 'Inbound' ? 'emerald' : 'gold'} hint={isSales ? 'Assigned to you' : 'In progress'} onClick={() => navigate(isSales ? '/inquiries/mine' : `/inquiries/${scope.toLowerCase()}`)} />
            {isSales ? (
              <KpiCard label="Follow-ups Due Today" value={data.followups.filter((f) => f.status === 'Pending' && f.date === todayISO()).length} icon={<CalendarClock className="size-5" />} tone="slate" hint="On your inquiries" onClick={() => navigate('/followups')} />
            ) : (
              <KpiCard label="Unassigned" value={data.inquiries.filter((i) => !i.assignedTo).length} icon={<UserPlus className="size-5" />} tone="slate" hint="Waiting for an executive" onClick={() => navigate(`/inquiries/${scope.toLowerCase()}`)} />
            )}
          </>
        )}
        <KpiCard label="New Inquiries" value={kpi.newInquiries} icon={<Sparkles className="size-5" />} tone="blue" hint="Awaiting first contact" />
        <KpiCard label="Pending Follow-ups" value={kpi.pendingFollowups} icon={<CalendarClock className="size-5" />} tone="amber" hint={kpi.overdueFollowups ? <span className="text-red-600">{kpi.overdueFollowups} overdue</span> : 'All on track'} onClick={() => navigate('/followups')} />
        <KpiCard label="Quotations Sent" value={kpi.quotationsSent} icon={<FileText className="size-5" />} tone="violet" onClick={() => navigate('/quotations')} />
        <KpiCard label="Confirmed Bookings" value={kpi.confirmedBookings} icon={<BadgeCheck className="size-5" />} tone="brand" hint={`≈ USD ${compactNumber(kpi.revenueUSD)} value`} />
        <KpiCard label="Lost Inquiries" value={kpi.lost} icon={<CircleX className="size-5" />} tone="red" hint={`${kpi.total ? Math.round((kpi.lost / kpi.total) * 100) : 0}% of total`} />
      </div>

      {scope === 'All' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {stats.departments.map((d) => (
            <Card key={d.dept} padded={false}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={cx('flex size-9 items-center justify-center rounded-lg', DEPT_META[d.dept].chip)}>{d.dept === 'Inbound' ? <PlaneLanding className="size-5" /> : <PlaneTakeoff className="size-5" />}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{DEPT_META[d.dept].name}</h3>
                    <p className="text-xs text-slate-500">{d.manager ? `${d.manager.name} · ` : ''}{d.team} sales executives</p>
                  </div>
                </div>
                {canSwitchDepartment && <Button size="sm" variant="secondary" onClick={() => setScope(d.dept)}>Open department <ArrowRight className="size-4" /></Button>}
              </div>
              <dl className="grid grid-cols-3 divide-x divide-slate-100 sm:grid-cols-6">
                {[
                  ['Inquiries', d.k.total],
                  ['Open', d.open],
                  ['Unassigned', d.unassigned],
                  ['Quoted', d.f.quotations],
                  ['Bookings', d.k.confirmedBookings],
                  ['Conversion', `${d.f.rate}%`],
                ].map(([label, value]) => (
                  <div key={label as string} className="px-3 py-3 text-center sm:px-2">
                    <dt className="text-[11px] text-slate-500">{label}</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
                <span>Booking value ≈ <b className="text-slate-700">USD {compactNumber(d.k.revenueUSD)}</b></span>
                <span className={d.overdue ? 'font-semibold text-red-600' : ''}>{d.overdue} overdue follow-ups</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Inquiry trend"
            subtitle="New inquiries received"
            action={<Segmented value={range} onChange={setRange} options={[{ value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }, { value: '6months', label: 'Last 6 Months' }]} />}
          />
          <TrendChart data={stats.trend} series={scope === 'All' ? undefined : [scope]} />
        </Card>
        {scope === 'All' ? (
          <Card>
            <CardHeader title="Inbound vs Outbound" subtitle="Share of all inquiries" />
            <SplitDonut inbound={kpi.inbound} outbound={kpi.outbound} />
          </Card>
        ) : (
          <Card>
            <CardHeader title="Top destinations" subtitle={scope === 'Inbound' ? 'First stop requested in Sri Lanka' : 'Countries customers want to visit'} />
            <HBarChart data={stats.destinations} />
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Inquiry sources" subtitle="Where leads come from" />
          <HBarChart data={stats.sources} />
        </Card>
        <Card>
          <CardHeader title="Inquiry status" subtitle="Current pipeline stage" />
          <HBarChart data={stats.statuses} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3" padded={false}>
          <div className="p-5 pb-0">
            <CardHeader title="Sales executive performance" subtitle="All-time, based on assigned inquiries" action={!isSales && user.role !== 'Sales Executive' && <Link to="/reports" className="text-sm font-medium text-brand-700 hover:underline">Full report</Link>} />
          </div>
          <div className="scrollbar-thin overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-y border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="th">Executive</th>
                  <th className="th text-right">Inquiries</th>
                  <th className="th text-right">Quotations</th>
                  <th className="th text-right">Bookings</th>
                  <th className="th text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.execs.filter((e) => !isSales || e.user.id === user.id).map((e) => (
                  <tr key={e.user.id} className={cx(e.user.id === user.id && 'bg-brand-50/40')}>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.user.name} color={e.user.avatarColor} size="sm" />
                        <span className="font-medium text-slate-800">{e.user.name}</span>
                      </div>
                    </td>
                    <td className="td text-right tabular-nums">{e.assigned}</td>
                    <td className="td text-right tabular-nums">{e.quotations}</td>
                    <td className="td text-right tabular-nums">{e.bookings}</td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden h-1.5 w-16 rounded-full bg-slate-100 2xl:block">
                          <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, e.conversion)}%` }} />
                        </div>
                        <span className="w-12 font-semibold text-slate-800 tabular-nums">{e.conversion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-2" padded={false}>
          <div className="p-5 pb-3">
            <CardHeader className="mb-0" title="Due follow-ups" subtitle="Today and overdue" action={<Link to="/followups" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>} />
          </div>
          {dueFollowups.length === 0 ? (
            <EmptyState icon={<CalendarClock className="size-5" />} title="You're all caught up" description="No follow-ups due today." />
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {dueFollowups.map((f) => {
                const overdue = f.date < today;
                return (
                  <li key={f.id}>
                    <Link to={`/inquiries/${f.inquiryId}`} className={cx('flex items-center gap-3 px-5 py-3 hover:bg-slate-50', overdue && 'border-l-2 border-red-400')}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{f.customerName}</p>
                        <p className="truncate text-xs text-slate-500">{f.type} · {f.inquiryId} · {userById.get(f.assignedTo ?? '')?.name ?? 'Unassigned'}</p>
                      </div>
                      <div className="text-right">
                        <p className={cx('text-xs font-semibold', overdue ? 'text-red-600' : 'text-amber-700')}>{relativeDay(f.date)}</p>
                        <p className="text-xs text-slate-500">{formatTime(f.time)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader className="mb-0" title="Latest inquiries" action={<Link to={isSales ? '/inquiries/mine' : scope === 'Outbound' ? '/inquiries/outbound' : '/inquiries/inbound'} className="text-sm font-medium text-brand-700 hover:underline">View all</Link>} />
        </div>
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {recent.map((i) => (
            <li key={i.id}>
              <Link to={`/inquiries/${i.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 hover:bg-slate-50">
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-medium text-slate-800">{i.customerName}</p>
                  <p className="text-xs text-slate-500">{i.id} · {i.source} · {timeAgo(i.createdAt)}</p>
                </div>
                <TypeBadge type={i.type} />
                <PriorityBadge priority={i.priority} />
                <StatusBadge status={i.status} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
