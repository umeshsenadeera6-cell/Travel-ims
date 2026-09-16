import { useEffect, useMemo, useState } from 'react';
import type { FollowUp, FollowUpType, Inquiry } from '@/types';
import { followupService, inquiryService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { FOLLOWUP_TYPES } from '@/utils/constants';
import { daysFromToday } from '@/utils/date';
import { useUserMap } from '@/hooks/useWorkspaceData';
import { executivesFor } from '@/utils/departments';

type Mode = 'create' | 'edit' | 'reschedule' | 'complete';

export function FollowUpModal({ open, onClose, inquiry, followup, mode = 'create' }: { open: boolean; onClose: () => void; inquiry?: Inquiry | null; followup?: FollowUp | null; mode?: Mode }) {
  const { user } = useAuth();
  const toast = useToast();
  const users = useUserMap();
  const dept = inquiry?.type ?? (followup?.inquiryId.startsWith('OUT') ? 'Outbound' : 'Inbound');
  const execs = useMemo(() => executivesFor([...users.values()], dept), [users, dept]);
  const [form, setForm] = useState({ date: daysFromToday(1), time: '10:00', type: 'Phone Call' as FollowUpType, notes: '', assignedTo: '' as string, outcome: '', markInquiry: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (followup) {
      setForm({ date: mode === 'reschedule' ? daysFromToday(1) : followup.date, time: followup.time, type: followup.type, notes: followup.notes, assignedTo: followup.assignedTo ?? '', outcome: followup.outcome ?? '', markInquiry: false });
    } else {
      setForm({ date: daysFromToday(1), time: '10:00', type: 'Phone Call', notes: '', assignedTo: inquiry?.assignedTo ?? (user?.role === 'Sales Executive' ? user.id : ''), outcome: '', markInquiry: true });
    }
  }, [open, followup, inquiry, mode, user]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const inquiryId = followup?.inquiryId ?? inquiry?.id;
  const customerName = followup?.customerName ?? inquiry?.customerName ?? '';

  const submit = async () => {
    if (!inquiryId) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        await followupService.create({ inquiryId, customerName, date: form.date, time: form.time, type: form.type, notes: form.notes, assignedTo: form.assignedTo || null }, user);
        if (form.markInquiry && inquiry && ['New', 'Contacted', 'Quotation Sent'].includes(inquiry.status)) await inquiryService.changeStatus(inquiry.id, 'Follow-up Required', user);
        toast('Follow-up scheduled');
      } else if (mode === 'reschedule') {
        await followupService.reschedule(followup!.id, form.date, form.time, user);
        toast('Follow-up rescheduled');
      } else if (mode === 'complete') {
        await followupService.complete(followup!.id, form.outcome, user);
        toast('Follow-up marked as completed');
      } else {
        await followupService.update(followup!.id, { date: form.date, time: form.time, type: form.type, notes: form.notes, assignedTo: form.assignedTo || null }, user);
        toast('Follow-up updated');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const titles: Record<Mode, string> = { create: 'Add follow-up', edit: 'Edit follow-up', reschedule: 'Reschedule follow-up', complete: 'Complete follow-up' };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titles[mode]}
      subtitle={`${inquiryId ?? ''} · ${customerName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving} disabled={!form.date || !form.time}>
            {mode === 'complete' ? 'Mark completed' : 'Save'}
          </Button>
        </>
      }
    >
      {mode === 'complete' ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">{followup?.type}</p>
            <p>{followup?.notes}</p>
          </div>
          <Field label="Outcome / summary">
            <Textarea value={form.outcome} onChange={(e) => set('outcome', e.target.value)} placeholder="e.g. Customer confirmed dates, requested revised quotation" autoFocus />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date" required>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Time" required>
            <Input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
          {mode !== 'reschedule' && (
            <>
              <Field label="Follow-up type">
                <Select options={FOLLOWUP_TYPES} value={form.type} onChange={(e) => set('type', e.target.value as FollowUpType)} />
              </Field>
              <Field label="Sales executive">
                <Select options={execs.map((u) => ({ value: u.id, label: u.name }))} placeholder="Unassigned" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} disabled={user?.role === 'Sales Executive'} />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="What needs to be discussed?" />
              </Field>
              {mode === 'create' && inquiry && ['New', 'Contacted', 'Quotation Sent'].includes(inquiry.status) && (
                <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                  <input type="checkbox" checked={form.markInquiry} onChange={(e) => set('markInquiry', e.target.checked)} className="size-4 accent-brand-600" />
                  Update inquiry status to “Follow-up Required”
                </label>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
