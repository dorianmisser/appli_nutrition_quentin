import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { connectDB } from "@/lib/mongodb";
import { Athlete } from "@/models/Athlete";
import { Consent } from "@/models/Consent";
import { HealthProfile } from "@/models/HealthProfile";
import { Measurement } from "@/models/Measurement";
import { NutritionPlan } from "@/models/NutritionPlan";
import { SportProfile } from "@/models/SportProfile";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });
  if (session.user.role !== "coach") return new Response("Accès refusé", { status: 403 });

  const { id } = await params;
  if (!isValidObjectId(id)) return new Response("Identifiant invalide", { status: 400 });

  await connectDB();
  const [athlete, sportProfile, healthProfile, measurements, plans, consents] = await Promise.all([
    Athlete.findById(id).lean(),
    SportProfile.findOne({ athleteId: id }).lean(),
    HealthProfile.findOne({ athleteId: id }).lean(),
    Measurement.find({ athleteId: id }).sort({ date: 1 }).lean(),
    NutritionPlan.find({ athleteId: id }).sort({ version: 1 }).lean(),
    Consent.find({ athleteId: id }).sort({ grantedAt: 1 }).lean(),
  ]);
  if (!athlete) return new Response("Athlète introuvable", { status: 404 });

  await logAudit({ user: session.user, action: "export", resource: "athlete", athleteId: id });

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), athlete, sportProfile, healthProfile, measurements, plans, consents },
    null,
    2
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="export-athlete-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
