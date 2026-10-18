"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

const inputClass =
  "h-11 w-full rounded border border-line bg-paper px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Mot de passe
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-brand">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded bg-ink text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
