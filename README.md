# Planchette / CH'TRI COACHING

Stratégie de nutrition et de ravitaillement pour les athlètes.

| Dossier | Contenu |
| --- | --- |
| `frontend/` | Front office athlète (React + TypeScript + Vite) : profil, plan de ravitaillement minuté, produits, chrono avec rappels et jauges. Voir `frontend/README.md`. |
| `backoffice/` | Back-office coach (Next.js + MongoDB). Voir `backoffice/README.md`. |
| `src/`, `scripts/` | API produits (Express + MongoDB) alimentée par l'import Open Food Facts. |

## API produits

```bash
cp .env.example .env
npm install
npm run import:off   # import des produits sportifs Open Food Facts
npm run dev          # http://localhost:3000/api/products
```

## Front office

```bash
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Les calculs sont des repères généraux et ne remplacent pas l'accompagnement d'un professionnel de santé ou d'un diététicien du sport.
