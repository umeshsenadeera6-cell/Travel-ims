import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ClipboardList, Luggage, Package as PackageIcon, UserRound } from 'lucide-react';
import {
  CURRENCIES, INQUIRY_STATUSES, PRIORITIES, SOURCES, type ContactMethod, type Currency, type Inquiry, type InquirySource, type InquiryStatus, type InquiryType, type Priority,
} from '@/types';
import { inquiryService, packageService, settingsService, userService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { Button, ChipSelect, Field, FormSection, Input, PageHeader, Select, Spinner, Textarea, Toggle } from '@/components/ui';
import { AccessDenied, NotFound } from './SystemPages';
import {
  ACTIVITIES, COUNTRIES, GUIDE_OPTIONS, HOTEL_CATEGORIES, INBOUND_DESTINATIONS, MEAL_OPTIONS, OUTBOUND_COUNTRIES, ROOM_OPTIONS, TRANSPORT_OPTIONS,
} from '@/utils/constants';
import { nightsBetween } from '@/utils/date';
import { canSeeInquiry } from '@/utils/permissions';
import type { InquiryInput } from '@/services/inquiryService';

interface FormState {
  customerName: string; email: string; phone: string; whatsapp: string;
  adults: number; children: number; infants: number; nights: number;
  budget: number; currency: Currency; specialRequirements: string;
  source: InquirySource | ''; priority: Priority; assignedTo: string; status: InquiryStatus; notes: string;
  // inbound
  country: string; nationality: string; preferredContact: ContactMethod; arrivalDate: string; departureDate: string;
  destinations: string[]; hotelCategory: string; transport: string; guide: string; safari: boolean; activities: string[]; mealPreference: string;
  // outbound
  nicPassport: string; destinationCountry: string; destinationCity: string; travelDate: string; returnDate: string; packageId: string;
  airlinePreference: string; roomRequirement: string; visaRequired: boolean; travelInsurance: boolean; excursions: string;
}

const empty = (type: InquiryType, userId: string): FormState => {
  const s = settingsService.getSync();
  return {
    customerName: '', email: '', phone: '', whatsapp: '', adults: 2, children: 0, infants: 0, nights: 0,
    budget: 0, currency: type === 'Inbound' ? s.defaultCurrencyInbound : s.defaultCurrencyOutbound, specialRequirements: '',
    source: '', priority: 'Medium', assignedTo: userId, status: 'New', notes: '',
    country: '', nationality: '', preferredContact: 'WhatsApp', arrivalDate: '', departureDate: '',
    destinations: [], hotelCategory: '4 Star', transport: 'Private Car', guide: 'Chauffeur Guide', safari: false, activities: [], mealPreference: 'Half Board',
    nicPassport: '', destinationCountry: '', destinationCity: '', travelDate: '', returnDate: '', packageId: '',
    airlinePreference: '', roomRequirement: '1 Double', visaRequired: false, travelInsurance: true, excursions: '',
  };
};

const fromInquiry = (i: Inquiry): FormState => ({
  ...empty(i.type, ''),
  customerName: i.customerName, email: i.email, phone: i.phone, whatsapp: i.whatsapp, adults: i.adults, children: i.children, infants: i.infants, nights: i.nights,
  budget: i.budget, currency: i.currency, specialRequirements: i.specialRequirements, source: i.source, priority: i.priority, assignedTo: i.assignedTo ?? '', status: i.status, notes: i.notes,
  ...(i.inbound ?? {}),
  ...(i.outbound ? { ...i.outbound, packageId: i.outbound.packageId ?? '' } : {}),
});

export default function InquiryFormPage({ type: typeProp }: { type?: InquiryType }) {
  const { id } = useParams();
  const { user, can } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const editing = !!id;
  const { data: existing, loading } = useServiceQuery(() => (id ? inquiryService.get(id) : Promise.resolve(undefined)), [id]);
  const { data: allExecs = [] } = useServiceQuery(() => userService.listSalesExecutives());
  const { data: packages = [] } = useServiceQuery(() => packageService.list());
  const type: InquiryType = existing?.type ?? typeProp ?? 'Inbound';
  const isSales = user?.role === 'Sales Executive';
  const execs = allExecs.filter((u) => u.department === type || u.department === 'All');

  const [form, setForm] = useState<FormState>(() => empty(type, isSales ? user!.id : ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm(fromInquiry(existing));
  }, [existing]);
  useEffect(() => {
    if (!editing) setForm(empty(type, isSales ? user!.id : ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, editing]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  // auto-calc nights
  useEffect(() => {
    const n = type === 'Inbound' ? nightsBetween(form.arrivalDate, form.departureDate) : nightsBetween(form.travelDate, form.returnDate);
    if (n > 0) setForm((f) => ({ ...f, nights: n }));
  }, [type, form.arrivalDate, form.departureDate, form.travelDate, form.returnDate]);

  const outboundPackages = useMemo(() => packages.filter((p) => p.type === 'Outbound' && p.status !== 'Archived'), [packages]);

  if (editing && loading) return <Spinner />;
  if (editing && !existing) return <NotFound />;
  if (existing && !canSeeInquiry(user, existing)) return <AccessDenied />;
  if (!can(editing ? 'inquiry.edit' : 'inquiry.create')) return <AccessDenied />;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.phone.trim() && !form.email.trim()) e.phone = 'Provide a phone number or email';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.source) e.source = 'Select the inquiry source';
    if (form.adults < 1) e.adults = 'At least 1 adult';
    if (type === 'Inbound') {
      if (!form.country) e.country = 'Country is required';
      if (form.arrivalDate && form.departureDate && form.departureDate < form.arrivalDate) e.departureDate = 'Departure must be after arrival';
    } else {
      if (!form.destinationCountry) e.destinationCountry = 'Destination is required';
      if (form.travelDate && form.returnDate && form.returnDate < form.travelDate) e.returnDate = 'Return must be after travel date';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      toast('Please fix the highlighted fields', 'error');
      document.querySelector(`[name="${Object.keys(e)[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(e).length === 0;
  };

  const toInput = (): InquiryInput => {
    const base = {
      type, customerName: form.customerName.trim(), email: form.email.trim(), phone: form.phone.trim(), whatsapp: form.whatsapp.trim() || form.phone.trim(),
      nights: form.nights, adults: form.adults, children: form.children, infants: form.infants, budget: form.budget, currency: form.currency,
      specialRequirements: form.specialRequirements, source: form.source as InquirySource, priority: form.priority,
      assignedTo: form.assignedTo || null, status: form.status, notes: form.notes,
    };
    if (type === 'Inbound') {
      return { ...base, inbound: { country: form.country, nationality: form.nationality, preferredContact: form.preferredContact, arrivalDate: form.arrivalDate, departureDate: form.departureDate, destinations: form.destinations, hotelCategory: form.hotelCategory, transport: form.transport, guide: form.guide, safari: form.safari, activities: form.activities, mealPreference: form.mealPreference } };
    }
    const pkg = packages.find((p) => p.id === form.packageId);
    return { ...base, outbound: { nicPassport: form.nicPassport, destinationCountry: form.destinationCountry, destinationCity: form.destinationCity, travelDate: form.travelDate, returnDate: form.returnDate, packageId: pkg?.id, packageName: pkg?.name, airlinePreference: form.airlinePreference, hotelCategory: form.hotelCategory, roomRequirement: form.roomRequirement, visaRequired: form.visaRequired, travelInsurance: form.travelInsurance, transport: form.transport, excursions: form.excursions } };
  };

  const submit = async (withFollowUp: boolean) => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing && existing) {
        const updated = await inquiryService.update(existing.id, toInput(), user);
        toast(`${updated.id} updated`);
        navigate(`/inquiries/${updated.id}${withFollowUp ? '?action=followup' : ''}`);
      } else {
        const created = await inquiryService.create(toInput(), user);
        toast(`Inquiry ${created.id} created`);
        navigate(`/inquiries/${created.id}${withFollowUp ? '?action=followup' : ''}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const err = (k: string) => errors[k] || undefined;
  const num = (k: keyof FormState, label: string, min = 0, required = false): ReactNode => (
    <Field label={label} error={err(k)} required={required}>
      <Input name={k} type="number" min={min} value={form[k] as number} onChange={(e) => set(k, Number(e.target.value) as never)} invalid={!!err(k)} />
    </Field>
  );
  const previewId = editing ? existing!.id : inquiryService.previewNextId(type);
  const backTo = editing ? `/inquiries/${id}` : isSales ? '/inquiries/mine' : type === 'Inbound' ? '/inquiries/inbound' : '/inquiries/outbound';

  return (
    <div className="pb-24">
      <PageHeader
        breadcrumb={<Link to={backTo} className="inline-flex items-center gap-1 hover:text-brand-700"><ArrowLeft className="size-3.5" /> Back</Link>}
        title={editing ? `Edit ${type} Inquiry` : `New ${type} Inquiry`}
        subtitle={<>Inquiry ID <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-700">{previewId}</span> {!editing && '· generated automatically'}</>}
      />

      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(false); }} noValidate>
        <FormSection title="Customer details" description="Who is enquiring" icon={<UserRound className="size-4" />}>
          <Field label="Customer name" required error={err('customerName')}>
            <Input name="customerName" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} invalid={!!err('customerName')} placeholder="Full name" />
          </Field>
          {type === 'Inbound' ? (
            <>
              <Field label="Country" required error={err('country')}>
                <Select name="country" options={COUNTRIES.filter((c) => c !== 'Sri Lanka')} placeholder="Select country" value={form.country} onChange={(e) => set('country', e.target.value)} invalid={!!err('country')} />
              </Field>
              <Field label="Nationality">
                <Input value={form.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="e.g. British" />
              </Field>
            </>
          ) : (
            <>
              <Field label="NIC / Passport">
                <Input value={form.nicPassport} onChange={(e) => set('nicPassport', e.target.value)} placeholder="e.g. 199012345678 or N1234567" />
              </Field>
              <Field label="Number of travelers" hint="Adults + children + infants"><Input value={form.adults + form.children + form.infants} readOnly className="bg-slate-50" /></Field>
            </>
          )}
          <Field label="Email" error={err('email')}>
            <Input name="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} invalid={!!err('email')} placeholder="name@example.com" />
          </Field>
          <Field label="Phone" error={err('phone')}>
            <Input name="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} invalid={!!err('phone')} placeholder={type === 'Inbound' ? '+44 …' : '+94 …'} />
          </Field>
          <Field label="WhatsApp" hint="Leave blank to use phone number">
            <Input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          </Field>
          {type === 'Inbound' && (
            <Field label="Preferred contact method">
              <Select options={['WhatsApp', 'Email', 'Phone']} value={form.preferredContact} onChange={(e) => set('preferredContact', e.target.value as ContactMethod)} />
            </Field>
          )}
        </FormSection>

        <FormSection title="Travel details" description="Dates and party size" icon={<CalendarDays className="size-4" />}>
          {type === 'Inbound' ? (
            <>
              <Field label="Arrival date"><Input type="date" value={form.arrivalDate} onChange={(e) => set('arrivalDate', e.target.value)} /></Field>
              <Field label="Departure date" error={err('departureDate')}><Input name="departureDate" type="date" value={form.departureDate} min={form.arrivalDate} onChange={(e) => set('departureDate', e.target.value)} invalid={!!err('departureDate')} /></Field>
            </>
          ) : (
            <>
              <Field label="Destination country" required error={err('destinationCountry')}>
                <Select name="destinationCountry" options={OUTBOUND_COUNTRIES} placeholder="Select destination" value={form.destinationCountry} onChange={(e) => set('destinationCountry', e.target.value)} invalid={!!err('destinationCountry')} />
              </Field>
              <Field label="Destination city"><Input value={form.destinationCity} onChange={(e) => set('destinationCity', e.target.value)} placeholder="e.g. Bangkok" /></Field>
              <Field label="Travel date"><Input type="date" value={form.travelDate} onChange={(e) => set('travelDate', e.target.value)} /></Field>
              <Field label="Return date" error={err('returnDate')}><Input name="returnDate" type="date" value={form.returnDate} min={form.travelDate} onChange={(e) => set('returnDate', e.target.value)} invalid={!!err('returnDate')} /></Field>
            </>
          )}
          <Field label="Number of nights" hint="Calculated from dates"><Input type="number" min={0} value={form.nights} onChange={(e) => set('nights', Number(e.target.value))} /></Field>
          {type === 'Inbound' && (
            <Field label="Number of travelers"><Input value={form.adults + form.children + form.infants} readOnly className="bg-slate-50" /></Field>
          )}
          {num('adults', 'Adults', 1, true)}
          {num('children', 'Children (2–11)')}
          {num('infants', 'Infants (under 2)')}
        </FormSection>

        {type === 'Inbound' ? (
          <FormSection title="Travel requirements" description="Preferences for the itinerary" icon={<Luggage className="size-4" />}>
            <Field label="Preferred destinations" className="md:col-span-2 xl:col-span-3">
              <ChipSelect options={INBOUND_DESTINATIONS} value={form.destinations} onChange={(v) => set('destinations', v)} />
            </Field>
            <Field label="Hotel category"><Select options={HOTEL_CATEGORIES} value={form.hotelCategory} onChange={(e) => set('hotelCategory', e.target.value)} /></Field>
            <Field label="Transport"><Select options={TRANSPORT_OPTIONS} value={form.transport} onChange={(e) => set('transport', e.target.value)} /></Field>
            <Field label="Guide"><Select options={GUIDE_OPTIONS} value={form.guide} onChange={(e) => set('guide', e.target.value)} /></Field>
            <Field label="Safari"><Toggle checked={form.safari} onChange={(v) => set('safari', v)} label="Include wildlife safari" /></Field>
            <Field label="Meal preference"><Select options={MEAL_OPTIONS} value={form.mealPreference} onChange={(e) => set('mealPreference', e.target.value)} /></Field>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <Field label="Currency"><Select options={CURRENCIES} value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)} /></Field>
              <Field label="Budget (total)"><Input type="number" min={0} value={form.budget} onChange={(e) => set('budget', Number(e.target.value))} /></Field>
            </div>
            <Field label="Activities" className="md:col-span-2 xl:col-span-3">
              <ChipSelect options={ACTIVITIES} value={form.activities} onChange={(v) => set('activities', v)} />
            </Field>
            <Field label="Special requirements" className="md:col-span-2 xl:col-span-3">
              <Textarea value={form.specialRequirements} onChange={(e) => set('specialRequirements', e.target.value)} placeholder="Dietary needs, accessibility, celebrations…" />
            </Field>
          </FormSection>
        ) : (
          <FormSection title="Package details" description="Services the customer needs" icon={<PackageIcon className="size-4" />}>
            <Field label="Package">
              <Select options={outboundPackages.map((p) => ({ value: p.id, label: p.name }))} placeholder="Select package" value={form.packageId} onChange={(e) => set('packageId', e.target.value)} />
            </Field>
            <Field label="Airline preference"><Input value={form.airlinePreference} onChange={(e) => set('airlinePreference', e.target.value)} placeholder="e.g. SriLankan Airlines" /></Field>
            <Field label="Hotel category"><Select options={HOTEL_CATEGORIES} value={form.hotelCategory} onChange={(e) => set('hotelCategory', e.target.value)} /></Field>
            <Field label="Room requirement"><Select options={ROOM_OPTIONS} value={form.roomRequirement} onChange={(e) => set('roomRequirement', e.target.value)} /></Field>
            <Field label="Visa requirement"><Toggle checked={form.visaRequired} onChange={(v) => set('visaRequired', v)} label="Visa assistance needed" /></Field>
            <Field label="Travel insurance"><Toggle checked={form.travelInsurance} onChange={(v) => set('travelInsurance', v)} label="Include travel insurance" /></Field>
            <Field label="Transport"><Select options={TRANSPORT_OPTIONS} value={form.transport} onChange={(e) => set('transport', e.target.value)} /></Field>
            <Field label="Excursions"><Input value={form.excursions} onChange={(e) => set('excursions', e.target.value)} placeholder="e.g. Desert safari, city tour" /></Field>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <Field label="Currency"><Select options={CURRENCIES} value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)} /></Field>
              <Field label="Budget (total)"><Input type="number" min={0} value={form.budget} onChange={(e) => set('budget', Number(e.target.value))} /></Field>
            </div>
            <Field label="Special requirements" className="md:col-span-2 xl:col-span-3">
              <Textarea value={form.specialRequirements} onChange={(e) => set('specialRequirements', e.target.value)} placeholder="Meal preferences, assistance, seating…" />
            </Field>
          </FormSection>
        )}

        <FormSection title="Inquiry details" description="Ownership and pipeline stage" icon={<ClipboardList className="size-4" />}>
          <Field label="Inquiry source" required error={err('source')}>
            <Select name="source" options={SOURCES} placeholder="Select source" value={form.source} onChange={(e) => set('source', e.target.value as InquirySource)} invalid={!!err('source')} />
          </Field>
          <Field label="Priority">
            <div className="grid grid-cols-3 gap-1.5">
              {PRIORITIES.map((p) => (
                <button key={p} type="button" onClick={() => set('priority', p)} aria-pressed={form.priority === p}
                  className={`h-10 rounded-lg border text-sm font-medium transition ${form.priority === p ? (p === 'High' ? 'border-red-500 bg-red-50 text-red-700' : p === 'Medium' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {p === 'High' ? '🔴' : p === 'Medium' ? '🟠' : '🟢'} {p}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Assigned sales executive" hint={isSales ? 'Inquiries you create are assigned to you' : `${type} department team`}>
            <Select options={execs.map((u) => ({ value: u.id, label: u.name }))} placeholder="Unassigned" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} disabled={isSales || !can('inquiry.assign') && editing} />
          </Field>
          <Field label="Status"><Select options={INQUIRY_STATUSES} value={form.status} onChange={(e) => set('status', e.target.value as InquiryStatus)} /></Field>
          <Field label="Notes" className="md:col-span-2">
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Initial conversation summary" />
          </Field>
        </FormSection>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-[272px]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-end gap-2 sm:px-4">
            <Button variant="ghost" onClick={() => navigate(backTo)}>Cancel</Button>
            <Button variant="secondary" onClick={() => submit(true)} loading={saving}>Save & Add Follow-up</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Save Inquiry'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
