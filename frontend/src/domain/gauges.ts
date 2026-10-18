import type { EffortLogEntry, FuelPlan, Intake } from './types';

export type GaugeLevel = 'ok' | 'watch' | 'alert';

export interface Gauge {
  key: 'carbs' | 'fluid' | 'sodium' | 'caffeine';
  label: string;
  unit: string;
  actual: number;
  expected: number;
  /** Plafond à ne pas dépasser (caféine). */
  limit?: number;
  level: GaugeLevel;
  message: string;
}

/** Écart entre ce qui a été pris et ce qui était prévu à ce stade : ±10 % vert, ±25 % orange, au-delà rouge. */
export function paceLevel(actual: number, expected: number): GaugeLevel {
  if (expected <= 0) return actual > 0 ? 'watch' : 'ok';
  const ratio = actual / expected;
  if (ratio >= 0.9 && ratio <= 1.1) return 'ok';
  if (ratio >= 0.75 && ratio <= 1.25) return 'watch';
  return 'alert';
}

export function limitLevel(actual: number, limit: number): GaugeLevel {
  if (actual > limit) return 'alert';
  if (actual > limit * 0.85) return 'watch';
  return 'ok';
}

const sum = (intakes: Intake[], key: 'carbsG' | 'fluidMl' | 'sodiumMg' | 'caffeineMg') =>
  intakes.reduce((total, intake) => total + intake[key], 0);

function paceMessage(level: GaugeLevel, actual: number, expected: number, unit: string): string {
  if (level === 'ok') return 'Dans le rythme prévu';
  const gap = Math.round(Math.abs(expected - actual));
  return actual < expected ? `${gap} ${unit} de retard` : `${gap} ${unit} d'avance`;
}

/** Jauges en direct pendant l'effort, à partir du journal des prises. */
export function liveGauges(plan: FuelPlan, log: EffortLogEntry[], elapsedMin: number): Gauge[] {
  const taken = new Set(log.filter((l) => l.status === 'taken').map((l) => l.intakeId));
  const due = plan.intakes.filter((i) => i.minute <= elapsedMin);
  const consumed = plan.intakes.filter((i) => taken.has(i.id));
  const preCaffeine = plan.before.caffeineMg;

  const make = (key: Gauge['key'], label: string, unit: string, field: Parameters<typeof sum>[1]): Gauge => {
    const actual = sum(consumed, field);
    const expected = sum(due, field);
    const level = paceLevel(actual, expected);
    return { key, label, unit, actual, expected, level, message: paceMessage(level, actual, expected, unit) };
  };

  const gauges = [
    make('carbs', 'Glucides', 'g', 'carbsG'),
    make('fluid', 'Hydratation', 'ml', 'fluidMl'),
  ];
  if (plan.targets.sodiumPerHourMg > 0) gauges.push(make('sodium', 'Sodium', 'mg', 'sodiumMg'));

  if (plan.targets.caffeineTotalMg > 0) {
    const actual = sum(consumed, 'caffeineMg') + preCaffeine;
    const limit = plan.targets.caffeineLimitMg;
    const level = limitLevel(actual, limit);
    gauges.push({
      key: 'caffeine',
      label: 'Caféine',
      unit: 'mg',
      actual,
      expected: plan.targets.caffeineTotalMg,
      limit,
      level,
      message: level === 'ok' ? `Plafond ${limit} mg` : level === 'watch' ? 'Proche du plafond' : 'Plafond dépassé',
    });
  }
  return gauges;
}

/** Jauges du plan lui-même : ce que les prises planifiées couvrent par rapport aux cibles. */
export function planCoverage(plan: FuelPlan): Gauge[] {
  const all = plan.intakes;
  const t = plan.targets;
  const cover = (key: Gauge['key'], label: string, unit: string, actual: number, expected: number): Gauge => {
    const level = paceLevel(actual, expected);
    const pct = expected > 0 ? Math.round((actual / expected) * 100) : 0;
    return { key, label, unit, actual, expected, level, message: expected > 0 ? `${pct} % de la cible` : 'Pas de besoin' };
  };
  const gauges = [
    cover('carbs', 'Glucides', 'g', sum(all, 'carbsG'), t.totalCarbsG),
    cover('fluid', 'Hydratation', 'ml', sum(all, 'fluidMl'), t.totalFluidMl),
    cover('sodium', 'Sodium', 'mg', sum(all, 'sodiumMg'), t.totalSodiumMg),
  ];
  if (t.caffeineTotalMg > 0) {
    const actual = sum(all, 'caffeineMg') + plan.before.caffeineMg;
    const level = limitLevel(actual, t.caffeineLimitMg);
    gauges.push({
      key: 'caffeine', label: 'Caféine', unit: 'mg', actual, expected: t.caffeineTotalMg, limit: t.caffeineLimitMg, level,
      message: `dont ${plan.before.caffeineMg} mg avant le départ`,
    });
  }
  return gauges;
}
