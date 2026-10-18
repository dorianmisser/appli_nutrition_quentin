import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// Un document par mesure : l'historique est conservé et permet de tracer des courbes.
const measurementSchema = new Schema(
  {
    athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true },
    date: { type: Date, required: true },
    weightKg: { type: Number, min: 0 },
    heightCm: { type: Number, min: 0 },
    bodyFatPct: { type: Number, min: 0, max: 100 },
    waistCm: { type: Number, min: 0 },
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

measurementSchema.index({ athleteId: 1, date: -1 });

export type MeasurementDoc = InferSchemaType<typeof measurementSchema>;

export const Measurement: Model<MeasurementDoc> =
  (models.Measurement as Model<MeasurementDoc>) ||
  model<MeasurementDoc>("Measurement", measurementSchema);
