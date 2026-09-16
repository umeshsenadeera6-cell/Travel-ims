import type { Department, DepartmentScope, User } from '@/types';

export const DEPARTMENTS: Department[] = ['Inbound', 'Outbound'];
export const DEPARTMENT_SCOPES: DepartmentScope[] = ['All', 'Inbound', 'Outbound'];
export const SECTIONS = ['Management', 'Sales', 'Reservations', 'Operations', 'Finance', 'Marketing'];

export const DEPT_META: Record<DepartmentScope, { name: string; short: string; description: string; dot: string; chip: string }> = {
  All: { name: 'All departments', short: 'All', description: 'Head office view of both departments', dot: 'bg-slate-500', chip: 'bg-slate-100 text-slate-700' },
  Inbound: { name: 'Inbound Department', short: 'Inbound', description: 'Foreign travellers touring Sri Lanka', dot: 'bg-brand-600', chip: 'bg-brand-50 text-brand-700' },
  Outbound: { name: 'Outbound Department', short: 'Outbound', description: 'Sri Lankans travelling abroad', dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700' },
};

/** e.g. "Inbound Manager", "Outbound Sales Executive", "Super Admin". */
export function roleLabel(user: Pick<User, 'role' | 'department'>): string {
  if (user.department === 'All') return user.role;
  return `${user.department} ${user.role}`;
}

/** Does a department-scoped record (inquiry type, customer segment, package type) fall within a scope? */
export const inScope = (dept: Department, scope: DepartmentScope) => scope === 'All' || dept === scope;

/** Active sales executives who can take work for a department. */
export function executivesFor(users: User[], dept: DepartmentScope): User[] {
  return users.filter((u) => u.role === 'Sales Executive' && u.status === 'Active' && (dept === 'All' || u.department === dept || u.department === 'All'));
}
