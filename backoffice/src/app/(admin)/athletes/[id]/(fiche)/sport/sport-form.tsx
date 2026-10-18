"use client";

import { useActionState } from "react";
import { SavedMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Field, inputClass, textareaClass } from "@/components/ui/field";
import type { FormState } from "@/lib/form-utils";
import { levelLabels } from "@/lib/labels";

export type SportFormValues = Partial<Record<
  | "disciplines" | "level" | "club" | "yearsOfPractice" | "weeklyHours" | "weeklySessions"
  | "maxHeartRate" | "restingHeartRate" | "ftp" | "vma" | "equipment",
  string
>>;

export function SportForm({
  action,
  defaults,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  defaults: SportFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const value = (name: keyof SportFormValues) => state?.values?.[name] ?? defaults[name] ?? "";
  const error = (name: string) => state?.errors?.[name]?.[0];

  return (
    <form action={formAction} className="grid max-w-3xl gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 font-display text-lg font-semibold">Pratique</legend>
        <Field
          label="Disciplines"
          hint="Séparées par des virgules : triathlon, trail, natation…"
          error={error("disciplines")}
          className="sm:col-span-2"
        >
          <input name="disciplines" defaultValue={value("disciplines")} className={inputClass} />
        </Field>
        <Field label="Niveau" error={error("level")}>
          <select name="level" defaultValue={value("level")} className={inputClass}>
            <option value="">Non renseigné</option>
            {Object.entries(levelLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Club" error={error("club")}>
          <input name="club" defaultValue={value("club")} className={inputClass} />
        </Field>
        <Field label="Années de pratique" error={error("yearsOfPractice")}>
          <input name="yearsOfPractice" type="number" min={0} max={70} step={1}
            defaultValue={value("yearsOfPractice")} className={inputClass} />
        </Field>
        <Field label="Volume hebdomadaire (heures)" error={error("weeklyHours")}>
          <input name="weeklyHours" type="number" min={0} max={40} step={0.5}
            defaultValue={value("weeklyHours")} className={inputClass} />
        </Field>
        <Field label="Séances par semaine" error={error("weeklySessions")}>
          <input name="weeklySessions" type="number" min={0} max={21} step={1}
            defaultValue={value("weeklySessions")} className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 font-display text-lg font-semibold">Repères physiologiques</legend>
        <Field label="FC max (bpm)" error={error("maxHeartRate")}>
          <input name="maxHeartRate" type="number" min={100} max={230} step={1}
            defaultValue={value("maxHeartRate")} className={inputClass} />
        </Field>
        <Field label="FC repos (bpm)" error={error("restingHeartRate")}>
          <input name="restingHeartRate" type="number" min={25} max={120} step={1}
            defaultValue={value("restingHeartRate")} className={inputClass} />
        </Field>
        <Field label="FTP (watts)" hint="Vélo" error={error("ftp")}>
          <input name="ftp" type="number" min={50} max={600} step={1}
            defaultValue={value("ftp")} className={inputClass} />
        </Field>
        <Field label="VMA (km/h)" hint="Course à pied" error={error("vma")}>
          <input name="vma" type="number" min={6} max={28} step={0.1}
            defaultValue={value("vma")} className={inputClass} />
        </Field>
      </fieldset>

      <Field label="Matériel utilisé" hint="Vélo, montre, capteurs, chaussures…" error={error("equipment")}>
        <textarea name="equipment" defaultValue={value("equipment")} className={textareaClass} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
        <SavedMessage saved={state?.saved} />
      </div>
    </form>
  );
}
