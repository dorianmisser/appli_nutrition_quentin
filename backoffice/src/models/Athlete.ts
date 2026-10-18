import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ATHLETE_STATUSES, SPORT_FAMILIES } from "@/lib/validators";

const athleteSchemaDb = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, trim: true },
    birthDate: { type: Date },
    sex: { type: String, enum: ["female", "male", "other"] },
    status: { type: String, enum: ATHLETE_STATUSES, default: "prospect", index: true },
    source: { type: String, trim: true },
    mainSport: { type: String, enum: SPORT_FAMILIES },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  { timestamps: true }
);

athleteSchemaDb.index({ lastName: 1, firstName: 1 });

export type AthleteDoc = InferSchemaType<typeof athleteSchemaDb>;

export const Athlete: Model<AthleteDoc> =
  (models.Athlete as Model<AthleteDoc>) || model<AthleteDoc>("Athlete", athleteSchemaDb);
