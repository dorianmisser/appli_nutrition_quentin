import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export function ConsentRequired({ athleteId, name }: { athleteId: string; name: string }) {
  return (
    <div className="max-w-2xl rounded border border-line bg-paper p-8">
      <h2 className="font-display text-xl font-semibold">Consentement requis</h2>
      <p className="mt-2 text-sm text-muted">
        Les données de santé de {name} ne peuvent être ni saisies ni consultées tant que son
        consentement n&apos;est pas enregistré.
      </p>
      <Link href={`/athletes/${athleteId}/rgpd`} className={buttonStyles("primary", "mt-5")}>
        Enregistrer le consentement
      </Link>
    </div>
  );
}
