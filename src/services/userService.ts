import type { Department, User } from '@/types';
import { createRepository } from './storage';
import { uid } from '@/utils/id';

const repo = createRepository<User>('users');
const COLORS = ['#0b6b4f', '#2563eb', '#db2777', '#c8962e', '#7c3aed', '#0891b2', '#ea580c'];

export const userService = {
  list: repo.list,
  get: repo.get,
  /** Active sales executives, optionally limited to one department. */
  async listSalesExecutives(department?: Department) {
    return (await repo.list()).filter((u) => u.role === 'Sales Executive' && u.status === 'Active' && (!department || u.department === department || u.department === 'All'));
  },
  async create(input: Omit<User, 'id'>) {
    const users = await repo.list();
    if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) throw new Error('A user with this email already exists');
    return repo.create({ ...input, id: uid('u'), avatarColor: COLORS[users.length % COLORS.length] });
  },
  async update(id: string, patch: Partial<User>) {
    if (patch.email) {
      const users = await repo.list();
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === patch.email!.toLowerCase())) throw new Error('A user with this email already exists');
    }
    return repo.update(id, patch);
  },
  remove: repo.remove,
};
