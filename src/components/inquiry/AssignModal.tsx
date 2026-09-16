import { useEffect, useState } from 'react';
import type { Inquiry } from '@/types';
import { inquiryService, userService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { Avatar, Button, Modal } from '@/components/ui';
import { cx } from '@/utils/format';
import { roleLabel, DEPT_META } from '@/utils/departments';

export function AssignModal({ inquiry, open, onClose }: { inquiry: Inquiry | null; open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: execs = [] } = useServiceQuery(() => userService.listSalesExecutives(inquiry?.type), [inquiry?.type]);
  const { data: inquiries = [] } = useServiceQuery(() => inquiryService.list());
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelected(inquiry?.assignedTo ?? null), [inquiry]);
  if (!inquiry) return null;

  const workload = (id: string) => inquiries.filter((i) => i.assignedTo === id && !['Travel Completed', 'Lost', 'Cancelled', 'Booking Completed'].includes(i.status)).length;
  const sorted = [...execs].sort((a, b) => workload(a.id) - workload(b.id));

  const save = async () => {
    setSaving(true);
    await inquiryService.assign(inquiry.id, selected, user);
    setSaving(false);
    toast(selected ? `${inquiry.id} assigned to ${execs.find((e) => e.id === selected)?.name}` : `${inquiry.id} unassigned`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign inquiry"
      subtitle={`${inquiry.id} · ${inquiry.customerName} · ${DEPT_META[inquiry.type].name} team`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={selected === inquiry.assignedTo}>Save assignment</Button>
        </>
      }
    >
      <div className="space-y-2">
        {sorted.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelected(e.id)}
            aria-pressed={selected === e.id}
            className={cx('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition', selected === e.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50')}
          >
            <Avatar name={e.name} color={e.avatarColor} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{e.name}</p>
              <p className="text-xs text-slate-500">{roleLabel(e)}</p>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">{workload(e.id)} open</span>
          </button>
        ))}
        <button onClick={() => setSelected(null)} className={cx('w-full rounded-xl border border-dashed p-2.5 text-sm', selected === null ? 'border-slate-400 bg-slate-50 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
          Leave unassigned
        </button>
      </div>
    </Modal>
  );
}
