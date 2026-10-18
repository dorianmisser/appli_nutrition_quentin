"use client";

import { useActionState } from "react";
import { SavedMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import type { FormState } from "@/lib/form-utils";

export function MeasurementForm({
  action,
  today,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const value = (name: string, fallback = "") => state?.values?.[name] ?? fallback;
  const error = (name: string) => state?.errors?.[name]?.[0];

  return (
    <form action={formAction} className="rounded border border-line bg-paper p-6">
      <h2 className="text-lg font-semibold">Nouvelle mesure</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Field label="Date" error={error("date")}>
          <input name="date" type="date" max={today} required
            defaultValue={value("date", today)} className={inputClass} />
        </Field>
        <Field label="Poids (kg)" error={error("weightKg")}>
          <input name="weightKg" type="number" min={20} max={300} step={0.1}
            defaultValue={value("weightKg")} className={inputClass} />
        </Field>
        <Field label="Taille (cm)" error={error("heightCm")}>
          <input name="heightCm" type="number" min={100} max={250} step={0.5}
            defaultValue={value("heightCm")} className={inputClass} />
        </Field>
        <Field label="Masse grasse (%)" error={error("bodyFatPct")}>
          <input name="bodyFatPct" type="number" min={2} max={60} step={0.1}
            defaultValue={value("bodyFatPct")} className={inputClass} />
        </Field>
        <Field label="Tour de taille (cm)" error={error("waistCm")}>
          <input name="waistCm" type="number" min={40} max={200} step={0.5}
            defaultValue={value("waistCm")} className={inputClass} />
        </Field>
        <Field label="Note" error={error("notes")} className="sm:col-span-3 lg:col-span-5">
          <input name="notes" defaultValue={value("notes")} className={inputClass}
            placeholder="Conditions de mesure, balance utilisée…" />
        </Field>
      </div>
      {error("_form") && <p role="alert" className="mt-3 text-sm text-brand">{error("_form")}</p>}
      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Ajouter la mesure"}</Button>
        <SavedMessage saved={state?.saved} />
      </div>
    </form>
  );
}
