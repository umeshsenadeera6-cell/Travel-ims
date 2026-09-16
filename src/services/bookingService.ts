import type { Booking, BookingStatus, Inquiry, Payment, PaymentStatus, User } from '@/types';
import { createRepository } from './storage';
import { nextSequentialId, uid } from '@/utils/id';
import { activityService } from './activityService';
import { inquiryService } from './inquiryService';

const repo = createRepository<Booking>('bookings');

export const paidAmount = (b: Booking) => b.payments.reduce((s, p) => s + p.amount, 0);
export const balanceAmount = (b: Booking) => Math.max(0, b.totalAmount - paidAmount(b));

function derivePaymentStatus(total: number, paid: number): PaymentStatus {
  if (paid <= 0) return 'Pending';
  if (paid >= total) return 'Paid';
  return 'Partial';
}

export interface BookingInput {
  inquiry: Inquiry;
  quotationId?: string;
  packageName: string;
  travelDate: string;
  returnDate: string;
  travelers: number;
  totalAmount: number;
  currency: Booking['currency'];
  advance?: Omit<Payment, 'id'> | null;
  notes: string;
}

export const bookingService = {
  async list() {
    return (await repo.list()).sort((a, b) => b.id.localeCompare(a.id));
  },
  get: repo.get,
  async getByInquiry(inquiryId: string) {
    return (await repo.list()).find((b) => b.inquiryId === inquiryId);
  },
  previewNextId() {
    return nextSequentialId('BK', repo.snapshot().map((b) => b.id), 4);
  },
  async createFromInquiry(input: BookingInput, actor: User | null) {
    const payments: Payment[] = input.advance && input.advance.amount > 0 ? [{ ...input.advance, id: uid('pay') }] : [];
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const booking: Booking = {
      id: bookingService.previewNextId(), inquiryId: input.inquiry.id, quotationId: input.quotationId, customerId: input.inquiry.customerId,
      customerName: input.inquiry.customerName, packageName: input.packageName, travelDate: input.travelDate, returnDate: input.returnDate,
      travelers: input.travelers, totalAmount: input.totalAmount, currency: input.currency, payments,
      paymentStatus: derivePaymentStatus(input.totalAmount, paid), bookingStatus: 'Confirmed', createdAt: new Date().toISOString(), notes: input.notes,
    };
    await repo.create(booking);
    await activityService.log(input.inquiry.id, 'booking', `Converted to booking ${booking.id}`, actor);
    const status = booking.paymentStatus === 'Paid' ? 'Fully Paid' : booking.paymentStatus === 'Partial' ? 'Partially Paid' : 'Payment Pending';
    await inquiryService.changeStatus(input.inquiry.id, status, actor);
    return booking;
  },
  async addPayment(id: string, payment: Omit<Payment, 'id'>, actor: User | null) {
    const b = await repo.get(id);
    if (!b) throw new Error('Booking not found');
    const payments = [...b.payments, { ...payment, id: uid('pay') }];
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const paymentStatus = derivePaymentStatus(b.totalAmount, paid);
    const updated = await repo.update(id, { payments, paymentStatus });
    await activityService.log(b.inquiryId, 'payment', `Payment received: ${b.currency} ${payment.amount.toLocaleString()} (${payment.method})`, actor);
    await inquiryService.changeStatus(b.inquiryId, paymentStatus === 'Paid' ? 'Fully Paid' : 'Partially Paid', actor);
    return updated;
  },
  async setStatus(id: string, bookingStatus: BookingStatus, actor: User | null) {
    const b = await repo.update(id, { bookingStatus });
    await activityService.log(b.inquiryId, 'booking', `Booking ${b.id} marked as ${bookingStatus}`, actor);
    if (bookingStatus === 'Completed') await inquiryService.changeStatus(b.inquiryId, 'Travel Completed', actor);
    if (bookingStatus === 'Cancelled') await inquiryService.changeStatus(b.inquiryId, 'Cancelled', actor);
    return b;
  },
  async update(id: string, patch: Partial<Booking>) {
    const b = await repo.get(id);
    if (!b) throw new Error('Booking not found');
    const merged = { ...b, ...patch };
    return repo.update(id, { ...patch, paymentStatus: derivePaymentStatus(merged.totalAmount, paidAmount(merged)) });
  },
};
