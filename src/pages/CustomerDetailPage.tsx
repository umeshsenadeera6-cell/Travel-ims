import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Inbox, Luggage, Mail, MessageCircle, Pencil, Phone, Plus, Wallet } from 'lucide-react';
import { bookingService, customerService, inquiryService, noteService, balanceAmount } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { NoteModal } from '@/components/inquiry/NoteModal';
import { Avatar, BookingBadge, Button, Card, CardHeader, EmptyState, InfoRow, KpiCard, PaymentBadge, Spinner, StatusBadge, TypeBadge } from '@/components/ui';
import { AccessDenied, NotFound } from './SystemPages';
import { CustomerModal, CustomerStatusBadge } from './CustomersPage';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatMoney, toUSD, compactNumber } from '@/utils/format';
import { canSeeInquiry } from '@/utils/permissions';
import { inquiryDestination } from '@/utils/inquiry';

export default function CustomerDetailPage() {
  const { id = '' } = useParams();
  const { user, can } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const { data, loading } = useServiceQuery(async () => {
    const [customer, inquiries, bookings, notes] = await Promise.all([customerService.get(id), inquiryService.list(), bookingService.list(), noteService.listByCustomer(id)]);
    return { customer, inquiries: inquiries.filter((i) => i.customerId === id), bookings: bookings.filter((b) => b.customerId === id), notes };
  }, [id]);

  if (loading && !data) return <Spinner />;
  if (!data?.customer) return <NotFound />;
  const { customer: c, inquiries, bookings, notes } = data;
  const outsideDept = user?.department !== 'All' && user?.department !== c.segment && !inquiries.some((i) => canSeeInquiry(user, i));
  if (outsideDept || (user?.role === 'Sales Executive' && !inquiries.some((i) => canSeeInquiry(user, i)))) return <AccessDenied />;
  const visibleInquiries = inquiries.filter((i) => canSeeInquiry(user, i));
  const visibleIds = new Set(visibleInquiries.map((i) => i.id));
  // Sales executives only see records tied to their own inquiries.
  const isSales = user?.role === 'Sales Executive';
  const visibleBookings = isSales ? bookings.filter((b) => visibleIds.has(b.inquiryId)) : bookings;
  const visibleNotes = isSales ? notes.filter((n) => !n.inquiryId || visibleIds.has(n.inquiryId)) : notes;
  const spent = visibleBookings.filter((b) => b.bookingStatus !== 'Cancelled').reduce((s, b) => s + toUSD(b.totalAmount, b.currency), 0);

  return (
    <div className="space-y-5">
      <Link to="/customers" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700"><ArrowLeft className="size-3.5" /> Customers</Link>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={c.name} color={c.segment === 'Inbound' ? '#188c67' : '#c8962e'} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight text-slate-900">{c.name}</h1><CustomerStatusBadge status={c.status} /><TypeBadge type={c.segment} /></div>
            <p className="mt-1 text-sm text-slate-500">{c.country}{c.nationality && ` · ${c.nationality}`} · Customer since {formatDate(c.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${c.phone}`}><Button size="sm" variant="secondary" icon={<Phone className="size-4" />}>Call</Button></a>
            <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary" icon={<MessageCircle className="size-4" />}>WhatsApp</Button></a>
            <a href={`mailto:${c.email}`}><Button size="sm" variant="secondary" icon={<Mail className="size-4" />}>Email</Button></a>
            {can('customer.manage') && <Button size="sm" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>Edit</Button>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={isSales ? 'Your inquiries' : 'Total inquiries'} value={visibleInquiries.length} icon={<Inbox className="size-5" />} tone="blue" />
        <KpiCard label="Bookings" value={visibleBookings.filter((b) => b.bookingStatus !== 'Cancelled').length} icon={<Luggage className="size-5" />} />
        <KpiCard label="Lifetime value" value={`$${compactNumber(spent)}`} icon={<Wallet className="size-5" />} tone="emerald" hint="USD equivalent" />
        <KpiCard label="Last inquiry" value={<span className="text-lg">{formatDate(visibleInquiries[0]?.createdAt)}</span>} icon={<CalendarDays className="size-5" />} tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Contact information" />
            <dl className="grid grid-cols-1 gap-3">
              <InfoRow label="Email">{c.email}</InfoRow>
              <InfoRow label="Phone">{c.phone}</InfoRow>
              <InfoRow label="WhatsApp">{c.whatsapp}</InfoRow>
              {c.nicPassport && <InfoRow label="NIC / Passport">{c.nicPassport}</InfoRow>}
              <InfoRow label="Country">{c.country}</InfoRow>
            </dl>
            {c.notes && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{c.notes}</p>}
          </Card>
          <Card>
            <CardHeader title="Notes" action={can('customer.manage') && <Button size="xs" variant="subtle" icon={<Plus className="size-3.5" />} onClick={() => setNoteOpen(true)}>Add</Button>} />
            {visibleNotes.length === 0 ? <p className="text-sm text-slate-500">No notes yet.</p> : (
              <ul className="space-y-3">
                {visibleNotes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm text-slate-700">{n.text}</p>
                    <p className="mt-1 text-xs text-slate-500">{n.authorName} · {formatDateTime(n.createdAt)}{n.inquiryId && <> · <Link className="text-brand-700 hover:underline" to={`/inquiries/${n.inquiryId}`}>{n.inquiryId}</Link></>}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Card padded={false}>
            <div className="p-5 pb-3"><CardHeader className="mb-0" title="Inquiry history" /></div>
            {visibleInquiries.length === 0 ? <EmptyState title="No inquiries" /> : (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {visibleInquiries.map((i) => (
                  <li key={i.id}>
                    <Link to={`/inquiries/${i.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <div className="min-w-[200px] flex-1">
                        <p className="text-sm font-semibold text-brand-700">{i.id}</p>
                        <p className="text-xs text-slate-500">{formatDate(i.createdAt)} · {inquiryDestination(i)}</p>
                      </div>
                      <TypeBadge type={i.type} />
                      <StatusBadge status={i.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card padded={false}>
            <div className="p-5 pb-3"><CardHeader className="mb-0" title="Booking history" /></div>
            {visibleBookings.length === 0 ? <EmptyState title="No bookings yet" /> : (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {visibleBookings.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-[200px] flex-1">
                      <p className="text-sm font-semibold text-slate-800">{b.id} · {b.packageName}</p>
                      <p className="text-xs text-slate-500">Travel {formatDate(b.travelDate)} · {b.travelers} pax · balance {formatMoney(balanceAmount(b), b.currency)}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatMoney(b.totalAmount, b.currency)}</span>
                    <PaymentBadge status={b.paymentStatus} />
                    <BookingBadge status={b.bookingStatus} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <CustomerModal customer={editOpen ? c : null} onClose={() => setEditOpen(false)} />
      <NoteModal open={noteOpen} onClose={() => setNoteOpen(false)} customerId={c.id} />
    </div>
  );
}
