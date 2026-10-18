import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { CONSENT_METHODS, CONSENT_PURPOSES } from "@/lib/validators";

// Un document par consentement accordé. Le retrait renseigne withdrawnAt : l'historique est conservé
// pour pouvoir démontrer qui a consenti à quoi, sur quel texte et à quelle date.
const consentSchema = new Schema({
  athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true },
  purpose: { type: String, enum: CONSENT_PURPOSES, required: true },
  version: { type: String, required: true },
  method: { type: String, enum: CONSENT_METHODS, required: true },
  notes: { type: String, trim: true },
  grantedAt: { type: Date, default: Date.now },
  grantedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  grantedByName: { type: String, required: true },
  withdrawnAt: { type: Date },
  withdrawnBy: { type: Schema.Types.ObjectId, ref: "User" },
  withdrawnByName: { type: String },
});

consentSchema.index({ athleteId: 1, purpose: 1, grantedAt: -1 });

export type ConsentDoc = InferSchemaType<typeof consentSchema>;

export const Consent: Model<ConsentDoc> =
  (models.Consent as Model<ConsentDoc>) || model<ConsentDoc>("Consent", consentSchema);
