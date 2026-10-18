import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const auditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, enum: ["read", "create", "update", "delete", "export"], required: true },
  resource: { type: String, enum: ["healthProfile", "sportProfile", "measurement", "consent", "plan", "athlete"], required: true },
  athleteId: { type: Schema.Types.ObjectId, ref: "Athlete", required: true },
  // Noms des champs modifiés uniquement : jamais les valeurs, pour ne pas dupliquer de données de santé.
  fields: { type: [String], default: [] },
  at: { type: Date, default: Date.now },
});

auditLogSchema.index({ athleteId: 1, at: -1 });
auditLogSchema.index({ at: -1 });

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc>) || model<AuditLogDoc>("AuditLog", auditLogSchema);
