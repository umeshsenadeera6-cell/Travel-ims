import type { AppSettings, DepartmentScope } from '@/types';
import { dataEvents, delay, readJSON, writeJSON } from './storage';
import { defaultSettings } from '@/data/mockData';

export interface UiPreferences {
  sidebarCollapsed: boolean;
  density: 'comfortable' | 'compact';
  lastPackagesTab: 'Inbound' | 'Outbound';
  departmentScope: DepartmentScope;
}
const defaultPrefs: UiPreferences = { sidebarCollapsed: false, density: 'comfortable', lastPackagesTab: 'Inbound', departmentScope: 'All' };

export const settingsService = {
  async get(): Promise<AppSettings> {
    return delay({ ...defaultSettings, ...readJSON<Partial<AppSettings>>('settings', {}) });
  },
  getSync(): AppSettings {
    return { ...defaultSettings, ...readJSON<Partial<AppSettings>>('settings', {}) };
  },
  async update(patch: Partial<AppSettings>) {
    const next = { ...settingsService.getSync(), ...patch };
    writeJSON('settings', next);
    dataEvents.emit('settings');
    return delay(next);
  },
  getPrefs(): UiPreferences {
    return { ...defaultPrefs, ...readJSON<Partial<UiPreferences>>('prefs', {}) };
  },
  setPrefs(patch: Partial<UiPreferences>) {
    writeJSON('prefs', { ...settingsService.getPrefs(), ...patch });
  },
};
