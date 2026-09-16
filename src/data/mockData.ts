/**
 * Realistic, deterministic demo data for Phase 1.
 * Dates are generated relative to "today" so follow-ups, overdue items
 * and trend charts always look alive whenever the prototype is opened.
 */
import type {
  Activity, AppSettings, Booking, Customer, FollowUp, FollowUpType, Inquiry, InquirySource, InquiryStatus,
  Note, Payment, PaymentStatus, BookingStatus, Priority, Quotation, QuotationLine, QuotationStatus, TourPackage, User,
} from '@/types';
import { addDays, toISODate } from '@/utils/date';
import { CONFIRMED_STATUSES } from '@/utils/constants';

// ── Seeded PRNG so data is stable between reloads/resets ──────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_PASSWORD_HINT = 'Any password works in the demo';

export const seedUsers: User[] = [
  // Head office
  { id: 'u_admin', name: 'Nishan Madushanka', email: 'admin@serendibtravel.com', phone: '+94 77 210 4455', role: 'Super Admin', department: 'All', section: 'Management', status: 'Active', avatarColor: '#0b6b4f' },
  { id: 'u_viewer', name: 'Amaya Gunasekara', email: 'viewer@serendibtravel.com', phone: '+94 77 551 2080', role: 'Viewer', department: 'All', section: 'Finance', status: 'Active', avatarColor: '#64748b' },
  // Inbound department — foreign travellers touring Sri Lanka
  { id: 'u_manager', name: 'Sandesh Dissanayake', email: 'inbound.manager@serendibtravel.com', phone: '+94 77 318 9021', role: 'Manager', department: 'Inbound', section: 'Management', status: 'Active', avatarColor: '#7c3aed' },
  { id: 'u_sales1', name: 'Kasun Dilshan', email: 'inbound.sales@serendibtravel.com', phone: '+94 71 455 7812', role: 'Sales Executive', department: 'Inbound', section: 'Sales', status: 'Active', avatarColor: '#2563eb' },
  { id: 'u_sales2', name: 'Hasini Navodini', email: 'nadeesha@serendibtravel.com', phone: '+94 76 882 1403', role: 'Sales Executive', department: 'Inbound', section: 'Sales', status: 'Active', avatarColor: '#db2777' },

  // Outbound department — Sri Lankans travelling abroad
  { id: 'u_manager_out', name: 'Isurini Lewkebandara', email: 'outbound.manager@serendibtravel.com', phone: '+94 77 640 2215', role: 'Manager', department: 'Outbound', section: 'Management', status: 'Active', avatarColor: '#0f766e' },
  { id: 'u_sales3', name: 'Hasini Gayathri', email: 'outbound.sales@serendibtravel.com', phone: '+94 70 612 3398', role: 'Sales Executive', department: 'Outbound', section: 'Sales', status: 'Active', avatarColor: '#c8962e' },
  { id: 'u_sales4', name: 'Amila Hashan', email: 'tharushi@serendibtravel.com', phone: '+94 77 904 5527', role: 'Sales Executive', department: 'Outbound', section: 'Sales', status: 'Active', avatarColor: '#0891b2' },
];

/** Demo sign-in cards, grouped by department. */
export const DEMO_ACCOUNTS: Array<{ group: string; ids: string[] }> = [
  { group: 'Head office', ids: ['u_admin', 'u_viewer'] },
  { group: 'Inbound department', ids: ['u_manager', 'u_sales1'] },
  { group: 'Outbound department', ids: ['u_manager_out', 'u_sales3'] },
];

