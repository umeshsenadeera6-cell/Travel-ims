import { useMemo } from 'react';
import { bookingService, customerService, followupService, inquiryService, quotationService, userService } from '@/services';
import { useServiceQuery } from './useServiceQuery';
import { useAuth } from '@/context/AuthContext';
import { canSeeInquiry } from '@/utils/permissions';
import { inScope } from '@/utils/departments';

/**
 * Loads the core CRM collections and applies role-based scoping
 * (sales executives only see records tied to their assigned inquiries).
 */
export function useWorkspaceData() {
  const { user, scope } = useAuth();
  const q = useServiceQuery(async () => {
    const [inquiries, followups, quotations, bookings, users, customers] = await Promise.all([
      inquiryService.list(), followupService.list(), quotationService.list(), bookingService.list(), userService.list(), customerService.list(),
    ]);
    return { inquiries, followups, quotations, bookings, users, customers };
  });

  const scoped = useMemo(() => {
    const d = q.data;
    if (!d) return null;
    const inquiries = d.inquiries.filter((i) => canSeeInquiry(user, i, scope));
    const ids = new Set(inquiries.map((i) => i.id));
    const customerIds = new Set(inquiries.map((i) => i.customerId));
    const restricted = user?.role === 'Sales Executive';
    const deptCustomers = d.customers.filter((c) => inScope(c.segment, scope) || customerIds.has(c.id));
    return {
      inquiries,
      followups: d.followups.filter((f) => ids.has(f.inquiryId)),
      quotations: d.quotations.filter((x) => ids.has(x.inquiryId)),
      bookings: d.bookings.filter((x) => ids.has(x.inquiryId)),
      customers: restricted ? d.customers.filter((c) => customerIds.has(c.id)) : deptCustomers,
      scope,
      users: d.users,
      allInquiries: d.inquiries,
    };
  }, [q.data, user, scope]);

  return { data: scoped, loading: q.loading && !q.data, error: q.error };
}

export function useUserMap() {
  const { data } = useServiceQuery(() => userService.list());
  return useMemo(() => new Map((data ?? []).map((u) => [u.id, u])), [data]);
}
