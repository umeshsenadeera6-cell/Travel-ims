import type { ReactNode } from 'react';
import type { BookingStatus, InquiryStatus, InquiryType, PaymentStatus, Priority, QuotationStatus } from '@/types';
import { BOOKING_TONE, PAYMENT_TONE, PRIORITY_META, QUOTATION_TONE, STATUS_TONE, TONE_CLASSES, type Tone } from '@/utils/constants';
import { cx } from '@/utils/format';
import { PlaneLanding, PlaneTakeoff } from 'lucide-react';

export function Badge({ tone = 'slate', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', TONE_CLASSES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }: { status: InquiryStatus }) => <Badge tone={STATUS_TONE[status]} dot>{status}</Badge>;
export const QuotationBadge = ({ status }: { status: QuotationStatus }) => <Badge tone={QUOTATION_TONE[status]} dot>{status}</Badge>;
export const PaymentBadge = ({ status }: { status: PaymentStatus }) => <Badge tone={PAYMENT_TONE[status]}>{status}</Badge>;
export const BookingBadge = ({ status }: { status: BookingStatus }) => <Badge tone={BOOKING_TONE[status]} dot>{status}</Badge>;

export function PriorityBadge({ priority, compact }: { priority: Priority; compact?: boolean }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', m.bg, m.text)}>
      <span className={cx('size-2 rounded-full', m.dot)} aria-hidden />
      {!compact && priority}
      <span className="sr-only">{priority} priority</span>
    </span>
  );
}

export function TypeBadge({ type }: { type: InquiryType }) {
  const Icon = type === 'Inbound' ? PlaneLanding : PlaneTakeoff;
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium', type === 'Inbound' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-800')}>
      <Icon className="size-3.5" /> {type}
    </span>
  );
}
