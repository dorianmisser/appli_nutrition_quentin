"use client";

import { useActionState } from "react";
import { SavedMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Field, inputClass, textareaClass } from "@/components/ui/field";
import type { FormState } from "@/lib/form-utils";
import { dietLabels } from "@/lib/labels";

export type HealthFormValues = Partial<Record<
  | "allergies" | "intolerances" | "diet" | "dietNotes" | "medications" | "injuries"
  | "digestiveIssues" | "hydrationLitersPerDay" | "likedFoods" | "dislikedFoods" | "constraints",
  string
>>;

export function HealthForm({
  action,
  defaults,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  defaults: HealthFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const value = (name: keyof HealthFormValues) => state?.values?.[name] ?? defaults[name] ?? "";
  const error = (name: string) => state?.errors?.[name]?.[0];
  const listHint = "Séparés par des virgules";

  return (
    <form action={formAction} className="grid max-w-3xl gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 font-display text-lg font-semibold">Alimentation</legend>
        <Field label="Allergies" hint={listHint} error={error("allergies")}>
          <input name="allergies" defaultValue={value("allergies")} className={inputClass} />
        </Field>
        <Field label="Intolérances" hint={listHint} error={error("intolerances")}>
          <input name="intolerances" defaultValue={value("intolerances")} className={inputClass} />
        </Field>
        <Field label="Régime alimentaire" error={error("diet")}>
          <select name="diet" defaultValue={value("diet")} className={inputClass}>
            <option value="">Non renseigné</option>
            {Object.entries(dietLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Hydratation habituelle (litres par jour)" error={error("hydrationLitersPerDay")}>
          <input name="hydrationLitersPerDay" type="number" min={0} max={10} step={0.1}
            defaultValue={value("hydrationLitersPerDay")} className={inputClass} />
        </Field>
        <Field label="Précisions sur le régime" error={error("dietNotes")} className="sm:col-span-2">
          <textarea name="dietNotes" defaultValue={value("dietNotes")} className={textareaClass} />
        </Field>
        <Field label="Aliments appréciés" hint={listHint} error={error("likedFoods")}>
          <input name="likedFoods" defaultValue={value("likedFoods")} className={inputClass} />
        </Field>
        <Field label="Aliments détestés" hint={listHint} error={error("dislikedFoods")}>
          <input name="dislikedFoods" defaultValue={value("dislikedFoods")} className={inputClass} />
        </Field>
        <Field label="Contraintes (budget, temps de préparation…)" error={error("constraints")} className="sm:col-span-2">
          <textarea name="constraints" defaultValue={value("constraints")} className={textareaClass} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-4 font-display text-lg font-semibold">Santé</legend>
        <Field label="Blessures et antécédents" error={error("injuries")}>
          <textarea name="injuries" defaultValue={value("injuries")} className={textareaClass} />
        </Field>
        <Field label="Traitements en cours" error={error("medications")}>
          <textarea name="medications" defaultValue={value("medications")} className={textareaClass} />
        </Field>
        <Field label="Troubles digestifs à l'effort" error={error("digestiveIssues")}>
          <textarea name="digestiveIssues" defaultValue={value("digestiveIssues")} className={textareaClass} />
        </Field>
      </fieldset>

      {error("_form") && <p role="alert" className="text-sm text-brand">{error("_form")}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
        <SavedMessage saved={state?.saved} />
      </div>
    </form>
  );
}
