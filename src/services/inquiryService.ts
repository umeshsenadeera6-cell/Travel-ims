import type { FollowUp, Inquiry, InquiryStatus, InquiryType, User } from '@/types';
import { createRepository } from './storage';
import { nextSequentialId } from '@/utils/id';
import { activityService } from './activityService';
import { customerService } from './customerService';

const repo = createRepository<Inquiry>('inquiries');
const followups = createRepository<FollowUp>('followups');
const users = createRepository<User>('users');

export type InquiryInput = Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt' | 'customerId' | 'nextFollowUp'>;

function withNextFollowUp(list: Inquiry[]): Inquiry[] {
  const pending = followups.snapshot().filter((f) => f.status === 'Pending');
  const byInquiry = new Map<string, string>();
  pending.forEach((f) => {
    const cur = byInquiry.get(f.inquiryId);
    if (!cur || f.date < cur) byInquiry.set(f.inquiryId, f.date);
  });
  return list.map((i) => ({ ...i, nextFollowUp: byInquiry.get(i.id) ?? null }));
}

const userName = (id: string | null) => users.snapshot().find((u) => u.id === id)?.name ?? 'Unassigned';

export const inquiryService = {
  async list(type?: InquiryType): Promise<Inquiry[]> {
    const all = withNextFollowUp(await repo.list());
    return (type ? all.filter((i) => i.type === type) : all).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<Inquiry | undefined> {
    const inq = await repo.get(id);
    return inq ? withNextFollowUp([inq])[0] : undefined;
  },

  previewNextId(type: InquiryType): string {
    return nextSequentialId(type === 'Inbound' ? 'INB' : 'OUT', repo.snapshot().map((i) => i.id));
  },

  async create(input: InquiryInput, actor: User | null): Promise<Inquiry> {
    const customer = await customerService.upsertFromInquiry({
      name: input.customerName, email: input.email, phone: input.phone, whatsapp: input.whatsapp,
      country: input.inbound?.country ?? 'Sri Lanka', nationality: input.inbound?.nationality ?? 'Sri Lankan',
      segment: input.type, nicPassport: input.outbound?.nicPassport,
    });
    const now = new Date().toISOString();
    const id = inquiryService.previewNextId(input.type);
    const inquiry: Inquiry = { ...input, id, customerId: customer.id, createdAt: now, updatedAt: now };
    await repo.create(inquiry);
    await activityService.log(id, 'created', `Inquiry created via ${input.source}`, actor);
    if (input.assignedTo) await activityService.log(id, 'assigned', `Assigned to ${userName(input.assignedTo)}`, actor);
    return inquiry;
  },

  async update(id: string, patch: Partial<InquiryInput>, actor: User | null): Promise<Inquiry> {
    const before = await repo.get(id);
    if (!before) throw new Error('Inquiry not found');
    const updated = await repo.update(id, { ...patch, updatedAt: new Date().toISOString() });
    if (patch.customerName || patch.email || patch.phone) {
      await customerService.update(before.customerId, {
        name: updated.customerName, email: updated.email, phone: updated.phone, whatsapp: updated.whatsapp,
      });
    }
    await activityService.log(id, 'updated', 'Inquiry details updated', actor);
    if (patch.status && patch.status !== before.status) await activityService.log(id, 'status', `Status changed from ${before.status} to ${patch.status}`, actor);
    if (patch.assignedTo !== undefined && patch.assignedTo !== before.assignedTo) await activityService.log(id, 'assigned', `Assigned to ${userName(patch.assignedTo)}`, actor);
    return updated;
  },

  async changeStatus(id: string, status: InquiryStatus, actor: User | null, reason?: string) {
    const before = await repo.get(id);
    if (!before || before.status === status) return before;
    const updated = await repo.update(id, { status, updatedAt: new Date().toISOString() });
    await activityService.log(id, 'status', `Status changed from ${before.status} to ${status}${reason ? ` — ${reason}` : ''}`, actor);
    return updated;
  },

  async assign(id: string, userId: string | null, actor: User | null) {
    const updated = await repo.update(id, { assignedTo: userId, updatedAt: new Date().toISOString() });
    await activityService.log(id, 'assigned', userId ? `Assigned to ${userName(userId)}` : 'Unassigned', actor);
    return updated;
  },

  async remove(id: string) {
    return repo.remove(id);
  },
};
