import { useMemo, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Eye, Menu, Plus, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { BrandLockup } from '@/components/layout/Brand';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { ActionMenu, Button } from '@/components/ui';
import { todayISO } from '@/utils/date';
import { DEPT_META } from '@/utils/departments';

export function AppLayout() {
  const { user, can, readOnly, canWorkIn, scope } = useAuth();
  const [open, setOpen] = useState(false);
  const { data } = useWorkspaceData();
  const navigate = useNavigate();
  const location = useLocation();

  const badges = useMemo(() => {
    if (!data || !user) return {};
    const today = todayISO();
    return {
      inbound: data.inquiries.filter((i) => i.type === 'Inbound' && i.status === 'New').length,
      outbound: data.inquiries.filter((i) => i.type === 'Outbound' && i.status === 'New').length,
      mine: data.inquiries.filter((i) => i.assignedTo === user.id && !['Travel Completed', 'Lost', 'Cancelled'].includes(i.status)).length,
      followups: data.followups.filter((f) => f.status === 'Pending' && f.date <= today).length,
    };
  }, [data, user]);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-full">
      <Sidebar open={open} onClose={() => setOpen(false)} badges={badges} />
      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <BrandLockup />
          </div>
          <div className="hidden items-center gap-3 text-sm text-slate-500 lg:flex">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${DEPT_META[scope].chip}`}>
              <span className={`size-1.5 rounded-full ${DEPT_META[scope].dot}`} />
              {DEPT_META[scope].name}
            </span>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {readOnly && (
              <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                <Eye className="size-3.5" /> Read-only access
              </span>
            )}
            <Link to="/followups" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Due follow-ups">
              <Bell className="size-5" />
              {!!badges.followups && <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{badges.followups}</span>}
            </Link>
            {can('inquiry.create') && (
              <>
                <div className="hidden sm:flex sm:gap-2">
                  {canWorkIn('Outbound') && <Button size="sm" variant={canWorkIn('Inbound') ? 'secondary' : 'primary'} icon={canWorkIn('Inbound') ? <PlaneTakeoff className="size-4" /> : <Plus className="size-4" />} onClick={() => navigate('/inquiries/outbound/new')}>{canWorkIn('Inbound') ? 'Outbound' : 'Outbound Inquiry'}</Button>}
                  {canWorkIn('Inbound') && <Button size="sm" icon={<Plus className="size-4" />} onClick={() => navigate('/inquiries/inbound/new')}>Inbound Inquiry</Button>}
                </div>
                <div className="sm:hidden">
                  <ActionMenu
                    label="New inquiry"
                    items={[
                      { label: 'New Inbound Inquiry', icon: <PlaneLanding />, onClick: () => navigate('/inquiries/inbound/new'), hidden: !canWorkIn('Inbound') },
                      { label: 'New Outbound Inquiry', icon: <PlaneTakeoff />, onClick: () => navigate('/inquiries/outbound/new'), hidden: !canWorkIn('Outbound') },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
