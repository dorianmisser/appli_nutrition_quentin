"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import type { FormState } from "@/lib/form-utils";
import { consentMethodLabels } from "@/lib/labels";

export function ConsentForm({
  action,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const error = (name: string) => state?.errors?.[name]?.[0];

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mode de recueil" error={error("method")}>
          <select name="method" defaultValue={state?.values?.method ?? ""} className={inputClass}>
            <option value="" disabled>Choisir…</option>
            {Object.entries(consentMethodLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Note (facultatif)" error={error("notes")}>
          <input name="notes" defaultValue={state?.values?.notes ?? ""} className={inputClass} />
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confirmed" className="mt-1 h-4 w-4 accent-[#c41732]" />
        <span>
          J&apos;atteste avoir recueilli ce consentement auprès de l&apos;athlète, après lui avoir
          présenté le texte ci-dessus.
          {error("confirmed") && <span className="mt-1 block text-brand">{error("confirmed")}</span>}
        </span>
      </label>
      {error("_form") && <p role="alert" className="text-sm text-brand">{error("_form")}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le consentement"}
        </Button>
      </div>
    </form>
  );
}
