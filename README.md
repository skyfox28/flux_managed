# FluxCore — Réception & Expédition

Application **Electron** de pilotage des flux logistiques d'un site : **flux
entrant (Réception)** et **flux sortant (Expédition)**, alimentée directement
par les fichiers Excel existants du site (`.xlsb` / `.xlsx` / `.xlsm`) — pas
de saisie manuelle, pas de nouvelle source de données à maintenir.

## Principe

L'application ne recalcule rien : elle **lit** deux fichiers Excel déjà
alimentés par d'autres process du site, et en affiche une synthèse
exploitable au quotidien.

- **Flux Réception** — fichier type `Planning_Réception_*.xlsb`, feuille
  `Synthèse` : palettes et camions reçus par jour et par site (Monteux1,
  Carp. Sucré, Carp. Salé, Pologne, Sous-Traitant, Rapatriement), cumul,
  capacité de la zone de réception et solde.
- **Flux Expédition** — fichier type `Analyse_Activité_Préparation.xlsb`,
  feuille `Activité Préparat-N° Livraison` : détail des livraisons du jour
  (palettes SILO, heures SILO, colis Picking, heures Picking, total colis)
  avec les totaux par jour et le total général.

Les deux chemins de fichiers sont **configurables indépendamment** depuis
l'écran Réglages (sélecteur de fichier natif). Une fois configuré, chaque
fichier est **surveillé** : dès qu'il est ré-enregistré (rafraîchissement
macro, mise à jour manuelle...), l'application relit automatiquement les
données, sans redémarrage.

Le parsing est fait par **repérage des en-têtes de colonnes** (et non par
position fixe), pour rester robuste si des colonnes/sites sont ajoutés,
retirés ou réordonnés dans les fichiers source.

## Stack

Electron · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
Recharts · SheetJS (`xlsx`, lecture native `.xlsb`) · Vite +
`vite-plugin-electron`.

## Développement

```bash
npm install
npm run dev          # Vite + Electron en mode dev (hot reload)
npm run build        # type-check (tsc -b) + build renderer/main/preload
npm run lint         # oxlint
npm run electron:pack   # build + package Electron non-installable (dossier)
npm run electron:dist   # build + génère l'installeur (electron-builder)
```

`npm run dev` lance à la fois le serveur Vite et la fenêtre Electron
(rechargement à chaud du renderer, rebuild automatique du process principal
et du preload à chaque modification).

## Architecture

```
electron/
  main.ts             Fenêtre principale, IPC, surveillance des fichiers
  preload.ts           Bridge contextIsolation (window.flux)
  settingsStore.ts      Persistance des 2 chemins de fichiers (userData)
  parsers/
    matrix.ts            Helpers génériques (dates Excel, recherche d'en-têtes)
    receptionParser.ts    Parsing feuille "Synthèse" (réception)
    expeditionParser.ts   Parsing feuille "Activité Préparat-N° Livraison"

src/
  types/flows.ts        Types partagés main <-> renderer
  state/FlowsContext.tsx  Contexte React : réglages, données, rafraîchissement
  components/
    layout/              Header + navigation (Réception / Expédition / Réglages)
    ui/                   Primitives Glass (GlassCard, KpiCard, AnimatedNumber...)
    settings/             Écran de configuration des 2 fichiers sources
    reception/            Dashboard flux entrant (KPI, graphique, tableau)
    expedition/           Dashboard flux sortant (KPI, graphique, tableau)
```

## Format des fichiers source attendus

L'application recherche, par nom de colonne, les feuilles contenant :

- **Réception** : colonnes `Date`, `Unité` (Palettes/Camions), une ou
  plusieurs colonnes "site", `S-TOTAL INTERSITES`, `Sous-Traitant`,
  `Rapatriement`, `Total Pal. Réception`, `Cumul`.
- **Expédition** : colonnes `Date Chargement`, `Livraison`, `Pal SILO`,
  `Colis Picking`, avec des lignes `Total <date>` et `Total général`.

Si ces colonnes ne sont pas trouvées, un message d'erreur explicite est
affiché plutôt qu'un plantage silencieux.
