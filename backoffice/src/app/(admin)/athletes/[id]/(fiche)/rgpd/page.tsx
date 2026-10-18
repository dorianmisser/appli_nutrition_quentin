import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { buttonStyles } from "@/components/ui/button";
import { CONSENT_VERSION, consentTexts } from "@/lib/consents";
import { consentMethodLabels, formatDateTime } from "@/lib/labels";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { getAthlete } from "@/lib/queries";
import { CONSENT_PURPOSES } from "@/lib/validators";
import { Consent } from "@/models/Consent";
import { deleteAthlete, eraseHealthData, grantConsent, withdrawConsent } from "../../../consent-actions";
import { ConsentForm } from "./consent-form";
import { DeleteAthleteForm } from "./delete-athlete-form";

export const dynamic = "force-dynamic";

export default async function RgpdPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("coach");
  const { id } = await params;
  if (!(await getAthlete(id))) notFound();

  await connectDB();
  const consents = await Consent.find({ athleteId: id }).sort({ grantedAt: -1 }).lean();

  return (
    <div className="grid max-w-3xl gap-8">
      <section className="grid gap-4">
        <h2 className="font-display text-lg font-semibold">Consentements</h2>

        {CONSENT_PURPOSES.map((purpose) => {
          const active = consents.find((c) => c.purpose === purpose && !c.withdrawnAt);
          const withdrawn = consents.filter((c) => c.purpose === purpose && c.withdrawnAt);
          const { label, text } = consentTexts[purpose];

          return (
            <article key={purpose} className="rounded border border-line bg-paper p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">{label}</h3>
                <span className={`text-sm ${active ? "text-emerald-700" : "text-muted"}`}>
                  {active ? "Consentement accordé" : "Non accordé"}
                </span>
              </div>

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted hover:text-ink">
                  Texte à présenter à l&apos;athlète (version {CONSENT_VERSION})
                </summary>
                <p className="mt-2 rounded bg-fog/60 p-3 leading-relaxed">{text}</p>
              </details>

              {active ? (
                <div className="mt-4 text-sm">
                  <p>
                    Accordé le {formatDateTime(active.grantedAt)} · {consentMethodLabels[active.method]} ·
                    recueilli par {active.grantedByName}
                  </p>
                  {active.notes && <p className="mt-1 text-muted">Note : {active.notes}</p>}
                  {active.version !== CONSENT_VERSION && (
                    <p className="mt-2 text-brand">
                      Ce consentement porte sur une ancienne version du texte (version {active.version}) :
                      pensez à le renouveler.
                    </p>
                  )}
                  <form action={withdrawConsent.bind(null, id, String(active._id))} className="mt-3">
                    <DeleteButton
                      label="Enregistrer le retrait du consentement"
                      message={
                        purpose === "health_data"
                          ? "Enregistrer le retrait ? L'accès aux données de santé sera bloqué pour cet athlète."
                          : "Enregistrer le retrait de ce consentement ?"
                      }
                    />
                  </form>
                </div>
              ) : (
                <ConsentForm action={grantConsent.bind(null, id, purpose)} />
              )}

              {withdrawn.length > 0 && (
                <ul className="mt-4 border-t border-line pt-3 text-sm text-muted">
                  {withdrawn.map((c) => (
                    <li key={String(c._id)}>
                      Accordé le {formatDateTime(c.grantedAt)}, retiré le {formatDateTime(c.withdrawnAt)}
                      {c.withdrawnByName ? ` (${c.withdrawnByName})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-lg font-semibold">Droits de l&apos;athlète</h2>

        <article className="rounded border border-line bg-paper p-6">
          <h3 className="font-semibold">Export des données</h3>
          <p className="mt-1 text-sm text-muted">
            Télécharge toutes les données de l&apos;athlète (identité, profil sportif, santé, mesures,
            plans nutritionnels, consentements) dans un fichier JSON lisible. L&apos;export est inscrit dans le journal d&apos;audit.
          </p>
          <a
            href={`/api/athletes/${id}/export`}
            className={buttonStyles("secondary", "mt-4")}
          >
            Télécharger l&apos;export
          </a>
        </article>

        <article className="rounded border border-line bg-paper p-6">
          <h3 className="font-semibold">Effacer les données de santé</h3>
          <p className="mt-1 text-sm text-muted">
            Supprime le volet santé et nutrition, toutes les mesures et tous les plans nutritionnels.
            L&apos;identité et le profil sportif sont conservés.
          </p>
          <form action={eraseHealthData.bind(null, id)} className="mt-4">
            <DeleteButton
              label="Effacer les données de santé"
              message="Supprimer définitivement le volet santé, les mesures et les plans nutritionnels de cet athlète ?"
            />
          </form>
        </article>

        <article className="rounded border border-brand/40 bg-paper p-6">
          <h3 className="font-semibold text-brand">Supprimer l&apos;athlète</h3>
          <p className="mt-1 text-sm text-muted">
            Supprime définitivement la fiche et toutes les données associées, consentements compris.
            Cette action est irréversible. Seule une trace technique de la suppression reste dans le
            journal d&apos;audit.
          </p>
          <DeleteAthleteForm action={deleteAthlete.bind(null, id)} />
        </article>
      </section>
    </div>
  );
}
