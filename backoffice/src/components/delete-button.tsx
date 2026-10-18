"use client";

export function DeleteButton({ message, label = "Supprimer" }: { message: string; label?: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="text-sm text-muted underline-offset-2 hover:text-brand hover:underline"
    >
      {label}
    </button>
  );
}
