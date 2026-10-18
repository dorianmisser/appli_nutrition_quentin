import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/lib/validators";

// À appeler en tête de chaque page ou route sensible : le middleware vérifie la connexion,
// cette fonction vérifie le rôle.
export async function requireRole(...allowed: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (allowed.length > 0 && !allowed.includes(session.user.role)) redirect("/?acces=refuse");
  return session.user;
}
