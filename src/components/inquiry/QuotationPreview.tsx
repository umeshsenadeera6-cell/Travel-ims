import { Printer } from 'lucide-react';
import type { Quotation } from '@/types';
import { Button, Modal, QuotationBadge } from '@/components/ui';
import { settingsService } from '@/services';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';
import { BrandMark } from '@/components/layout/Brand';

export function QuotationPreview({ open, onClose, quotation, backLabel = 'Close' }: { open: boolean; onClose: () => void; quotation: Quotation | null; backLabel?: string }) {
  if (!quotation) return null;
  const s = settingsService.getSync();
  const q = quotation;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Quotation preview`}
      subtitle={q.id}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{backLabel}</Button>
          <Button icon={<Printer className="size-4" />} onClick={() => window.print()}>Print / Save PDF</Button>
        </>
      }
    >
      <div className="print-area rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11" />
            <div>
              <p className="text-base font-bold text-slate-900">{s.companyName}</p>
              <p className="text-xs text-slate-500">{s.companyAddress}</p>
              <p className="text-xs text-slate-500">{s.companyPhone} · {s.companyEmail}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-xl font-semibold tracking-tight text-brand-700">QUOTATION</p>
            <p className="font-medium text-slate-800">{q.id}</p>
            <div className="mt-1"><QuotationBadge status={q.status} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-4">
          <div><p className="text-xs text-slate-500">Prepared for</p><p className="font-medium text-slate-900">{q.customerName}</p><p className="text-xs text-slate-500">Ref: {q.inquiryId}</p></div>
          <div><p className="text-xs text-slate-500">Destination</p><p className="font-medium text-slate-900">{q.destination || '—'}</p></div>
          <div><p className="text-xs text-slate-500">Travel dates</p><p className="font-medium text-slate-900">{formatDate(q.travelFrom)} – {formatDate(q.travelTo)}</p></div>
          <div><p className="text-xs text-slate-500">Issued / Valid until</p><p className="font-medium text-slate-900">{formatDate(q.date)}</p><p className="text-xs text-slate-500">until {formatDate(q.validUntil)}</p></div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <th className="px-3 py-2 font-semibold">Service</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Rate</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {q.services.filter((l) => l.description).map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="px-3 py-2.5">{l.description}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{l.qty}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">{formatMoney(l.unitPrice, q.currency)}</td>
                <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap tabular-nums">{formatMoney(l.qty * l.unitPrice, q.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{formatMoney(q.subtotal, q.currency)}</span></div>
          {q.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-red-600 tabular-nums">− {formatMoney(q.discount, q.currency)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900"><span>Total</span><span className="text-brand-700 tabular-nums">{formatMoney(q.total, q.currency)}</span></div>
        </div>

        {q.notes && <p className="mt-6 rounded-lg bg-brand-50 p-3 text-slate-700">{q.notes}</p>}
        <div className="mt-6">
          <p className="mb-1 text-xs font-semibold text-slate-500 uppercase">Terms & conditions</p>
          <p className="text-xs leading-relaxed whitespace-pre-line text-slate-600">{q.terms}</p>
        </div>
        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">Thank you for choosing Serendib Travel & Tours.</p>
      </div>
    </Modal>
  );
}
