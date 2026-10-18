import type { UpdateQuery } from "mongoose";

export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      values?: Record<string, string>;
      saved?: boolean;
    }
  | undefined;

export function readValues<const K extends readonly string[]>(formData: FormData, fields: K) {
  return Object.fromEntries(
    fields.map((field) => [field, String(formData.get(field) ?? "").trim()])
  ) as Record<K[number], string>;
}

export const optional = (text: string) => (text === "" ? undefined : text);

export function splitList(text: string) {
  return [...new Set(text.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
}

// Un champ vide dans le formulaire doit être supprimé en base (et pas simplement ignoré).
export function toUpdate(data: Record<string, unknown>, keys: readonly string[]) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  for (const key of keys) {
    if (data[key] === undefined) unset[key] = 1;
    else set[key] = data[key];
  }
  return {
    ...(Object.keys(set).length ? { $set: set } : {}),
    ...(Object.keys(unset).length ? { $unset: unset } : {}),
  } as UpdateQuery<never>;
}
