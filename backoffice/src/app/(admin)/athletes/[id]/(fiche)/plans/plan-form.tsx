"use client";

import { useActionState, useState } from "react";
import { SavedMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Field, inputClass, textareaClass } from "@/components/ui/field";
import type { FormState } from "@/lib/form-utils";
import { goalLabels, intensityLabels, sportLabels } from "@/lib/labels";
import { computePlan } from "@/lib/nutrition";
import { GOALS, INTENSITIES, SPORT_FAMILIES } from "@/lib/validators";

type Defaults = { weightKg: string; durationMin: string; intensity: string; sport: string; goal: string };

export function PlanForm({
  action,
  defaults,
  weightHint,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  defaults: Defaults;
  weightHint?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [v, setV] = useState(defaults);
  const set = (name: keyof Defaults) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((current) => ({ ...current, [name]: event.target.value }));
  const error = (name: string) => state?.errors?.[name]?.[0];

  const weight = Number(v.weightKg);
  const duration = Number(v.durationMin);
  const valid =
    weight >= 35 && weight <= 200 && Number.isInteger(duration) && duration >= 15 && duration <= 600 &&
    (INTENSITIES as readonly string[]).includes(v.intensity) &&
    (SPORT_FAMILIES as readonly string[]).includes(v.sport) &&
    (GOALS as readonly string[]).includes(v.goal);
  const preview = valid
    ? computePlan({
        weightKg: weight,
        durationMin: duration,
        intensity: v.intensity as (typeof INTENSITIES)[number],
        sport: v.sport as (typeof SPORT_FAMILIES)[number],
        goal: v.goal as (typeof GOALS)[number],
      })
    : null;

  return (
    <form action={formAction} className="rounded border border-line bg-paper p-6">
      <h2 className="text-lg font-semibold">Nouveau plan</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Poids (kg)" hint={weightHint} error={error("weightKg")}>
          <input name="weightKg" type="number" min={35} max={200} step={0.1} required
            value={v.weightKg} onChange={set("weightKg")} className={inputClass} />
        </Field>
        <Field label="Durée de l'effort (minutes)" error={error("durationMin")}>
          <input name="durationMin" type="number" min={15} max={600} step={1} required
            value={v.durationMin} onChange={set("durationMin")} className={inputClass} />
        </Field>
        <Field label="Intensité" error={error("intensity")}>
          <select name="intensity" value={v.intensity} onChange={set("intensity")} className={inputClass}>
            {Object.entries(intensityLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Famille de sport" error={error("sport")}>
          <select name="sport" value={v.sport} onChange={set("sport")} className={inputClass}>
            {Object.entries(sportLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Objectif" error={error("goal")}>
          <select name="goal" value={v.goal} onChange={set("goal")} className={inputClass}>
            {Object.entries(goalLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Notes du coach" error={error("coachNotes")} className="sm:col-span-2 lg:col-span-3">
          <textarea name="coachNotes" defaultValue={state?.values?.coachNotes ?? ""} className={textareaClass}
            placeholder="Ajustements, produits conseillés, points d'attention…" />
        </Field>
      </div>

      <div className="mt-5 rounded bg-fog/60 p-4 text-sm" aria-live="polite">
        {preview ? (
          <p>
            <span className="font-semibold">Aperçu :</span> {preview.calories} kcal · {preview.carbsG} g de
            glucides (dont {preview.preCarbsG} g avant l&apos;effort) · {preview.hydrationMl} ml à boire
            pendant l&apos;effort ({preview.hydrationPerHourMl} ml/h) · {preview.proteinG} g de protéines
            de récupération dans les {preview.recoveryMinutes} min
          </p>
        ) : (
          <p className="text-muted">Renseignez un poids (35 à 200 kg) et une durée (15 à 600 min) pour voir l&apos;aperçu.</p>
        )}
      </div>

      {error("_form") && <p role="alert" className="mt-3 text-sm text-brand">{error("_form")}</p>}
      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={pending || !valid}>{pending ? "Enregistrement…" : "Enregistrer le plan"}</Button>
        <SavedMessage saved={state?.saved} />
      </div>
    </form>
  );
}
