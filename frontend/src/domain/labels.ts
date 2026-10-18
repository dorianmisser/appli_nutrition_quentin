import type { CaffeinePreference, Goal, GutTraining, Intensity, ProductType, Sex, SportFamily, SweatRate, Taste, Weather } from './types';

export const sportLabels: Record<SportFamily, string> = { endurance: 'Endurance', team: 'Sport collectif', strength: 'Force', precision: 'Précision' };
export const sportExamples: Record<SportFamily, string> = {
  endurance: 'Course, vélo, triathlon, trail',
  team: 'Football, rugby, handball, hockey',
  strength: 'Musculation, CrossFit, haltérophilie',
  precision: 'Tennis, escalade, golf, tir',
};
export const intensityLabels: Record<Intensity, string> = { low: 'Modérée', medium: 'Soutenue', high: 'Très intense' };
export const goalLabels: Record<Goal, string> = { perform: 'Performance', recover: 'Récupération', balance: 'Équilibre' };
export const weatherLabels: Record<Weather, string> = { cold: 'Froid', mild: 'Tempéré', hot: 'Chaud' };
export const weatherHints: Record<Weather, string> = { cold: 'sous 10 °C', mild: '10 à 25 °C', hot: 'plus de 25 °C' };
export const sexLabels: Record<Sex, string> = { female: 'Femme', male: 'Homme', other: 'Autre' };
export const sweatLabels: Record<SweatRate, string> = { light: 'Je transpire peu', moderate: 'Normalement', heavy: 'Beaucoup, traces de sel' };
export const gutLabels: Record<GutTraining, string> = {
  novice: 'Je mange rarement en courant',
  regular: 'Je m\'alimente souvent',
  trained: 'Habitué à 80–90 g/h',
};
export const caffeineLabels: Record<CaffeinePreference, string> = { none: 'Sans caféine', low: 'Dose légère', normal: 'Dose classique' };
export const tasteLabels: Record<Taste, string> = { sweet: 'Sucré', salty: 'Salé', neutral: 'Neutre' };
export const productTypeLabels: Record<ProductType, string> = {
  gel: 'Gel', bar: 'Barre', chew: 'Gommes', drink: 'Boisson', food: 'Aliment', electrolyte: 'Électrolytes', recovery: 'Récupération',
};

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
export const fmt = (value: number) => nf.format(value);

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** Repère horaire d'une prise : « 0:40 », « 1:20 ». */
export function formatClock(minutes: number): string {
  const sign = minutes < 0 ? '−' : '';
  const abs = Math.abs(minutes);
  return `${sign}${Math.floor(abs / 60)}:${String(Math.round(abs % 60)).padStart(2, '0')}`;
}

export function formatChrono(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}
