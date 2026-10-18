# CH'TRI COACHING — Front office

Application athlète : profil, plan de ravitaillement minuté, catalogue produits, chrono avec rappels et jauges pendant l'effort.
React 19 + TypeScript + Vite, sans dépendance UI. Remplace l'ancien MVP statique (`index.html`, `script.js`, `style.css` à la racine).

## Lancer

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Le catalogue Open Food Facts vient de l'API Planchette (racine du dépôt, `npm run dev`, port 3000) :
en développement, Vite relaie `/api` vers `http://localhost:3000`. Sans API, l'application fonctionne avec un catalogue générique.
En production, renseigner `VITE_API_URL` (voir `.env.example`).

```bash
npm test           # moteur de calcul (Vitest)
npm run typecheck
npm run build      # sortie dans dist/
```

L'application utilise des URL propres (`/plans/…`) : le serveur de production doit renvoyer `index.html` pour toute route inconnue.

## Pages

| Route | Rôle |
| --- | --- |
| `/` | Accueil, exemple de ruban de ravitaillement |
| `/profil` | Poids, sudation (ou perte mesurée), habitude digestive, caféine, goûts, données facultatives pour la dépense journalière |
| `/plan` | Formulaire de séance avec aperçu des besoins en direct |
| `/plans/:id` | Plan : avant, pendant (prises minutées), après, couverture des cibles, impression |
| `/produits` | Catalogue (API + générique), favoris utilisés par les plans |
| `/effort/:id` | Chrono : rappel à chaque prise (notification, vibration, bip), jauges colorées, écran maintenu allumé |
| `/historique` | Plans et séances suivies, taux de prises respectées |

## Structure

```
src/
  domain/      moteur pur et testé : nutrition.ts (cibles), schedule.ts (prises), gauges.ts (jauges)
  data/        catalogue générique, valeurs par défaut
  services/    products.ts (API produits), storage.ts (persistance)
  components/  Layout, FuelStrip (ruban), GaugeBar, Segmented
  pages/       une page par route
  styles/      base (jetons), composants, pages
```

## Moteur de calcul (v2)

Les formules du MVP ont été remplacées par des repères publiés, cités en tête de `src/domain/nutrition.ts` :
glucides par paliers de durée (0 / 30 / 30–60 / 60–90 g/h) plafonnés selon l'habitude digestive,
hydratation 400–800 ml/h ajustée à la sudation et à la météo, sodium 300–600 mg/h sur effort long ou chaud,
caféine 2–3 mg/kg (plafond 6 mg/kg), récupération 0,3–0,4 g/kg de protéines et 1–1,2 g/kg/h de glucides si la séance suivante est proche.
**À faire valider par un diététicien du sport avant mise en production.**

## Points d'intégration restants

- **Persistance** : profil, plans et séances sont dans le `localStorage` du navigateur. Tout passe par `src/services/storage.ts` :
  brancher des routes API (MongoDB) ne demande de modifier que ce fichier.
- **Back-office** : `backoffice/src/lib/nutrition.ts` reprend encore les anciennes formules du MVP. Pour que coach et athlète voient
  les mêmes chiffres, il faut qu'il réutilise `src/domain/` (copie ou paquet partagé).
- **Base produits** : le modèle `Product` de l'API n'importe pas la caféine. Ajouter `caffeine_100g` à l'import Open Food Facts
  (`nutriments.caffeine100g`) pour que les gels caféinés de la base soient reconnus. Les goûts ne sont pas fournis par OFF.
- **Rappels écran verrouillé** : les notifications passent par l'API Notification du navigateur, page ouverte. Pour des rappels fiables
  téléphone en poche, prévoir une PWA avec service worker.
