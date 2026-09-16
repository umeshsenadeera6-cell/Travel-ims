import type { Activity, ActivityKind, User } from '@/types';
import { createRepository } from './storage';
import { uid } from '@/utils/id';

const repo = createRepository<Activity>('activities');

export const activityService = {
  async listByInquiry(inquiryId: string): Promise<Activity[]> {
    const all = await repo.list();
    return all.filter((a) => a.inquiryId === inquiryId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async recent(limit = 8): Promise<Activity[]> {
    const all = await repo.list();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },
  log(inquiryId: string, kind: ActivityKind, message: string, actor?: User | null) {
    return repo.create({ id: uid('act'), inquiryId, kind, message, actorName: actor?.name ?? 'System', createdAt: new Date().toISOString() });
  },
};
