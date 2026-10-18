import type { AthleteProfile, EffortSession, FuelPlan } from '../domain/types';

/**
 * Persistance côté navigateur. Les pages n'appellent que ces fonctions :
 * le jour où l'API expose profils et plans (MongoDB), seul ce fichier change.
 */
const PREFIX = 'chtri:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'application reste utilisable sans sauvegarde.
  }
  window.dispatchEvent(new CustomEvent('chtri:storage', { detail: key }));
}

export const profileStore = {
  get: () => read<AthleteProfile | null>('profile', null),
  save: (profile: AthleteProfile) => write('profile', { ...profile, updatedAt: new Date().toISOString() }),
};

export const planStore = {
  list: () => read<FuelPlan[]>('plans', []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  get: (id: string) => read<FuelPlan[]>('plans', []).find((p) => p.id === id) ?? null,
  save: (plan: FuelPlan) => write('plans', [plan, ...read<FuelPlan[]>('plans', []).filter((p) => p.id !== plan.id)]),
  remove: (id: string) => {
    write('plans', read<FuelPlan[]>('plans', []).filter((p) => p.id !== id));
    write('efforts', read<EffortSession[]>('efforts', []).filter((e) => e.planId !== id));
  },
};

export const effortStore = {
  list: () => read<EffortSession[]>('efforts', []).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
  get: (id: string) => read<EffortSession[]>('efforts', []).find((e) => e.id === id) ?? null,
  active: () => read<EffortSession[]>('efforts', []).find((e) => !e.endedAt) ?? null,
  save: (session: EffortSession) =>
    write('efforts', [session, ...read<EffortSession[]>('efforts', []).filter((e) => e.id !== session.id)]),
};
