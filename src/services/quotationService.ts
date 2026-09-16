import type { Quotation, QuotationStatus, User } from '@/types';
import { createRepository } from './storage';
import { nextSequentialId } from '@/utils/id';
import { activityService } from './activityService';
import { inquiryService } from './inquiryService';

const repo = createRepository<Quotation>('quotations');

export type QuotationInput = Omit<Quotation, 'id' | 'subtotal' | 'total'>;

const totals = (q: Pick<Quotation, 'services' | 'discount'>) => {
  const subtotal = q.services.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  return { subtotal, total: Math.max(0, subtotal - (Number(q.discount) || 0)) };
};

export const quotationService = {
  calcTotals: totals,
  async list() {
    return (await repo.list()).sort((a, b) => b.id.localeCompare(a.id));
  },
  get: repo.get,
  async listByInquiry(inquiryId: string) {
    return (await repo.list()).filter((q) => q.inquiryId === inquiryId).sort((a, b) => b.id.localeCompare(a.id));
  },
  previewNextId() {
    return nextSequentialId('QT', repo.snapshot().map((q) => q.id), 4);
  },
  async create(input: QuotationInput, actor: User | null) {
    const q: Quotation = { ...input, ...totals(input), id: quotationService.previewNextId() };
    await repo.create(q);
    await activityService.log(q.inquiryId, 'quotation', `Quotation ${q.id} created (${q.status}) — ${q.currency} ${q.total.toLocaleString()}`, actor);
    if (q.status === 'Sent') await inquiryService.changeStatus(q.inquiryId, 'Quotation Sent', actor);
    else await inquiryService.changeStatus(q.inquiryId, 'Quotation Preparing', actor);
    return q;
  },
  async update(id: string, input: Partial<QuotationInput>, actor: User | null) {
    const current = await repo.get(id);
    if (!current) throw new Error('Quotation not found');
    const merged = { ...current, ...input };
    const q = await repo.update(id, { ...input, ...totals(merged) });
    await activityService.log(q.inquiryId, 'quotation', `Quotation ${q.id} updated`, actor);
    return q;
  },
  async setStatus(id: string, status: QuotationStatus, actor: User | null) {
    const q = await repo.update(id, { status });
    await activityService.log(q.inquiryId, 'quotation', `Quotation ${q.id} marked as ${status}`, actor);
    if (status === 'Sent') await inquiryService.changeStatus(q.inquiryId, 'Quotation Sent', actor);
    if (status === 'Accepted') await inquiryService.changeStatus(q.inquiryId, 'Negotiation', actor);
    return q;
  },
  remove: repo.remove,
};
