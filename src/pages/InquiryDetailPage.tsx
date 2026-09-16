import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarPlus, CheckCircle2, Clock, CreditCard, FileText, FolderOpen, Luggage, Mail, MessageCircle, Pencil, Phone, Plus, RefreshCw,
  StickyNote, Upload, UserPlus, CircleDot, Activity as ActivityIcon, BadgeCheck, CalendarClock, Eye,
} from 'lucide-react';
import { INQUIRY_STATUSES, type Activity, type FollowUp, type InquiryStatus, type Quotation } from '@/types';
import { activityService, balanceAmount, bookingService, followupService, inquiryService, noteService, paidAmount, quotationService, userService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useInquiryActions } from '@/components/inquiry/useInquiryActions';
import { FollowUpModal } from '@/components/inquiry/FollowUpModal';
import { QuotationModal } from '@/components/inquiry/QuotationModal';
import { QuotationPreview } from '@/components/inquiry/QuotationPreview';
import { PaymentModal } from '@/components/inquiry/BookingModals';
import {
  ActionMenu, Avatar, Badge, BookingBadge, Button, Card, CardHeader, EmptyState, InfoRow, PaymentBadge, PriorityBadge, QuotationBadge, Spinner, StatusBadge, Tabs, TypeBadge,
} from '@/components/ui';
import { AccessDenied, NotFound } from './SystemPages';
import { formatDate, formatDateTime, formatTime, relativeDay, timeAgo, todayISO } from '@/utils/date';
import { cx, formatMoney } from '@/utils/format';
import { canSeeInquiry } from '@/utils/permissions';
import { inquiryDestination, travelEnd, travelerCount, travelStart } from '@/utils/inquiry';

type Tab = 'overview' | 'timeline' | 'followups' | 'quotations' | 'booking' | 'documents' | 'notes';

const PIPELINE: Array<{ label: string; statuses: InquiryStatus[] }> = [
  { label: 'New', statuses: ['New'] },
  { label: 'Contacted', statuses: ['Contacted', 'Requirement Collected'] },
  { label: 'Quotation', statuses: ['Quotation Preparing', 'Quotation Sent', 'Follow-up Required', 'Negotiation'] },
  { label: 'Confirmed', statuses: ['Confirmed', 'Payment Pending', 'Partially Paid'] },
  { label: 'Paid', statuses: ['Fully Paid', 'Booking Completed'] },
  { label: 'Travelled', statuses: ['Travel Completed'] },
];

