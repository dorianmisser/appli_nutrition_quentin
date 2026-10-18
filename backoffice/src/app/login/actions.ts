"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function authenticate(_previous: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Email ou mot de passe incorrect.";
    throw error; // la redirection réussie passe par une exception interne de Next.js
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
