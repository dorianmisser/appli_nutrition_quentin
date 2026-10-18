import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";

// Utilisable sur un <button> comme sur un <Link> : <Link className={buttonStyles("secondary")}>
export function buttonStyles(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex h-10 items-center justify-center rounded px-4 text-sm font-semibold transition-colors disabled:opacity-60",
    variant === "primary" && "bg-ink text-white hover:bg-black",
    variant === "secondary" && "border border-line bg-paper hover:bg-fog",
    className
  );
}

export function Button({
  variant,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonStyles(variant, className)} {...props} />;
}
