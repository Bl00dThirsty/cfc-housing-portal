# Cohérence de l'interface CFC — tables, suivi interactif, toasts, en-tête par rôle

**Date** : 2026-11-12
**Portée** : portail `cfc-housing-portal` (Next.js 16 / React 19 / Supabase / Tailwind v4)
**Référence visuelle** : kit `guichet-unque-cfc` (adapté à la charte CFC brun/or)

---

## 1. Pourquoi ce chantier

Le portail a grandi par strates : chaque écran a reçu son propre traitement de
table, son propre en-tête, son propre rendu d'erreur. Quatre conséquences sont
visibles :

| Constat | Conséquence |
|---|---|
| 44 tables, 4 traitements de filtre distincts (`FilterMenu`, `DataTableToolbar`, filtres maison, aucun filtre) | Un agent qui apprend un écran ne sait pas lire l'autre |
| L'en-tête de la console est identique pour les 7 rôles agent | Un risque voit « File de support » et une recherche « DUC, prêt, client » là où son périmètre est ailleurs |
| Aucun toast dans l'application | Une action réussie ou échouée ne se signale que par un changement de page |
| Le suivi du dossier est une frise **inerte** | L'emprunteur voit *où* il en est, jamais *qui a fait quoi, quand* |

Ce chantier rend l'interface **homogène** : un moteur de table unique, un
suivi cliquable, une couche de notifications transitoire, un en-tête paramétré
par le rôle.

**Principe directeur : une seule localisation canonique par concept.** Un
deuxième exemplaire d'un filtre, d'un store de tri ou d'un en-tête est
**supprimé**, pas ajouté en parallèle.

---

## 2. Fondations (préalable bloquant)

`src/hooks/use-chat-scroll.tsx` appelle `container.scrollTo(...)`. jsdom
n'implémente pas `scrollTo` : l'effet lève `TypeError`, le composant de chat
ne se monte pas, et les tests `src/components/support/support-chat.test.tsx`
échouent.

Correction à **deux** niveaux, parce que ce sont deux défauts distincts :

1. `src/hooks/use-chat-scroll.tsx` — garde défensive :
   `if (typeof container.scrollTo !== "function") return;`.
   Le hook reste correct dans *tout* environnement, pas seulement sous test.
2. `vitest.setup.ts` — doublure `Element.prototype.scrollTo ??= …`, dans le
   même esprit que la doublure `scrollIntoView` existante.

`src/components/support/debug.test.tsx` (fichier de débogage temporaire) est
**supprimé**.

---

## 3. Moteur de table partagé

### 3.1 Emplacement

Nouveau dossier `src/components/data-table/` — écho du kit
(`components/companies/table/`). Le dossier regroupe uniquement le moteur ;
les primitives d'interface restent dans `src/components/ui/`.

| Fichier | Rôle |
|---|---|
| `src/components/data-table/types.ts` | Types `DataColumn<T>`, `SortRule`, `FilterRule`, `GroupRule` |
| `src/components/data-table/use-data-table.ts` | Hook d'orchestration (état + actions + lignes dérivées) |
| `src/components/data-table/data-table.tsx` | Rendu : en-têtes triables, lignes, en-têtes de groupe |
| `src/lib/data-table.ts` | Fonctions **pures** : recherche, filtres, tris, groupement |

### 3.2 Le contrat de colonne

```ts
export interface DataColumn<T> {
  key: string;
  label: string;
  /** Valeur utilisée pour trier, filtrer et grouper. */
  accessor?: (row: T) => string | number | boolean | null | undefined;
  /** Rendu de la cellule. Par défaut : la valeur de `accessor`. */
  render?: (row: T) => React.ReactNode;
  /** Exclusion explicite du tri (colonnes d'icônes). */
  sortable?: boolean;
  /** Le groupe de facettes est alimenté par cet accesseur. */
  filterable?: boolean;
  /** Cette colonne peut servir de clé de groupement. */
  groupable?: boolean;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
}
```

