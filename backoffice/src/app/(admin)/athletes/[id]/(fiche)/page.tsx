import { notFound } from "next/navigation";
import { ageFrom, formatDate, sexLabels, sportLabels } from "@/lib/labels";
import { getAthlete } from "@/lib/queries";

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5">{children || "–"}</dd>
    </div>
  );
}

export default async function AthletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athlete = await getAthlete(id);
  if (!athlete) notFound();

  const age = ageFrom(athlete.birthDate);
  const contact = athlete.emergencyContact;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded border border-line bg-paper p-6">
        <h2 className="mb-4 text-lg font-semibold">Identité</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Info label="Email">{athlete.email}</Info>
          <Info label="Téléphone">{athlete.phone}</Info>
          <Info label="Date de naissance">
            {athlete.birthDate ? `${formatDate(athlete.birthDate)} (${age} ans)` : null}
          </Info>
          <Info label="Sexe">{athlete.sex ? sexLabels[athlete.sex] : null}</Info>
        </dl>
      </section>

      <section className="rounded border border-line bg-paper p-6">
        <h2 className="mb-4 text-lg font-semibold">Suivi</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Info label="Sport principal">
            {athlete.mainSport ? sportLabels[athlete.mainSport] : null}
          </Info>
          <Info label="Origine">{athlete.source}</Info>
          <Info label="Entrée">{formatDate(athlete.createdAt)}</Info>
          <Info label="Dernière modification">{formatDate(athlete.updatedAt)}</Info>
        </dl>
      </section>

      <section className="rounded border border-line bg-paper p-6 md:col-span-2">
        <h2 className="mb-4 text-lg font-semibold">Contact d&apos;urgence</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Info label="Nom">{contact?.name}</Info>
          <Info label="Téléphone">{contact?.phone}</Info>
          <Info label="Lien">{contact?.relation}</Info>
        </dl>
      </section>
    </div>
  );
}
