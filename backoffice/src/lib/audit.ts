import { connectDB } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";

type Actor = { id: string; name?: string | null; role: string };

export async function logAudit(entry: {
  user: Actor;
  action: "read" | "create" | "update" | "delete" | "export";
  resource: "healthProfile" | "sportProfile" | "measurement" | "consent" | "plan" | "athlete";
  athleteId: string;
  fields?: string[];
}) {
  // Volontairement non « fire and forget » : si la trace ne peut pas être écrite,
  // l'accès à la donnée de santé échoue aussi.
  await connectDB();
  await AuditLog.create({
    userId: entry.user.id,
    userName: entry.user.name ?? "Utilisateur",
    userRole: entry.user.role,
    action: entry.action,
    resource: entry.resource,
    athleteId: entry.athleteId,
    fields: entry.fields ?? [],
  });
}

export function changedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  keys: readonly string[]
) {
  return keys.filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]));
}