Une colonne est triable si elle a un `accessor` ; `sortable: false` sert à
l'exclure explicitement. Un tableau de valeurs est rendu par `render`.

### 3.3 Sémantique du filtrage

- **ET entre facettes**, **OU à l'intérieur d'une facette**.
- Recherche texte : insensible à la casse, sur la concaténation des valeurs
  textuelles de la ligne.
- Chaque facette est alimentée par les valeurs distinctes de la colonne,
  calculées sur le jeu de lignes **complet** (avant filtrage) : une option ne
  disparaît pas sous les yeux de l'agent parce qu'il vient de cocher une
  autre facette.
- L'état d'une facette est porté par le store (cf. 3.6), pas par le
  composant : il survit au re-routage côté client. Un rechargement complet de
  la page repart de l'état initial.

### 3.4 Sémantique du tri

Tri **multi-colonnes**, prioritaire :

- Clic sur un en-tête → devient le tri principal (priorité 1).
- Clic sur un en-tête déjà trié → bascule ascendant/descendant.
- `Shift` + clic → ajoute une colonne secondaire (priorité 2, 3, …).
- `Shift` + clic sur une colonne déjà triée → la retire.
- Tri **stable** : à valeur égale, l'ordre d'origine est conservé.
- Comparaison : numérique si les deux valeurs sont des nombres, sinon
  `localeCompare(…, "fr")`. Les valeurs nulles se placent en fin de liste.

L'en-tête affiche le libellé, la flèche de direction et le **rang de
priorité** quand le tri est multi-colonnes.

### 3.5 Sémantique du groupement

**Un seul niveau de groupement** (décision actée). Le sélecteur « Grouper par »
liste les colonnes marquées `groupable`.

- Le rendu produit une **ligne d'en-tête de groupe** : libellé de la valeur,
  effectif du groupe, et repli repliable.
- Quand le groupement est actif, le tri s'applique **à l'intérieur** de chaque
  groupe. L'ordre des groupes suit la clé de groupement, croissant ; si une
  colonne de tri est la clé de groupement, sa direction s'applique aussi à
  l'ordre des groupes.
- Le groupement ne supprime pas le tri : les deux réglages cohabitent, et la
  barre d'outils affiche le groupement en cours à côté des pastilles de tri.

### 3.6 Qui possède l'état

**Un seul store zustand**, `src/stores/data-table-store.ts`, indexé par
`tableId` :

```ts
type TableState = {
  search: string;
  sorts: SortRule[];              // priorité 1 en tête
  filters: Record<string, string[]>;
  groupBy: string | null;
};
type TablesStore = {
  byTable: Record<string, TableState>;
  setSearch(tableId, value): void;
  toggleSort(tableId, key, additive): void;
  setFilter(tableId, facetId, values): void;
  setGroupBy(tableId, key): void;
  reset(tableId): void;
};
```

Un store unique indexé, **pas** un store par tableau : 44 tableaux ne
produisent pas 44 propriétaires d'état.

### 3.7 Barre d'outils

`src/components/ui/data-table-toolbar.tsx` (déjà utilisée par 4 écrans)
devient la **barre d'outils canonique**. Elle gagne :

- le sélecteur **« Grouper par »**,
- les **pastilles de tri** (colonne + direction + rang, supprimables),
- le compteur `filtré / total` (déjà présent),
- l'export CSV (là où l'écran le propose déjà).

`src/components/ui/data-table-faceted-filter.tsx` reste la primitive de
facette. `src/components/clients/toolbar/clients-toolbar.tsx` et
`src/components/_common/filter-menu.tsx` sont **supprimés** : il n'y a plus
qu'un concept de filtre, avec un seul propriétaire.

### 3.8 Migration des 44 tableaux

Chaque tableau déclare ses colonnes et devient piloté par le moteur. La
migration est mécanique et suit toujours le même schéma :

