import { isValidObjectId } from "mongoose";
import { cache } from "react";
import { connectDB } from "@/lib/mongodb";
import { Athlete } from "@/models/Athlete";

// Mis en cache le temps d'une requête : le layout et la page partagent la même lecture.
export const getAthlete = cache(async (id: string) => {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  return Athlete.findById(id).lean();
});
