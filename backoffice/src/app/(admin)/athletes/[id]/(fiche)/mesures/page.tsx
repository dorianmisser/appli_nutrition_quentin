import { notFound } from "next/navigation";
import { ConsentRequired } from "@/components/consent-required";
import { hasHealthConsent } from "@/lib/consents";
import { DeleteButton } from "@/components/delete-button";
import { MeasurementChart, type ChartPoint } from "@/components/measurement-chart";
import { logAudit } from "@/lib/audit";
import { formatDay, formatNumber, todayParis } from "@/lib/labels";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { getAthlete } from "@/lib/queries";
import { Measurement } from "@/models/Measurement";
import { addMeasurement, deleteMeasurement } from "../../../measurement-actions";
import { MeasurementForm } from "./measurement-form";

export const dynamic = "force-dynamic";

export default async function MeasurementsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("coach"); // poids et composition corporelle : données de santé
  const { id } = await params;
  const athlete = await getAthlete(id);
  if (!athlete) notFound();
  if (!(await hasHealthConsent(id))) {
    return <ConsentRequired athleteId={id} name={athlete.firstName} />;
  }

  await connectDB();
  await logAudit({ user, action: "read", resource: "measurement", athleteId: id });

  // Ordre chronologique : sert au calcul des écarts et à la courbe.
  const raw = await Measurement.find({ athleteId: id }).sort({ date: 1, createdAt: 1 }).lean();
  const ascending = raw.map((m) => ({
    id: String(m._id),
    date: m.date,
    weightKg: m.weightKg ?? undefined,
    heightCm: m.heightCm ?? undefined,
    bodyFatPct: m.bodyFatPct ?? undefined,
    waistCm: m.waistCm ?? undefined,
    notes: m.notes ?? undefined,
  }));

  let previousWeight: number | undefined;
  const rows = ascending.map((m) => {
    const delta =
      m.weightKg !== undefined && previousWeight !== undefined ? m.weightKg - previousWeight : undefined;
    if (m.weightKg !== undefined) previousWeight = m.weightKg;
    return { m, delta };
  });
  const history = [...rows].reverse(); // le plus récent en premier

  const points: ChartPoint[] = ascending.map((m) => ({
    t: m.date.getTime(),
    weightKg: m.weightKg,
    bodyFatPct: m.bodyFatPct,
    waistCm: m.waistCm,
  }));

  return (
    <div className="grid gap-6">
      <MeasurementForm action={addMeasurement.bind(null, id)} today={todayParis()} />
      <MeasurementChart points={points} />

      <section>
        <h2 className="text-lg font-semibold">Historique</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Aucune mesure pour le moment. Ajoutez la première avec le formulaire ci-dessus.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded border border-line bg-paper">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-fog/60 text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Poids</th>
                  <th scope="col" className="px-4 py-3 font-medium">Écart</th>
                  <th scope="col" className="px-4 py-3 font-medium">Taille</th>
                  <th scope="col" className="px-4 py-3 font-medium">Masse grasse</th>
                  <th scope="col" className="px-4 py-3 font-medium">Tour de taille</th>
                  <th scope="col" className="px-4 py-3 font-medium">Note</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {history.map(({ m, delta }) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">{formatDay(m.date)}</td>
                    <td className="px-4 py-3">{m.weightKg !== undefined ? `${formatNumber(m.weightKg)} kg` : "–"}</td>
                    <td className="px-4 py-3 text-muted">
                      {delta === undefined ? "–" : `${delta > 0 ? "+" : ""}${formatNumber(delta)} kg`}
                    </td>
                    <td className="px-4 py-3">{m.heightCm !== undefined ? `${formatNumber(m.heightCm)} cm` : "–"}</td>
                    <td className="px-4 py-3">{m.bodyFatPct !== undefined ? `${formatNumber(m.bodyFatPct)} %` : "–"}</td>
                    <td className="px-4 py-3">{m.waistCm !== undefined ? `${formatNumber(m.waistCm)} cm` : "–"}</td>
                    <td className="max-w-48 truncate px-4 py-3 text-muted" title={m.notes}>{m.notes ?? "–"}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteMeasurement.bind(null, id, m.id)}>
                        <DeleteButton message="Supprimer définitivement cette mesure ?" />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
