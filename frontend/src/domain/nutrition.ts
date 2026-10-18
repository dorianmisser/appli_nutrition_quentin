import type {
  AfterAdvice,
  AthleteProfile,
  BeforeAdvice,
  Energy,
  Intensity,
  Range,
  SessionInputs,
  SportFamily,
  Targets,
} from './types';

/**
 * Moteur de calcul des besoins nutritionnels autour d'une séance.
 *
 * Repères utilisés (à faire relire par un diététicien du sport avant mise en production) :
 * - Glucides pendant l'effort selon la durée : < 45 min aucun besoin, 45–75 min petites quantités
 *   ou rinçage de bouche, 1 h 15–2 h 30 : 30–60 g/h, au-delà : 60–90 g/h (90 g/h seulement avec
 *   un mélange glucose + fructose et un intestin entraîné).
 *   Sources : ACSM / Academy of Nutrition and Dietetics / Dietitians of Canada (2016) ; Jeukendrup (2014).
 * - Repas avant l'effort : 1–4 g/kg de glucides 1 à 4 h avant ; boire 5–7 ml/kg environ 4 h avant.
 * - Charge glucidique : 7–12 g/kg/j sur 24 h (épreuve de 60–90 min), 10–12 g/kg/j sur 36–48 h (> 90 min).
 * - Hydratation pendant l'effort : 400–800 ml/h, ajustés à la sudation et à la chaleur ;
 *   sodium 300–600 mg/h pour les efforts longs ou en cas de forte sudation (ACSM 2007).
 * - Caféine : 3 mg/kg (2 à 6 mg/kg), 60 min avant ou fractionnée en fin d'effort ; plafond 6 mg/kg.
 * - Récupération : 0,3 g/kg de protéines (20–40 g) dans les 2 h ; 1–1,2 g/kg/h de glucides
 *   pendant 4 h si la séance suivante a lieu dans les 24 h ; réhydratation à 150 % des pertes.
 * - Dépense de la séance par équivalents métaboliques (MET), métabolisme de base par Mifflin-St Jeor.
 */
export const ENGINE_VERSION = '2.0.0';

const INTENSITY_POSITION: Record<Intensity, number> = { low: 0, medium: 0.5, high: 1 };

/** Plafond de glucides par heure selon l'habitude de l'athlète à s'alimenter pendant l'effort. */
export const GUT_CAP_G_PER_HOUR = { novice: 60, regular: 75, trained: 90 } as const;

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const pick = (range: Range, intensity: Intensity) =>
  range.min + (range.max - range.min) * INTENSITY_POSITION[intensity];

/** Fourchette de glucides par heure recommandée pour un sport et une durée. */
export function carbRangeFor(sport: SportFamily, durationMin: number): Range {
  if (sport === 'strength') return durationMin < 60 ? { min: 0, max: 0 } : { min: 15, max: 30 };
  if (sport === 'precision') return durationMin < 90 ? { min: 0, max: 0 } : { min: 15, max: 30 };
  if (durationMin < 45) return { min: 0, max: 0 };
  if (durationMin < 75) return { min: 0, max: 30 };
  if (durationMin < 150) return { min: 30, max: 60 };
  return { min: 60, max: 90 };
}

export interface TargetResult {
  targets: Targets;
  warnings: string[];
}

