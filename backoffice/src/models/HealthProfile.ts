import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DIETS } from "@/lib/validators";

// Données de santé (RGPD, art. 9) : collection séparée, lue uniquement via requireRole("coach")
// et toujours accompagnée d'une entrée dans le journal d'audit.
const healthProfileSchema = new Schema(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true, unique: true },
    allergies: { type: [String], default: [] },
    intolerances: { type: [String], default: [] },
    diet: { type: String, enum: DIETS },
    dietNotes: { type: String },
    medications: { type: String },
    injuries: { type: String },
    digestiveIssues: { type: String },
    hydrationLitersPerDay: { type: Number, min: 0 },
    likedFoods: { type: [String], default: [] },
    dislikedFoods: { type: [String], default: [] },
    constraints: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type HealthProfileDoc = InferSchemaType<typeof healthProfileSchema>;

export const HealthProfile: Model<HealthProfileDoc> =
  (models.HealthProfile as Model<HealthProfileDoc>) ||
  model<HealthProfileDoc>("HealthProfile", healthProfileSchema);