export default function InquiryDetailPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, can, readOnly } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const { run, modals } = useInquiryActions();
  const [fuModal, setFuModal] = useState<{ fu: FollowUp; mode: 'edit' | 'reschedule' | 'complete' } | null>(null);
  const [qModal, setQModal] = useState<Quotation | null>(null);
  const [preview, setPreview] = useState<Quotation | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const { data, loading } = useServiceQuery(async () => {
    const [inquiry, followups, quotations, booking, notes, activities, users] = await Promise.all([
      inquiryService.get(id), followupService.listByInquiry(id), quotationService.listByInquiry(id), bookingService.getByInquiry(id),
      noteService.listByInquiry(id), activityService.listByInquiry(id), userService.list(),
    ]);
    return { inquiry, followups, quotations, booking, notes, activities, users };
  }, [id]);

  useEffect(() => {
    if (data?.inquiry && params.get('action') === 'followup') {
      run('followup', data.inquiry);
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.inquiry, params]);

  const userById = useMemo(() => new Map((data?.users ?? []).map((u) => [u.id, u])), [data]);

  if (loading && !data) return <Spinner />;
  if (!data?.inquiry) return <NotFound />;
  const { inquiry: inq, followups, quotations, booking, notes, activities } = data;
  if (!canSeeInquiry(user, inq)) return <AccessDenied />;

  const assignee = userById.get(inq.assignedTo ?? '');
  const today = todayISO();
  const pendingFu = followups.filter((f) => f.status === 'Pending');
  const stageIndex = PIPELINE.findIndex((p) => p.statuses.includes(inq.status));
  const closedLost = inq.status === 'Lost' || inq.status === 'Cancelled';
  const canEdit = can('inquiry.edit');

  const quickStatus = async (s: InquiryStatus) => {
    await inquiryService.changeStatus(inq.id, s, user);
    toast(`Status updated to ${s}`);
  };

  const tabs: Array<{ value: Tab; label: string; count?: number; icon: ReactNode }> = [
    { value: 'overview', label: 'Overview', icon: <CircleDot className="size-4" /> },
    { value: 'timeline', label: 'Timeline', count: activities.length, icon: <ActivityIcon className="size-4" /> },
    { value: 'followups', label: 'Follow-ups', count: followups.length, icon: <CalendarClock className="size-4" /> },
    { value: 'quotations', label: 'Quotations', count: quotations.length, icon: <FileText className="size-4" /> },
    { value: 'booking', label: 'Booking', count: booking ? 1 : 0, icon: <Luggage className="size-4" /> },
    { value: 'documents', label: 'Documents', icon: <FolderOpen className="size-4" /> },
    { value: 'notes', label: 'Notes', count: notes.length, icon: <StickyNote className="size-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link to={user?.role === 'Sales Executive' ? '/inquiries/mine' : inq.type === 'Inbound' ? '/inquiries/inbound' : '/inquiries/outbound'} className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700">
          <ArrowLeft className="size-3.5" /> {user?.role === 'Sales Executive' ? 'My Inquiries' : `${inq.type} Inquiries`}
        </Link>
        <Card>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-brand-700">{inq.id}</span>
                <TypeBadge type={inq.type} />
                <StatusBadge status={inq.status} />
                <PriorityBadge priority={inq.priority} />
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{inq.customerName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                <span>{inquiryDestination(inq)}</span>
                <span>{travelerCount(inq)} travelers · {inq.nights} nights</span>
                <span>Received {formatDate(inq.createdAt)} via {inq.source}</span>
                <span className="inline-flex items-center gap-1.5">
                  {assignee ? <><Avatar name={assignee.name} color={assignee.avatarColor} size="sm" /> {assignee.name}</> : <Badge tone="amber">Unassigned</Badge>}
                </span>
              </div>
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 xl:max-w-[560px] xl:justify-end">
                {canEdit && <Button size="sm" variant="secondary" icon={<Pencil className="size-4" />} onClick={() => navigate(`/inquiries/${inq.id}/edit`)}>Edit</Button>}
                {can('inquiry.assign') && <Button size="sm" variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => run('assign', inq)}>Assign</Button>}
                {can('followup.manage') && <Button size="sm" variant="secondary" icon={<CalendarPlus className="size-4" />} onClick={() => run('followup', inq)}>Add Follow-up</Button>}
                {canEdit && <Button size="sm" variant="secondary" icon={<StickyNote className="size-4" />} onClick={() => run('note', inq)}>Add Note</Button>}
                {can('quotation.manage') && <Button size="sm" variant="outline" icon={<FileText className="size-4" />} onClick={() => run('quotation', inq)}>Create Quotation</Button>}
                {can('booking.manage') && !booking && !closedLost && <Button size="sm" icon={<BadgeCheck className="size-4" />} onClick={() => run('booking', inq)}>Convert to Booking</Button>}
              </div>
            )}
          </div>

          {/* Pipeline */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <ol className="flex flex-1 items-center gap-1 overflow-x-auto" aria-label="Pipeline progress">
                {PIPELINE.map((p, i) => {
                  const done = !closedLost && i < stageIndex;
                  const current = !closedLost && i === stageIndex;
                  return (
                    <li key={p.label} className="flex min-w-[88px] flex-1 flex-col gap-1.5">
                      <div className={cx('h-1.5 rounded-full', done ? 'bg-brand-500' : current ? 'bg-brand-600' : 'bg-slate-200')} />
                      <span className={cx('text-xs', current ? 'font-semibold text-brand-700' : done ? 'text-slate-600' : 'text-slate-400')}>{p.label}</span>
                    </li>
                  );
                })}
              </ol>
              {closedLost && <Badge tone="red">Closed — {inq.status}</Badge>}
              {canEdit && (
                <div className="flex items-center gap-2">
                  <label htmlFor="status-select" className="text-xs font-medium text-slate-500">Status</label>
                  <select id="status-select" value={inq.status} onChange={(e) => quickStatus(e.target.value as InquiryStatus)} className="input h-9 w-52 py-1">
                    {INQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => run('status', inq)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Change status with comment" aria-label="Change status with comment">
                    <RefreshCw className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Card>
              <CardHeader title="Customer information" action={<Link to={`/customers/${inq.customerId}`} className="text-sm font-medium text-brand-700 hover:underline">View profile</Link>} />
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Name">{inq.customerName}</InfoRow>
                {inq.inbound ? (
                  <>
                    <InfoRow label="Country">{inq.inbound.country}</InfoRow>
                    <InfoRow label="Nationality">{inq.inbound.nationality}</InfoRow>
                  </>
                ) : (
                  <InfoRow label="NIC / Passport">{inq.outbound?.nicPassport}</InfoRow>
                )}
                <InfoRow label="Email">{inq.email && <a href={`mailto:${inq.email}`} className="text-brand-700 hover:underline">{inq.email}</a>}</InfoRow>
                <InfoRow label="Phone">{inq.phone}</InfoRow>
                <InfoRow label="WhatsApp">{inq.whatsapp}</InfoRow>
                {inq.inbound && <InfoRow label="Preferred contact">{inq.inbound.preferredContact}</InfoRow>}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:${inq.phone}`}><Button size="sm" variant="secondary" icon={<Phone className="size-4" />}>Call</Button></a>
                <a href={`https://wa.me/${inq.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary" icon={<MessageCircle className="size-4" />}>WhatsApp</Button></a>
                <a href={`mailto:${inq.email}`}><Button size="sm" variant="secondary" icon={<Mail className="size-4" />}>Email</Button></a>
              </div>
            </Card>

            <Card>
              <CardHeader title="Travel information" />
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label={inq.type === 'Inbound' ? 'Arrival' : 'Travel date'}>{formatDate(travelStart(inq))}</InfoRow>
                <InfoRow label={inq.type === 'Inbound' ? 'Departure' : 'Return date'}>{formatDate(travelEnd(inq))}</InfoRow>
                <InfoRow label="Nights">{inq.nights}</InfoRow>
                <InfoRow label="Travelers">{`${inq.adults} adults${inq.children ? `, ${inq.children} children` : ''}${inq.infants ? `, ${inq.infants} infants` : ''}`}</InfoRow>
                <InfoRow label="Budget">{inq.budget ? formatMoney(inq.budget, inq.currency) : '—'}</InfoRow>
                <InfoRow label="Hotel category">{inq.inbound?.hotelCategory ?? inq.outbound?.hotelCategory}</InfoRow>
                {inq.inbound ? (
                  <>
                    <InfoRow label="Destinations">
                      <span className="flex flex-wrap gap-1">{inq.inbound.destinations.map((d) => <Badge key={d} tone="slate">{d}</Badge>)}</span>
                    </InfoRow>
                    <InfoRow label="Transport">{inq.inbound.transport}</InfoRow>
                    <InfoRow label="Guide">{inq.inbound.guide}</InfoRow>
                    <InfoRow label="Safari">{inq.inbound.safari ? 'Yes' : 'No'}</InfoRow>
                    <InfoRow label="Meal preference">{inq.inbound.mealPreference}</InfoRow>
                    <InfoRow label="Activities">{inq.inbound.activities.join(', ')}</InfoRow>
                  </>
                ) : (
                  <>
                    <InfoRow label="Destination">{inquiryDestination(inq)}</InfoRow>
                    <InfoRow label="Package">{inq.outbound?.packageName}</InfoRow>
                    <InfoRow label="Airline preference">{inq.outbound?.airlinePreference}</InfoRow>
                    <InfoRow label="Room requirement">{inq.outbound?.roomRequirement}</InfoRow>
                    <InfoRow label="Visa">{inq.outbound?.visaRequired ? 'Required' : 'Not required'}</InfoRow>
                    <InfoRow label="Travel insurance">{inq.outbound?.travelInsurance ? 'Yes' : 'No'}</InfoRow>
                    <InfoRow label="Transport">{inq.outbound?.transport}</InfoRow>
                    <InfoRow label="Excursions">{inq.outbound?.excursions}</InfoRow>
                  </>
                )}
              </dl>
              {(inq.specialRequirements || inq.notes) && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {inq.specialRequirements && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><p className="mb-0.5 text-xs font-semibold">Special requirements</p>{inq.specialRequirements}</div>}
                  {inq.notes && <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><p className="mb-0.5 text-xs font-semibold text-slate-500">Inquiry notes</p>{inq.notes}</div>}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Next follow-up" action={can('followup.manage') && <Button size="xs" variant="subtle" icon={<Plus className="size-3.5" />} onClick={() => run('followup', inq)}>Add</Button>} />
              {pendingFu.length ? (
                <ul className="space-y-2">
                  {[...pendingFu].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3).map((f) => (
                    <li key={f.id} className={cx('rounded-lg border p-3', f.date < today ? 'border-red-200 bg-red-50' : 'border-slate-200')}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">{f.type}</span>
                        <span className={cx('text-xs font-semibold', f.date < today ? 'text-red-600' : 'text-slate-500')}>{relativeDay(f.date)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(f.date)} · {formatTime(f.time)}</p>
                      {f.notes && <p className="mt-1 text-xs text-slate-600">{f.notes}</p>}
                      {can('followup.manage') && (
                        <div className="mt-2 flex gap-1.5">
                          <Button size="xs" variant="subtle" onClick={() => setFuModal({ fu: f, mode: 'complete' })}>Complete</Button>
                          <Button size="xs" variant="ghost" onClick={() => setFuModal({ fu: f, mode: 'reschedule' })}>Reschedule</Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No pending follow-ups.</p>
              )}
            </Card>
            <Card>
              <CardHeader title="Summary" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Quotations</dt><dd className="font-medium">{quotations.length}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Latest quote</dt><dd className="font-medium">{quotations[0] ? formatMoney(quotations[0].total, quotations[0].currency) : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Booking</dt><dd>{booking ? <BookingBadge status={booking.bookingStatus} /> : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Last updated</dt><dd className="font-medium">{timeAgo(activities[0]?.createdAt ?? inq.updatedAt)}</dd></div>
              </dl>
            </Card>
            <Card>
              <CardHeader title="Recent activity" action={<button className="text-sm font-medium text-brand-700 hover:underline" onClick={() => setTab('timeline')}>All</button>} />
              <Timeline items={activities.slice(0, 4)} />
            </Card>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <Card>
          <CardHeader title="Activity timeline" subtitle="Every change made to this inquiry" />
          <Timeline items={activities} />
        </Card>
      )}

      {tab === 'followups' && (
        <Card padded={false}>
          <div className="p-5 pb-3"><CardHeader className="mb-0" title="Follow-ups" action={can('followup.manage') && <Button size="sm" icon={<Plus className="size-4" />} onClick={() => run('followup', inq)}>Add Follow-up</Button>} /></div>
          {followups.length === 0 ? (
            <EmptyState icon={<CalendarClock className="size-5" />} title="No follow-ups yet" description="Schedule a call, WhatsApp or email reminder." />
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {followups.map((f) => {
                const overdue = f.status === 'Pending' && f.date < today;
                return (
                  <li key={f.id} className={cx('flex flex-wrap items-start gap-3 px-5 py-4', overdue && 'bg-red-50/60')}>
                    <span className={cx('mt-0.5 flex size-8 items-center justify-center rounded-full', f.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600')}>
                      {f.status === 'Completed' ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{f.type}</p>
                        <Badge tone={f.status === 'Completed' ? 'green' : overdue ? 'red' : 'amber'}>{overdue ? 'Overdue' : f.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(f.date)} at {formatTime(f.time)} · {userById.get(f.assignedTo ?? '')?.name ?? 'Unassigned'}</p>
                      {f.notes && <p className="mt-1 text-sm text-slate-600">{f.notes}</p>}
                      {f.outcome && <p className="mt-1 text-sm text-emerald-700">Outcome: {f.outcome}</p>}
                    </div>
                    {can('followup.manage') && f.status === 'Pending' && (
                      <ActionMenu items={[
                        { label: 'Complete', icon: <CheckCircle2 />, onClick: () => setFuModal({ fu: f, mode: 'complete' }) },
                        { label: 'Reschedule', icon: <CalendarClock />, onClick: () => setFuModal({ fu: f, mode: 'reschedule' }) },
                        { label: 'Edit', icon: <Pencil />, onClick: () => setFuModal({ fu: f, mode: 'edit' }) },
                      ]} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {tab === 'quotations' && (
        <Card padded={false}>
          <div className="p-5 pb-3"><CardHeader className="mb-0" title="Quotations" action={can('quotation.manage') && <Button size="sm" icon={<Plus className="size-4" />} onClick={() => run('quotation', inq)}>Create Quotation</Button>} /></div>
          {quotations.length === 0 ? (
            <EmptyState icon={<FileText className="size-5" />} title="No quotations yet" description="Create a quotation to share pricing with the customer." />
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {quotations.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-800">{q.id}</p><QuotationBadge status={q.status} /></div>
                    <p className="text-xs text-slate-500">Issued {formatDate(q.date)} · valid until {formatDate(q.validUntil)} · {q.services.length} services</p>
                  </div>
                  <p className="text-base font-semibold text-slate-900 tabular-nums">{formatMoney(q.total, q.currency)}</p>
                  <ActionMenu items={[
                    { label: 'Preview', icon: <Eye />, onClick: () => setPreview(q) },
                    { label: 'Edit', icon: <Pencil />, onClick: () => setQModal(q), hidden: !can('quotation.manage') },
                    { label: 'Mark as Sent', icon: <Mail />, onClick: () => quotationService.setStatus(q.id, 'Sent', user).then(() => toast('Quotation marked as sent')), hidden: !can('quotation.manage') || q.status !== 'Draft' },
                    { label: 'Mark as Accepted', icon: <BadgeCheck />, onClick: () => quotationService.setStatus(q.id, 'Accepted', user).then(() => toast('Quotation accepted')), hidden: !can('quotation.manage') || !['Sent', 'Draft'].includes(q.status) },
                    { label: 'Mark as Rejected', icon: <RefreshCw />, onClick: () => quotationService.setStatus(q.id, 'Rejected', user).then(() => toast('Quotation rejected')), hidden: !can('quotation.manage') || q.status !== 'Sent' },
                  ]} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'booking' && (
        <Card>
          {!booking ? (
            <EmptyState icon={<Luggage className="size-5" />} title="Not booked yet" description="Once the customer confirms, convert this inquiry into a booking to track payments." action={can('booking.manage') && !closedLost && <Button icon={<BadgeCheck className="size-4" />} onClick={() => run('booking', inq)}>Convert to Booking</Button>} />
          ) : (
            <div>
              <CardHeader title={<span className="flex items-center gap-2">{booking.id} <BookingBadge status={booking.bookingStatus} /> <PaymentBadge status={booking.paymentStatus} /></span>} subtitle={`Created ${formatDate(booking.createdAt)}`} action={can('booking.manage') && booking.paymentStatus !== 'Paid' && booking.bookingStatus !== 'Cancelled' && <Button size="sm" icon={<CreditCard className="size-4" />} onClick={() => setPayOpen(true)}>Record Payment</Button>} />
              <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <InfoRow label="Package">{booking.packageName}</InfoRow>
                <InfoRow label="Travel">{`${formatDate(booking.travelDate)} – ${formatDate(booking.returnDate)}`}</InfoRow>
                <InfoRow label="Travelers">{booking.travelers}</InfoRow>
                <InfoRow label="Quotation">{booking.quotationId}</InfoRow>
              </dl>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[['Total', booking.totalAmount, 'text-slate-900'], ['Paid', paidAmount(booking), 'text-emerald-700'], ['Balance', balanceAmount(booking), balanceAmount(booking) > 0 ? 'text-red-600' : 'text-slate-900']].map(([l, v, c]) => (
                  <div key={l as string} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{l}</p>
                    <p className={cx('text-base font-semibold tabular-nums sm:text-lg', c as string)}>{formatMoney(v as number, booking.currency)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (paidAmount(booking) / booking.totalAmount) * 100)}%` }} /></div>
              <h4 className="mt-6 mb-2 text-sm font-semibold text-slate-800">Payments</h4>
              {booking.payments.length === 0 ? <p className="text-sm text-slate-500">No payments recorded.</p> : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {booking.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span><span className="font-medium text-slate-800">{formatDate(p.date)}</span> <span className="text-slate-500">· {p.method} {p.reference && `· ${p.reference}`}</span></span>
                      <span className="font-semibold tabular-nums">{formatMoney(p.amount, booking.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {booking.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{booking.notes}</p>}
            </div>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <CardHeader title="Documents" subtitle="Passports, tickets, vouchers and invoices" action={!readOnly && <Button size="sm" variant="secondary" icon={<Upload className="size-4" />} onClick={() => toast('Document uploads will be available in Phase 2', 'info')}>Upload</Button>} />
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
            <FolderOpen className="mx-auto size-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">Document storage is coming in Phase 2</p>
            <p className="mt-1 text-xs text-slate-500">Files will be stored securely on the server and linked to this inquiry.</p>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {['Passport copies', 'Flight tickets / e-tickets', 'Hotel vouchers', 'Invoice', 'Visa documents', 'Travel insurance'].map((d) => (
              <li key={d} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500"><FileText className="size-4 text-slate-300" /> {d}</li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'notes' && (
        <Card>
          <CardHeader title="Internal notes" subtitle="Visible to staff only" action={canEdit && <Button size="sm" icon={<Plus className="size-4" />} onClick={() => run('note', inq)}>Add Note</Button>} />
          {notes.length === 0 ? (
            <EmptyState icon={<StickyNote className="size-5" />} title="No notes yet" />
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => {
                const author = userById.get(n.authorId ?? '');
                return (
                  <li key={n.id} className="flex gap-3">
                    <Avatar name={n.authorName} color={author?.avatarColor} size="sm" />
                    <div className="flex-1 rounded-xl rounded-tl-sm bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500"><b className="font-semibold text-slate-700">{n.authorName}</b> · {formatDateTime(n.createdAt)}</p>
                      <p className="mt-1 text-sm whitespace-pre-line text-slate-700">{n.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {modals}
      <FollowUpModal open={!!fuModal} onClose={() => setFuModal(null)} followup={fuModal?.fu} mode={fuModal?.mode} />
      <QuotationModal open={!!qModal} onClose={() => setQModal(null)} quotation={qModal} />
      <QuotationPreview open={!!preview} onClose={() => setPreview(null)} quotation={preview} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} booking={booking ?? null} />
    </div>
  );
}

const KIND_STYLE: Record<Activity['kind'], string> = {
  created: 'bg-blue-50 text-blue-600', status: 'bg-violet-50 text-violet-600', assigned: 'bg-slate-100 text-slate-600', followup: 'bg-amber-50 text-amber-600',
  note: 'bg-slate-100 text-slate-600', quotation: 'bg-indigo-50 text-indigo-600', booking: 'bg-emerald-50 text-emerald-600', payment: 'bg-green-50 text-green-600', updated: 'bg-slate-100 text-slate-600',
};
const KIND_ICON: Record<Activity['kind'], ReactNode> = {
  created: <Plus className="size-3.5" />, status: <RefreshCw className="size-3.5" />, assigned: <UserPlus className="size-3.5" />, followup: <CalendarClock className="size-3.5" />,
  note: <StickyNote className="size-3.5" />, quotation: <FileText className="size-3.5" />, booking: <BadgeCheck className="size-3.5" />, payment: <CreditCard className="size-3.5" />, updated: <Pencil className="size-3.5" />,
};

function Timeline({ items }: { items: Activity[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">No activity yet.</p>;
  return (
    <ol className="relative space-y-4">
      {items.map((a, i) => (
        <li key={a.id} className="relative flex gap-3">
          {i < items.length - 1 && <span className="absolute top-7 bottom-[-16px] left-[13px] w-px bg-slate-200" aria-hidden />}
          <span className={cx('relative flex size-7 shrink-0 items-center justify-center rounded-full', KIND_STYLE[a.kind])}>{KIND_ICON[a.kind]}</span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm text-slate-800">{a.message}</p>
            <p className="text-xs text-slate-500">{a.actorName} · {formatDateTime(a.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
