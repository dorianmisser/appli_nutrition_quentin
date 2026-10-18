import Link from "next/link";
import type { FilterQuery } from "mongoose";
import { StatusBadge } from "@/components/status-badge";
import { buttonStyles } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { formatDate, sportLabels, statusLabels } from "@/lib/labels";
import { connectDB } from "@/lib/mongodb";
import { Athlete, type AthleteDoc } from "@/models/Athlete";

const PAGE_SIZE = 20;

type SearchParams = { q?: string; status?: string; page?: string };

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildFilter({ q, status }: SearchParams): FilterQuery<AthleteDoc> {
  const filter: FilterQuery<AthleteDoc> = {};

  if (status === "all") {
    // aucun filtre sur le statut
  } else if (status && status in statusLabels) {
    filter.status = status;
  } else {
    filter.status = { $ne: "archived" }; // par défaut, les archivés sont masqués
  }

  // Chaque mot saisi doit se retrouver dans le prénom, le nom ou l'email.
  const tokens = (q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (tokens.length) {
    filter.$and = tokens.map((token) => {
      const regex = new RegExp(escapeRegex(token), "i");
      return { $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] };
    });
  }
  return filter;
}

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const filter = buildFilter(params);

  await connectDB();
  const [athletes, total] = await Promise.all([
    Athlete.find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Athlete.countDocuments(filter),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(params.q || params.status);

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    query.set("page", String(target));
    return `/athletes?${query}`;
  };

  return (
    <main>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Athlètes</h1>
        <Link href="/athletes/new" className={buttonStyles("primary")}>
          Nouvel athlète
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          type="search"
          defaultValue={params.q}
          placeholder="Rechercher par nom ou email"
          aria-label="Rechercher un athlète"
          className={`${inputClass} max-w-xs`}
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          aria-label="Filtrer par statut"
          className={`${inputClass} max-w-[12rem]`}
        >
          <option value="">Tous sauf archivés</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
          <option value="all">Tous, archivés inclus</option>
        </select>
        <button type="submit" className={buttonStyles("secondary")}>Filtrer</button>
        {filtered && (
          <Link href="/athletes" className="self-center text-sm text-muted hover:text-ink">
            Réinitialiser
          </Link>
        )}
      </form>

      {athletes.length === 0 ? (
        <div className="mt-6 rounded border border-line bg-paper p-10 text-center">
          <p className="font-display text-xl font-semibold">
            {filtered ? "Aucun athlète ne correspond à cette recherche." : "Aucun athlète pour le moment."}
          </p>
          <p className="mt-2 text-sm text-muted">
            {filtered
              ? "Modifiez la recherche ou le filtre de statut."
              : "Créez la première fiche pour commencer le suivi."}
          </p>
          {!filtered && (
            <Link href="/athletes/new" className={buttonStyles("primary", "mt-5")}>
              Nouvel athlète
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">
            {total} athlète{total > 1 ? "s" : ""}
          </p>
          <div className="mt-2 overflow-x-auto rounded border border-line bg-paper">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-fog/60 text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Nom</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email</th>
                  <th scope="col" className="px-4 py-3 font-medium">Sport</th>
                  <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                  <th scope="col" className="px-4 py-3 font-medium">Entrée</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((athlete) => (
                  <tr key={String(athlete._id)} className="border-b border-line last:border-0 hover:bg-fog/40">
                    <td className="px-4 py-3">
                      <Link href={`/athletes/${athlete._id}`} className="font-semibold hover:text-brand">
                        {athlete.lastName} {athlete.firstName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{athlete.email}</td>
                    <td className="px-4 py-3">{athlete.mainSport ? sportLabels[athlete.mainSport] : "–"}</td>
                    <td className="px-4 py-3"><StatusBadge status={athlete.status} /></td>
                    <td className="px-4 py-3 text-muted">{formatDate(athlete.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className={buttonStyles("secondary")}>Précédent</Link>
              ) : <span />}
              <span className="text-muted">Page {page} sur {pageCount}</span>
              {page < pageCount ? (
                <Link href={pageHref(page + 1)} className={buttonStyles("secondary")}>Suivant</Link>
              ) : <span />}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
