import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../data/catalogue';
import { liveGauges, paceLevel, planCoverage } from './gauges';
import { carbRangeFor, computeAfter, computeBefore, computeEnergy, computeTargets } from './nutrition';
import { buildPlan, intakeMinutes } from './schedule';
import type { AthleteProfile, SessionInputs } from './types';

const profile: AthleteProfile = {
  firstName: 'Camille',
  weightKg: 70,
  heightCm: 175,
  age: 32,
  sex: 'female',
  sweatRate: 'moderate',
  gutTraining: 'regular',
  caffeine: 'normal',
  tastes: ['sweet'],
  favoriteProductIds: [],
  updatedAt: '',
};

const session: SessionInputs = {
  name: 'Triathlon M',
  sport: 'endurance',
  durationMin: 160,
  intensity: 'high',
  goal: 'perform',
  weather: 'mild',
  isRace: true,
  nextSessionWithin24h: false,
  intakeIntervalMin: 20,
};

const pantry = CATALOGUE.filter((p) => ['cat-boisson-effort', 'cat-gel', 'cat-gel-cafe', 'cat-barre'].includes(p.id));

describe('fourchettes de glucides', () => {
  it('suit les paliers de durée en endurance', () => {
    expect(carbRangeFor('endurance', 30)).toEqual({ min: 0, max: 0 });
    expect(carbRangeFor('endurance', 60)).toEqual({ min: 0, max: 30 });
    expect(carbRangeFor('endurance', 120)).toEqual({ min: 30, max: 60 });
    expect(carbRangeFor('endurance', 200)).toEqual({ min: 60, max: 90 });
  });
  it('ne demande rien en force sous 1 h', () => {
    expect(carbRangeFor('strength', 50).max).toBe(0);
  });
});

describe('cibles', () => {
  it('plafonne les glucides selon l\'habitude digestive', () => {
    const { targets, warnings } = computeTargets(profile, session);
    expect(targets.carbsPerHourG).toBe(75);
    expect(warnings.some((w) => w.includes('75 g/h'))).toBe(true);
    const novice = computeTargets({ ...profile, gutTraining: 'novice' }, session).targets;
    expect(novice.carbsPerHourG).toBe(60);
  });
  it('reste dans 300–1000 ml/h et ajoute du sodium sur effort long', () => {
    const { targets } = computeTargets({ ...profile, sweatRate: 'heavy' }, { ...session, weather: 'hot' });
    expect(targets.fluidPerHourMl).toBeLessThanOrEqual(1000);
    expect(targets.fluidPerHourMl).toBeGreaterThanOrEqual(300);
    expect(targets.sodiumPerHourMg).toBe(700);
  });
  it('ne prévoit pas de caféine sans préférence ou en séance facile', () => {
    expect(computeTargets({ ...profile, caffeine: 'none' }, session).targets.caffeineTotalMg).toBe(0);
    expect(computeTargets(profile, { ...session, intensity: 'low' }).targets.caffeineTotalMg).toBe(0);
  });
  it('dose la caféine à 3 mg/kg sous le plafond de 6 mg/kg', () => {
    const { targets } = computeTargets(profile, session);
    expect(targets.caffeineTotalMg).toBe(210);
    expect(targets.caffeineLimitMg).toBe(400);
  });
});

describe('avant et après', () => {
  it('prévoit un repas à 3 g/kg et une charge glucidique en compétition longue', () => {
    const { targets } = computeTargets(profile, session);
    const before = computeBefore(profile, session, targets);
    expect(before.mealCarbsG).toBe(210);
    expect(before.carbLoadingGPerKgPerDay).toEqual({ min: 10, max: 12 });
    expect(before.caffeineMg).toBe(105);
  });
  it('accélère la récupération si la séance suivante est proche', () => {
    const next = { ...session, nextSessionWithin24h: true };
    const { targets } = computeTargets(profile, next);
    const after = computeAfter(profile, next, targets);
    expect(after.windowMin).toBe(60);
    expect(after.carbsG).toBe(85);
    expect(after.carbsPerHourForFourHours).toBe(70);
    expect(after.proteinG).toBe(21);
  });
  it('calcule la dépense journalière quand taille et âge sont connus', () => {
    const energy = computeEnergy(profile, session);
    expect(energy.sessionKcal).toBe(2240);
    expect(energy.dailyKcal).toBeGreaterThan(energy.sessionKcal);
    expect(computeEnergy({ ...profile, age: undefined }, session).dailyKcal).toBeUndefined();
  });
});

describe('plan de ravitaillement', () => {
  it('place les prises toutes les 20 min jusqu\'à 10 min de la fin', () => {
    expect(intakeMinutes(160, 20)).toEqual([20, 40, 60, 80, 100, 120, 140]);
    expect(intakeMinutes(30, 20)).toEqual([20]);
  });
  it('couvre la cible glucidique à ±15 % avec les favoris', () => {
    const plan = buildPlan(profile, session, pantry);
    const carbs = plan.intakes.reduce((s, i) => s + i.carbsG, 0);
    expect(carbs).toBeGreaterThan(plan.targets.totalCarbsG * 0.85);
    expect(carbs).toBeLessThan(plan.targets.totalCarbsG * 1.15);
  });
  it('réserve la caféine au dernier tiers', () => {
    const plan = buildPlan(profile, session, pantry);
    const caffeinated = plan.intakes.filter((i) => i.caffeineMg > 0);
    expect(caffeinated.length).toBeGreaterThan(0);
    caffeinated.forEach((i) => expect(i.minute / session.durationMin).toBeGreaterThanOrEqual(2 / 3));
  });
  it('se replie sur le catalogue sans favoris', () => {
    const plan = buildPlan(profile, session, []);
    expect(plan.intakes.some((i) => i.carbsG > 0)).toBe(true);
    expect(plan.warnings.some((w) => w.includes('génériques'))).toBe(true);
  });
  it('ne planifie rien pour une séance très courte', () => {
    const plan = buildPlan(profile, { ...session, durationMin: 15 }, pantry);
    expect(plan.intakes).toHaveLength(0);
  });
});

describe('jauges', () => {
  it('passe du vert au rouge selon l\'écart', () => {
    expect(paceLevel(100, 100)).toBe('ok');
    expect(paceLevel(80, 100)).toBe('watch');
    expect(paceLevel(50, 100)).toBe('alert');
  });
  it('compare les prises au prévu à l\'instant t', () => {
    const plan = buildPlan(profile, session, pantry);
    const firstSlot = plan.intakes.filter((i) => i.minute === 20);
    const log = firstSlot.map((i) => ({ intakeId: i.id, takenAt: '', status: 'taken' as const }));
    const gauges = liveGauges(plan, log, 25);
    expect(gauges.find((g) => g.key === 'carbs')?.level).toBe('ok');
    expect(liveGauges(plan, [], 45).find((g) => g.key === 'carbs')?.level).toBe('alert');
  });
  it('résume la couverture du plan', () => {
    const plan = buildPlan(profile, session, pantry);
    expect(planCoverage(plan).find((g) => g.key === 'carbs')?.level).not.toBe('alert');
  });
});
