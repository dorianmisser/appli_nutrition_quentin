import { hash } from "@node-rs/argon2";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { ROLES, passwordSchema, type Role } from "@/lib/validators";
import { User } from "@/models/User";

// Saisie en mode « raw » : chaque touche est lue individuellement, le mot de passe n'est jamais
// affiché ni conservé dans l'historique du terminal, et un retour chariot Windows (\r\n) n'est
// compté qu'une seule fois.
let skipLineFeed = false;

function prompt(label: string, secret = false): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(label);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const finish = (carriageReturn: boolean) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      skipLineFeed = carriageReturn;
      process.stdout.write("\n");
      resolve(value.trim());
    };

    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\u001b") return; // séquence d'échappement (flèches…) : ignorée
        if (ch === "\n" && skipLineFeed) { skipLineFeed = false; continue; }
        skipLineFeed = false;
        if (ch === "\r") return finish(true);
        if (ch === "\n") return finish(false);
        if (ch === "\u0003") { // Ctrl+C
          stdin.setRawMode(false);
          process.stdout.write("\nAnnulé.\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            if (!secret) process.stdout.write("\b \b");
          }
          continue;
        }
        if (ch < " ") continue;
        value += ch;
        if (!secret) process.stdout.write(ch);
      }
    };
    stdin.on("data", onData);
  });
}

type Parsed<T> = { value: T } | { error: string };

async function askValid<T>(label: string, parse: (input: string) => Parsed<T>, secret = false): Promise<T> {
  for (;;) {
    const result = parse(await prompt(label, secret));
    if ("value" in result) return result.value;
    console.log(`  ${result.error}`);
  }
}

const emailSchema = z.string().trim().toLowerCase().email();

async function main() {
  if (!process.stdin.isTTY) {
    throw new Error("Lancez ce script dans un terminal interactif (npm run user:create).");
  }

  const name = await askValid("Nom affiché : ", (v) => (v ? { value: v } : { error: "Le nom est obligatoire." }));
  const email = await askValid("Email : ", (v) => {
    const parsed = emailSchema.safeParse(v);
    return parsed.success ? { value: parsed.data } : { error: "Adresse email invalide, recommencez." };
  });
  const role = await askValid(`Rôle (${ROLES.join("/")}) [coach] : `, (v) => {
    const value = (v || "coach").toLowerCase();
    return (ROLES as readonly string[]).includes(value)
      ? { value: value as Role }
      : { error: `Rôle invalide : choisissez ${ROLES.join(" ou ")}.` };
  });

  let password = "";
  for (;;) {
    password = await askValid<string>("Mot de passe (12 caractères min., non affiché) : ", (v) => {
      const parsed = passwordSchema.safeParse(v);
      return parsed.success ? { value: parsed.data } : { error: parsed.error.issues[0].message };
    }, true);
    const confirm = await prompt("Confirmer le mot de passe : ", true);
    if (confirm === password) break;
    console.log("  Les mots de passe ne correspondent pas, recommencez.");
  }

  console.log(`\nCréation du compte : ${name} <${email}> (${role})`);
  await connectDB();
  if (await User.exists({ email })) throw new Error("Un utilisateur avec cet email existe déjà.");

  await User.create({ name, email, role, passwordHash: await hash(password) });
  console.log(`Utilisateur créé : ${email} (${role})`);
}

main()
  .catch((error) => {
    console.error(`Erreur : ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
