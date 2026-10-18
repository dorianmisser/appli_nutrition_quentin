"use client";

import { useActionState } from "react";
import { inputClass } from "@/components/ui/field";
import type { FormState } from "@/lib/form-utils";

export function DeleteAthleteForm({
  action,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const error = state?.errors?.confirmation?.[0];

  return (
    <form action={formAction} className="mt-4 flex flex-wrap items-start gap-3">
      <div className="grid gap-1.5">
        <input
          name="confirmation"
          aria-label="Saisissez SUPPRIMER pour confirmer"
          placeholder="Saisir SUPPRIMER"
          autoComplete="off"
          className={`${inputClass} w-56`}
        />
        {error && <span className="text-sm text-brand">{error}</span>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Suppression…" : "Supprimer définitivement"}
      </button>
    </form>
  );
}
