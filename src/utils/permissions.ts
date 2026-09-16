import type { Department, DepartmentScope, Inquiry, Role, User } from '@/types';

/**
 * Frontend role simulation. In Phase 2 these checks must also be enforced
 * server-side — the UI only hides what a role cannot do.
 */
export type Permission =
  | 'inquiry.create'
  | 'inquiry.edit'
  | 'inquiry.assign'
  | 'inquiry.viewAll'
  | 'inquiry.delete'
  | 'followup.manage'
  | 'quotation.manage'
  | 'booking.manage'
  | 'customer.manage'
  | 'package.manage'
  | 'reports.view'
  | 'users.manage'
  | 'settings.manage';

const MATRIX: Record<Role, Permission[]> = {
  'Super Admin': [
    'inquiry.create', 'inquiry.edit', 'inquiry.assign', 'inquiry.viewAll', 'inquiry.delete',
    'followup.manage', 'quotation.manage', 'booking.manage', 'customer.manage', 'package.manage',
    'reports.view', 'users.manage', 'settings.manage',
  ],
  Manager: [
    'inquiry.create', 'inquiry.edit', 'inquiry.assign', 'inquiry.viewAll',
    'followup.manage', 'quotation.manage', 'booking.manage', 'customer.manage', 'package.manage', 'reports.view',
  ],
  'Sales Executive': ['inquiry.create', 'inquiry.edit', 'followup.manage', 'quotation.manage', 'booking.manage', 'customer.manage'],
  Viewer: ['inquiry.viewAll', 'reports.view'],
};

export function can(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return MATRIX[user.role].includes(permission);
}

export const isReadOnly = (user?: User | null) => user?.role === 'Viewer';

/** A user's department fence: head-office users ('All') may narrow it with the department switcher. */
export function effectiveScope(user: User | null | undefined, selected: DepartmentScope = 'All'): DepartmentScope {
  if (!user) return 'All';
  return user.department === 'All' ? selected : user.department;
}

/** Can the user work in this department at all? */
export const canAccessDepartment = (user: User | null | undefined, dept: Department) => !!user && (user.department === 'All' || user.department === dept);

/**
 * Inquiry visibility:
 *  1. Department fence — Inbound staff never see Outbound inquiries and vice versa.
 *  2. Sales executives see only inquiries assigned to them.
 */
export function canSeeInquiry(user: User | null | undefined, inquiry: Inquiry, scope: DepartmentScope = 'All'): boolean {
  if (!user || !canAccessDepartment(user, inquiry.type)) return false;
  if (scope !== 'All' && inquiry.type !== scope) return false;
  if (can(user, 'inquiry.viewAll')) return true;
  return inquiry.assignedTo === user.id;
}

export type NavKey =
  | 'dashboard' | 'inbound' | 'outbound' | 'mine' | 'followups' | 'quotations' | 'bookings'
  | 'customers' | 'packages' | 'reports' | 'users' | 'settings';

const NAV_BY_ROLE: Record<Role, NavKey[]> = {
  'Super Admin': ['dashboard', 'inbound', 'outbound', 'mine', 'followups', 'quotations', 'bookings', 'customers', 'packages', 'reports', 'users', 'settings'],
  Manager: ['dashboard', 'inbound', 'outbound', 'mine', 'followups', 'quotations', 'bookings', 'customers', 'packages', 'reports'],
  // Sales executives only ever see inquiries assigned to them, so they work from "My Inquiries".
  'Sales Executive': ['dashboard', 'mine', 'followups', 'quotations', 'customers'],
  Viewer: ['dashboard', 'inbound', 'outbound', 'followups', 'quotations', 'bookings', 'customers', 'packages', 'reports'],
};

export function canNavigate(user: User | null | undefined, key: NavKey, selected: DepartmentScope = 'All'): boolean {
  if (!user || !NAV_BY_ROLE[user.role].includes(key)) return false;
  const scope = effectiveScope(user, selected);
  if (key === 'inbound') return scope !== 'Outbound';
  if (key === 'outbound') return scope !== 'Inbound';
  return true;
}
