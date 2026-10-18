"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { CONSENT_VERSION, getActiveConsent } from "@/lib/consents";
import { optional, readValues, type FormState } from "@/lib/form-utils";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { CONSENT_PURPOSES, consentSchema, type ConsentPurpose } from "@/lib/validators";
import { Athlete } from "@/models/Athlete";
import { Consent } from "@/models/Consent";
import { HealthProfile } from "@/models/HealthProfile";
import { Measurement } from "@/models/Measurement";
import { NutritionPlan } from "@/models/NutritionPlan";
import { SportProfile } from "@/models/SportProfile";

function revalidateAthlete(athleteId: string) {
  for (const tab of ["rgpd", "sante", "mesures", "plans"]) revalidatePath(`/athletes/${athleteId}/${tab}`);
}

export async function grantConsent(
  athleteId: string,
  purpose: ConsentPurpose,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("coach");
  if (!isValidObjectId(athleteId) || !CONSENT_PURPOSES.includes(purpose)) notFound();

  const v = readValues(formData, ["method", "notes", "confirmed"] as const);
  const parsed = consentSchema.safeParse({
    method: v.method,
    notes: optional(v.notes),
    confirmed: v.confirmed,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: v };

  await connectDB();
  if (!(await Athlete.exists({ _id: athleteId }))) notFound();
  if (await getActiveConsent(athleteId, purpose)) {
    return { errors: { _form: ["Un consentement actif existe déjà pour cette finalité."] }, values: v };
  }

  await Consent.create({
    athleteId,
    purpose,
    version: CONSENT_VERSION,
    method: parsed.data.method,
    notes: parsed.data.notes,
    grantedBy: user.id,
    grantedByName: user.name ?? "Utilisateur",
  });
  await logAudit({ user, action: "create", resource: "consent", athleteId, fields: [purpose] });

  revalidateAthlete(athleteId);
  return { saved: true };
}

export async function withdrawConsent(athleteId: string, consentId: string) {
  const user = await requireRole("coach");
  if (!isValidObjectId(athleteId) || !isValidObjectId(consentId)) notFound();

  await connectDB();
  const withdrawn = await Consent.findOneAndUpdate(
    { _id: consentId, athleteId, withdrawnAt: null },
    { withdrawnAt: new Date(), withdrawnBy: user.id, withdrawnByName: user.name ?? "Utilisateur" }
  ).lean();
  if (withdrawn) {
    await logAudit({ user, action: "update", resource: "consent", athleteId, fields: [withdrawn.purpose] });
  }
  revalidateAthlete(athleteId);
}

// Effacement des seules données de santé (le reste de la fiche est conservé).
export async function eraseHealthData(athleteId: string) {
  const user = await requireRole("coach");
  if (!isValidObjectId(athleteId)) notFound();

  await connectDB();
  await Promise.all([
    HealthProfile.deleteMany({ athleteId }),
    Measurement.deleteMany({ athleteId }),
    NutritionPlan.deleteMany({ athleteId }),
  ]);
  await logAudit({ user, action: "delete", resource: "healthProfile", athleteId, fields: ["all"] });
  await logAudit({ user, action: "delete", resource: "measurement", athleteId, fields: ["all"] });
  await logAudit({ user, action: "delete", resource: "plan", athleteId, fields: ["all"] });
  revalidateAthlete(athleteId);
}

// Droit à l'effacement : la fiche et toutes ses données sont supprimées.
// Seul le journal d'audit est conservé (identifiants techniques, aucune donnée de santé).
export async function deleteAthlete(
  athleteId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("coach");
  if (!isValidObjectId(athleteId)) notFound();

  if (String(formData.get("confirmation") ?? "").trim() !== "SUPPRIMER") {
    return { errors: { confirmation: ["Saisissez SUPPRIMER pour confirmer."] } };
  }

  await connectDB();
  await Promise.all([
    Athlete.deleteOne({ _id: athleteId }),
    SportProfile.deleteMany({ athleteId }),
    HealthProfile.deleteMany({ athleteId }),
    Measurement.deleteMany({ athleteId }),
    NutritionPlan.deleteMany({ athleteId }),
    Consent.deleteMany({ athleteId }),
  ]);
  await logAudit({ user, action: "delete", resource: "athlete", athleteId });

  revalidatePath("/athletes");
  redirect("/athletes");
}
