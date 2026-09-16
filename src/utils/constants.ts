import type { BookingStatus, InquiryStatus, PaymentStatus, Priority, QuotationStatus } from '@/types';

type Tone = 'slate' | 'blue' | 'indigo' | 'violet' | 'amber' | 'orange' | 'teal' | 'green' | 'emerald' | 'red' | 'rose' | 'cyan' | 'gray';

export const STATUS_TONE: Record<InquiryStatus, Tone> = {
  New: 'blue',
  Contacted: 'cyan',
  'Requirement Collected': 'indigo',
  'Quotation Preparing': 'violet',
  'Quotation Sent': 'violet',
  'Follow-up Required': 'amber',
  Negotiation: 'orange',
  Confirmed: 'emerald',
  'Payment Pending': 'amber',
  'Partially Paid': 'teal',
  'Fully Paid': 'green',
  'Booking Completed': 'green',
  'Travel Completed': 'slate',
  Lost: 'red',
  Cancelled: 'gray',
};

/** Status groups used for dashboard/report roll-ups. */
export const STATUS_GROUPS: Record<string, InquiryStatus[]> = {
  New: ['New'],
  Contacted: ['Contacted', 'Requirement Collected', 'Quotation Preparing'],
  'Quotation Sent': ['Quotation Sent', 'Negotiation'],
  'Follow-up': ['Follow-up Required'],
  Confirmed: ['Confirmed', 'Payment Pending', 'Partially Paid', 'Fully Paid', 'Booking Completed', 'Travel Completed'],
  Lost: ['Lost', 'Cancelled'],
};

export const QUOTED_STATUSES: InquiryStatus[] = ['Quotation Sent', 'Negotiation', ...STATUS_GROUPS.Confirmed];
export const CONFIRMED_STATUSES = STATUS_GROUPS.Confirmed;
export const CLOSED_STATUSES: InquiryStatus[] = ['Travel Completed', 'Lost', 'Cancelled', 'Booking Completed'];

export const PRIORITY_META: Record<Priority, { dot: string; text: string; bg: string; emoji: string }> = {
  High: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 ring-red-200', emoji: '🔴' },
  Medium: { dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50 ring-orange-200', emoji: '🟠' },
  Low: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 ring-emerald-200', emoji: '🟢' },
};

export const QUOTATION_TONE: Record<QuotationStatus, Tone> = {
  Draft: 'slate',
  Sent: 'blue',
  Accepted: 'green',
  Rejected: 'red',
  Expired: 'gray',
};

export const PAYMENT_TONE: Record<PaymentStatus, Tone> = { Pending: 'amber', Partial: 'teal', Paid: 'green' };
export const BOOKING_TONE: Record<BookingStatus, Tone> = { Confirmed: 'emerald', Processing: 'blue', Completed: 'slate', Cancelled: 'red' };

export const TONE_CLASSES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  gray: 'bg-gray-100 text-gray-600 ring-gray-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
};
export type { Tone };

/** Chart palette — validated for colour-vision deficiency (always paired with legends/labels). */
export const SERIES_COLORS = { Inbound: '#188c67', Outbound: '#eb6834' } as const;
export const MAGNITUDE_COLOR = '#188c67';
export const CHART_GRID = '#e2e8f0';
export const CHART_AXIS = '#64748b';

export const INBOUND_DESTINATIONS = ['Colombo', 'Kandy', 'Sigiriya', 'Dambulla', 'Nuwara Eliya', 'Ella', 'Yala', 'Galle', 'Mirissa', 'Bentota', 'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Udawalawe', 'Arugam Bay', 'Jaffna'];
export const OUTBOUND_COUNTRIES = ['Thailand', 'Singapore', 'Malaysia', 'Vietnam', 'UAE', 'India', 'Maldives', 'France', 'Switzerland', 'Italy', 'Japan', 'Turkey'];
export const HOTEL_CATEGORIES = ['3 Star', '4 Star', '5 Star', 'Boutique', 'Luxury Villa', 'Budget'];
export const TRANSPORT_OPTIONS = ['Private Car', 'Van', 'Mini Coach', 'Luxury Coach', 'Train + Car', 'Self Arranged'];
export const GUIDE_OPTIONS = ['Chauffeur Guide', 'National Guide', 'Driver Only', 'No Guide'];
export const MEAL_OPTIONS = ['Bed & Breakfast', 'Half Board', 'Full Board', 'All Inclusive', 'Room Only'];
export const ACTIVITIES = ['Whale Watching', 'Tea Plantation Tour', 'Cooking Class', 'Ayurveda Spa', 'Hiking', 'Surfing', 'Temple Visits', 'Train Ride', 'Hot Air Balloon', 'Snorkeling'];
export const COUNTRIES = ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Italy', 'Australia', 'United States', 'Canada', 'India', 'China', 'Japan', 'Russia', 'Switzerland', 'Sweden', 'Sri Lanka', 'Maldives', 'Spain', 'Poland'];
export const ROOM_OPTIONS = ['1 Double', '1 Twin', '2 Doubles', '1 Double + 1 Twin', '1 Triple', 'Family Room', '3+ Rooms'];
export const FOLLOWUP_TYPES = ['Phone Call', 'WhatsApp', 'Email', 'Meeting', 'Other'] as const;
export const DEPARTMENTS = ['Management', 'Sales', 'Operations', 'Finance', 'Marketing'];