const INBOUND_PEOPLE: Array<[string, string, string, string]> = [
  ['James Whitmore', 'United Kingdom', 'British', '+44 7700 900 412'],
  ['Sophie Müller', 'Germany', 'German', '+49 151 2345 6789'],
  ['Lucas Bernard', 'France', 'French', '+33 6 12 34 56 78'],
  ['Emma van der Berg', 'Netherlands', 'Dutch', '+31 6 2345 6789'],
  ['Olivia Thompson', 'Australia', 'Australian', '+61 412 345 678'],
  ['Michael Anderson', 'United States', 'American', '+1 415 555 0142'],
  ['Priya Raghavan', 'India', 'Indian', '+91 98450 12345'],
  ['Wei Zhang', 'China', 'Chinese', '+86 138 0013 8000'],
  ['Yuki Tanaka', 'Japan', 'Japanese', '+81 90 1234 5678'],
  ['Giulia Rossi', 'Italy', 'Italian', '+39 347 123 4567'],
  ['Anna Kowalska', 'Poland', 'Polish', '+48 512 345 678'],
  ['Erik Lindqvist', 'Sweden', 'Swedish', '+46 70 123 45 67'],
  ['Hannah Schmidt', 'Switzerland', 'Swiss', '+41 79 123 45 67'],
  ['Daniel Clarke', 'Canada', 'Canadian', '+1 604 555 0188'],
  ['Isabella García', 'Spain', 'Spanish', '+34 612 345 678'],
  ['Dmitri Volkov', 'Russia', 'Russian', '+7 916 123 4567'],
  ['Charlotte Evans', 'United Kingdom', 'British', '+44 7700 900 873'],
  ['Thomas Becker', 'Germany', 'German', '+49 160 9876 5432'],
  ['Aarav Mehta', 'India', 'Indian', '+91 99200 54321'],
  ['Grace Wilson', 'Australia', 'Australian', '+61 423 987 654'],
];

const OUTBOUND_PEOPLE: Array<[string, string, string]> = [
  ['Nimal Rathnayake', '198534502311', '+94 77 123 4567'],
  ['Sanduni Wijesinghe', '199276104512', '+94 71 234 5678'],
  ['Chathura Senanayake', '198812903345', '+94 76 345 6789'],
  ['Dilini Abeysekara', '199045601234', '+94 77 456 7890'],
  ['Mohamed Rizwan', '198723401987', '+94 75 567 8901'],
  ['Kavindi Herath', '199581202233', '+94 70 678 9012'],
  ['Pradeep Karunaratne', '197965400876', '+94 77 789 0123'],
  ['Fathima Nazeera', '199367803456', '+94 72 890 1234'],
  ['Suresh Thevarajah', '198456709876', '+94 77 901 2345'],
  ['Ishara Madushani', '199712305678', '+94 71 012 3456'],
  ['Lahiru Gamage', '199023407654', '+94 76 112 2334'],
  ['Hasini Liyanage', '199468201122', '+94 77 223 3445'],
  ['Asanka Dissanayake', '198345608899', '+94 70 334 4556'],
  ['Roshan Weerasinghe', '198190204455', '+94 77 445 5667'],
  ['Madhavi Kumarasinghe', '199659806677', '+94 71 556 6778'],
  ['Tharindu Ekanayake', '199134509988', '+94 76 667 7889'],
];

const INBOUND_PKGS: Array<[string, string, number, number, string]> = [
  ['Sri Lanka Discovery', 'Colombo · Sigiriya · Kandy · Ella · Galle', 10, 1450, 'Culture, hill country and south coast in one loop'],
  ['Sri Lanka Highlights', 'Sigiriya · Kandy · Nuwara Eliya · Bentota', 7, 980, 'Best-of-island short itinerary'],
  ['Cultural Triangle Tour', 'Anuradhapura · Polonnaruwa · Sigiriya · Dambulla', 5, 690, 'UNESCO heritage sites with national guide'],
  ['Beach Holiday', 'Bentota · Mirissa · Galle', 6, 820, 'Beach resorts, whale watching and Galle Fort'],
  ['Wildlife Safari', 'Yala · Udawalawe · Wilpattu', 6, 1180, 'Leopards, elephants and jeep safaris'],
  ['Honeymoon Package', 'Kandy · Nuwara Eliya · Ella · Maldives optional', 9, 2150, 'Romantic stays, private transfers and spa'],
  ['Custom Tour', 'Tailor-made', 0, 0, 'Fully customised itinerary on request'],
];

const OUTBOUND_PKGS: Array<[string, string, number, number, string]> = [
  ['Bangkok & Pattaya Getaway', 'Thailand', 5, 185000, 'Hotels, transfers, city tour & Coral Island'],
  ['Singapore & Malaysia Combo', 'Singapore · Kuala Lumpur', 6, 295000, 'Sentosa, Universal Studios, Genting Highlands'],
  ['Vietnam Explorer', 'Hanoi · Ha Long Bay · Ho Chi Minh City', 7, 340000, 'Ha Long cruise and Cu Chi tunnels'],
  ['Dubai Delights', 'UAE', 5, 265000, 'Desert safari, Burj Khalifa & Dhow cruise'],
  ['India Golden Triangle', 'Delhi · Agra · Jaipur', 6, 210000, 'Taj Mahal and heritage forts'],
  ['Maldives Resort Escape', 'Maldives', 4, 395000, 'Water villa with seaplane transfers'],
  ['Europe Highlights', 'France · Switzerland · Italy', 12, 1150000, 'Paris, Swiss Alps, Venice & Rome'],
  ['Custom Tour', 'Tailor-made', 0, 0, 'Fully customised outbound itinerary'],
];

