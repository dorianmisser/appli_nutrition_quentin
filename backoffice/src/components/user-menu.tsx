import { logout } from "@/app/login/actions";

const roleLabels = { coach: "Coach", assistant: "Assistant" } as const;

export function UserMenu({ name, role }: { name?: string | null; role: keyof typeof roleLabels }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span>
        {name} <span className="text-muted">({roleLabels[role]})</span>
      </span>
      <form action={logout}>
        <button type="submit" className="rounded border border-line px-3 py-1.5 hover:bg-fog">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