export function computeTargets(profile: AthleteProfile, session: SessionInputs): TargetResult {
  const warnings: string[] = [];
  const hours = session.durationMin / 60;
  const weight = profile.weightKg;

  // Glucides
  const carbRange = carbRangeFor(session.sport, session.durationMin);
  let carbs = pick(carbRange, session.intensity);
  if (session.goal === 'balance' && !session.isRace) carbs = Math.max(carbRange.min, carbs - 15);
  if (session.durationMin >= 45 && session.durationMin < 75 && session.intensity === 'low') carbs = 0;
  const cap = GUT_CAP_G_PER_HOUR[profile.gutTraining];
  if (carbs > cap) {
    carbs = cap;
    warnings.push(
      `Votre habitude digestive limite l'apport à ${cap} g/h. Entraînez-vous à boire et manger pendant vos sorties longues pour monter progressivement.`,
    );
  }
  carbs = roundTo(carbs, 5);
  if (carbs > 60) {
    warnings.push(
      'Au-delà de 60 g/h, choisissez des produits qui associent glucose (ou maltodextrine) et fructose : un seul type de sucre ne passe pas au-delà de 60 g/h.',
    );
  }
  if (carbRange.max > 0 && carbRange.max <= 30 && carbs > 0 && session.durationMin < 75) {
    warnings.push('Sur ce format, un rinçage de bouche avec une boisson sucrée suffit souvent si vous digérez mal.');
  }

  // Hydratation
  const sweatBase = { light: 400, moderate: 550, heavy: 700 }[profile.sweatRate];
  const weatherShift = { cold: -50, mild: 0, hot: 150 }[session.weather];
  const intensityShift = { low: -50, medium: 0, high: 50 }[session.intensity];
  let fluid = profile.measuredSweatLossLh
    ? profile.measuredSweatLossLh * 1000 * 0.75 + weatherShift
    : sweatBase + weatherShift + intensityShift;
  fluid = roundTo(clamp(fluid, 300, 1000), 50);
  if (session.durationMin < 45) fluid = roundTo(Math.min(fluid, 400), 50);

  // Sodium
  const needsSodium =
    session.durationMin >= 90 || session.weather === 'hot' || profile.sweatRate === 'heavy';
  let sodium = 0;
  if (needsSodium) {
    sodium = { light: 300, moderate: 450, heavy: 600 }[profile.sweatRate];
    if (session.weather === 'hot') sodium += 100;
    sodium = clamp(sodium, 300, 800);
  }
  if (fluid >= 800 && session.durationMin >= 240) {
    warnings.push(
      'Sur un effort de plus de 4 h, ne buvez pas au-delà de votre soif et gardez vos apports en sodium : boire trop d\'eau seule expose à l\'hyponatrémie.',
    );
  }

  // Caféine
  const caffeineLimit = Math.min(roundTo(weight * 6, 5), 400);
  let caffeine = 0;
  const caffeineUseful =
    session.durationMin >= 30 && session.intensity !== 'low' && (session.isRace || session.goal === 'perform');
  if (profile.caffeine !== 'none' && caffeineUseful) {
    const perKg = profile.caffeine === 'low' || session.sport === 'precision' ? 2 : 3;
    caffeine = Math.min(roundTo(weight * perKg, 5), caffeineLimit);
  }

  return {
    targets: {
      carbsPerHourG: carbs,
      carbsPerHourRange: carbRange,
      fluidPerHourMl: fluid,
      sodiumPerHourMg: sodium,
      caffeineTotalMg: caffeine,
      caffeineLimitMg: caffeineLimit,
      totalCarbsG: Math.round(carbs * hours),
      totalFluidMl: roundTo(fluid * hours, 50),
      totalSodiumMg: roundTo(sodium * hours, 10),
    },
    warnings,
  };
}

/** Part de la caféine prise avant le départ (le reste est réparti sur le dernier tiers). */
export function preEffortCaffeine(targets: Targets, durationMin: number): number {
  if (targets.caffeineTotalMg === 0) return 0;
  return durationMin <= 120 ? targets.caffeineTotalMg : roundTo(targets.caffeineTotalMg / 2, 5);
}

export function computeBefore(profile: AthleteProfile, session: SessionInputs, targets: Targets): BeforeAdvice {
  const weight = profile.weightKg;
  const long = session.durationMin >= 90;
  let gPerKg = long ? (session.isRace || session.intensity === 'high' ? 3 : 2) : 1;
  if (session.sport === 'strength') gPerKg = 1.5;
  if (session.sport === 'precision') gPerKg = 1;

  const advice: BeforeAdvice = {
    mealHoursBefore: long ? 3 : 2,
    mealCarbsG: roundTo(weight * gPerKg, 5),
    snackCarbsG: session.durationMin >= 60 && session.intensity !== 'low' ? 25 : 0,
    fluidMl: roundTo(weight * 6, 50),
    caffeineMg: preEffortCaffeine(targets, session.durationMin),
  };

  if (session.isRace && (session.sport === 'endurance' || session.sport === 'team')) {
    if (session.durationMin >= 90) {
      advice.carbLoadingGPerKgPerDay = { min: 10, max: 12 };
      advice.carbLoadingHours = 48;
    } else if (session.durationMin >= 60) {
      advice.carbLoadingGPerKgPerDay = { min: 7, max: 12 };
      advice.carbLoadingHours = 24;
    }
  }
  return advice;
}

