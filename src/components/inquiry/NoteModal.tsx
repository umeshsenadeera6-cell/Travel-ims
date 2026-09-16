import { useEffect, useState } from 'react';
import type { Inquiry } from '@/types';
import { noteService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Modal, Textarea } from '@/components/ui';

export function NoteModal({ open, onClose, inquiry, customerId }: { open: boolean; onClose: () => void; inquiry?: Inquiry | null; customerId?: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setText(''); }, [open]);

  const save = async () => {
    setSaving(true);
    await noteService.create({ inquiryId: inquiry?.id, customerId: inquiry?.customerId ?? customerId, text: text.trim() }, user);
    setSaving(false);
    toast('Note added');
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add internal note"
      subtitle={inquiry ? `${inquiry.id} · ${inquiry.customerName}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!text.trim()}>Add note</Button>
        </>
      }
    >
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Notes are visible to staff only…" className="min-h-32" autoFocus />
    </Modal>
  );
}
