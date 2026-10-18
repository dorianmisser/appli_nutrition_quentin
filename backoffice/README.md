# CH'TRI COACHING — Back-office

Next.js (App Router) + TypeScript + MongoDB (Mongoose) + Zod + Tailwind.

## Démarrage

```bash
cp .env.example .env.local   # renseigner MONGODB_URI et AUTH_SECRET
npm install
npm run user:create          # crée le premier compte coach (saisie interactive)
npm run dev
```

- Application : http://localhost:3000
- Test de connexion à la base : http://localhost:3000/api/health

## Structure

- `src/lib/mongodb.ts` : connexion MongoDB mise en cache
- `src/lib/validators.ts` : schémas Zod partagés (client et serveur)
- `src/models/` : modèles Mongoose (`Athlete`, `User`)
- `src/auth.config.ts` / `src/auth.ts` : Auth.js (config edge-safe + provider identifiants, argon2)
- `src/middleware.ts` : protège toutes les pages sauf `/login`
- `src/lib/permissions.ts` : `requireRole("coach")` pour restreindre une page ou une route par rôle

## Écrans disponibles

- `/athletes` : liste paginée (20 par page), recherche par nom ou email, filtre par statut
- `/athletes/new` et `/athletes/[id]/edit` : formulaire partagé, validé par Zod côté serveur
- `/athletes/[id]` : fiche, avec archivage et réactivation (pas de suppression définitive pour l'instant)
- `/athletes/[id]/sport` : profil sportif (coach et assistant)
- `/athletes/[id]/sante` : santé et nutrition, **coach uniquement** ; lectures et modifications tracées dans la collection `auditlogs` (noms des champs modifiés, jamais les valeurs)
- `/athletes/[id]/mesures` : historique des mesures (poids, taille, % de masse grasse, tour de taille) avec courbe Recharts, **coach uniquement** et tracé dans le journal d'audit
- `/athletes/[id]/rgpd` : consentements (santé, communications), export JSON des données, effacement du volet santé, suppression définitive de l'athlète — **coach uniquement**. Tant que le consentement « données de santé » n'est pas enregistré, les onglets Santé et Mesures sont verrouillés (lecture et écriture)
- `/audit` : journal d'audit en lecture seule (filtres par action et type de donnée), **coach uniquement**
- Les textes de consentement sont dans `src/lib/consents.ts` : à faire valider par un juriste ou un DPO, et à compléter (durée de conservation)
- `/athletes/[id]/plans` : plans nutritionnels versionnés (entrées et résultats enregistrés), poids prérempli depuis la dernière pesée, aperçu en direct. Mêmes formules que le calculateur public (`src/lib/nutrition.ts`), recalculées côté serveur. **Coach uniquement**, verrouillé sans consentement santé, tracé dans l'audit
