export const statusLabels = {
  prospect: "Prospect",
  active: "Actif",
  paused: "En pause",
  archived: "Archivé",
} as const;

export const sportLabels = {
  endurance: "Endurance",
  team: "Collectif",
  strength: "Force",
  precision: "Précision",
} as const;

export const sexLabels = { female: "Femme", male: "Homme", other: "Autre" } as const;

export const sourceSuggestions = [
  "Bouche-à-oreille",
  "Réseaux sociaux",
  "Site web",
  "Club",
  "Événement",
];

export function formatDate(date?: Date | null) {
  return date ? new Intl.DateTimeFormat("fr-FR").format(date) : "–";
}

export function toDateInput(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function ageFrom(date?: Date | null) {
  if (!date) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const birthdayPassed =
    now.getMonth() > date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!birthdayPassed) age -= 1;
  return age;
}

export const levelLabels = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  elite: "Élite",
} as const;

export const dietLabels = {
  omnivore: "Omnivore",
  vegetarian: "Végétarien",
  vegan: "Végan",
  pescatarian: "Pescétarien",
  gluten_free: "Sans gluten",
  lactose_free: "Sans lactose",
  other: "Autre",
} as const;

export const auditActionLabels = {
  read: "Consultation",
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  export: "Export",
} as const;

export function formatDateTime(date?: Date | null) {
  return date
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Europe/Paris",
      }).format(date)
    : "–";
}

// Les dates de mesure sont stockées à minuit UTC : on les affiche en UTC pour éviter tout décalage d'un jour.
export function formatDay(date?: Date | null) {
  return date ? new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(date) : "–";
}

export function formatNumber(value?: number | null, digits = 1) {
  return value === undefined || value === null
    ? "–"
    : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);
}

export function todayParis() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date()); // aaaa-mm-jj
}

export const auditResourceLabels = {
  healthProfile: "Santé et nutrition",
  sportProfile: "Profil sportif",
  measurement: "Mesures",
  consent: "Consentement",
  plan: "Plans nutritionnels",
  athlete: "Fiche athlète",
} as const;

export const consentMethodLabels = {
  paper: "Formulaire papier signé",
  electronic: "Accord électronique (email, formulaire en ligne)",
  verbal: "Accord verbal (preuve plus fragile)",
} as const;

export const intensityLabels = { low: "Modérée", medium: "Soutenue", high: "Très intense" } as const;
export const goalLabels = { perform: "Performance", recover: "Récupération", balance: "Équilibre" } as const;
