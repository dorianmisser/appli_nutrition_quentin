import { statusLabels } from "@/lib/labels";

const dots: Record<keyof typeof statusLabels, string> = {
  prospect: "bg-amber-500",
  active: "bg-emerald-600",
  paused: "bg-sky-600",
  archived: "bg-muted",
};

export function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${dots[status]}`} aria-hidden />
      {statusLabels[status]}
    </span>
  );
}
