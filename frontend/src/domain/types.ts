// Types métier partagés par le moteur de calcul, les pages et la persistance.

export type SportFamily = 'endurance' | 'team' | 'strength' | 'precision';
export type Intensity = 'low' | 'medium' | 'high';
export type Goal = 'perform' | 'recover' | 'balance';
export type Sex = 'female' | 'male' | 'other';
export type SweatRate = 'light' | 'moderate' | 'heavy';
/** Habitude à absorber des glucides pendant l'effort (« entraînement de l'intestin »). */
export type GutTraining = 'novice' | 'regular' | 'trained';
export type CaffeinePreference = 'none' | 'low' | 'normal';
export type Taste = 'sweet' | 'salty' | 'neutral';
export type Weather = 'cold' | 'mild' | 'hot';

export interface AthleteProfile {
  firstName: string;
  weightKg: number;
  heightCm?: number;
  age?: number;
  sex?: Sex;
  sweatRate: SweatRate;
  /** Perte mesurée en litres par heure (pesée avant/après), prioritaire sur sweatRate si renseignée. */
  measuredSweatLossLh?: number;
  gutTraining: GutTraining;
  caffeine: CaffeinePreference;
  tastes: Taste[];
  weeklyTrainingHours?: number;
  favoriteProductIds: string[];
  updatedAt: string;
}

export interface SessionInputs {
  name: string;
  sport: SportFamily;
  durationMin: number;
  intensity: Intensity;
  goal: Goal;
  weather: Weather;
  /** Compétition : active la charge glucidique et le café pré-départ. */
  isRace: boolean;
  /** Prochaine séance dans moins de 24 h : récupération accélérée. */
  nextSessionWithin24h: boolean;
  intakeIntervalMin: 15 | 20 | 30;
}

export type ProductType = 'gel' | 'bar' | 'chew' | 'drink' | 'food' | 'electrolyte' | 'recovery';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  type: ProductType;
  servingLabel: string;
  carbsG: number;
  sodiumMg: number;
  caffeineMg: number;
  /** Volume de liquide apporté par portion (boissons), en ml. */
  fluidMl: number;
  proteinG: number;
  tastes: Taste[];
  source: 'api' | 'catalogue';
  imageUrl?: string;
}

export interface Range {
  min: number;
  max: number;
}

export interface Targets {
  carbsPerHourG: number;
  carbsPerHourRange: Range;
  fluidPerHourMl: number;
  sodiumPerHourMg: number;
  caffeineTotalMg: number;
  caffeineLimitMg: number;
  totalCarbsG: number;
  totalFluidMl: number;
  totalSodiumMg: number;
}

export interface BeforeAdvice {
  mealHoursBefore: number;
  mealCarbsG: number;
  snackCarbsG: number;
  fluidMl: number;
  caffeineMg: number;
  carbLoadingGPerKgPerDay?: Range;
  carbLoadingHours?: number;
}

export interface AfterAdvice {
  windowMin: number;
  proteinG: number;
  carbsG: number;
  carbsPerHourForFourHours?: number;
  fluidMl: number;
}

export interface Energy {
  sessionKcal: number;
  dailyKcal?: number;
  dailyCarbsGPerKg: Range;
  dailyProteinGPerKg: Range;
}

export interface Intake {
  id: string;
  minute: number;
  productId: string;
  productName: string;
  quantity: number;
  carbsG: number;
  fluidMl: number;
  sodiumMg: number;
  caffeineMg: number;
  note?: string;
}

export interface FuelPlan {
  id: string;
  createdAt: string;
  athleteName: string;
  weightKg: number;
  inputs: SessionInputs;
  targets: Targets;
  before: BeforeAdvice;
  after: AfterAdvice;
  energy: Energy;
  intakes: Intake[];
  warnings: string[];
  engineVersion: string;
}

export interface EffortLogEntry {
  intakeId: string;
  takenAt: string;
  status: 'taken' | 'skipped';
}

export interface EffortSession {
  id: string;
  planId: string;
  startedAt: string;
  endedAt?: string;
  log: EffortLogEntry[];
}
