import { useEffect, useState } from 'react';
import { INQUIRY_STATUSES, type Inquiry, type InquiryStatus } from '@/types';
import { inquiryService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Field, Modal, Select, StatusBadge, Textarea } from '@/components/ui';

export function StatusModal({ open, onClose, inquiry }: { open: boolean; onClose: () => void; inquiry: Inquiry | null }) {
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<InquiryStatus>('New');
  const [reason, setReason] = useState('');
  useEffect(() => { if (inquiry) { setStatus(inquiry.status); setReason(''); } }, [inquiry, open]);
  if (!inquiry) return null;
  const needsReason = status === 'Lost' || status === 'Cancelled';
  const save = async () => {
    await inquiryService.changeStatus(inquiry.id, status, user, reason.trim() || undefined);
    toast(`Status updated to ${status}`);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change status"
      subtitle={`${inquiry.id} · ${inquiry.customerName}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={status === inquiry.status || (needsReason && !reason.trim())}>Update status</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">Current: <StatusBadge status={inquiry.status} /></div>
        <Field label="New status">
          <Select options={INQUIRY_STATUSES} value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} />
        </Field>
        <Field label={needsReason ? 'Reason (required)' : 'Comment (optional)'}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={needsReason ? 'e.g. Booked with another agency, price too high' : ''} />
        </Field>
      </div>
    </Modal>
  );
}
