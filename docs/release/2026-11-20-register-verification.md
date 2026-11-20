# Vérification locale — registres persistés (2026-11-20)

Périmètre : Prisma CFC — fiches de registre persistantes, écrans CRUD et
diffusion de notifications par rôle. Local + prêt pour PR uniquement : aucun
écrivain distant (Supabase hébergé, Vercel) n'a été utilisé.

## Migrations appliquées en local

```
npx supabase migration up --local
```

- `20261120131000_active_notification_recipients.sql` (PR-4) — appliquée.
- `20261120132000_active_notification_recipients_fix.sql` (PR-6) — appliquée.
  Correction propulsion décrite plus bas. Les migrations déjà appliquées
  n'ont pas été modifiées.

## Résultats des portes de vérification

| Commande | Résultat exact |
| --- | --- |
| `npx supabase test db --local` (pgTAP) | **PASS** — `Files=17, Tests=148`, 0 échec. `20261120_register_rls.test.sql` : ok. |
| `npm run test:system` | **PASS** — `tests 50`, `suites 13`, `pass 50`, `fail 0`, `skipped 0`. |
| `npm test` | **PASS** — `Test Files 95 passed | 5 skipped (100)` ; `Tests 530 passed | 17 skipped (547)`. |
| `npm run typecheck` | **PASS** — `tsc --noEmit`, sortie vide, code 0. |
| `npm run lint` | **PASS** — 0 erreur ; 1 avertissement préexistant (voir ci-dessous). |
| `npm run build` | **PASS** — `Compiled successfully in 26.8s`, `Generating static pages (11/11)`, sortie de production générée, code 0. |

Avertissement ESLint restant (non introduit par ces tâches, déjà présent depuis
PR-3, fichier non modifié ici) :

```
src/server/queries/registers.ts
  10:20  warning  'value' is defined but never used  @typescript-eslint/no-unused-vars
```

## Preuve TDD (rouge → vert)

| Tâche | Test | Rouge | Vert |
| --- | --- | --- | --- |
| PR-4 | `npx vitest run src/server/notifications/register-notifications.test.ts` | `Failed to resolve import "./register-notifications"` | `Test Files 1 passed`, `Tests 2 passed` |
| PR-5 | `npx vitest run src/components/registers/register-table.test.tsx` | `Failed to resolve import "./register-table"` | `Test Files 1 passed`, `Tests 1 passed` |
| PR-5 | `npx vitest run ... src/config/rbac/route-access.test.ts` | — (non-régression) | `Tests 12 passed` (11 route-access + 1 register-table) |
| PR-6 | `npm run test:system` | `SyntaxError: ... does not provide an export named 'buildRegisterFixtures'` — `fail 1` | `tests 50`, `pass 50`, `fail 0` |

## Smoke authentifié local — cinq routes de liste

Script temporaire (supprimé après exécution), sessions Supabase locales réelles
rejouées en cookie sur `http://localhost:3000` avec `node scripts/tmp-register-list-smoke.mjs` :

```
ADMIN   /portail-cfc/registres/{promoters,bet-experts,notary-offices,subsidies,recovery}           5 × 200
ADMIN   /portail-cfc/actors/{agency/promoters,risk-engineering/directory,notary-cadastre/directory,
        disbursements/subsidies,disbursements/recovery}                                             5 × 200
GUICHET /portail-cfc/registres/...                                                                 5 × 200
NOTAIRE /portail-cfc/registres/...                                                                 5 × 200
ALL PASS register list routes (ADMIN 10, GUICHET 5, NOTAIRE 5)                                    20/20
```

Le journal du serveur de développement confirme les `GET ... 200` pour chaque
route. Les pages de synthèse de périmètre non autorisées ont renvoyé la
redirection attendue vers `/portail-cfc/acces-refuse` (contrôle de route
existant, inchangé). La table d'accès a aussi été vérifiée directement : les
huit rôles habilités `register:read` ouvrent les cinq routes canoniques, les
rôles non habilités (DIASPORA, ANALYSTE, ARCHIVISTE, AUDIT) restent refusés.

## Notification — diffusion multi-rôles

Test local temporaire (supprimé après exécution) avec la vraie base Supabase et
le client service-role, `CFC_E2E=1 npx vitest run ...register-fanout.local.test.ts` :