```tsx
const COLUMNS: DataColumn<Row>[] = [
  { key: "nom", label: "Emprunteur", accessor: (r) => r.name },
  { key: "phase", label: "Phase", accessor: (r) => r.phase, groupable: true },
  { key: "montant", label: "Montant", accessor: (r) => r.loanAmount, align: "right" },
];

<DataTable
  tableId="clients"
  columns={COLUMNS}
  rows={rows}
  getRowId={(r) => r.id}
  emptyLabel="Aucun emprunteur ne correspond aux filtres appliqués."
/>
```

Les tableaux **déjà** interactifs conservent leur comportement : le kanban
(glisser-déposer), la liste de l'épargne (sous-totaux), les onglets analytics.
Quand une table ne peut pas être pilotée par le moteur (kanban : grille de
colonnes, pas des lignes), elle reste une page dédiée et **le dit** — elle
n'imite pas le moteur.

---

## 4. Suivi interactif du dossier

### 4.1 Mapping étape ↔ événements

`src/domain/workflows/tracking.ts` (propriétaire unique de l'indexation des
étapes) gagne :

```ts
export const STEP_EVENT_TYPES: Record<string, readonly string[]>;
```

Il associe à chaque code d'étape (`CRD-01`…`CRD-13`, `GAR-01`) les types
d'événements du journal qui l'attestent.

Deux règles d'attribution, dans cet ordre :

1. **Attribution explicite** : l'événement correspond si son `event_type`
   figure dans `STEP_EVENT_TYPES[code]`.
2. **Attribution par charge utile** : l'événement correspond si
   `payload.step_code` vaut le code de l'étape — quelle que soit son type.
   C'est ce qui permet à une action de support (`support.message`) ou à une
   pièce (`document.uploaded`) d'atterrir sur l'étape concernée.

Un événement sans correspondance tombe dans le groupe « Autres événements du
dossier » — il n'est jamais silencieusement perdu.

### 4.2 Lecture des événements

`getCitizenTracking` (`src/server/queries/citizen-space.ts`) lit déjà
`public.dossier_events` (100 derniers événements) mais **n'expose pas** les
événements. `CitizenTracking` gagne un champ `events: DossierEvent[]`. Aucun
appel réseau supplémentaire : le drawer filtre côté client sur des données
déjà chargées.

### 4.3 « Qui » — le rôle, pas le nom

Pour l'emprunteur, « qui » = le **rôle** : `actor_role` → libellé humain
(Emprunteur, Agence, Siège, Comité, Partenaire, Support). Le mapping est
unique et vit dans `src/domain/entities/processes.ts`, à côté de
`DOSSIER_EVENT_LABELS` qui porte déjà le vocabulaire des événements.

**Aucun nom de personne ne transite vers l'emprunteur.** La console, elle,
peut afficher le nom de l'agent : c'est un usage interne de la banque.

### 4.4 Le drawer

Nouveau `src/components/tracking/step-detail-drawer.tsx`, bâti sur
`src/components/ui/sheet.tsx` (déjà présent).

Contenu :

