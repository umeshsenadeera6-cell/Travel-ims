import type { TourPackage } from '@/types';
import { createRepository } from './storage';
import { uid } from '@/utils/id';

const repo = createRepository<TourPackage>('packages');

export const packageService = {
  list: repo.list,
  get: repo.get,
  create: (input: Omit<TourPackage, 'id'>) => repo.create({ ...input, id: uid('pkg') }),
  update: repo.update,
  remove: repo.remove,
};
