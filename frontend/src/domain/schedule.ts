import { CATALOGUE, WATER_ID } from '../data/catalogue';
import {
  computeAfter,
  computeBefore,
  computeEnergy,
  computeTargets,
  ENGINE_VERSION,
  preEffortCaffeine,
} from './nutrition';
import type { AthleteProfile, FuelPlan, Intake, Product, ProductType, SessionInputs, Targets } from './types';

const SOLID_TYPES: ProductType[] = ['gel', 'bar', 'chew', 'food'];
const byId = (id: string) => CATALOGUE.find((p) => p.id === id);

export interface ScheduleResult {
  intakes: Intake[];
  achieved: { carbsG: number; fluidMl: number; sodiumMg: number; caffeineMg: number };
  warnings: string[];
}

/** Minutes de prise : une toutes les `interval` minutes, la dernière au moins 10 min avant la fin. */
export function intakeMinutes(durationMin: number, interval: number): number[] {
  const minutes: number[] = [];
  for (let m = interval; m <= durationMin - 10; m += interval) minutes.push(m);
  return minutes;
}

function chooseDrink(pantry: Product[], targets: Targets): Product {
  const water = pantry.find((p) => p.id === WATER_ID) ?? byId(WATER_ID)!;
  const drinks = pantry.filter((p) => p.type === 'drink' && p.fluidMl > 0 && p.id !== WATER_ID);
  if (targets.carbsPerHourG === 0 && targets.sodiumPerHourMg === 0) return water;
  // On garde la boisson qui couvre le plus de glucides sans dépasser la cible horaire.
  const scored = drinks
    .map((drink) => ({ drink, carbsPerHour: (drink.carbsG / drink.fluidMl) * targets.fluidPerHourMl }))
    .filter((d) => d.carbsPerHour <= targets.carbsPerHourG * 1.1 || targets.carbsPerHourG === 0)
    .sort((a, b) => b.carbsPerHour - a.carbsPerHour || b.drink.sodiumMg - a.drink.sodiumMg);
  return scored[0]?.drink ?? water;
}

function tasteScore(product: Product, profile: AthleteProfile): number {
  return product.tastes.filter((t) => profile.tastes.includes(t)).length;
}

