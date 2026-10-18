import Link from "next/link";
import { notFound } from "next/navigation";
import { FicheTabs } from "@/components/fiche-tabs";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { requireRole } from "@/lib/permissions";
import { getAthlete } from "@/lib/queries";
import { setAthleteStatus } from "../../actions";

export default async function FicheLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole();
  const { id } = await params;
  const athlete = await getAthlete(id);
  if (!athlete) notFound();

  const archived = athlete.status === "archived";

  return (
    <main>
      <Link href="/athletes" className="text-sm text-muted hover:text-ink">
        ← Tous les athlètes
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            {athlete.firstName} {athlete.lastName}
          </h1>
          <div className="mt-2">
            <StatusBadge status={athlete.status} />
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/athletes/${id}/edit`} className={buttonStyles("primary")}>
            Modifier l&apos;identité
          </Link>
          <form action={setAthleteStatus.bind(null, id, archived ? "active" : "archived")}>
            <Button type="submit" variant="secondary">
              {archived ? "Réactiver" : "Archiver"}
            </Button>
          </form>
        </div>
      </div>

      <FicheTabs id={id} showHealth={user.role === "coach"} />
      <div className="mt-6">{children}</div>
    </main>
  );
}
