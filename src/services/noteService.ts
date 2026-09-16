import type { Note, User } from '@/types';
import { createRepository } from './storage';
import { uid } from '@/utils/id';
import { activityService } from './activityService';

const repo = createRepository<Note>('notes');

export const noteService = {
  async listByInquiry(inquiryId: string) {
    return (await repo.list()).filter((n) => n.inquiryId === inquiryId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async listByCustomer(customerId: string) {
    return (await repo.list()).filter((n) => n.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async create(input: { inquiryId?: string; customerId?: string; text: string }, actor: User | null) {
    const note: Note = { id: uid('note'), ...input, authorId: actor?.id ?? null, authorName: actor?.name ?? 'System', createdAt: new Date().toISOString() };
    await repo.create(note);
    if (input.inquiryId) await activityService.log(input.inquiryId, 'note', 'Internal note added', actor);
    return note;
  },
  remove: repo.remove,
};
