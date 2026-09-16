/**
 * Reporting & dashboard aggregations.
 * Phase 2: these become server-side endpoints (e.g. GET /reports/conversion).
 */
import type { Booking, FollowUp, Inquiry, Quotation, User } from '@/types';
import { CONFIRMED_STATUSES, STATUS_GROUPS } from '@/utils/constants';
import { SOURCES } from '@/types';
import { addDays, pad, todayISO, toISODate } from '@/utils/date';
import { toUSD } from '@/utils/format';

export type TrendRange = 'week' | 'month' | '6months';

const isQuoted = (i: Inquiry, quotedIds: Set<string>) => quotedIds.has(i.id);
const isBooked = (i: Inquiry) => CONFIRMED_STATUSES.includes(i.status);

export const analytics = {
  kpis(inquiries: Inquiry[], followups: FollowUp[], quotations: Quotation[], bookings: Booking[]) {
    const today = todayISO();
    const ids = new Set(inquiries.map((i) => i.id));
    const fu = followups.filter((f) => ids.has(f.inquiryId));
    const q = quotations.filter((x) => ids.has(x.inquiryId));
    const b = bookings.filter((x) => ids.has(x.inquiryId));
    return {
      total: inquiries.length,
      inbound: inquiries.filter((i) => i.type === 'Inbound').length,
      outbound: inquiries.filter((i) => i.type === 'Outbound').length,
      newInquiries: inquiries.filter((i) => i.status === 'New').length,
      pendingFollowups: fu.filter((f) => f.status === 'Pending').length,
      overdueFollowups: fu.filter((f) => f.status === 'Pending' && f.date < today).length,
      quotationsSent: q.filter((x) => x.status !== 'Draft').length,
      confirmedBookings: b.filter((x) => x.bookingStatus !== 'Cancelled').length,
      lost: inquiries.filter((i) => i.status === 'Lost' || i.status === 'Cancelled').length,
      revenueUSD: b.filter((x) => x.bookingStatus !== 'Cancelled').reduce((s, x) => s + toUSD(x.totalAmount, x.currency), 0),
    };
  },

  trend(inquiries: Inquiry[], range: TrendRange) {
    const now = new Date();
    const buckets: Array<{ key: string; label: string; Inbound: number; Outbound: number }> = [];
    if (range === '6months') {
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        buckets.push({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: d.toLocaleDateString('en-GB', { month: 'short' }), Inbound: 0, Outbound: 0 });
      }
      inquiries.forEach((i) => {
        const b = buckets.find((x) => x.key === i.createdAt.slice(0, 7));
        if (b) b[i.type]++;
      });
    } else {
      const days = range === 'week' ? 7 : 30;
      for (let n = days - 1; n >= 0; n--) {
        const d = addDays(now, -n);
        buckets.push({
          key: toISODate(d),
          label: range === 'week' ? d.toLocaleDateString('en-GB', { weekday: 'short' }) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          Inbound: 0, Outbound: 0,
        });
      }
      inquiries.forEach((i) => {
        const key = toISODate(new Date(i.createdAt));
        const b = buckets.find((x) => x.key === key);
        if (b) b[i.type]++;
      });
    }
    return buckets;
  },

  bySource(inquiries: Inquiry[], quotations: Quotation[]) {
    const quoted = new Set(quotations.filter((q) => q.status !== 'Draft').map((q) => q.inquiryId));
    return SOURCES.map((s) => {
      const list = inquiries.filter((i) => i.source === s);
      const bookings = list.filter(isBooked).length;
      return {
        name: s,
        value: list.length,
        inbound: list.filter((i) => i.type === 'Inbound').length,
        outbound: list.filter((i) => i.type === 'Outbound').length,
        quotations: list.filter((i) => isQuoted(i, quoted)).length,
        bookings,
        conversion: list.length ? Math.round((bookings / list.length) * 1000) / 10 : 0,
      };
    });
  },

  byStatusGroup(inquiries: Inquiry[]) {
    return Object.entries(STATUS_GROUPS).map(([name, statuses]) => ({ name, value: inquiries.filter((i) => statuses.includes(i.status)).length }));
  },

  executivePerformance(inquiries: Inquiry[], quotations: Quotation[], users: User[]) {
    const quoted = new Set(quotations.filter((q) => q.status !== 'Draft').map((q) => q.inquiryId));
    return users
      .filter((u) => u.role === 'Sales Executive')
      .map((u) => {
        const mine = inquiries.filter((i) => i.assignedTo === u.id);
        const bookings = mine.filter(isBooked).length;
        return {
          user: u,
          assigned: mine.length,
          contacted: mine.filter((i) => i.status !== 'New').length,
          quotations: mine.filter((i) => isQuoted(i, quoted)).length,
          bookings,
          lost: mine.filter((i) => i.status === 'Lost').length,
          conversion: mine.length ? Math.round((bookings / mine.length) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.bookings - a.bookings || b.conversion - a.conversion);
  },

  funnel(inquiries: Inquiry[], quotations: Quotation[]) {
    const quoted = new Set(quotations.filter((q) => q.status !== 'Draft').map((q) => q.inquiryId));
    const total = inquiries.length;
    const contacted = inquiries.filter((i) => i.status !== 'New').length;
    const q = inquiries.filter((i) => quoted.has(i.id)).length;
    const booked = inquiries.filter(isBooked).length;
    return { total, contacted, quotations: q, bookings: booked, rate: total ? Math.round((booked / total) * 1000) / 10 : 0 };
  },

  byDestination(inquiries: Inquiry[], keyFn: (i: Inquiry) => string) {
    const map = new Map<string, number>();
    inquiries.forEach((i) => map.set(keyFn(i), (map.get(keyFn(i)) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  },
};
