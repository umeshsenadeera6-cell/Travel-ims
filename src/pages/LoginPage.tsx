import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, Lock, Mail, ShieldCheck, Briefcase, UserRound } from 'lucide-react';
import type { Role, User } from '@/types';
import { authService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Field } from '@/components/ui';
import { BrandLockup } from '@/components/layout/Brand';
import { cx } from '@/utils/format';
import { DEPT_META, roleLabel } from '@/utils/departments';

const ROLE_META: Record<Role, { icon: typeof ShieldCheck; desc: string }> = {
  'Super Admin': { icon: ShieldCheck, desc: 'Full access, users & settings' },
  Manager: { icon: Briefcase, desc: 'Department team, assignment & reports' },
  'Sales Executive': { icon: UserRound, desc: 'Own assigned inquiries' },
  Viewer: { icon: Eye, desc: 'Read-only access' },
};

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accounts, setAccounts] = useState<Array<{ group: string; users: User[] }>>([]);
  const [email, setEmail] = useState('admin@serendibtravel.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.demoAccounts().then(setAccounts);
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e?: FormEvent, override?: string) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(override ?? email);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <svg className="absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path d="M0 620 C120 560 180 640 300 600 S480 520 600 560 V800 H0Z" fill="#fff" />
          <path d="M0 690 C140 650 220 720 340 680 S500 620 600 650 V800 H0Z" fill="#fff" />
          <circle cx="470" cy="190" r="70" fill="none" stroke="#fff" strokeWidth="2" />
          <path d="M80 300 q60 -40 120 0 t120 0" stroke="#fff" strokeWidth="2" fill="none" />
        </svg>
        <BrandLockup light />
        <div className="relative max-w-md">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-200 uppercase">Inquiry Management System</p>
          <h1 className="mt-3 text-4xl leading-tight font-semibold text-white">Every traveller's journey starts with an inquiry.</h1>
          <p className="mt-4 text-brand-100/90">Capture inbound and outbound leads, follow up on time, send quotations and convert them into confirmed bookings — all in one place.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-white">
            {[['Inbound', 'Sri Lanka tours'], ['Outbound', 'Holidays abroad'], ['Head office', 'Both departments']].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-sm font-semibold">{a}</p>
                <p className="text-xs text-brand-100/80">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-brand-200/80">© {new Date().getFullYear()} Serendib Travel & Tours · Phase 1 prototype</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLockup />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Pick a demo account — each department has its own manager and sales team.</p>

          <div className="mt-6 space-y-4">
            {accounts.map((g) => (
              <div key={g.group}>
                <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <span className={cx('size-1.5 rounded-full', DEPT_META[g.users[0]?.department ?? 'All'].dot)} />
                  {g.group}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {g.users.map((a) => {
                    const M = ROLE_META[a.role];
                    const selected = email === a.email;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setEmail(a.email)}
                        onDoubleClick={() => submit(undefined, a.email)}
                        aria-pressed={selected}
                        className={cx('flex items-start gap-3 rounded-xl border p-3 text-left transition', selected ? 'border-brand-600 bg-brand-50 ring-3 ring-brand-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}
                      >
                        <span className={cx('flex size-8 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500')}>
                          <M.icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800">{roleLabel(a)}</span>
                          <span className="block truncate text-xs text-slate-500">{a.name}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email address">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" autoComplete="username" required />
              </div>
            </Field>
            <Field label="Password" hint="Demo mode — any password is accepted.">
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="current-password" />
              </div>
            </Field>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Sign in <ArrowRight className="size-4" />
            </Button>
          </form>
          <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Phase 1 prototype: authentication is simulated and all data is stored in this browser.
          </p>
        </div>
      </div>
    </div>
  );
}
