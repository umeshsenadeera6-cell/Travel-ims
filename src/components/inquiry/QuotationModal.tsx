import { useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { CURRENCIES, type Currency, type Inquiry, type Quotation, type QuotationLine, type QuotationStatus } from '@/types';
import { inquiryService, quotationService, settingsService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { canSeeInquiry } from '@/utils/permissions';
import { addDays, todayISO, toISODate } from '@/utils/date';
import { formatMoney } from '@/utils/format';
import { inquiryDestination, travelEnd, travelerCount, travelStart } from '@/utils/inquiry';
import { uid } from '@/utils/id';
import { QuotationPreview } from './QuotationPreview';

interface FormState {
  inquiryId: string;
  customerName: string;
  destination: string;
  travelFrom: string;
  travelTo: string;
  date: string;
  validUntil: string;
  currency: Currency;
  services: QuotationLine[];
  discount: number;
  terms: string;
  notes: string;
}

function suggestedLines(inq: Inquiry): QuotationLine[] {
  const pax = travelerCount(inq);
  if (inq.type === 'Inbound') {
    return [
      { id: uid('l'), description: `Accommodation — ${inq.nights} nights, ${inq.inbound?.hotelCategory ?? ''} (${inq.inbound?.mealPreference ?? ''})`, qty: inq.nights, unitPrice: 0 },
      { id: uid('l'), description: `${inq.inbound?.transport ?? 'Transport'} with ${inq.inbound?.guide ?? 'guide'}`, qty: inq.nights + 1, unitPrice: 0 },
      { id: uid('l'), description: 'Entrance fees & sightseeing', qty: pax, unitPrice: 0 },
    ];
  }
  return [
    { id: uid('l'), description: `Return air tickets (${inq.outbound?.airlinePreference ?? 'Any airline'})`, qty: pax, unitPrice: 0 },
    { id: uid('l'), description: `Hotel — ${inq.nights} nights, ${inq.outbound?.hotelCategory ?? ''}`, qty: inq.nights, unitPrice: 0 },
    { id: uid('l'), description: 'Airport transfers & sightseeing', qty: 1, unitPrice: 0 },
  ];
}

export function QuotationModal({ open, onClose, inquiry, quotation }: { open: boolean; onClose: () => void; inquiry?: Inquiry | null; quotation?: Quotation | null }) {
  const { user, scope } = useAuth();
  const toast = useToast();
  const { data: inquiries = [] } = useServiceQuery(() => inquiryService.list());
  const visible = useMemo(() => inquiries.filter((i) => canSeeInquiry(user, i, scope) && !['Lost', 'Cancelled', 'Travel Completed'].includes(i.status)), [inquiries, user, scope]);
  const [form, setForm] = useState<FormState | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const settings = settingsService.getSync();

  const fromInquiry = (inq: Inquiry): FormState => ({
    inquiryId: inq.id, customerName: inq.customerName, destination: inquiryDestination(inq), travelFrom: travelStart(inq), travelTo: travelEnd(inq),
    date: todayISO(), validUntil: toISODate(addDays(new Date(), settings.quotationValidityDays)), currency: inq.currency,
    services: suggestedLines(inq), discount: 0, terms: settings.quotationTerms, notes: '',
  });

  useEffect(() => {
    if (!open) return;
    if (quotation) setForm({ ...quotation, services: quotation.services.map((s) => ({ ...s })) });
    else if (inquiry) setForm(fromInquiry(inquiry));
    else setForm({ inquiryId: '', customerName: '', destination: '', travelFrom: '', travelTo: '', date: todayISO(), validUntil: toISODate(addDays(new Date(), settings.quotationValidityDays)), currency: 'USD', services: [{ id: uid('l'), description: '', qty: 1, unitPrice: 0 }], discount: 0, terms: settings.quotationTerms, notes: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quotation, inquiry]);

  if (!form) return null;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const setLine = (id: string, patch: Partial<QuotationLine>) => set('services', form.services.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const { subtotal, total } = quotationService.calcTotals(form);
  const valid = form.inquiryId && form.services.some((l) => l.description && l.unitPrice > 0);
  const previewQuote: Quotation = { ...form, id: quotation?.id ?? quotationService.previewNextId(), subtotal, total, status: quotation?.status ?? 'Draft', createdBy: user?.id ?? null };

  const save = async (status: QuotationStatus) => {
    setSaving(true);
    try {
      const payload = { ...form, services: form.services.filter((l) => l.description), status, createdBy: quotation?.createdBy ?? user?.id ?? null };
      if (quotation) {
        await quotationService.update(quotation.id, payload, user);
        if (status !== quotation.status) await quotationService.setStatus(quotation.id, status, user);
        toast(`Quotation ${quotation.id} updated`);
      } else {
        const q = await quotationService.create(payload, user);
        toast(`Quotation ${q.id} ${status === 'Sent' ? 'created and marked as sent' : 'saved as draft'}`);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open && !preview}
        onClose={onClose}
        size="xl"
        title={quotation ? `Edit quotation ${quotation.id}` : 'Create quotation'}
        subtitle={form.customerName ? `${form.inquiryId} · ${form.customerName}` : 'Select an inquiry to quote'}
        footer={
          <>
            <Button variant="ghost" icon={<Eye className="size-4" />} onClick={() => setPreview(true)} disabled={!form.inquiryId} className="mr-auto">Preview quotation</Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="outline" onClick={() => save('Draft')} disabled={!valid} loading={saving}>Save draft</Button>
            <Button onClick={() => save('Sent')} disabled={!valid} loading={saving}>Save & mark sent</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Inquiry" required className="md:col-span-1">
              <Select
                value={form.inquiryId}
                disabled={!!inquiry || !!quotation}
                placeholder="Select inquiry…"
                options={(quotation || inquiry ? inquiries : visible).map((i) => ({ value: i.id, label: `${i.id} — ${i.customerName}` }))}
                onChange={(e) => {
                  const inq = inquiries.find((i) => i.id === e.target.value);
                  if (inq) setForm(fromInquiry(inq));
                }}
              />
            </Field>
            <Field label="Customer">
              <Input value={form.customerName} readOnly className="bg-slate-50" />
            </Field>
            <Field label="Destination">
              <Input value={form.destination} onChange={(e) => set('destination', e.target.value)} />
            </Field>
            <Field label="Travel from">
              <Input type="date" value={form.travelFrom} onChange={(e) => set('travelFrom', e.target.value)} />
            </Field>
            <Field label="Travel to">
              <Input type="date" value={form.travelTo} onChange={(e) => set('travelTo', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quote date">
                <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </Field>
              <Field label="Valid until">
                <Input type="date" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
              </Field>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Services</h3>
              <Button size="sm" variant="subtle" icon={<Plus className="size-4" />} onClick={() => set('services', [...form.services, { id: uid('l'), description: '', qty: 1, unitPrice: 0 }])}>Add line</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_80px_130px_130px_40px] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase md:grid">
                <span>Description</span><span>Qty</span><span>Unit price</span><span className="text-right">Amount</span><span />
              </div>
              {form.services.map((l) => (
                <div key={l.id} className="grid grid-cols-[1fr_auto] gap-2 border-t border-slate-100 p-3 first:border-t-0 md:grid-cols-[1fr_80px_130px_130px_40px] md:items-center md:first:border-t">
                  <Input value={l.description} onChange={(e) => setLine(l.id, { description: e.target.value })} placeholder="Service description" className="col-span-2 md:col-span-1" />
                  <Input type="number" min={0} value={l.qty} onChange={(e) => setLine(l.id, { qty: Number(e.target.value) })} aria-label="Quantity" />
                  <Input type="number" min={0} value={l.unitPrice} onChange={(e) => setLine(l.id, { unitPrice: Number(e.target.value) })} aria-label="Unit price" />
                  <p className="self-center text-right text-sm font-medium text-slate-700 tabular-nums">{formatMoney(l.qty * l.unitPrice, form.currency)}</p>
                  <button onClick={() => set('services', form.services.filter((x) => x.id !== l.id))} className="justify-self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove line">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_320px]">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Terms & conditions">
                <Textarea value={form.terms} onChange={(e) => set('terms', e.target.value)} className="min-h-28" />
              </Field>
              <Field label="Notes to customer">
                <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional message shown on the quotation" />
              </Field>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <Field label="Currency">
                <Select options={CURRENCIES} value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)} />
              </Field>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium tabular-nums">{formatMoney(subtotal, form.currency)}</span></div>
              <Field label="Discount">
                <Input type="number" min={0} value={form.discount} onChange={(e) => set('discount', Number(e.target.value))} />
              </Field>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-lg font-semibold text-brand-700 tabular-nums">{formatMoney(total, form.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <QuotationPreview open={open && preview} onClose={() => setPreview(false)} quotation={previewQuote} backLabel="Back to editing" />
    </>
  );
}
