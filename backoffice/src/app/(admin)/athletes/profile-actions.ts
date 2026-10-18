"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { changedFields, logAudit } from "@/lib/audit";
import { HEALTH_CONSENT_MESSAGE, hasHealthConsent } from "@/lib/consents";
import { optional, readValues, splitList, toUpdate, type FormState } from "@/lib/form-utils";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { healthProfileSchema, sportProfileSchema } from "@/lib/validators";
import { Athlete } from "@/models/Athlete";
import { HealthProfile } from "@/models/HealthProfile";
import { SportProfile } from "@/models/SportProfile";

const SPORT_FIELDS = [
  "disciplines", "level", "club", "yearsOfPractice", "weeklyHours", "weeklySessions",
  "maxHeartRate", "restingHeartRate", "ftp", "vma", "equipment",
] as const;

export async function saveSportProfile(
  athleteId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole();
  if (!isValidObjectId(athleteId)) notFound();

  const v = readValues(formData, SPORT_FIELDS);
  const parsed = sportProfileSchema.safeParse({
    disciplines: splitList(v.disciplines),
    level: optional(v.level),
    club: optional(v.club),
    yearsOfPractice: optional(v.yearsOfPractice),
    weeklyHours: optional(v.weeklyHours),
    weeklySessions: optional(v.weeklySessions),
    maxHeartRate: optional(v.maxHeartRate),
    restingHeartRate: optional(v.restingHeartRate),
    ftp: optional(v.ftp),
    vma: optional(v.vma),
    equipment: optional(v.equipment),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: v };

  await connectDB();
  if (!(await Athlete.exists({ _id: athleteId }))) notFound();

  await SportProfile.findOneAndUpdate({ athleteId }, toUpdate(parsed.data, SPORT_FIELDS), {
    upsert: true,
    runValidators: true,
  });

  revalidatePath(`/athletes/${athleteId}/sport`);
  return { saved: true, values: v };
}

const HEALTH_FIELDS = [
  "allergies", "intolerances", "diet", "dietNotes", "medications", "injuries",
  "digestiveIssues", "hydrationLitersPerDay", "likedFoods", "dislikedFoods", "constraints",
] as const;

export async function saveHealthProfile(
  athleteId: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireRole("coach"); // l'action est protégée indépendamment de la page
  if (!isValidObjectId(athleteId)) notFound();

  const v = readValues(formData, HEALTH_FIELDS);
  const parsed = healthProfileSchema.safeParse({
    allergies: splitList(v.allergies),
    intolerances: splitList(v.intolerances),
    diet: optional(v.diet),
    dietNotes: optional(v.dietNotes),
    medications: optional(v.medications),
    injuries: optional(v.injuries),
    digestiveIssues: optional(v.digestiveIssues),
    hydrationLitersPerDay: optional(v.hydrationLitersPerDay),
    likedFoods: splitList(v.likedFoods),
    dislikedFoods: splitList(v.dislikedFoods),
    constraints: optional(v.constraints),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, values: v };

  await connectDB();
  if (!(await Athlete.exists({ _id: athleteId }))) notFound();
  if (!(await hasHealthConsent(athleteId))) {
    return { errors: { _form: [HEALTH_CONSENT_MESSAGE] }, values: v };
  }

  const before = await HealthProfile.findOne({ athleteId }).lean();
  const after = await HealthProfile.findOneAndUpdate(
    { athleteId },
    toUpdate({ ...parsed.data, updatedBy: user.id }, [...HEALTH_FIELDS, "updatedBy"]),
    { upsert: true, new: true, runValidators: true }
  ).lean();

  const fields = changedFields(
    before as Record<string, unknown> | null,
    after as Record<string, unknown> | null,
    HEALTH_FIELDS
  );
  if (!before || fields.length > 0) {
    await logAudit({
      user,
      action: before ? "update" : "create",
      resource: "healthProfile",
      athleteId,
      fields,
    });
  }

  revalidatePath(`/athletes/${athleteId}/sante`);
  return { saved: true, values: v };
}
