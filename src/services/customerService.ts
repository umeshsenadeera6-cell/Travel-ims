import type { Booking, Customer, Inquiry } from '@/types';
import { createRepository } from './storage';
import { uid } from '@/utils/id';

const repo = createRepository<Customer>('customers');
const inquiries = createRepository<Inquiry>('inquiries');
const bookings = createRepository<Booking>('bookings');

export interface CustomerWithStats extends Customer {
  totalInquiries: number;
  totalBookings: number;
  lastInquiry: string | null;
}

export type CustomerMatchInput = Pick<Customer, 'name' | 'email' | 'phone' | 'whatsapp' | 'country' | 'nationality' | 'segment'> & { nicPassport?: string };

export const customerService = {
  async list(): Promise<CustomerWithStats[]> {
    const [cs, inqs, bks] = await Promise.all([repo.list(), inquiries.list(), bookings.list()]);
    return cs.map((c) => {
      const mine = inqs.filter((i) => i.customerId === c.id);
      return {
        ...c,
        totalInquiries: mine.length,
        totalBookings: bks.filter((b) => b.customerId === c.id && b.bookingStatus !== 'Cancelled').length,
        lastInquiry: mine.map((i) => i.createdAt).sort().at(-1) ?? null,
      };
    });
  },
  get: repo.get,
  async create(input: Omit<Customer, 'id' | 'createdAt'>) {
    return repo.create({ ...input, id: uid('cus'), createdAt: new Date().toISOString() });
  },
  update: repo.update,
  /** Match an existing customer by email / phone, or create a new record. */
  async upsertFromInquiry(input: CustomerMatchInput): Promise<Customer> {
    const all = await repo.list();
    const norm = (s?: string) => (s ?? '').replace(/\s+/g, '').toLowerCase();
    const found = all.find((c) => (input.email && norm(c.email) === norm(input.email)) || (input.phone && norm(c.phone) === norm(input.phone)));
    if (found) {
      return repo.update(found.id, {
        name: input.name || found.name,
        whatsapp: input.whatsapp || found.whatsapp,
        email: input.email || found.email,
        nicPassport: input.nicPassport || found.nicPassport,
      });
    }
    return repo.create({ ...input, id: uid('cus'), status: 'Active', notes: '', createdAt: new Date().toISOString() });
  },
};
