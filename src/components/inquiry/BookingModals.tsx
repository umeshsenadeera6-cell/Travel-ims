import { useEffect, useState } from 'react';
import type { Booking, Currency, Inquiry } from '@/types';
import { CURRENCIES } from '@/types';
import { balanceAmount, bookingService, quotationService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { todayISO } from '@/utils/date';
import { formatMoney } from '@/utils/format';
import { travelEnd, travelerCount, travelStart } from '@/utils/inquiry';

const METHODS = ['Bank Transfer', 'Card', 'Cash', 'PayPal', 'Cheque'];

export function ConvertBookingModal({ open, onClose, inquiry, onDone }: { open: boolean; onClose: () => void; inquiry: Inquiry | null; onDone?: (b: Booking) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ packageName: '', travelDate: '', returnDate: '', travelers: 1, totalAmount: 0, currency: 'USD' as Currency, quotationId: '', advance: 0, method: 'Bank Transfer', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !inquiry) return;
    quotationService.listByInquiry(inquiry.id).then((qs) => {
      const q = qs.find((x) => x.status === 'Accepted') ?? qs.find((x) => x.status === 'Sent') ?? qs[0];
      setForm({
        packageName: inquiry.outbound?.packageName ?? `${inquiry.nights}N ${inquiry.inbound?.destinations.slice(0, 2).join(' & ') ?? ''} Tour`,
        travelDate: travelStart(inquiry), returnDate: travelEnd(inquiry), travelers: travelerCount(inquiry),
        totalAmount: q?.total ?? inquiry.budget, currency: q?.currency ?? inquiry.currency, quotationId: q?.id ?? '',
        advance: 0, method: 'Bank Transfer', reference: '', notes: '',
      });
    });
  }, [open, inquiry]);

  if (!inquiry) return null;
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const b = await bookingService.createFromInquiry({
      inquiry, quotationId: form.quotationId || undefined, packageName: form.packageName, travelDate: form.travelDate, returnDate: form.returnDate,
      travelers: form.travelers, totalAmount: form.totalAmount, currency: form.currency, notes: form.notes,
      advance: form.advance > 0 ? { amount: form.advance, method: form.method, reference: form.reference, date: todayISO() } : null,
    }, user);
    setSaving(false);
    toast(`Booking ${b.id} created`);
    onDone?.(b);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Convert to booking"
      subtitle={`${inquiry.id} · ${inquiry.customerName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!form.packageName || form.totalAmount <= 0 || !form.travelDate}>Confirm booking</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Package / tour name" required className="sm:col-span-2"><Input value={form.packageName} onChange={(e) => set('packageName', e.target.value)} /></Field>
        <Field label="Travel date" required><Input type="date" value={form.travelDate} onChange={(e) => set('travelDate', e.target.value)} /></Field>
        <Field label="Return date"><Input type="date" value={form.returnDate} onChange={(e) => set('returnDate', e.target.value)} /></Field>
        <Field label="Travelers"><Input type="number" min={1} value={form.travelers} onChange={(e) => set('travelers', Number(e.target.value))} /></Field>
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <Field label="Currency"><Select options={CURRENCIES} value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)} /></Field>
          <Field label="Total amount" required hint={form.quotationId ? `From ${form.quotationId}` : undefined}><Input type="number" min={0} value={form.totalAmount} onChange={(e) => set('totalAmount', Number(e.target.value))} /></Field>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:col-span-2">
          <p className="mb-3 text-sm font-semibold text-slate-800">Advance payment <span className="font-normal text-slate-500">(optional)</span></p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Amount"><Input type="number" min={0} max={form.totalAmount} value={form.advance} onChange={(e) => set('advance', Number(e.target.value))} /></Field>
            <Field label="Method"><Select options={METHODS} value={form.method} onChange={(e) => set('method', e.target.value)} /></Field>
            <Field label="Reference"><Input value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="TRX…" /></Field>
          </div>
        </div>
        <Field label="Booking notes" className="sm:col-span-2"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export function PaymentModal({ open, onClose, booking }: { open: boolean; onClose: () => void; booking: Booking | null }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ amount: 0, date: todayISO(), method: 'Bank Transfer', reference: '' });
  useEffect(() => { if (booking && open) setForm({ amount: balanceAmount(booking), date: todayISO(), method: 'Bank Transfer', reference: '' }); }, [booking, open]);
  if (!booking) return null;
  const balance = balanceAmount(booking);
  const save = async () => {
    await bookingService.addPayment(booking.id, form, user);
    toast(`Payment of ${formatMoney(form.amount, booking.currency)} recorded`);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Record payment"
      subtitle={`${booking.id} · Balance ${formatMoney(balance, booking.currency)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={form.amount <= 0 || form.amount > balance}>Record payment</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <Field label={`Amount (${booking.currency})`} error={form.amount > balance ? 'Amount exceeds balance' : undefined}>
          <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
        </Field>
        <Field label="Payment date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Method"><Select options={METHODS} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} /></Field>
        <Field label="Reference"><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
