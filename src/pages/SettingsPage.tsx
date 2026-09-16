import { useEffect, useState } from 'react';
import { Building2, Database, FileText, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { CURRENCIES, type AppSettings, type Currency } from '@/types';
import { resetDemoData, settingsService } from '@/services';
import { useToast } from '@/context/ToastContext';
import { Button, Card, CardHeader, ConfirmDialog, Field, Input, PageHeader, Select, Spinner, Textarea } from '@/components/ui';

export default function SettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { settingsService.get().then(setForm); }, []);
  if (!form) return <Spinner />;
  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const save = async () => { await settingsService.update(form); toast('Settings saved'); };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Company profile, defaults and demo data" actions={<Button icon={<Save className="size-4" />} onClick={save}>Save settings</Button>} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Building2 className="size-4 text-brand-600" /> Company profile</span>} subtitle="Shown on quotations" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company name" className="sm:col-span-2"><Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} /></Field>
            <Field label="Email"><Input value={form.companyEmail} onChange={(e) => set('companyEmail', e.target.value)} /></Field>
            <Field label="Phone"><Input value={form.companyPhone} onChange={(e) => set('companyPhone', e.target.value)} /></Field>
            <Field label="Address" className="sm:col-span-2"><Input value={form.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-brand-600" /> Defaults</span>} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Inbound currency"><Select options={CURRENCIES} value={form.defaultCurrencyInbound} onChange={(e) => set('defaultCurrencyInbound', e.target.value as Currency)} /></Field>
            <Field label="Outbound currency"><Select options={CURRENCIES} value={form.defaultCurrencyOutbound} onChange={(e) => set('defaultCurrencyOutbound', e.target.value as Currency)} /></Field>
            <Field label="Quotation validity (days)"><Input type="number" min={1} value={form.quotationValidityDays} onChange={(e) => set('quotationValidityDays', Number(e.target.value))} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><FileText className="size-4 text-brand-600" /> Quotation terms</span>} subtitle="Default terms added to new quotations" />
          <Textarea value={form.quotationTerms} onChange={(e) => set('quotationTerms', e.target.value)} className="min-h-40" />
        </Card>
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Database className="size-4 text-brand-600" /> Data & storage</span>} subtitle="Phase 1 prototype" />
          <p className="text-sm text-slate-600">All records are stored in this browser's localStorage through the service layer. In Phase 2 the same services will call the REST API instead — no UI changes required.</p>
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">Reset demo data</p>
            <p className="mt-1 text-sm text-red-700">Restores the original sample inquiries, customers, quotations and bookings. Any changes you made will be lost.</p>
            <Button className="mt-3" variant="danger" size="sm" icon={<RotateCcw className="size-4" />} onClick={() => setConfirm(true)}>Reset demo data</Button>
          </div>
        </Card>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} danger title="Reset all demo data?" confirmLabel="Reset data" message="This replaces everything with fresh sample data. You'll stay signed in." onConfirm={() => { resetDemoData(); settingsService.get().then(setForm); toast('Demo data restored'); }} />
    </div>
  );
}
