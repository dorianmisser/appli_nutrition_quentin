import Link from "next/link";
import type { FilterQuery } from "mongoose";
import { buttonStyles } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { auditActionLabels, auditResourceLabels, formatDateTime } from "@/lib/labels";
import { connectDB } from "@/lib/mongodb";
import { requireRole } from "@/lib/permissions";
import { Athlete } from "@/models/Athlete";
import { AuditLog, type AuditLogDoc } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = { action?: string; resource?: string; page?: string };

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole("coach");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const filter: FilterQuery<AuditLogDoc> = {};
  if (params.action && params.action in auditActionLabels) filter.action = params.action;
  if (params.resource && params.resource in auditResourceLabels) filter.resource = params.resource;

  await connectDB();
  const [entries, total] = await Promise.all([
    AuditLog.find(filter).sort({ at: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    AuditLog.countDocuments(filter),
  ]);

  const athleteIds = [...new Set(entries.map((e) => String(e.athleteId)))];
  const athletes = await Athlete.find({ _id: { $in: athleteIds } }).select("firstName lastName").lean();
  const names = new Map(athletes.map((a) => [String(a._id), `${a.firstName} ${a.lastName}`]));

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (params.action) query.set("action", params.action);
    if (params.resource) query.set("resource", params.resource);
    query.set("page", String(target));
    return `/audit?${query}`;
  };

  return (
    <main>
      <h1 className="text-3xl font-semibold">Journal d&apos;audit</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Accès et modifications portant sur les données sensibles. Le journal est en lecture seule et ne
        contient jamais les valeurs des données, seulement les champs concernés.
      </p>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <select name="action" defaultValue={params.action ?? ""} aria-label="Filtrer par action"
          className={`${inputClass} max-w-[12rem]`}>
          <option value="">Toutes les actions</option>
          {Object.entries(auditActionLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select name="resource" defaultValue={params.resource ?? ""} aria-label="Filtrer par type de donnée"
          className={`${inputClass} max-w-[14rem]`}>
          <option value="">Tous les types</option>
          {Object.entries(auditResourceLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button type="submit" className={buttonStyles("secondary")}>Filtrer</button>
        {(params.action || params.resource) && (
          <Link href="/audit" className="self-center text-sm text-muted hover:text-ink">Réinitialiser</Link>
        )}
      </form>

      {entries.length === 0 ? (
        <p className="mt-6 rounded border border-line bg-paper p-8 text-center text-sm text-muted">
          Aucune entrée ne correspond à ces critères.
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">{total} entrée{total > 1 ? "s" : ""}</p>
          <div className="mt-2 overflow-x-auto rounded border border-line bg-paper">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-fog/60 text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Utilisateur</th>
                  <th scope="col" className="px-4 py-3 font-medium">Action</th>
                  <th scope="col" className="px-4 py-3 font-medium">Donnée</th>
                  <th scope="col" className="px-4 py-3 font-medium">Athlète</th>
                  <th scope="col" className="px-4 py-3 font-medium">Champs</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const athleteName = names.get(String(entry.athleteId));
                  return (
                    <tr key={String(entry._id)} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">{formatDateTime(entry.at)}</td>
                      <td className="px-4 py-3">{entry.userName} <span className="text-muted">({entry.userRole})</span></td>
                      <td className="px-4 py-3">{auditActionLabels[entry.action]}</td>
                      <td className="px-4 py-3">{auditResourceLabels[entry.resource]}</td>
                      <td className="px-4 py-3">
                        {athleteName ? (
                          <Link href={`/athletes/${entry.athleteId}`} className="hover:text-brand">{athleteName}</Link>
                        ) : (
                          <span className="text-muted">Athlète supprimé</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{entry.fields.length ? entry.fields.join(", ") : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link href={pageHref(page - 1)} className={buttonStyles("secondary")}>Précédent</Link> : <span />}
              <span className="text-muted">Page {page} sur {pageCount}</span>
              {page < pageCount ? <Link href={pageHref(page + 1)} className={buttonStyles("secondary")}>Suivant</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
