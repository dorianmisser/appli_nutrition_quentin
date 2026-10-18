import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { LEVELS } from "@/lib/validators";

const sportProfileSchema = new Schema(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true, unique: true },
    disciplines: { type: [String], default: [] },
    level: { type: String, enum: LEVELS },
    club: { type: String, trim: true },
    yearsOfPractice: { type: Number, min: 0 },
    weeklyHours: { type: Number, min: 0 },
    weeklySessions: { type: Number, min: 0 },
    maxHeartRate: { type: Number },
    restingHeartRate: { type: Number },
    ftp: { type: Number },
    vma: { type: Number },
    equipment: { type: String },
  },
  { timestamps: true }
);

export type SportProfileDoc = InferSchemaType<typeof sportProfileSchema>;

export const SportProfile: Model<SportProfileDoc> =
  (models.SportProfile as Model<SportProfileDoc>) ||
  model<SportProfileDoc>("SportProfile", sportProfileSchema);
