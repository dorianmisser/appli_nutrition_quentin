import type { GOALS, INTENSITIES, SPORT_FAMILIES } from "./validators";

export type PlanInputs = {
  weightKg: number;
  durationMin: number;
  intensity: (typeof INTENSITIES)[number];
  sport: (typeof SPORT_FAMILIES)[number];
  goal: (typeof GOALS)[number];
};

export type PlanOutputs = {
  calories: number;
  carbsG: number;
  preCarbsG: number;
  hydrationMl: number; // volume total à boire pendant la séance
  hydrationPerHourMl: number;
  proteinG: number;
  recoveryMinutes: number;
};

const intensityFactor = { low: 0.85, medium: 1, high: 1.18 } as const;
const sportFactor = { endurance: 1.1, team: 1, strength: 0.9, precision: 0.8 } as const;

// Mêmes coefficients que le calculateur public (script.js) : les plans enregistrés
// donnent les mêmes chiffres que ce que l'athlète voit en ligne.
export function computePlan({ weightKg, durationMin, intensity, sport, goal }: PlanInputs): PlanOutputs {
  const carbsG = Math.round(
    weightKg * (durationMin / 60) * intensityFactor[intensity] * sportFactor[sport] * 0.8
  );
  const hydrationMl = Math.round(durationMin * (intensity === "high" ? 11 : 9));
  const proteinG = Math.round(weightKg * (goal === "recover" ? 0.35 : 0.28));
  const calories = Math.round((carbsG * 4 + proteinG * 4 + weightKg * 0.35 * 9) / 10) * 10;

  return {
    calories,
    carbsG,
    preCarbsG: Math.round(carbsG * 0.35),
    hydrationMl,
    hydrationPerHourMl: intensity === "high" ? 660 : 540,
    proteinG,
    recoveryMinutes: goal === "recover" ? 30 : 60,
  };
}
