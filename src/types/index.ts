// ─────────────────────────────────────────────────────────────
// Domain types — shared by UI and service layer.
// These mirror the future REST API contracts for Phase 2.
// ─────────────────────────────────────────────────────────────

export type ID = string;

export type Role = 'Super Admin' | 'Manager' | 'Sales Executive' | 'Viewer';

/** Serendib runs two separate business units. 'All' = head office access to both. */
export type Department = 'Inbound' | 'Outbound';
export type DepartmentScope = Department | 'All';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: Role;
  department: DepartmentScope;
  section: string; // team within the department, e.g. Sales, Operations, Finance
  status: UserStatus;
  lastLogin?: string;
  avatarColor?: string;
}

export type InquiryType = 'Inbound' | 'Outbound';

export const INQUIRY_STATUSES = [
  'New',
  'Contacted',
  'Requirement Collected',
  'Quotation Preparing',
  'Quotation Sent',
  'Follow-up Required',
  'Negotiation',
  'Confirmed',
  'Payment Pending',
  'Partially Paid',
  'Fully Paid',
  'Booking Completed',
  'Travel Completed',
  'Lost',
  'Cancelled',
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SOURCES = ['WhatsApp', 'Facebook', 'Instagram', 'Website', 'Phone', 'Email', 'Referral'] as const;
export type InquirySource = (typeof SOURCES)[number];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'LKR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export type ContactMethod = 'Email' | 'Phone' | 'WhatsApp';

export interface InboundDetails {
  country: string;
  nationality: string;
  preferredContact: ContactMethod;
  arrivalDate: string;
  departureDate: string;
  destinations: string[];
  hotelCategory: string;
  transport: string;
  guide: string;
  safari: boolean;
  activities: string[];
  mealPreference: string;
}

export interface OutboundDetails {
  nicPassport: string;
  destinationCountry: string;
  destinationCity: string;
  travelDate: string;
  returnDate: string;
  packageId?: ID;
  packageName?: string;
  airlinePreference: string;
  hotelCategory: string;
  roomRequirement: string;
  visaRequired: boolean;
  travelInsurance: boolean;
  transport: string;
  excursions: string;
}

export interface Inquiry {
  id: ID; // INB-2026-00001 / OUT-2026-00001
  type: InquiryType;
  createdAt: string; // ISO
  updatedAt: string;
  customerId: ID;
  customerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  budget: number;
  currency: Currency;
  specialRequirements: string;
  source: InquirySource;
  priority: Priority;
  assignedTo: ID | null;
  status: InquiryStatus;
  notes: string;
  nextFollowUp?: string | null; // ISO date (derived & cached)
  inbound?: InboundDetails;
  outbound?: OutboundDetails;
}

export type FollowUpType = 'Phone Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Other';
export type FollowUpStatus = 'Pending' | 'Completed';

export interface FollowUp {
  id: ID;
  inquiryId: ID;
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  assignedTo: ID | null;
  type: FollowUpType;
  status: FollowUpStatus;
  notes: string;
  outcome?: string;
  completedAt?: string;
  createdAt: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface QuotationLine {
  id: ID;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Quotation {
  id: ID; // QT-2026-0001
  inquiryId: ID;
  customerName: string;
  destination: string;
  travelFrom: string;
  travelTo: string;
  date: string;
  validUntil: string;
  services: QuotationLine[];
  discount: number;
  currency: Currency;
  subtotal: number;
  total: number;
  terms: string;
  notes: string;
  status: QuotationStatus;
  createdBy: ID | null;
}

export type PaymentStatus = 'Pending' | 'Partial' | 'Paid';
export type BookingStatus = 'Confirmed' | 'Processing' | 'Completed' | 'Cancelled';

export interface Payment {
  id: ID;
  date: string;
  amount: number;
  method: string;
  reference: string;
}

export interface Booking {
  id: ID; // BK-2026-0001
  inquiryId: ID;
  quotationId?: ID;
  customerId: ID;
  customerName: string;
  packageName: string;
  travelDate: string;
  returnDate: string;
  travelers: number;
  totalAmount: number;
  currency: Currency;
  payments: Payment[];
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  createdAt: string;
  notes: string;
}

export type CustomerStatus = 'Active' | 'VIP' | 'Inactive';

export interface Customer {
  id: ID;
  name: string;
  country: string;
  nationality: string;
  phone: string;
  whatsapp: string;
  email: string;
  nicPassport?: string;
  segment: InquiryType;
  status: CustomerStatus;
  notes: string;
  createdAt: string;
}

export type PackageStatus = 'Active' | 'Draft' | 'Archived';

export interface TourPackage {
  id: ID;
  type: InquiryType;
  name: string;
  destination: string;
  durationDays: number;
  nights: number;
  startingPrice: number;
  currency: Currency;
  status: PackageStatus;
  highlights: string;
}

export interface Note {
  id: ID;
  inquiryId?: ID;
  customerId?: ID;
  text: string;
  authorId: ID | null;
  authorName: string;
  createdAt: string;
}

export type ActivityKind =
  | 'created'
  | 'status'
  | 'assigned'
  | 'followup'
  | 'note'
  | 'quotation'
  | 'booking'
  | 'payment'
  | 'updated';

export interface Activity {
  id: ID;
  inquiryId: ID;
  kind: ActivityKind;
  message: string;
  actorName: string;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  defaultCurrencyInbound: Currency;
  defaultCurrencyOutbound: Currency;
  quotationValidityDays: number;
  quotationTerms: string;
  pageSize: number;
}

export interface Session {
  userId: ID;
  loggedInAt: string;
}