/** Perte sudorale estimée, en litres par heure. */
export function estimatedSweatLossLh(profile: AthleteProfile, session: SessionInputs): number {
  if (profile.measuredSweatLossLh) return profile.measuredSweatLossLh;
  const base = { light: 0.5, moderate: 0.9, heavy: 1.3 }[profile.sweatRate];
  const weather = { cold: -0.2, mild: 0, hot: 0.3 }[session.weather];
  const intensity = { low: -0.2, medium: 0, high: 0.2 }[session.intensity];
  return Math.max(0.3, base + weather + intensity);
}

export function computeAfter(profile: AthleteProfile, session: SessionInputs, targets: Targets): AfterAdvice {
  const weight = profile.weightKg;
  const hours = session.durationMin / 60;
  const fast = session.nextSessionWithin24h || session.goal === 'recover';
  const proteinPerKg = session.goal === 'recover' || session.sport === 'strength' ? 0.4 : 0.3;
  const netLossL = Math.max(0, (estimatedSweatLossLh(profile, session) - targets.fluidPerHourMl / 1000) * hours);

  let carbsPerKg = session.durationMin >= 90 ? 1 : 0.5;
  if (fast) carbsPerKg = 1.2;

  return {
    windowMin: fast ? 60 : 120,
    proteinG: clamp(Math.round(weight * proteinPerKg), 20, 45),
    carbsG: roundTo(weight * carbsPerKg, 5),
    carbsPerHourForFourHours: fast && session.durationMin >= 60 ? roundTo(weight * 1, 5) : undefined,
    fluidMl: Math.max(500, roundTo(netLossL * 1.5 * 1000, 50)),
  };
}

const MET: Record<SportFamily, Record<Intensity, number>> = {
  endurance: { low: 6, medium: 9, high: 12 },
  team: { low: 5.5, medium: 8, high: 10 },
  strength: { low: 3.5, medium: 5, high: 6 },
  precision: { low: 3, medium: 4, high: 5 },
};

export function computeEnergy(profile: AthleteProfile, session: SessionInputs): Energy {
  const hours = session.durationMin / 60;
  const sessionKcal = roundTo(MET[session.sport][session.intensity] * profile.weightKg * hours, 10);

  let dailyKcal: number | undefined;
  if (profile.heightCm && profile.age) {
    const sexOffset = profile.sex === 'male' ? 5 : profile.sex === 'female' ? -161 : -78;
    const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset;
    dailyKcal = roundTo(bmr * 1.4 + sessionKcal, 50);
  }

  const load = profile.weeklyTrainingHours;
  let dailyCarbs: Range;
  if (load !== undefined) {
    dailyCarbs = load < 5 ? { min: 3, max: 5 } : load < 10 ? { min: 5, max: 7 } : load < 15 ? { min: 6, max: 10 } : { min: 8, max: 12 };
  } else {
    const d = session.durationMin;
    dailyCarbs = d < 60 ? { min: 3, max: 5 } : d < 120 ? { min: 5, max: 7 } : d < 180 ? { min: 6, max: 10 } : { min: 8, max: 12 };
  }

  const dailyProtein: Record<SportFamily, Range> = {
    endurance: { min: 1.2, max: 1.6 },
    team: { min: 1.4, max: 1.8 },
    strength: { min: 1.6, max: 2.2 },
    precision: { min: 1.2, max: 1.6 },
  };

  return { sessionKcal, dailyKcal, dailyCarbsGPerKg: dailyCarbs, dailyProteinGPerKg: dailyProtein[session.sport] };
}
