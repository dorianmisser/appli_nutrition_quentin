import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { requireRole } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(); // toute personne connectée
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="border-b border-line">
        <div className="flex items-center justify-between pb-1">
          <p className="font-display text-2xl font-semibold">CH&apos;TRI COACHING</p>
          <UserMenu name={user.name} role={user.role} />
        </div>
        <NavLinks showAudit={user.role === "coach"} />
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}
