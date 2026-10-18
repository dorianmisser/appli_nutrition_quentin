"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { HEALTH_CONSENT_MESSAGE, hasHealthConsent } from "@/lib/consents";
import { optional, readValues, type FormState } from "@/lib/form-utils";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { measurementSchema } from "@/lib/validators";
import { Athlete } from "@/models/Athlete";
import { Measurement } from "@/models/Measurement";

const FIELDS = ["date", "weightKg", "heightCm", "bodyFatPct", "waistCm", "notes"] as const;
const METRICS = ["weightKg", "heightCm", "bodyFatPct", "waistCm"] as const;

export async function addMeasurement(
  athleteId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("coach"); // le poids et la composition corporelle sont des données de santé
  if (!isValidObjectId(athleteId)) notFound();

  const v = readValues(formData, FIELDS);
  const parsed = measurementSchema.safeParse({
    date: v.date,
    weightKg: optional(v.weightKg),
    heightCm: optional(v.heightCm),
    bodyFatPct: optional(v.bodyFatPct),
    waistCm: optional(v.waistCm),
    notes: optional(v.notes),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: v };

  await connectDB();
  if (!(await Athlete.exists({ _id: athleteId }))) notFound();
  if (!(await hasHealthConsent(athleteId))) {
    return { errors: { _form: [HEALTH_CONSENT_MESSAGE] }, values: v };
  }

  await Measurement.create({ ...parsed.data, athleteId, recordedBy: user.id });
  await logAudit({
    user,
    action: "create",
    resource: "measurement",
    athleteId,
    fields: METRICS.filter((key) => parsed.data[key] !== undefined),
  });

  revalidatePath(`/athletes/${athleteId}/mesures`);
  return { saved: true, values: { date: v.date } }; // on garde la date, les autres champs sont vidés
}

export async function deleteMeasurement(athleteId: string, measurementId: string) {
  const user = await requireRole("coach");
  if (!isValidObjectId(athleteId) || !isValidObjectId(measurementId)) notFound();

  await connectDB();
  const deleted = await Measurement.findOneAndDelete({ _id: measurementId, athleteId }).lean();
  if (deleted) {
    await logAudit({
      user,
      action: "delete",
      resource: "measurement",
      athleteId,
      fields: METRICS.filter((key) => deleted[key] !== undefined && deleted[key] !== null),
    });
  }
  revalidatePath(`/athletes/${athleteId}/mesures`);
}
