import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Department, DepartmentScope, User } from '@/types';
import { authService, settingsService } from '@/services';
import { can as canFn, canAccessDepartment, canNavigate, effectiveScope, isReadOnly, type NavKey, type Permission } from '@/utils/permissions';

interface AuthCtx {
  user: User | null;
  login: (email: string) => Promise<User>;
  logout: () => void;
  can: (p: Permission) => boolean;
  canNav: (k: NavKey) => boolean;
  readOnly: boolean;
  /** Department currently in view: the user's own, or the switcher choice for head-office users. */
  scope: DepartmentScope;
  setScope: (s: DepartmentScope) => void;
  canSwitchDepartment: boolean;
  canWorkIn: (d: Department) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.currentUser());
  const [selected, setSelected] = useState<DepartmentScope>(() => settingsService.getPrefs().departmentScope);

  const login = useCallback(async (email: string) => {
    const u = await authService.login(email);
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);
  const setScope = useCallback((s: DepartmentScope) => {
    setSelected(s);
    settingsService.setPrefs({ departmentScope: s });
  }, []);

  const value = useMemo<AuthCtx>(() => {
    const scope = effectiveScope(user, selected);
    return {
      user, login, logout, setScope, scope,
      can: (p) => canFn(user, p),
      canNav: (k) => canNavigate(user, k, selected),
      readOnly: isReadOnly(user),
      canSwitchDepartment: user?.department === 'All',
      canWorkIn: (d) => canAccessDepartment(user, d) && (scope === 'All' || scope === d),
    };
  }, [user, login, logout, selected, setScope]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
