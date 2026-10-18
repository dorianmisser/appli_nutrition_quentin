import { notFound } from "next/navigation";
import { ConsentRequired } from "@/components/consent-required";
import { DeleteButton } from "@/components/delete-button";
import { hasHealthConsent } from "@/lib/consents";
import { logAudit } from "@/lib/audit";
import { formatDay, formatDateTime, formatNumber, goalLabels, intensityLabels, sportLabels } from "@/lib/labels";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { getAthlete } from "@/lib/queries";
import { Measurement } from "@/models/Measurement";
import { NutritionPlan } from "@/models/NutritionPlan";
import { createPlan, deletePlan } from "../../../plan-actions";
import { PlanForm } from "./plan-form";

export const dynamic = "force-dynamic";

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold">{value}</dd>
    </div>
  );
}

export default async function PlansPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("coach");
  const { id } = await params;
  const athlete = await getAthlete(id);
  if (!athlete) notFound();
  if (!(await hasHealthConsent(id))) return <ConsentRequired athleteId={id} name={athlete.firstName} />;

  await connectDB();
  await logAudit({ user, action: "read", resource: "plan", athleteId: id });

  const [rawPlans, lastWeighing] = await Promise.all([
    NutritionPlan.find({ athleteId: id }).sort({ version: -1 }).lean(),
    Measurement.findOne({ athleteId: id, weightKg: { $ne: null } }).sort({ date: -1, createdAt: -1 }).lean(),
  ]);

  // inputs et outputs sont obligatoires dans le schéma : on les normalise une fois ici.
  const plans = rawPlans.map((p) => ({
    id: String(p._id),
    version: p.version,
    createdAt: p.createdAt,
    createdByName: p.createdByName,
    coachNotes: p.coachNotes ?? undefined,
    inputs: p.inputs!,
    outputs: p.outputs!,
  }));
  const latest = plans[0];
  // Priorité : dernier plan (mêmes réglages) puis dernière pesée, puis valeurs par défaut du calculateur.
  const defaults = {
    weightKg: lastWeighing?.weightKg !== undefined && lastWeighing?.weightKg !== null
      ? String(lastWeighing.weightKg) : latest ? String(latest.inputs.weightKg) : "",
    durationMin: latest ? String(latest.inputs.durationMin) : "90",
    intensity: latest?.inputs.intensity ?? "medium",
    sport: latest?.inputs.sport ?? athlete.mainSport ?? "endurance",
    goal: latest?.inputs.goal ?? "perform",
  };
  const weightHint = lastWeighing?.weightKg
    ? `Prérempli avec la pesée du ${formatDay(lastWeighing.date)}`
    : "Aucune pesée enregistrée : saisissez le poids";

  return (
    <div className="grid gap-6">
      <PlanForm action={createPlan.bind(null, id)} defaults={defaults} weightHint={weightHint} />

      <section>
        <h2 className="text-lg font-semibold">Historique des plans</h2>
        {plans.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucun plan pour le moment. Enregistrez le premier avec le formulaire ci-dessus.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {plans.map((p) => (
              <li key={p.id} className="rounded border border-line bg-paper p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Plan n° {p.version}
                      {p === latest && <span className="ml-2 text-sm font-normal text-emerald-700">Plan en cours</span>}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateTime(p.createdAt)} · {p.createdByName}
                    </p>
                  </div>
                  <form action={deletePlan.bind(null, id, p.id)}>
                    <DeleteButton message="Supprimer définitivement ce plan ?" />
                  </form>
                </div>
                <p className="mt-2 text-sm">
                  {sportLabels[p.inputs.sport]} · {p.inputs.durationMin} min · {intensityLabels[p.inputs.intensity]} ·{" "}
                  {goalLabels[p.inputs.goal]} · {formatNumber(p.inputs.weightKg)} kg
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <Figure label="Énergie" value={`${p.outputs.calories} kcal`} />
                  <Figure label="Glucides" value={`${p.outputs.carbsG} g`} />
                  <Figure label="Avant l'effort" value={`${p.outputs.preCarbsG} g`} />
                  <Figure label="Boisson" value={`${p.outputs.hydrationMl} ml`} />
                  <Figure label="Protéines" value={`${p.outputs.proteinG} g`} />
                </dl>
                {p.coachNotes && <p className="mt-3 border-t border-line pt-3 text-sm">{p.coachNotes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