export function buildSchedule(
  profile: AthleteProfile,
  session: SessionInputs,
  targets: Targets,
  pantryInput: Product[],
): ScheduleResult {
  const warnings: string[] = [];
  const interval = session.intakeIntervalMin;
  const minutes = intakeMinutes(session.durationMin, interval);
  const intakes: Intake[] = [];

  if (minutes.length === 0) {
    return {
      intakes,
      achieved: { carbsG: 0, fluidMl: 0, sodiumMg: 0, caffeineMg: 0 },
      warnings: ['Séance courte : buvez de l\'eau à la soif, aucun ravitaillement n\'est nécessaire.'],
    };
  }

  let pantry = pantryInput.filter((p) => p.type !== 'recovery');
  let carbSources = pantry.filter((p) => SOLID_TYPES.includes(p.type) && p.carbsG > 0);
  if (targets.carbsPerHourG > 0 && carbSources.length === 0) {
    const fallback = ['cat-gel', 'cat-barre', 'cat-gommes'].map((id) => byId(id)!);
    pantry = [...pantry, ...fallback];
    carbSources = fallback;
    warnings.push('Aucun produit solide ou gel dans vos favoris : le plan utilise des produits génériques du catalogue.');
  }

  const drink = chooseDrink(pantry, targets);
  let salt = pantry.find((p) => p.type === 'electrolyte');
  if (!salt && targets.sodiumPerHourMg > 0) salt = byId('cat-sel');

  const caffeineDuring = targets.caffeineTotalMg - preEffortCaffeine(targets, session.durationMin);
  let caffeineBudget = caffeineDuring;
  let carbDebt = 0;
  let sodiumDebt = 0;
  const usage = new Map<string, number>();
  let lastSolidId = '';
  let saltUsed = false;

  const add = (minute: number, product: Product, quantity: number, note?: string) => {
    usage.set(product.id, (usage.get(product.id) ?? 0) + 1);
    const intake: Intake = {
      id: `${minute}-${product.id}-${intakes.length}`,
      minute,
      productId: product.id,
      productName: product.name,
      quantity,
      carbsG: Math.round(product.carbsG * quantity),
      fluidMl: Math.round(product.fluidMl * quantity),
      sodiumMg: Math.round(product.sodiumMg * quantity),
      caffeineMg: Math.round(product.caffeineMg * quantity),
      note,
    };
    intakes.push(intake);
    carbDebt -= intake.carbsG;
    sodiumDebt -= intake.sodiumMg;
    caffeineBudget -= intake.caffeineMg;
  };

  for (const minute of minutes) {
    const progress = minute / session.durationMin;
    carbDebt += (targets.carbsPerHourG * interval) / 60;
    sodiumDebt += (targets.sodiumPerHourMg * interval) / 60;

    const fluidSlot = Math.round(((targets.fluidPerHourMl * interval) / 60) / 10) * 10;
    if (fluidSlot > 0) add(minute, drink, fluidSlot / drink.fluidMl, `${fluidSlot} ml`);

    // Ordre de préférence : solide en début d'effort modéré, gels et gommes ensuite.
    const order: ProductType[] =
      progress < 0.5 && session.intensity !== 'high' && session.sport === 'endurance'
        ? ['bar', 'food', 'chew', 'gel']
        : ['gel', 'chew', 'food', 'bar'];

    for (let item = 0; item < 2; item += 1) {
      const wantCaffeine = progress >= 2 / 3 && caffeineBudget > 0;
      const candidates = carbSources
        .filter((p) => (p.caffeineMg > 0 ? wantCaffeine && p.caffeineMg <= caffeineBudget + 10 : true))
        .filter((p) => carbDebt >= p.carbsG * (item === 0 ? 0.6 : 1));
      if (candidates.length === 0) break;
      candidates.sort((a, b) => {
        if (wantCaffeine && (a.caffeineMg > 0) !== (b.caffeineMg > 0)) return a.caffeineMg > 0 ? -1 : 1;
        const typeRank = order.indexOf(a.type) - order.indexOf(b.type);
        if (typeRank !== 0) return typeRank;
        const repeat = Number(a.id === lastSolidId) - Number(b.id === lastSolidId);
        if (repeat !== 0) return repeat;
        const used = (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0);
        if (used !== 0) return used;
        return tasteScore(b, profile) - tasteScore(a, profile);
      });
      const chosen = candidates[0]!;
      add(minute, chosen, 1, chosen.servingLabel);
      lastSolidId = chosen.id;
    }

    if (salt && sodiumDebt >= salt.sodiumMg * 0.8) {
      add(minute, salt, 1, salt.servingLabel);
      saltUsed = true;
    }
  }

  const achieved = intakes.reduce(
    (sum, i) => ({
      carbsG: sum.carbsG + i.carbsG,
      fluidMl: sum.fluidMl + i.fluidMl,
      sodiumMg: sum.sodiumMg + i.sodiumMg,
      caffeineMg: sum.caffeineMg + i.caffeineMg,
    }),
    { carbsG: 0, fluidMl: 0, sodiumMg: 0, caffeineMg: 0 },
  );

  if (targets.totalCarbsG > 0 && achieved.carbsG < targets.totalCarbsG * 0.85) {
    warnings.push(
      `Vos produits couvrent ${Math.round((achieved.carbsG / targets.totalCarbsG) * 100)} % des glucides visés. Ajoutez un produit plus dosé (gel 40 g, boisson haut dosage) à vos favoris.`,
    );
  }
  if (saltUsed && !pantry.some((p) => p.type === 'electrolyte')) {
    warnings.push('Des gélules de sel ont été ajoutées pour couvrir vos besoins en sodium : remplacez-les par vos propres électrolytes si besoin.');
  }
  if (caffeineDuring > 0 && achieved.caffeineMg === 0 && session.durationMin > 120) {
    warnings.push('Aucun produit caféiné dans vos favoris : la caféine prévue en fin d\'effort n\'est pas planifiée.');
  }

  return { intakes, achieved, warnings };
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function buildPlan(profile: AthleteProfile, session: SessionInputs, pantry: Product[]): FuelPlan {
  const { targets, warnings } = computeTargets(profile, session);
  const schedule = buildSchedule(profile, session, targets, pantry);
  return {
    id: newId(),
    createdAt: new Date().toISOString(),
    athleteName: profile.firstName,
    weightKg: profile.weightKg,
    inputs: session,
    targets,
    before: computeBefore(profile, session, targets),
    after: computeAfter(profile, session, targets),
    energy: computeEnergy(profile, session),
    intakes: schedule.intakes,
    warnings: [...warnings, ...schedule.warnings],
    engineVersion: ENGINE_VERSION,
  };
}
