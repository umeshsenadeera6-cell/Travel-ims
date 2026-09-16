import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppLayout } from '@/layouts/AppLayout';
import type { NavKey } from '@/utils/permissions';
import type { Permission } from '@/utils/permissions';
import type { Department } from '@/types';
import LoginPage from '@/pages/LoginPage';
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const InquiriesPage = lazy(() => import('@/pages/InquiriesPage'));
const InquiryFormPage = lazy(() => import('@/pages/InquiryFormPage'));
const InquiryDetailPage = lazy(() => import('@/pages/InquiryDetailPage'));
const FollowUpsPage = lazy(() => import('@/pages/FollowUpsPage'));
const QuotationsPage = lazy(() => import('@/pages/QuotationsPage'));
const BookingsPage = lazy(() => import('@/pages/BookingsPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage'));
const PackagesPage = lazy(() => import('@/pages/PackagesPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
import { AccessDenied, NotFound } from '@/pages/SystemPages';
import { Spinner } from '@/components/ui';

function Guard({ nav, perm, dept, children }: { nav?: NavKey; perm?: Permission; dept?: Department; children: ReactNode }) {
  const { canNav, can, canWorkIn } = useAuth();
  if ((nav && !canNav(nav)) || (perm && !can(perm)) || (dept && !canWorkIn(dept))) return <AccessDenied />;
  return <>{children}</>;
}

/** Sales executives have no department-wide list — send them to their own inquiries. */
function OwnInquiriesRedirect({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'Sales Executive') return <Navigate to="/inquiries/mine" replace />;
  return <>{children}</>;
}

/**
 * HashRouter keeps the prototype deployable on any static host.
 * Switch to BrowserRouter once served behind a real web server (Phase 2).
 */
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inquiries/inbound" element={<OwnInquiriesRedirect><Guard nav="inbound"><InquiriesPage scope="Inbound" /></Guard></OwnInquiriesRedirect>} />
              <Route path="/inquiries/outbound" element={<OwnInquiriesRedirect><Guard nav="outbound"><InquiriesPage scope="Outbound" /></Guard></OwnInquiriesRedirect>} />
              <Route path="/inquiries/mine" element={<Guard nav="mine"><InquiriesPage scope="Mine" /></Guard>} />
              <Route path="/inquiries/inbound/new" element={<Guard perm="inquiry.create" dept="Inbound"><InquiryFormPage type="Inbound" /></Guard>} />
              <Route path="/inquiries/outbound/new" element={<Guard perm="inquiry.create" dept="Outbound"><InquiryFormPage type="Outbound" /></Guard>} />
              <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
              <Route path="/inquiries/:id/edit" element={<Guard perm="inquiry.edit"><InquiryFormPage /></Guard>} />
              <Route path="/followups" element={<Guard nav="followups"><FollowUpsPage /></Guard>} />
              <Route path="/quotations" element={<Guard nav="quotations"><QuotationsPage /></Guard>} />
              <Route path="/bookings" element={<Guard nav="bookings"><BookingsPage /></Guard>} />
              <Route path="/customers" element={<Guard nav="customers"><CustomersPage /></Guard>} />
              <Route path="/customers/:id" element={<Guard nav="customers"><CustomerDetailPage /></Guard>} />
              <Route path="/packages" element={<Guard nav="packages"><PackagesPage /></Guard>} />
              <Route path="/reports" element={<Guard nav="reports"><ReportsPage /></Guard>} />
              <Route path="/users" element={<Guard nav="users"><UsersPage /></Guard>} />
              <Route path="/settings" element={<Guard nav="settings"><SettingsPage /></Guard>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
