import { connectDB } from "@/lib/mongodb";
import type { ConsentPurpose } from "@/lib/validators";
import { Consent } from "@/models/Consent";

// À modifier chaque fois que le texte change : les consentements existants gardent la version
// qu'ils ont acceptée et l'interface signale qu'ils sont à renouveler.
export const CONSENT_VERSION = "2026-10";

// Textes à faire relire et valider (juriste ou DPO) avant utilisation réelle.
export const consentTexts: Record<ConsentPurpose, { label: string; text: string }> = {
  health_data: {
    label: "Données de santé",
    text:
      "J'accepte que CH'TRI COACHING collecte et traite mes données de santé (poids et composition " +
      "corporelle, blessures et antécédents, allergies et intolérances, traitements en cours, troubles " +
      "digestifs) afin d'élaborer et d'ajuster mon accompagnement sportif et nutritionnel. Ces données " +
      "sont accessibles uniquement au coach, hébergées dans l'Union européenne, conservées pendant la " +
      "durée de l'accompagnement puis [durée de conservation à définir], et ne sont transmises à aucun " +
      "tiers. Je peux retirer mon consentement à tout moment et demander l'accès, la rectification, " +
      "l'export ou l'effacement de mes données en contactant mon coach.",
  },
  communications: {
    label: "Communications",
    text:
      "J'accepte de recevoir par email ou SMS des rappels de séances et des conseils liés à mon " +
      "accompagnement. Je peux me désinscrire à tout moment en le signalant à mon coach.",
  },
};

export async function getActiveConsent(athleteId: string, purpose: ConsentPurpose) {
  await connectDB();
  return Consent.findOne({ athleteId, purpose, withdrawnAt: null }).sort({ grantedAt: -1 }).lean();
}

export async function hasHealthConsent(athleteId: string) {
  return Boolean(await getActiveConsent(athleteId, "health_data"));
}

export const HEALTH_CONSENT_MESSAGE =
  "Le consentement de l'athlète pour les données de santé n'est pas enregistré : enregistrez-le dans l'onglet RGPD.";