const INBOUND_DESTS = [['Colombo', 'Sigiriya', 'Kandy', 'Ella', 'Galle'], ['Sigiriya', 'Dambulla', 'Kandy'], ['Yala', 'Udawalawe'], ['Bentota', 'Mirissa', 'Galle'], ['Kandy', 'Nuwara Eliya', 'Ella'], ['Trincomalee', 'Sigiriya'], ['Anuradhapura', 'Polonnaruwa', 'Sigiriya'], ['Ella', 'Yala', 'Mirissa']];
const OUTBOUND_DESTS: Array<[string, string, number]> = [['Thailand', 'Bangkok', 0], ['Singapore', 'Singapore', 1], ['Vietnam', 'Hanoi', 2], ['UAE', 'Dubai', 3], ['India', 'New Delhi', 4], ['Maldives', 'Malé', 5], ['France', 'Paris', 6], ['Malaysia', 'Kuala Lumpur', 1], ['Japan', 'Tokyo', 7], ['Turkey', 'Istanbul', 7]];
const AIRLINES = ['SriLankan Airlines', 'Emirates', 'Qatar Airways', 'Singapore Airlines', 'Thai Airways', 'IndiGo', 'Any'];
const SOURCES_W: InquirySource[] = ['WhatsApp', 'WhatsApp', 'WhatsApp', 'Facebook', 'Facebook', 'Website', 'Website', 'Website', 'Instagram', 'Phone', 'Email', 'Email', 'Referral'];
const FU_TYPES: FollowUpType[] = ['Phone Call', 'WhatsApp', 'WhatsApp', 'Email', 'Meeting'];

const FU_NOTES = [
  'Check whether they reviewed the revised itinerary.',
  'Confirm number of travellers and room split.',
  'Send hotel options for 4-star vs 5-star.',
  'Call regarding advance payment.',
  'Discuss flight timings and visa documents.',
  'Customer asked to call back after discussing with family.',
  'Share updated quotation with discount.',
  'Confirm dietary requirements and guide language.',
];

export interface SeedData {
  users: User[];
  customers: Customer[];
  inquiries: Inquiry[];
  followups: FollowUp[];
  quotations: Quotation[];
  bookings: Booking[];
  packages: TourPackage[];
  notes: Note[];
  activities: Activity[];
  settings: AppSettings;
}

export const defaultSettings: AppSettings = {
  companyName: 'Serendib Travel & Tours (Pvt) Ltd',
  companyEmail: 'info@serendibtravel.com',
  companyPhone: '+94 11 234 5678',
  companyAddress: 'No. 45, Galle Road, Colombo 03, Sri Lanka',
  defaultCurrencyInbound: 'USD',
  defaultCurrencyOutbound: 'LKR',
  quotationValidityDays: 14,
  quotationTerms:
    '• 30% advance payment required to confirm the booking.\n• Balance payable 21 days prior to travel.\n• Rates are subject to availability at the time of confirmation.\n• Cancellation charges apply as per hotel & airline policies.',
  pageSize: 10,
};

