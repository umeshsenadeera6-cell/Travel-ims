import { useState } from 'react';
import type { Inquiry } from '@/types';
import { AssignModal } from './AssignModal';
import { FollowUpModal } from './FollowUpModal';
import { NoteModal } from './NoteModal';
import { StatusModal } from './StatusModal';
import { QuotationModal } from './QuotationModal';
import { ConvertBookingModal } from './BookingModals';

export type InquiryAction = 'assign' | 'followup' | 'note' | 'status' | 'quotation' | 'booking';

/** Centralises inquiry modals so list pages and the detail page share one workflow. */
export function useInquiryActions() {
  const [state, setState] = useState<{ action: InquiryAction; inquiry: Inquiry } | null>(null);
  const close = () => setState(null);
  const is = (a: InquiryAction) => state?.action === a;
  const inquiry = state?.inquiry ?? null;

  const modals = (
    <>
      <AssignModal open={is('assign')} onClose={close} inquiry={inquiry} />
      <FollowUpModal open={is('followup')} onClose={close} inquiry={inquiry} />
      <NoteModal open={is('note')} onClose={close} inquiry={inquiry} />
      <StatusModal open={is('status')} onClose={close} inquiry={inquiry} />
      <QuotationModal open={is('quotation')} onClose={close} inquiry={inquiry} />
      <ConvertBookingModal open={is('booking')} onClose={close} inquiry={inquiry} />
    </>
  );
  return { run: (action: InquiryAction, inquiry: Inquiry) => setState({ action, inquiry }), modals };
}
