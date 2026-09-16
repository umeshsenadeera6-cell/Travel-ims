import type { Session, User } from '@/types';
import { createRepository, delay, readJSON, removeKey, writeJSON } from './storage';
import { DEMO_ACCOUNTS } from '@/data/mockData';

/**
 * Demo-only authentication. No passwords are verified.
 * Phase 2: POST /auth/login → JWT, GET /auth/me.
 */
const users = createRepository<User>('users');

export const authService = {
  async demoAccounts(): Promise<Array<{ group: string; users: User[] }>> {
    const all = await users.list();
    return DEMO_ACCOUNTS.map((g) => ({ group: g.group, users: g.ids.map((id) => all.find((u) => u.id === id)).filter(Boolean) as User[] }));
  },
  async login(email: string): Promise<User> {
    const all = await users.list();
    const user = all.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) throw new Error('No account found for this email. Use one of the demo accounts.');
    if (user.status !== 'Active') throw new Error('This account is inactive. Contact your administrator.');
    writeJSON<Session>('session', { userId: user.id, loggedInAt: new Date().toISOString() });
    await users.update(user.id, { lastLogin: new Date().toISOString() });
    return delay(user, 250);
  },
  async logout() {
    removeKey('session');
  },
  currentUser(): User | null {
    const session = readJSON<Session | null>('session', null);
    if (!session) return null;
    return users.snapshot().find((u) => u.id === session.userId) ?? null;
  },
};