1. En-tête : code, libellé, phase, couloir, état.
2. Liste chronologique (plus récent en premier) des événements de l'étape :
   **quoi** (libellé de l'événement) · **qui** (rôle) · **quand**
   (date relative + date absolue).
3. Résumé de la charge utile (`payload`) quand elle porte de l'information
   lisible — sinon rien.

États distincts, jamais confondus :

- *aucun événement* → « Aucun événement pour cette étape » ;
- *lecture impossible* → `ErrorState` avec reprise ;
- *chargement* → squelette.

`src/app/tracking/_components/tracking-stepper.tsx` rend chaque étape
cliquable (bouton, pas `<div>` : accessibilité clavier et `aria-expanded`).

### 4.5 Portée

Le drawer est un composant **partagé** : `src/app/tracking` l'utilise en
premier lieu ; la console pourra le brancher sur la fiche dossier.

---

## 5. Couche de toasts

### 5.1 Bibliothèque et montage

`sonner` est ajoutée. Un seul `<CfcToaster />` (`src/components/ui/toaster.tsx`)
est monté dans `src/app/layout.tsx`, thémé avec les jetons CFC (brun, or,
`--danger`, `--success`).

### 5.2 Propriétaire du retour d'action

`src/lib/action-feedback.ts` :

```ts
export function reportAction(
  result: { ok: true } | { ok: false; error: string },
  successMessage?: string,
): boolean;
```

- `ok: false` → `toast.error(result.error)` et retour `false`.
- `ok: true` → `toast.success(successMessage)` si un message est fourni,
  retour `true`.

Tous les appels serveur suivent déjà la convention `{ ok, error }` : le helper
n'a pas besoin d'inventer un format.

Le module est **côté client** (il appelle `toast` de `sonner`) : il n'est
importé que depuis des composants clients. Un composant serveur signale
l'échec par son `ErrorState`, jamais par un toast.

### 5.3 Points de câblage

| Événement | Toast |
|---|---|
| Connexion réussie | « Connexion réussie — bienvenue » |
| Déconnexion | « Vous êtes déconnecté » |
| Ouverture de l'espace citoyen | récapitulatif de l'état du dossier (« Dossier à 62 % · 2 pièces à fournir ») |
| Écriture réussie (dossier, épargne, KYC, modèle d'e-mail…) | message métier |
| Échec d'action | message d'erreur du serveur |
| Échec de téléversement | message + action de reprise |
| Notification reçue en temps réel | titre de la notification |
| Message de support reçu en temps réel | « Nouveau message du conseiller » |

Deux toasts distincts sur l'entrée du citoyen : celui de la **connexion**
(émis par `sign-in-form.tsx`) et celui du **récapitulatif de dossier** (émis
par l'espace citoyen à l'ouverture). Ils ne se déclenchent pas l'un l'autre.

### 5.4 Règle de complémentarité

Un toast est un **signal transitoire**. Un échec qui bloque la tâche de
l'utilisateur **garde aussi** son `ErrorState` en ligne. Le toast ne remplace
jamais l'`ErrorState` ; il l'accompagne.

---

## 6. En-tête paramétré par le rôle

### 6.1 Un seul composant

`src/components/layout/portal-header.tsx` — une coque :

```
[logo + contexte de rôle] [emplacement central] [actions rapides] [cloche][thème][menu identité]
```

- **gauche** : logo + libellé du rôle (`Espace citoyen`, `Pôle Risques & BET`).
- **centre** : les onglets (citoyen) ou la recherche scopée (agent).
- **droite** : actions rapides du rôle, puis cloche, thème, menu identité.

Les deux portails rendent **la même** coque : `client-header.tsx` et l'en-tête
d'`admin-shell.tsx` deviennent des **compositions** de `PortalHeader`, plus
deux implémentations parallèles.

### 6.2 Un seul propriétaire de la configuration

`src/config/rbac/role-header.ts`, à côté de `sidebar-by-role.ts` et
`route-access.ts` :

```ts
export interface RoleHeaderConfig {
  /** Libellé du pôle affiché à gauche. */
  contextLabel: string;
  /** Recherche : placeholder et périmètre réel. */
  search?: { placeholder: string; scope: string };
  /** Actions rapides, filtrées par capacité. */
  quickActions: QuickAction[];
  /** La file de support est-elle pertinente pour ce rôle ? */
  showSupport: boolean;
}
```

Chaque `QuickAction` porte la `capability` qu'elle exige : le filtrage
repose sur `canSeeNavItem` (la politique existante), donc **un rôle ne voit
jamais une action qu'il ne peut pas accomplir**.

### 6.3 Actions rapides par rôle

| Rôle | Action(s) |
|---|---|
| Guichet | Enrôler un emprunteur · Valider un KYC |
| Gestionnaire | Ouvrir le kanban · Consulter l'épargne |
| Risques & BET | Rapport de visite · Évaluation technique |
| Comité | Dossier en délibération · Accords de prêt |
| Notaire | Convention notariée · Titres fonciers |
| Diaspora | Guichet diaspora · Simulateur de devises |
| Admin | Pilotage & analytics · Ordre de virement (décaissements) |
| Citoyen | Déposer une pièce |

Les rôles listés sont exactement ceux de `LANDING_BY_ROLE` (7 rôles agent)
plus le citoyen. Une action qui n'est rattachée à aucun rôle — le contrôle
des décaissements, par exemple, que l'administration porte aujourd'hui — n'est
pas exposée en action rapide.

### 6.4 Recherche scopée

La recherche de la console passe de « DUC, prêt, client » (générique, non
filtrée) à une recherche **dans le périmètre du rôle** : le placeholder et la
requête sont dérivés du rôle via `role-header.ts`. La recherche reste un
champ de l'en-tête ; le câblage serveur de la recherche reste hors de ce
chantier (elle est visuellement et sémantiquement scopée, pas encore
interrogeable).

---

## 7. Rampe de conformité

Après les quatre chantiers :

- **44 tables** pilotées par le moteur unique, ou explicitement hors moteur
  (kanban, grilles) et signalées comme telles.
- **0** barre d'outils de filtre sur mesure ; **0** store de tri spécifique.
- **1** coque d'en-tête, **1** configuration par rôle, **0** en-tête parallèle.
- **1** `<CfcToaster />` monté, **1** helper de retour d'action.
- **0** rendu d'erreur maison : `ErrorState` partout où une lecture peut échouer.

---

## 8. Tests et validation

### 8.1 Tests unitaires

- `src/lib/data-table.test.ts` — recherche insensible à la casse ; ET entre
  facettes et OU dans une facette ; tri multi-colonnes et rang de priorité ;
  bascule asc/desc ; retrait par `Shift` ; tri stable ; valeurs nulles en fin ;
  groupement simple et effectif de groupe.
- `src/domain/workflows/tracking.test.ts` — attribution d'un événement par
  `STEP_EVENT_TYPES` ; attribution par `payload.step_code` ; événement non
  attribué placé dans « Autres ».
- `src/lib/action-feedback.test.ts` — `ok: true` → succès, `ok: false` →
  erreur.
- `src/components/tracking/step-detail-drawer.test.tsx` — un événement à
  `step_code` s'affiche dans le drawer de la bonne étape ; l'état « aucun
  événement » ≠ l'état d'erreur.
- `src/components/support/support-chat.test.tsx` — les 3 cas existants
  passent (le blocage jsdom de la section 2 est levé).

### 8.2 Validation

`typecheck` 0 · `lint` 0 (0 avertissement) · tests unitaires · e2e local ·
`build` 0 · `scripts/smoke.mjs` (le nombre de règles augmente : navigation,
FAQ, présence du moteur de table sur les écrans pivot) · navigateur : console
à 0 erreur.

Le build et le serveur de développement ne doivent pas tourner en même temps
(`.next` partagé).

---

## 9. Hors périmètre (assumé, non silencieux)

- Les écrans de pôle restent **adossés à des données de démonstration** : le
  branchement sur les tables réelles (`public.dossiers`, `public.disbursements`,
  `public.land_titles`…) est un chantier d'accès aux données distinct.
- `/verify/[code]` conserve sa CNI factice.
- La recherche publique par code DUC (avec mot de passe) reste une question
  produit non tranchée.
- La recherche de la console devient scopée **sémantiquement** ; l'implémentation
  serveur de la recherche reste hors de ce chantier.

---

## 10. Ordre d'exécution

1. **Fondations** (section 2) — déblocage du chat et des tests.
2. **Moteur de table** (section 3) — puis migration des 44 tableaux.
3. **Suivi interactif** (section 4).
4. **Toasts** (section 5).
5. **En-tête par rôle** (section 6).
6. **Rampe de conformité** (section 7) et validation (section 8).

Les étapes 3, 4 et 5 sont indépendantes ; l'ordre 3 → 4 → 5 est un choix de
déroulement, pas une dépendance technique.
