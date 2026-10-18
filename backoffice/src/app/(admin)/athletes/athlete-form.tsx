"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { sexLabels, sourceSuggestions, sportLabels, statusLabels } from "@/lib/labels";
import type { FormState } from "./actions";

export type AthleteFormValues = Partial<Record<
  | "firstName" | "lastName" | "email" | "phone" | "birthDate" | "sex" | "status"
  | "source" | "mainSport" | "ecName" | "ecPhone" | "ecRelation",
  string
>>;

export function AthleteForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  defaults?: AthleteFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  // React 19 réinitialise le formulaire après l'action : on réinjecte les valeurs saisies.
  const value = (name: keyof AthleteFormValues) => state?.values?.[name] ?? defaults[name] ?? "";
  const error = (name: string) => state?.errors?.[name]?.[0];

  return (
    <form action={formAction} className="grid max-w-3xl gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 font-display text-lg font-semibold">Identité</legend>
        <Field label="Prénom" error={error("firstName")}>
          <input name="firstName" defaultValue={value("firstName")} required className={inputClass} />
        </Field>
        <Field label="Nom" error={error("lastName")}>
          <input name="lastName" defaultValue={value("lastName")} required className={inputClass} />
        </Field>
        <Field label="Email" error={error("email")}>
          <input name="email" type="email" defaultValue={value("email")} required className={inputClass} />
        </Field>
        <Field label="Téléphone" error={error("phone")}>
          <input name="phone" type="tel" defaultValue={value("phone")} className={inputClass} />
        </Field>
        <Field label="Date de naissance" error={error("birthDate")}>
          <input name="birthDate" type="date" defaultValue={value("birthDate")} className={inputClass} />
        </Field>
        <Field label="Sexe" error={error("sex")}>
          <select name="sex" defaultValue={value("sex")} className={inputClass}>
            <option value="">Non renseigné</option>
            {Object.entries(sexLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 font-display text-lg font-semibold">Suivi</legend>
        <Field label="Statut" error={error("status")}>
          <select name="status" defaultValue={value("status") || "prospect"} className={inputClass}>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Sport principal" error={error("mainSport")}>
          <select name="mainSport" defaultValue={value("mainSport")} className={inputClass}>
            <option value="">Non renseigné</option>
            {Object.entries(sportLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Comment nous a-t-il connus ?" error={error("source")} className="sm:col-span-2">
          <input name="source" list="sources" defaultValue={value("source")} className={inputClass} />
          <datalist id="sources">
            {sourceSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-4 font-display text-lg font-semibold">Contact d&apos;urgence</legend>
        <Field label="Nom">
          <input name="ecName" defaultValue={value("ecName")} className={inputClass} />
        </Field>
        <Field label="Téléphone">
          <input name="ecPhone" type="tel" defaultValue={value("ecPhone")} className={inputClass} />
        </Field>
        <Field label="Lien (conjoint, parent…)">
          <input name="ecRelation" defaultValue={value("ecRelation")} className={inputClass} />
        </Field>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : submitLabel}</Button>
        <Link href={cancelHref} className={buttonStyles("secondary")}>Annuler</Link>
      </div>
    </form>
  );
}