```
[register smoke] notified=28 recipients=28 roles=ADMIN,PMO,GUICHET,DIASPORA,
GESTIONNAIRE,ANALYSTE,COMITE,NOTAIRE,RECOUVREMENT,AUDIT,RISQUES_BET,ARCHIVISTE,CITIZEN
Test Files 1 passed | Tests 1 passed
```

Soit 28 notifications in-app, 28 destinataires distincts et **13 rôles
distincts** — largement au-dessus de l'exigence « au moins deux rôles ». Les
charges utiles des rôles sans `register:read` sont génériques (aucun identifiant
ni libellé de fiche), y compris dans la clé d'idempotence.

## Écarts constatés et corrigés

1. **PR-4 — fuite PII dans la clé d'idempotence.** Le code littéral du brief
   construisait `dedupeKey: register:<clé>:<recordId>:<opération>:<libellé>`
   même pour les rôles sans `register:read`, ce qui faisait échouer le test
   « cache l'identifiant » du brief lui-même. Correction minimale : variante
   opaque hachée (SHA-256 tronqué) pour ces rôles, unicité par fiche conservée,
   texte français inchangé.
2. **PR-6 — prédicat d'actif erroné dans le RPC de destinataires.** Le SQL du
   brief comparait `staff_assignments.starts_at` (timestamptz) à
   `current_date` (minuit) : toute affectation commencée plus tôt le même jour
   était exclue, et les lignes supprimées logiquement étaient incluses. Résultat
   observé avant correction : `notified=3`, tous `CITIZEN`. Correction par une
   **nouvelle migration propulsion** `20261120132000_..._fix.sql` alignée sur
   `private.current_role()` (`starts_at <= now()`, `ends_at > now()`,
   `deleted_at is null`) avec `DISTINCT ON (a.id)` pour une seule notification
   par acteur. Après correction : `notified=28`, 13 rôles. Aucune fonction
   `SECURITY DEFINER` ajoutée ; `SECURITY INVOKER`, `service_role` uniquement.
3. **Avertissement ESLint préexistant** dans `src/server/queries/registers.ts`
   (PR-3) : laissé tel quel pour ne pas modifier une tâche déjà livrée.
4. **Post-revue — lien et dédup de notification.** Le lien des lecteurs
   autorisés pointait vers `/portail-cfc/actors/agency/...` (route
   `promoters` seulement) : remplacé par la route canonique PR-5
   `/portail-cfc/registres/<registerKey>/<recordId>` pour les cinq clés ;
   les lecteurs non autorisés restent à `actionUrl: null`. La clé de dédup
   n'incluait pas l'identité de l'écriture, si bien que deux mises à jour
   identiques étaient absorbées par l'`ignoreDuplicates` de `notify()`.
   Ajout de `eventId` (`randomUUID()` par écriture dans les actions) dans les
   deux branches de clé : brute pour les autorisés, hachée avec `recordId` et
   `label` pour les autres (aucune fuite en clé). Une notification par
   écriture, idempotence conservée au retry. Détails dans
   `.superpowers/sdd/pr-4-6-report.md`, section 8.

## Dirty worktree préservé

Les commits PR-4, PR-5 et PR-6 n'ont été créés qu'avec les fichiers de leur
tâche. Les modifications antérieures (PDF de démonstration, affiliation
diaspora, écrans clients, etc.) sont restées non indexées / non suivies dans
l'arbre de travail. Aucun `git reset`, aucun force-push, aucune perte de WIP.

## Re-vérification après correctifs de revue (2026-11-20)

| Commande | Résultat |
| --- | --- |
| `npx vitest run src/server/notifications/register-notifications.test.ts src/server/actions/registers.test.ts` | **PASS** — 2 fichiers, **5 tests** (dont 3 sur la charge utile de registre). |
| `npm test` | **PASS** — **95 fichiers / 100** (5 ignorés), **531 tests / 548** (17 ignorés). |
| `npm run typecheck` | **PASS** — sortie vide, code 0. |
| `npm run lint` | **PASS** — 0 erreur, 1 avertissement préexistant inchangé. |
| `npm run build` | **PASS** — compilé en 22,9 s, 11/11 pages statiques, code 0. |

La séquence TDD est documentée dans `.superpowers/sdd/pr-4-6-report.md` §8 :
rouge (2 échecs sur 5 : `actionUrl` et clé de dédup) puis vert (5/5). Aucune
écriture distante (Supabase hébergé, Vercel) ; WIP préservé.
