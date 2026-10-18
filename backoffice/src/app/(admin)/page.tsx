import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Athlete } from "@/models/Athlete";

export const dynamic = "force-dynamic";

async function getStatus() {
  try {
    await connectDB();
    const count = await Athlete.countDocuments();
    return { ok: true as const, count };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ acces?: string }>;
}) {
  const { acces } = await searchParams;
  const status = await getStatus();

  return (
    <main>
      {acces === "refuse" && (
        <p role="alert" className="mb-4 rounded border border-brand/30 bg-brand-soft p-3 text-sm">
          Cette section est réservée au coach.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-line bg-paper p-6">
          <h2 className="text-lg font-semibold">Base de données</h2>
          {status.ok ? (
            <p className="mt-2 text-sm text-muted">Connectée à MongoDB.</p>
          ) : (
            <p className="mt-2 text-sm text-brand">
              Connexion impossible : {status.message}. Vérifiez que MongoDB tourne et que
              MONGODB_URI est renseigné dans .env.local.
            </p>
          )}
        </div>

        <Link
          href="/athletes"
          className="rounded border border-line bg-paper p-6 hover:border-brand"
        >
          <h2 className="text-lg font-semibold">Athlètes</h2>
          <p className="mt-2 font-display text-4xl font-semibold text-brand">
            {status.ok ? status.count : "–"}
          </p>
          <p className="mt-1 text-sm text-muted">fiches enregistrées</p>
        </Link>
      </section>
    </main>
  );
}
