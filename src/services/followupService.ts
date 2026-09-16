import type { FollowUp, User } from '@/types';
import { createRepository } from './storage';
import { uid } from '@/utils/id';
import { activityService } from './activityService';
import { formatDate, formatTime } from '@/utils/date';

const repo = createRepository<FollowUp>('followups');

export type FollowUpInput = Omit<FollowUp, 'id' | 'createdAt' | 'status' | 'completedAt' | 'outcome'>;

export const followupService = {
  async list() {
    return (await repo.list()).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  },
  async listByInquiry(inquiryId: string) {
    return (await repo.list()).filter((f) => f.inquiryId === inquiryId).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  },
  snapshot: repo.snapshot,
  async create(input: FollowUpInput, actor: User | null) {
    const fu = await repo.create({ ...input, id: uid('fu'), status: 'Pending', createdAt: new Date().toISOString() });
    await activityService.log(input.inquiryId, 'followup', `${input.type} follow-up scheduled for ${formatDate(input.date)} ${formatTime(input.time)}`, actor);
    return fu;
  },
  async update(id: string, patch: Partial<FollowUp>, actor: User | null) {
    const fu = await repo.update(id, patch);
    await activityService.log(fu.inquiryId, 'followup', 'Follow-up updated', actor);
    return fu;
  },
  async complete(id: string, outcome: string, actor: User | null) {
    const fu = await repo.update(id, { status: 'Completed', outcome, completedAt: new Date().toISOString() });
    await activityService.log(fu.inquiryId, 'followup', `${fu.type} follow-up completed${outcome ? ` — ${outcome}` : ''}`, actor);
    return fu;
  },
  async reschedule(id: string, date: string, time: string, actor: User | null) {
    const fu = await repo.update(id, { date, time, status: 'Pending' });
    await activityService.log(fu.inquiryId, 'followup', `Follow-up rescheduled to ${formatDate(date)} ${formatTime(time)}`, actor);
    return fu;
  },
  remove: repo.remove,
};
