"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { HEALTH_CONSENT_MESSAGE, hasHealthConsent } from "@/lib/consents";
import { optional, readValues, type FormState } from "@/lib/form-utils";
import { connectDB } from "@/lib/mongodb";
import { computePlan } from "@/lib/nutrition";
import { requireRole } from "@/lib/permissions";
import { planInputSchema } from "@/lib/validators";
import { Athlete } from "@/models/Athlete";
import { NutritionPlan } from "@/models/NutritionPlan";

const FIELDS = ["weightKg", "durationMin", "intensity", "sport", "goal", "coachNotes"] as const;

export async function createPlan(
  athleteId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("coach");
  if (!isValidObjectId(athleteId)) notFound();

  const v = readValues(formData, FIELDS);
  const parsed = planInputSchema.safeParse({ ...v, coachNotes: optional(v.coachNotes) });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: v };

  await connectDB();
  if (!(await Athlete.exists({ _id: athleteId }))) notFound();
  if (!(await hasHealthConsent(athleteId))) {
    return { errors: { _form: [HEALTH_CONSENT_MESSAGE] }, values: v };
  }

  const { coachNotes, ...inputs } = parsed.data;
  // Les résultats sont toujours recalculés côté serveur : on ne fait jamais confiance au navigateur.
  const outputs = computePlan(inputs);

  // Numéro de version par athlète ; l'index unique protège contre deux créations simultanées.
  for (let attempt = 0; attempt < 3; attempt++) {
    const last = await NutritionPlan.findOne({ athleteId }).sort({ version: -1 }).select("version").lean();
    try {
      await NutritionPlan.create({
        athleteId,
        version: (last?.version ?? 0) + 1,
        inputs,
        outputs,
        coachNotes,
        createdBy: user.id,
        createdByName: user.name ?? "Utilisateur",
      });
      break;
    } catch (error) {
      const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000;
      if (!duplicate || attempt === 2) throw error;
    }
  }

  await logAudit({ user, action: "create", resource: "plan", athleteId });
  revalidatePath(`/athletes/${athleteId}/plans`);
  return { saved: true, values: { weightKg: v.weightKg, durationMin: v.durationMin, intensity: v.intensity, sport: v.sport, goal: v.goal } };
}

export async function deletePlan(athleteId: string, planId: string) {
  const user = await requireRole("coach");
  if (!isValidObjectId(athleteId) || !isValidObjectId(planId)) notFound();

  await connectDB();
  const deleted = await NutritionPlan.findOneAndDelete({ _id: planId, athleteId }).lean();
  if (deleted) await logAudit({ user, action: "delete", resource: "plan", athleteId });
  revalidatePath(`/athletes/${athleteId}/plans`);
}
