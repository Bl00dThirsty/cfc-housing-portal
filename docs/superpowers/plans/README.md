# Plans d'implémentation — CFC

Deux spécifications sont en cours d'implémentation :

- [`../specs/2026-11-12-portal-ui-conformance-design.md`](../specs/2026-11-12-portal-ui-conformance-design.md)
  — cohérence de l'interface : moteur de table, suivi interactif, toasts,
  en-tête par rôle.
- [`../specs/2026-11-12-signup-kyc-onboarding-journey-design.md`](../specs/2026-11-12-signup-kyc-onboarding-journey.md)
  — parcours d'inscription, de KYC et d'onboarding.

Chacune couvre **plusieurs sous-systèmes indépendants**. Plutôt qu'un plan
unique de trente tâches, il y a **un plan par sous-système** : chacun produit
un logiciel qui fonctionne et se teste seul, et ils peuvent être confiés à
des agents distincts.

| Plan | Sous-système | Tâches | Étapes |
|---|---|---|---|
| [`2026-11-12-shared-data-table-engine.md`](2026-11-12-shared-data-table-engine.md) | Moteur de table partagé — tri multi-colonnes, facettes, groupement ; migration des 44 tableaux | 11 | 55 |
| [`2026-11-12-signup-kyc-onboarding-journey.md`](2026-11-12-signup-kyc-onboarding-journey.md) | Parcours d'inscription, de KYC et d'onboarding | 10 | ~60 |
| [`2026-11-12-interactive-tracking-drawer.md`](2026-11-12-interactive-tracking-drawer.md) | Suivi interactif — le panneau d'étape : qui, quoi, quand | 6 | 28 |
| [`2026-11-12-toast-layer.md`](2026-11-12-toast-layer.md) | Couche de toasts — actions, refus, événements temps réel | 6 | 26 |
| [`2026-11-12-role-aware-header.md`](2026-11-12-role-aware-header.md) | En-tête paramétré par le rôle — pôle, recherche scopée, actions rapides | 5 | 20 |

## Ordre d'exécution

```
1. Moteur de table partagé
2. Parcours d'inscription et d'onboarding
3. Suivi interactif
4. Couche de toasts
5. En-tête paramétré par le rôle
```

Les plans 2 à 5 sont **indépendants** du plan 1 et entre eux : ils ne
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
