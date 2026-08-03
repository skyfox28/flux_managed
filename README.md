# FluxCore — Flow Management Logistique

Centre de pilotage logistique temps réel : calcule si l'équipe dispose de
suffisamment de capacité pour absorber la charge journalière (activité
SILO + Picking), avec un dashboard Glass Morphism futuriste, une
visualisation 3D du flux et des graphiques animés.

## Fonctionnalités

- **Saisie du jour** : palettes SILO, cadence SILO, colis Picking, cadence
  Picking, effectifs des 3 équipes (Matin / Après-midi / Journée, horaires
  fixes).
- **Calcul automatique** de la charge (SILO, Picking, totale), de la
  capacité disponible, du taux d'occupation, de la marge restante et de la
  surcapacité éventuelle — recalculé instantanément à chaque modification.
- **Jauge circulaire 3D** (React Three Fiber) colorée selon le taux
  d'occupation (vert / orange / rouge).
- **Visualisation 3D du flux** : palettes → silo → picking → expéditions,
  animée en temps réel, vitesse liée aux cadences.
- **Graphiques** : courbe de charge, histogramme SILO vs Picking, heatmap
  de charge par équipe/heure, évolution cumulée de la capacité.
- **Alertes intelligentes** : 🟢 capacité suffisante, 🟠 charge élevée,
  🔴 capacité insuffisante.
- **Simulateur** : sliders pour palettes, colis, cadences et effectifs —
  tout le dashboard se met à jour instantanément.

## Stack

React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · React Three
Fiber / Three.js · Recharts · Lucide Icons.

## Développement

```bash
npm install
npm run dev      # serveur de dev (http://localhost:5173)
npm run build    # build de production (tsc -b && vite build)
npm run lint      # oxlint
npm run preview  # prévisualiser le build
```

## Architecture

```
src/
  types/           Types métier (LogisticsInputs, LogisticsDerived, ...)
  lib/              Moteur de calcul (calculations.ts, timeline.ts, format.ts)
  state/            Contexte React global (LogisticsContext)
  components/
    layout/         Header
    ui/              Primitives Glass (GlassCard, AnimatedNumber, StatRow)
    inputs/          Simulateur (ControlPanel, SliderField)
    dashboard/       Cartes du dashboard (SILO, Picking, Ressources, Gauge...)
    scene/            Visualisation 3D du flux (FlowScene)
    charts/           Graphiques Recharts (courbe, histogramme, heatmap, évolution)
```

## Hypothèses de calcul

- `Temps SILO = palettes / cadence SILO` (ressource dédiée, indépendante
  des effectifs Picking) → mobilise l'équivalent d'1 préparateur pendant
  ce temps (`Charge SILO`).
- `Charge Picking = colis / cadence Picking` (préparateur-heures totales
  nécessaires) ; `Temps Picking = Charge Picking / nombre de
  préparateurs` (durée si tous les préparateurs picken en parallèle).
- `Capacité disponible = Σ (durée de l'équipe × effectif)` sur les 3
  équipes.
- `Taux d'occupation = Charge totale / Capacité disponible`. Seuils :
  < 80 % capacité suffisante, 80–100 % charge élevée, > 100 % capacité
  insuffisante.
