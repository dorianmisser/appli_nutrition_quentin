import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { GOALS, INTENSITIES, SPORT_FAMILIES } from "@/lib/validators";

// Les entrées ET les sorties sont enregistrées : si les formules évoluent, les anciens plans
// restent tels qu'ils ont été remis à l'athlète.
const planSchema = new Schema(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true },
    version: { type: Number, required: true },
    inputs: {
      weightKg: { type: Number, required: true },
      durationMin: { type: Number, required: true },
      intensity: { type: String, enum: INTENSITIES, required: true },
      sport: { type: String, enum: SPORT_FAMILIES, required: true },
      goal: { type: String, enum: GOALS, required: true },
    },
    outputs: {
      calories: { type: Number, required: true },
      carbsG: { type: Number, required: true },
      preCarbsG: { type: Number, required: true },
      hydrationMl: { type: Number, required: true },
      hydrationPerHourMl: { type: Number, required: true },
      proteinG: { type: Number, required: true },
      recoveryMinutes: { type: Number, required: true },
    },
    coachNotes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

planSchema.index({ athleteId: 1, version: -1 }, { unique: true });

export type NutritionPlanDoc = InferSchemaType<typeof planSchema>;

export const NutritionPlan: Model<NutritionPlanDoc> =
  (models.NutritionPlan as Model<NutritionPlanDoc>) ||
  model<NutritionPlanDoc>("NutritionPlan", planSchema);
