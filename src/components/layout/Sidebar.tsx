import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlaneLanding, PlaneTakeoff, Inbox, CalendarClock, FileText, Luggage, Users, Map, ChartColumn, UserCog, Settings, LogOut, X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { NavKey } from '@/utils/permissions';
import { cx } from '@/utils/format';
import { Avatar } from '@/components/ui';
import { BrandLockup } from './Brand';
import { DEPARTMENT_SCOPES, DEPT_META, roleLabel } from '@/utils/departments';
import type { DepartmentScope } from '@/types';

export const NAV_ITEMS: Array<{ key: NavKey; label: string; to: string; icon: ComponentType<{ className?: string }>; group: string }> = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { key: 'inbound', label: 'Inbound Inquiries', to: '/inquiries/inbound', icon: PlaneLanding, group: 'Inquiries' },
  { key: 'outbound', label: 'Outbound Inquiries', to: '/inquiries/outbound', icon: PlaneTakeoff, group: 'Inquiries' },
  { key: 'mine', label: 'My Inquiries', to: '/inquiries/mine', icon: Inbox, group: 'Inquiries' },
  { key: 'followups', label: 'Follow-ups', to: '/followups', icon: CalendarClock, group: 'Sales' },
  { key: 'quotations', label: 'Quotations', to: '/quotations', icon: FileText, group: 'Sales' },
  { key: 'bookings', label: 'Bookings', to: '/bookings', icon: Luggage, group: 'Sales' },
  { key: 'customers', label: 'Customers', to: '/customers', icon: Users, group: 'Sales' },
  { key: 'packages', label: 'Tours & Packages', to: '/packages', icon: Map, group: 'Catalogue' },
  { key: 'reports', label: 'Reports', to: '/reports', icon: ChartColumn, group: 'Insights' },
  { key: 'users', label: 'Users', to: '/users', icon: UserCog, group: 'Administration' },
  { key: 'settings', label: 'Settings', to: '/settings', icon: Settings, group: 'Administration' },
];

export function Sidebar({ open, onClose, badges }: { open: boolean; onClose: () => void; badges: Partial<Record<NavKey, number>> }) {
  const { user, logout, canNav, scope, setScope, canSwitchDepartment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const switchTo = (d: DepartmentScope) => {
    setScope(d);
    const onList = /^\/inquiries\/(inbound|outbound)(\/new)?$/.test(location.pathname);
    if (onList && d !== 'All') navigate(location.pathname.replace(/inbound|outbound/, d.toLowerCase()));
  };
  const items = NAV_ITEMS.filter((i) => canNav(i.key));
  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <>
      <div className={cx('fixed inset-0 z-30 bg-slate-900/40 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} />
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ width: 272 }}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <BrandLockup />
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-3 py-3">
          {canSwitchDepartment ? (
            <div>
              <p className="mb-1.5 px-1 text-[10.5px] font-semibold tracking-[0.08em] text-slate-400 uppercase">Department</p>
              <div className="grid grid-cols-3 gap-0.5 rounded-lg bg-slate-100 p-0.5" role="radiogroup" aria-label="Department in view">
                {DEPARTMENT_SCOPES.map((d) => (
                  <button
                    key={d}
                    role="radio"
                    aria-checked={scope === d}
                    onClick={() => switchTo(d)}
                    className={cx('flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition', scope === d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800')}
                  >
                    {d !== 'All' && <span className={cx('size-1.5 rounded-full', DEPT_META[d].dot)} />}
                    {DEPT_META[d].short}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={cx('flex items-center gap-2.5 rounded-lg px-3 py-2', DEPT_META[scope].chip)}>
              <span className={cx('size-2 rounded-full', DEPT_META[scope].dot)} />
              <div className="min-w-0 leading-tight">
                <p className="text-sm font-semibold">{DEPT_META[scope].name}</p>
                <p className="truncate text-[11px] opacity-80">{DEPT_META[scope].description}</p>
              </div>
            </div>
          )}
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g} className="mb-4">
              <p className="mb-1.5 px-3 text-[10.5px] font-semibold tracking-[0.08em] text-slate-400 uppercase">{g}</p>
              <ul className="space-y-0.5">
                {items
                  .filter((i) => i.group === g)
                  .map((item) => (
                    <li key={item.key}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cx(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={cx('size-[18px]', isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600')} />
                            <span className="flex-1">{item.label}</span>
                            {!!badges[item.key] && (
                              <span className={cx('rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums', item.key === 'followups' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600')}>
                                {badges[item.key]}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        {user && (
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
              <Avatar name={user.name} color={user.avatarColor} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="truncate text-xs text-brand-700">{roleLabel(user)}</p>
              </div>
              <button onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600" aria-label="Log out" title="Log out">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
