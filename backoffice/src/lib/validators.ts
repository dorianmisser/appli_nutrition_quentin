import { z } from "zod";

export const SPORT_FAMILIES = ["endurance", "team", "strength", "precision"] as const;
export const ATHLETE_STATUSES = ["prospect", "active", "paused", "archived"] as const;

// Schéma partagé : formulaires côté client et routes d'API côté serveur.
export const athleteSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire"),
  lastName: z.string().trim().min(1, "Le nom est obligatoire"),
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  phone: z.string().trim().optional(),
  birthDate: z.coerce
    .date()
    .refine((d) => d <= new Date(), "La date de naissance doit être dans le passé")
    .optional(),
  sex: z.enum(["female", "male", "other"]).optional(),
  status: z.enum(ATHLETE_STATUSES).default("prospect"),
  source: z.string().trim().optional(),
  mainSport: z.enum(SPORT_FAMILIES).optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().optional(),
      phone: z.string().trim().optional(),
      relation: z.string().trim().optional(),
    })
    .optional(),
});

export type AthleteInput = z.infer<typeof athleteSchema>;

export const ROLES = ["coach", "assistant"] as const;
export type Role = (typeof ROLES)[number];

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const passwordSchema = z
  .string()
  .min(12, "12 caractères minimum");

// ---------- Profil sportif ----------
export const LEVELS = ["beginner", "intermediate", "advanced", "elite"] as const;

const num = (min: number, max: number, integer = false) => {
  const schema = z
    .coerce.number({ invalid_type_error: "Nombre attendu" })
    .min(min, `Minimum ${min}`)
    .max(max, `Maximum ${max}`);
  return integer ? schema.int("Nombre entier attendu") : schema;
};

export const sportProfileSchema = z
  .object({
    disciplines: z.array(z.string().max(60)).max(20).default([]),
    level: z.enum(LEVELS).optional(),
    club: z.string().max(100).optional(),
    yearsOfPractice: num(0, 70, true).optional(),
    weeklyHours: num(0, 40).optional(),
    weeklySessions: num(0, 21, true).optional(),
    maxHeartRate: num(100, 230, true).optional(),
    restingHeartRate: num(25, 120, true).optional(),
    ftp: num(50, 600, true).optional(),
    vma: num(6, 28).optional(),
    equipment: z.string().max(2000).optional(),
  })
  .refine(
    (d) => !d.maxHeartRate || !d.restingHeartRate || d.restingHeartRate < d.maxHeartRate,
    { message: "La FC repos doit être inférieure à la FC max", path: ["restingHeartRate"] }
  );

// ---------- Santé et nutrition (données sensibles) ----------
export const DIETS = [
  "omnivore", "vegetarian", "vegan", "pescatarian", "gluten_free", "lactose_free", "other",
] as const;

const list = z.array(z.string().max(80)).max(30).default([]);

export const healthProfileSchema = z.object({
  allergies: list,
  intolerances: list,
  diet: z.enum(DIETS).optional(),
  dietNotes: z.string().max(1000).optional(),
  medications: z.string().max(2000).optional(),
  injuries: z.string().max(3000).optional(),
  digestiveIssues: z.string().max(2000).optional(),
  hydrationLitersPerDay: num(0, 10).optional(),
  likedFoods: list,
  dislikedFoods: list,
  constraints: z.string().max(2000).optional(),
});

// ---------- Mesures corporelles ----------
export const measurementSchema = z
  .object({
    date: z.coerce
      .date({ invalid_type_error: "Date invalide", required_error: "La date est obligatoire" })
      .refine((d) => d.getTime() <= Date.now() + 24 * 3600 * 1000, "La date ne peut pas être dans le futur"),
    weightKg: num(20, 300).optional(),
    heightCm: num(100, 250).optional(),
    bodyFatPct: num(2, 60).optional(),
    waistCm: num(40, 200).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (d) => [d.weightKg, d.heightCm, d.bodyFatPct, d.waistCm].some((value) => value !== undefined),
    { message: "Renseignez au moins une mesure", path: ["_form"] }
  );

// ---------- Consentements RGPD ----------
export const CONSENT_PURPOSES = ["health_data", "communications"] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];
export const CONSENT_METHODS = ["paper", "electronic", "verbal"] as const;

export const consentSchema = z.object({
  method: z.enum(CONSENT_METHODS, { errorMap: () => ({ message: "Choisissez le mode de recueil" }) }),
  notes: z.string().max(500).optional(),
  confirmed: z.literal("on", { errorMap: () => ({ message: "Confirmez le recueil du consentement" }) }),
});

// ---------- Plans nutritionnels ----------
export const INTENSITIES = ["low", "medium", "high"] as const;
export const GOALS = ["perform", "recover", "balance"] as const;

export const planInputSchema = z.object({
  weightKg: num(35, 200),
  durationMin: num(15, 600, true),
  intensity: z.enum(INTENSITIES),
  sport: z.enum(SPORT_FAMILIES),
  goal: z.enum(GOALS),
  coachNotes: z.string().max(1000).optional(),
});