export function buildSeedData(now = new Date()): SeedData {
  const rand = mulberry32(20260915);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const year = now.getFullYear();
  const iso = (d: Date) => toISODate(d);
  const at = (d: Date, h = int(8, 18), m = int(0, 59)) => {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  };
  const actorName = (id: string | null) => seedUsers.find((u) => u.id === id)?.name ?? 'System';

  // ── Packages ─────────────────────────────────────────────
  const packages: TourPackage[] = [
    ...INBOUND_PKGS.map(([name, destination, days, price, highlights], i) => ({
      id: `pkg_in_${i + 1}`, type: 'Inbound' as const, name, destination, durationDays: days, nights: Math.max(0, days - 1),
      startingPrice: price, currency: 'USD' as const, status: name === 'Custom Tour' ? ('Active' as const) : i === 5 ? ('Active' as const) : ('Active' as const), highlights,
    })),
    ...OUTBOUND_PKGS.map(([name, destination, days, price, highlights], i) => ({
      id: `pkg_out_${i + 1}`, type: 'Outbound' as const, name, destination, durationDays: days, nights: Math.max(0, days - 1),
      startingPrice: price, currency: 'LKR' as const, status: i === 2 ? ('Draft' as const) : ('Active' as const), highlights,
    })),
  ];

  // ── Customers ────────────────────────────────────────────
  const customers: Customer[] = [
    ...INBOUND_PEOPLE.map(([name, country, nationality, phone], i) => ({
      id: `cus_in_${i + 1}`, name, country, nationality, phone, whatsapp: phone,
      email: `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').split(' ').join('.')}@${pick(['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'])}`,
      segment: 'Inbound' as const, status: i % 7 === 0 ? ('VIP' as const) : ('Active' as const), notes: '', createdAt: at(addDays(now, -int(120, 240))),
    })),
    ...OUTBOUND_PEOPLE.map(([name, nic, phone], i) => ({
      id: `cus_out_${i + 1}`, name, country: 'Sri Lanka', nationality: 'Sri Lankan', phone, whatsapp: phone, nicPassport: nic,
      email: `${name.toLowerCase().split(' ')[0]}.${name.toLowerCase().split(' ')[1]?.slice(0, 4)}${int(10, 99)}@gmail.com`,
      segment: 'Outbound' as const, status: i % 6 === 0 ? ('VIP' as const) : ('Active' as const), notes: '', createdAt: at(addDays(now, -int(120, 240))),
    })),
  ];
  customers[3].notes = 'Prefers boutique hotels. Travels with elderly parents — avoid long drives.';
  customers[20].notes = 'Corporate client — handles annual staff trips.';
  customers[customers.length - 1].status = 'Inactive';

  // ── Inquiries ────────────────────────────────────────────
  type Draft = { type: 'Inbound' | 'Outbound'; daysAgo: number };
  const drafts: Draft[] = [];
  const makeDaysAgo = (i: number, total: number) => {
    // ensure every recent period has data: first ~20% within 7 days
    if (i < Math.ceil(total * 0.18)) return int(0, 6);
    if (i < Math.ceil(total * 0.42)) return int(7, 30);
    return int(31, 178);
  };
  const IN_COUNT = 42, OUT_COUNT = 36;
  for (let i = 0; i < IN_COUNT; i++) drafts.push({ type: 'Inbound', daysAgo: makeDaysAgo(i, IN_COUNT) });
  for (let i = 0; i < OUT_COUNT; i++) drafts.push({ type: 'Outbound', daysAgo: makeDaysAgo(i, OUT_COUNT) });
  drafts.sort((a, b) => b.daysAgo - a.daysAgo); // oldest first for sequential IDs

  const statusFor = (daysAgo: number): InquiryStatus => {
    if (daysAgo <= 2) return pick(['New', 'New', 'New', 'Contacted'] as const);
    if (daysAgo <= 7) return pick(['New', 'Contacted', 'Requirement Collected', 'Quotation Preparing', 'Quotation Sent', 'Follow-up Required'] as const);
    if (daysAgo <= 30) return pick(['Quotation Sent', 'Follow-up Required', 'Negotiation', 'Confirmed', 'Payment Pending', 'Partially Paid', 'Quotation Sent', 'Lost', 'Follow-up Required'] as const);
    if (daysAgo <= 75) return pick(['Confirmed', 'Partially Paid', 'Fully Paid', 'Booking Completed', 'Lost', 'Follow-up Required', 'Negotiation', 'Cancelled'] as const);
    return pick(['Travel Completed', 'Travel Completed', 'Booking Completed', 'Lost', 'Lost', 'Cancelled', 'Fully Paid'] as const);
  };
  const priorityFor = (s: InquiryStatus): Priority =>
    ['Negotiation', 'Follow-up Required', 'Payment Pending'].includes(s) ? pick(['High', 'High', 'Medium'] as const) : pick(['High', 'Medium', 'Medium', 'Low', 'Low'] as const);

  const inboundExecs = ['u_sales1', 'u_sales2', 'u_sales5', 'u_sales1', 'u_sales2'];
  const outboundExecs = ['u_sales3', 'u_sales4', 'u_sales6', 'u_sales3', 'u_sales4'];
  let inSeq = 0, outSeq = 0;
  const inquiries: Inquiry[] = [];
  const activities: Activity[] = [];
  const notes: Note[] = [];
  const act = (inquiryId: string, kind: Activity['kind'], message: string, actor: string, when: Date) =>
    activities.push({ id: `act_${activities.length + 1}`, inquiryId, kind, message, actorName: actor, createdAt: at(when) });

  drafts.forEach((d, idx) => {
    const created = addDays(now, -d.daysAgo);
    const status = statusFor(d.daysAgo);
    const priority = priorityFor(status);
    const source = pick(SOURCES_W);
    const unassigned = status === 'New' && rand() < 0.45;
    const adults = pick([1, 2, 2, 2, 2, 3, 4, 4, 6]);
    const children = rand() < 0.35 ? int(1, 3) : 0;
    const infants = rand() < 0.1 ? 1 : 0;

    if (d.type === 'Inbound') {
      inSeq++;
      const cust = customers[(idx * 7 + int(0, 3)) % INBOUND_PEOPLE.length];
      const nights = pick([5, 6, 7, 8, 9, 10, 12, 14]);
      const leadDays = status === 'Travel Completed' ? Math.max(3, d.daysAgo - nights - int(3, 15)) : int(18, 110);
      const arrival = addDays(created, leadDays);
      const departure = addDays(arrival, nights);
      const dests = pick(INBOUND_DESTS);
      const id = `INB-${year}-${String(inSeq).padStart(5, '0')}`;
      const currency = cust.country === 'United Kingdom' ? 'GBP' : ['Germany', 'France', 'Netherlands', 'Italy', 'Spain'].includes(cust.country) ? 'EUR' : cust.country === 'Australia' ? 'AUD' : 'USD';
      inquiries.push({
        id, type: 'Inbound', createdAt: at(created), updatedAt: at(created), customerId: cust.id, customerName: cust.name,
        email: cust.email, phone: cust.phone, whatsapp: cust.whatsapp, nights, adults, children, infants,
        budget: Math.round(((adults + children * 0.6) * nights * int(90, 260)) / 50) * 50, currency,
        specialRequirements: pick(['', '', 'Vegetarian meals for 2 guests', 'Ground floor rooms preferred', 'Anniversary celebration — arrange cake', 'Need child seats in vehicle', 'Early check-in on arrival']),
        source, priority, assignedTo: unassigned ? null : pick(inboundExecs), status,
        notes: pick(['', 'Found us via TripAdvisor reviews.', 'Repeat enquiry from last year.', 'Interested in eco-lodges.']),
        inbound: {
          country: cust.country, nationality: cust.nationality, preferredContact: pick(['Email', 'WhatsApp', 'WhatsApp', 'Phone'] as const),
          arrivalDate: iso(arrival), departureDate: iso(departure), destinations: dests,
          hotelCategory: pick(['4 Star', '5 Star', 'Boutique', '4 Star', 'Luxury Villa']), transport: pick(['Private Car', 'Van', 'Private Car', 'Mini Coach']),
          guide: pick(['Chauffeur Guide', 'Chauffeur Guide', 'National Guide']), safari: dests.includes('Yala') || dests.includes('Udawalawe') || rand() < 0.3,
          activities: [pick(['Tea Plantation Tour', 'Whale Watching', 'Cooking Class']), pick(['Temple Visits', 'Train Ride', 'Ayurveda Spa'])],
          mealPreference: pick(['Bed & Breakfast', 'Half Board', 'Half Board', 'Full Board']),
        },
      });
    } else {
      outSeq++;
      const cust = customers[INBOUND_PEOPLE.length + ((idx * 5 + int(0, 2)) % OUTBOUND_PEOPLE.length)];
      const [country, city, pkgIdx] = pick(OUTBOUND_DESTS);
      const pkg = packages.filter((p) => p.type === 'Outbound')[pkgIdx];
      const nights = pkg.nights || pick([4, 5, 6]);
      const leadDays = status === 'Travel Completed' ? Math.max(3, d.daysAgo - nights - int(3, 15)) : int(14, 90);
      const travel = addDays(created, leadDays);
      const id = `OUT-${year}-${String(outSeq).padStart(5, '0')}`;
      const pax = adults + children + infants;
      inquiries.push({
        id, type: 'Outbound', createdAt: at(created), updatedAt: at(created), customerId: cust.id, customerName: cust.name,
        email: cust.email, phone: cust.phone, whatsapp: cust.whatsapp, nights, adults, children, infants,
        budget: Math.round((pkg.startingPrice || 250000) * pax * (0.9 + rand() * 0.5) / 5000) * 5000, currency: 'LKR',
        specialRequirements: pick(['', '', 'Halal food required', 'Need wheelchair assistance at airport', 'Prefer morning flights', 'Adjoining rooms']),
        source, priority, assignedTo: unassigned ? null : pick(outboundExecs), status,
        notes: pick(['', 'Family trip during school holidays.', 'Office staff trip — may increase pax.', 'Previously travelled with us to Thailand.']),
        outbound: {
          nicPassport: cust.nicPassport ?? '', destinationCountry: country, destinationCity: city, travelDate: iso(travel), returnDate: iso(addDays(travel, nights)),
          packageId: pkg.id, packageName: pkg.name, airlinePreference: pick(AIRLINES), hotelCategory: pick(['3 Star', '4 Star', '4 Star', '5 Star']),
          roomRequirement: pick(['1 Double', '2 Doubles', '1 Double + 1 Twin', 'Family Room']), visaRequired: !['Maldives', 'Thailand', 'Singapore', 'Malaysia'].includes(country) || rand() < 0.2,
          travelInsurance: rand() < 0.6, transport: pick(['Private Car', 'Van', 'Self Arranged']), excursions: pick(['City tour', 'Desert safari', 'Island hopping', 'Theme parks', 'Shopping tour', '']),
        },
      });
    }

    // timeline
    const inq = inquiries[inquiries.length - 1];
    act(inq.id, 'created', `Inquiry received via ${source}`, 'System', created);
    if (inq.assignedTo) act(inq.id, 'assigned', `Assigned to ${actorName(inq.assignedTo)}`, inq.type === 'Inbound' ? 'Shanika Rodrigo' : 'Malith Gunawardena', created);
    if (status !== 'New') act(inq.id, 'status', `Status changed to Contacted`, actorName(inq.assignedTo), addDays(created, Math.min(1, d.daysAgo)));
    if (status !== 'New' && status !== 'Contacted') {
      act(inq.id, 'status', `Status changed to ${status}`, actorName(inq.assignedTo), addDays(created, Math.min(d.daysAgo, int(2, 10))));
    }
    if (rand() < 0.35) {
      notes.push({
        id: `note_${notes.length + 1}`, inquiryId: inq.id, customerId: inq.customerId,
        text: pick(['Customer is comparing with two other agencies — respond quickly.', 'Requested sea-view rooms wherever possible.', 'Budget is flexible for the right hotels.', 'Prefers WhatsApp voice notes over calls.', 'Passport copies received for all travellers.']),
        authorId: inq.assignedTo, authorName: actorName(inq.assignedTo), createdAt: at(addDays(created, Math.min(d.daysAgo, 1))),
      });
    }
  });

  // ── Follow-ups ───────────────────────────────────────────
  const followups: FollowUp[] = [];
  const activeStatuses: InquiryStatus[] = ['New', 'Contacted', 'Requirement Collected', 'Quotation Preparing', 'Quotation Sent', 'Follow-up Required', 'Negotiation', 'Payment Pending', 'Partially Paid'];
  const offsets = [0, 0, -1, -3, 1, 2, 0, -2, 4, 5, 3, 1, -5, 6, 0, 2, 7, -1];
  let offIdx = 0;
  inquiries.forEach((inq) => {
    const created = new Date(inq.createdAt);
    const daysAgo = Math.round((now.getTime() - created.getTime()) / 86400000);
    if (daysAgo > 2 && rand() < 0.8) {
      const doneDate = addDays(created, Math.min(daysAgo - 1, int(1, 3)));
      followups.push({
        id: `fu_${followups.length + 1}`, inquiryId: inq.id, customerName: inq.customerName, date: iso(doneDate), time: `${String(int(9, 17)).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`,
        assignedTo: inq.assignedTo, type: pick(FU_TYPES), status: 'Completed', notes: pick(FU_NOTES),
        outcome: pick(['Customer interested, requested quotation.', 'Discussed itinerary changes.', 'No answer — sent WhatsApp message.', 'Confirmed travel dates.']),
        completedAt: at(doneDate), createdAt: at(created),
      });
      act(inq.id, 'followup', 'Follow-up completed', actorName(inq.assignedTo), doneDate);
    }
    if (activeStatuses.includes(inq.status) && inq.assignedTo) {
      const date = addDays(now, offsets[offIdx++ % offsets.length]);
      followups.push({
        id: `fu_${followups.length + 1}`, inquiryId: inq.id, customerName: inq.customerName, date: iso(date), time: `${String(int(9, 17)).padStart(2, '0')}:${pick(['00', '30'])}`,
        assignedTo: inq.assignedTo, type: pick(FU_TYPES), status: 'Pending', notes: pick(FU_NOTES), createdAt: at(addDays(now, -1)),
      });
    }
  });

  // ── Quotations ───────────────────────────────────────────
  const quotations: Quotation[] = [];
  const bookings: Booking[] = [];
  let qSeq = 0, bSeq = 0;
  const quotable: InquiryStatus[] = ['Quotation Preparing', 'Quotation Sent', 'Follow-up Required', 'Negotiation', ...CONFIRMED_STATUSES, 'Lost'];
  inquiries.forEach((inq) => {
    if (!quotable.includes(inq.status)) return;
    if (inq.status === 'Lost' && rand() < 0.5) return;
    if (inq.status === 'Follow-up Required' && rand() < 0.4) return;
    const created = new Date(inq.createdAt);
    const daysAgo = Math.round((now.getTime() - created.getTime()) / 86400000);
    const qDate = addDays(created, Math.min(daysAgo, int(1, 4)));
    const pax = inq.adults + inq.children;
    let lines: QuotationLine[];
    let destination: string, from: string, to: string;
    if (inq.type === 'Inbound' && inq.inbound) {
      destination = inq.inbound.destinations.join(', ');
      from = inq.inbound.arrivalDate; to = inq.inbound.departureDate;
      const roomRate = inq.inbound.hotelCategory === '5 Star' || inq.inbound.hotelCategory === 'Luxury Villa' ? 180 : 95;
      lines = [
        { id: 'l1', description: `Accommodation — ${inq.nights} nights, ${inq.inbound.hotelCategory} (${inq.inbound.mealPreference})`, qty: Math.ceil(pax / 2) * inq.nights, unitPrice: roomRate },
        { id: 'l2', description: `${inq.inbound.transport} with ${inq.inbound.guide}`, qty: inq.nights + 1, unitPrice: 75 },
        { id: 'l3', description: 'Entrance fees & sightseeing', qty: pax, unitPrice: 110 },
      ];
      if (inq.inbound.safari) lines.push({ id: 'l4', description: 'Safari jeep & park permits', qty: pax, unitPrice: 65 });
    } else {
      const o = inq.outbound!;
      destination = `${o.destinationCity}, ${o.destinationCountry}`;
      from = o.travelDate; to = o.returnDate;
      lines = [
        { id: 'l1', description: `Return air tickets (${o.airlinePreference})`, qty: pax, unitPrice: int(9, 28) * 5000 },
        { id: 'l2', description: `Hotel — ${inq.nights} nights, ${o.hotelCategory}, ${o.roomRequirement}`, qty: inq.nights, unitPrice: int(4, 12) * 5000 },
        { id: 'l3', description: 'Airport transfers & sightseeing', qty: 1, unitPrice: int(4, 10) * 5000 },
      ];
      if (o.visaRequired) lines.push({ id: 'l4', description: 'Visa processing', qty: pax, unitPrice: 18500 });
      if (o.travelInsurance) lines.push({ id: 'l5', description: 'Travel insurance', qty: pax, unitPrice: 6500 });
    }
    const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const discount = rand() < 0.4 ? Math.round((subtotal * pick([0.03, 0.05, 0.08])) / 10) * 10 : 0;
    const total = subtotal - discount;
    let qStatus: QuotationStatus = 'Sent';
    if (inq.status === 'Quotation Preparing') qStatus = 'Draft';
    else if (CONFIRMED_STATUSES.includes(inq.status)) qStatus = 'Accepted';
    else if (inq.status === 'Lost') qStatus = pick(['Rejected', 'Expired'] as const);
    else if (daysAgo > 20 && inq.status === 'Follow-up Required') qStatus = 'Expired';
    qSeq++;
    const q: Quotation = {
      id: `QT-${year}-${String(qSeq).padStart(4, '0')}`, inquiryId: inq.id, customerName: inq.customerName, destination, travelFrom: from, travelTo: to,
      date: iso(qDate), validUntil: iso(addDays(qDate, 14)), services: lines, discount, currency: inq.currency, subtotal, total,
      terms: defaultSettings.quotationTerms, notes: '', status: qStatus, createdBy: inq.assignedTo,
    };
    quotations.push(q);
    if (qStatus !== 'Draft') act(inq.id, 'quotation', `Quotation ${q.id} ${qStatus === 'Accepted' ? 'accepted' : 'sent'} — ${inq.currency} ${total.toLocaleString()}`, actorName(inq.assignedTo), qDate);

    // ── Bookings ─────────────────────────────────────────
    if (CONFIRMED_STATUSES.includes(inq.status)) {
      bSeq++;
      const bDate = addDays(qDate, int(1, 5));
      let paymentStatus: PaymentStatus = 'Pending';
      let bookingStatus: BookingStatus = 'Confirmed';
      if (inq.status === 'Partially Paid') paymentStatus = 'Partial';
      if (['Fully Paid', 'Booking Completed', 'Travel Completed'].includes(inq.status)) paymentStatus = 'Paid';
      if (inq.status === 'Confirmed') bookingStatus = 'Processing';
      if (inq.status === 'Travel Completed') bookingStatus = 'Completed';
      const payments: Payment[] = [];
      if (paymentStatus !== 'Pending') {
        const adv = Math.round((total * 0.3) / 10) * 10;
        payments.push({ id: 'p1', date: iso(bDate), amount: adv, method: pick(['Bank Transfer', 'Card', 'PayPal']), reference: `TRX${int(100000, 999999)}` });
        if (paymentStatus === 'Paid') payments.push({ id: 'p2', date: iso(addDays(bDate, int(5, 20))), amount: total - adv, method: 'Bank Transfer', reference: `TRX${int(100000, 999999)}` });
      }
      bookings.push({
        id: `BK-${year}-${String(bSeq).padStart(4, '0')}`, inquiryId: inq.id, quotationId: q.id, customerId: inq.customerId, customerName: inq.customerName,
        packageName: inq.type === 'Outbound' ? inq.outbound!.packageName ?? 'Custom Tour' : `${inq.nights}N ${inq.inbound!.destinations.slice(0, 2).join(' & ')} Tour`,
        travelDate: from, returnDate: to, travelers: inq.adults + inq.children + inq.infants, totalAmount: total, currency: inq.currency,
        payments, paymentStatus, bookingStatus, createdAt: at(bDate), notes: '',
      });
      act(inq.id, 'booking', `Converted to booking BK-${year}-${String(bSeq).padStart(4, '0')}`, actorName(inq.assignedTo), bDate);
    }
  });

  // cancelled booking example
  const cancelled = inquiries.find((i) => i.status === 'Cancelled');
  if (cancelled) {
    bSeq++;
    const from = cancelled.inbound?.arrivalDate ?? cancelled.outbound!.travelDate;
    const to = cancelled.inbound?.departureDate ?? cancelled.outbound!.returnDate;
    bookings.push({
      id: `BK-${year}-${String(bSeq).padStart(4, '0')}`, inquiryId: cancelled.id, customerId: cancelled.customerId, customerName: cancelled.customerName,
      packageName: cancelled.outbound?.packageName ?? 'Sri Lanka Highlights', travelDate: from, returnDate: to,
      travelers: cancelled.adults + cancelled.children, totalAmount: cancelled.budget, currency: cancelled.currency,
      payments: [], paymentStatus: 'Pending', bookingStatus: 'Cancelled', createdAt: cancelled.createdAt, notes: 'Cancelled by customer due to change of plans.',
    });
  }

  // ── Users' last login ────────────────────────────────────
  const users = seedUsers.map((u, i) => ({ ...u, lastLogin: new Date(now.getTime() - (i * 5 + 1) * 3600_000).toISOString() }));

  activities.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { users, customers, inquiries, followups, quotations, bookings, packages, notes, activities, settings: defaultSettings };
}
