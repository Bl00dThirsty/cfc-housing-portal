# Plans d'implémentation — Cohérence de l'interface CFC

Ces plans implémentent la spécification
[`../specs/2026-11-12-portal-ui-conformance-design.md`](../specs/2026-11-12-portal-ui-conformance-design.md).

La spécification couvre **quatre sous-systèmes indépendants**. Plutôt qu'un
plan unique de trente tâches, il y a **un plan par sous-système** : chacun
produit un logiciel qui fonctionne et se teste seul, et ils peuvent être
confiés à des agents distincts.

| Plan | Sous-système | Tâches | Étapes |
|---|---|---|---|
| [`2026-11-12-shared-data-table-engine.md`](2026-11-12-shared-data-table-engine.md) | Moteur de table partagé — tri multi-colonnes, facettes, groupement ; migration des 44 tableaux | 11 | 55 |
| [`2026-11-12-interactive-tracking-drawer.md`](2026-11-12-interactive-tracking-drawer.md) | Suivi interactif — le panneau d'une étape : qui, quoi, quand | 6 | 28 |
| [`2026-11-12-toast-layer.md`](2026-11-12-toast-layer.md) | Couche de toasts — actions, refus, événements temps réel | 6 | 26 |
| [`2026-11-12-role-aware-header.md`](2026-11-12-role-aware-header.md) | En-tête paramétré par le rôle — pôle, recherche scopée, actions rapides | 5 | 20 |

## Ordre d'exécution

```
1. Moteur de table partagé      ──►  2. Suivi interactif
                                        3. Couche de toasts
                                        4. En-tête paramétré par le rôle
```

Les plans 2, 3 et 4 sont **indépendants** du plan 1 et entre eux : ils ne
portent pas sur les mêmes fichiers. Seule précaution : tous ajoutent des
règles de smoke, et le total monte à chaque plan (58 → 60 → 59 → 60).

## Règles communes

- **Une seule localisation par concept.** Un second store de tri, une seconde
  barre d'outils ou un second filtre est **supprimé**, jamais ajouté en
  parallèle.
- **Tout le texte visible est en français.**
- `src/domain/**` reste pur : ni React, ni Next, ni Supabase, ni composants.
- `src/components/**` n'importe ni `@supabase/*` ni `@/server/**` — sauf
  `@/server/actions/**`.
- Un échec ne doit jamais ressembler à une absence.
- Le build et le serveur de développement ne tournent **jamais** en même
  temps : `.next` est partagé.

## Validation de chaque plan

```bash
npm run typecheck      # exit 0
npm run lint           # exit 0 — 0 erreur, 0 avertissement
npm test               # tous les tests passés
npm run build          # exit 0 — serveur de développement arrêté
node scripts/smoke.mjs # le total annoncé par le plan
```
