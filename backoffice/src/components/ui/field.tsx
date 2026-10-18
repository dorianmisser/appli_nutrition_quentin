import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full rounded border border-line bg-paper px-3 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export const textareaClass =
  "min-h-24 w-full rounded border border-line bg-paper px-3 py-2 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid content-start gap-1.5 text-sm font-medium", className)}>
      {label}
      {children}
      {hint && !error && <span className="text-xs font-normal text-muted">{hint}</span>}
      {error && <span className="text-sm font-normal text-brand">{error}</span>}
    </label>
  );
}
