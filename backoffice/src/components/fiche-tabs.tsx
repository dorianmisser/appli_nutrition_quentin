"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function FicheTabs({ id, showHealth }: { id: string; showHealth: boolean }) {
  const pathname = usePathname();
  const base = `/athletes/${id}`;
  const tabs = [
    { href: base, label: "Identité" },
    { href: `${base}/sport`, label: "Profil sportif" },
    ...(showHealth
      ? [
          { href: `${base}/mesures`, label: "Mesures" },
          { href: `${base}/plans`, label: "Plans" },
          { href: `${base}/sante`, label: "Santé et nutrition" },
          { href: `${base}/rgpd`, label: "RGPD" },
        ]
      : []),
  ];

  return (
    <nav aria-label="Sections de la fiche" className="mt-6 flex gap-6 border-b border-line text-sm">
      {tabs.map(({ href, label }) => {
        const active = href === base ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2",
              active ? "border-brand font-semibold" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
