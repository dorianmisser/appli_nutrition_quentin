"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const baseLinks = [
  { href: "/", label: "Tableau de bord" },
  { href: "/athletes", label: "Athlètes" },
];

export function NavLinks({ showAudit = false }: { showAudit?: boolean }) {
  const pathname = usePathname();
  const links = showAudit ? [...baseLinks, { href: "/audit", label: "Journal d'audit" }] : baseLinks;
  return (
    <nav aria-label="Navigation principale" className="mt-4 flex gap-6 text-sm">
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 pb-2",
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
