"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { ATHLETE_STATUSES, athleteSchema } from "@/lib/validators";
import { Athlete } from "@/models/Athlete";

export type FormState =
  | { errors?: Record<string, string[] | undefined>; values?: Record<string, string> }
  | undefined;

const FIELDS = [
  "firstName", "lastName", "email", "phone", "birthDate", "sex", "status",
  "source", "mainSport", "ecName", "ecPhone", "ecRelation",
] as const;

function readForm(formData: FormData) {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "").trim()])
  ) as Record<(typeof FIELDS)[number], string>;
  const opt = (field: (typeof FIELDS)[number]) => values[field] || undefined;

  const result = athleteSchema.safeParse({
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: opt("phone"),
    birthDate: opt("birthDate"),
    sex: opt("sex"),
    status: opt("status"),
    source: opt("source"),
    mainSport: opt("mainSport"),
    emergencyContact: { name: opt("ecName"), phone: opt("ecPhone"), relation: opt("ecRelation") },
  });
  return { values, result };
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

const duplicateEmail: FormState = { errors: { email: ["Un athlète utilise déjà cet email."] } };

export async function createAthlete(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireRole();
  const { values, result } = readForm(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors, values };

  const { emergencyContact, ...rest } = result.data;
  const hasContact = emergencyContact && Object.values(emergencyContact).some(Boolean);

  await connectDB();
  let id: string;
  try {
    const created = await Athlete.create({
      ...rest,
      ...(hasContact ? { emergencyContact } : {}),
    });
    id = created.id;
  } catch (error) {
    if (isDuplicateKey(error)) return { ...duplicateEmail, values };
    throw error;
  }

  revalidatePath("/athletes");
  redirect(`/athletes/${id}`); // hors du try/catch : redirect fonctionne par exception
}

const OPTIONAL_KEYS = ["phone", "birthDate", "sex", "source", "mainSport"] as const;

export async function updateAthlete(
  id: string,
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole();
  if (!isValidObjectId(id)) notFound();

  const { values, result } = readForm(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors, values };

  const { emergencyContact, ...rest } = result.data;
  const set: Record<string, unknown> = {
    firstName: rest.firstName,
    lastName: rest.lastName,
    email: rest.email,
    status: rest.status,
  };
  const unset: Record<string, 1> = {};

  // Un champ vidé dans le formulaire doit être supprimé en base, pas ignoré.
  for (const key of OPTIONAL_KEYS) {
    if (rest[key] === undefined) unset[key] = 1;
    else set[key] = rest[key];
  }
  if (emergencyContact && Object.values(emergencyContact).some(Boolean)) {
    set.emergencyContact = emergencyContact;
  } else {
    unset.emergencyContact = 1;
  }

  await connectDB();
  try {
    const updated = await Athlete.findByIdAndUpdate(
      id,
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { runValidators: true }
    );
    if (!updated) notFound();
  } catch (error) {
    if (isDuplicateKey(error)) return { ...duplicateEmail, values };
    throw error;
  }

  revalidatePath("/athletes");
  redirect(`/athletes/${id}`);
}

export async function setAthleteStatus(id: string, status: (typeof ATHLETE_STATUSES)[number]) {
  await requireRole();
  if (!isValidObjectId(id) || !ATHLETE_STATUSES.includes(status)) notFound();

  await connectDB();
  await Athlete.findByIdAndUpdate(id, { status });
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${id}`);
}
