import { notFound } from "next/navigation";
import { ConsentRequired } from "@/components/consent-required";
import { hasHealthConsent } from "@/lib/consents";
import { logAudit } from "@/lib/audit";
import { auditActionLabels, formatDateTime } from "@/lib/labels";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { getAthlete } from "@/lib/queries";
import { AuditLog } from "@/models/AuditLog";
import { HealthProfile } from "@/models/HealthProfile";
import { saveHealthProfile } from "../../../profile-actions";
import { HealthForm } from "./health-form";

export const dynamic = "force-dynamic";

const text = (value?: number | string | null) => (value === undefined || value === null ? "" : String(value));

export default async function HealthPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("coach"); // données de santé : coach uniquement
  const { id } = await params;
  const athlete = await getAthlete(id);
  if (!athlete) notFound();
  if (!(await hasHealthConsent(id))) {
    return <ConsentRequired athleteId={id} name={athlete.firstName} />;
  }

  await connectDB();
  // Lus avant l'écriture de la trace : on affiche les accès précédents, pas celui en cours.
  const recent = await AuditLog.find({ athleteId: id, resource: "healthProfile" })
    .sort({ at: -1 })
    .limit(5)
    .lean();
  await logAudit({ user, action: "read", resource: "healthProfile", athleteId: id });

  const p = await HealthProfile.findOne({ athleteId: id }).lean();

  return (
    <div className="grid gap-8">
      <p className="max-w-3xl rounded border border-line bg-fog/60 p-4 text-sm">
        Ces informations sont des données de santé. Recueillez le consentement explicite de
        l&apos;athlète avant toute saisie. Chaque consultation et chaque modification de cette page
        est enregistrée.
      </p>

      <HealthForm
        action={saveHealthProfile.bind(null, id)}
        defaults={{
          allergies: (p?.allergies ?? []).join(", "),
          intolerances: (p?.intolerances ?? []).join(", "),
          diet: text(p?.diet),
          dietNotes: text(p?.dietNotes),
          medications: text(p?.medications),
          injuries: text(p?.injuries),
          digestiveIssues: text(p?.digestiveIssues),
          hydrationLitersPerDay: text(p?.hydrationLitersPerDay),
          likedFoods: (p?.likedFoods ?? []).join(", "),
          dislikedFoods: (p?.dislikedFoods ?? []).join(", "),
          constraints: text(p?.constraints),
        }}
      />

      <section className="max-w-3xl">
        <h2 className="font-display text-lg font-semibold">Derniers accès</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucun accès enregistré avant celui-ci.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line rounded border border-line bg-paper text-sm">
            {recent.map((entry) => (
              <li key={String(entry._id)} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
                <span>
                  {entry.userName} · {auditActionLabels[entry.action]}
                  {entry.fields.length > 0 && (
                    <span className="text-muted"> ({entry.fields.length} champ{entry.fields.length > 1 ? "s" : ""})</span>
                  )}
                </span>
                <span className="text-muted">{formatDateTime(entry.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
