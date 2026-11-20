# Suivi interactif du dossier — Plan d'implémentation

> **Pour les agents d'implémentation :** SOUS-SKILL REQUIS : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**Objectif :** cliquer sur une étape du parcours ouvre un panneau latéral qui dit **qui** a fait **quoi**, **quand** — à partir du journal `public.dossier_events`.

**Architecture :** le **domaine** possède le mapping étape ↔ événements (`src/domain/workflows/tracking.ts`) ; la couche serveur ne fait que lire ; le composant `StepDetailDrawer` ne fait que rendre. Aucun identifiant personnel ne transite vers l'emprunteur : « qui » est un **rôle**.

**Pile technique :** Next.js 15.5.25 · React 19 · TypeScript strict · Tailwind v4 · Radix UI (Sheet) · Vitest + @testing-library/react

## Contraintes globales

- `src/domain/**` ne peut importer ni `react`, ni `next`, ni `@supabase/*`, ni `@/components/**`, ni `@/server/**`.
- `src/components/**` ne peut importer ni `@supabase/*` ni `@/server/**` — sauf `@/server/actions/**`.
- **Tout le texte visible par l'utilisateur est en français.**
- Un seul exemplaire par concept : le drawer est **partagé** par les deux portails, le mapping du domaine est **unique**.
- Commandes de validation : `npm run typecheck`, `npm run lint` (0 avertissement), `npm test`, `npm run build` (jamais en même temps que le serveur de développement), `node scripts/smoke.mjs`.

---

## Carte des fichiers

| Fichier | Rôle | Statut |
|---|---|---|
| `src/domain/workflows/tracking.ts` | `STEP_EVENT_TYPES` + `eventsForStep` | modifié |
| `src/domain/workflows/tracking.test.ts` | Tests du mapping | créé |
| `src/domain/entities/processes.ts` | `ACTOR_ROLE_LABELS` | modifié |
| `src/server/queries/citizen-space.ts` | `CitizenTracking.events` | modifié |
| `src/components/tracking/step-detail-drawer.tsx` | Le panneau latéral | créé |
| `src/components/tracking/step-detail-drawer.test.tsx` | Tests du panneau | créé |
| `src/app/tracking/_components/tracking-stepper.tsx` | Étapes cliquables | modifié |

---

## Tâche 1 — Le mapping étape ↔ événements, dans le domaine

**Fichiers :**
- Modifier : `src/domain/workflows/tracking.ts`
- Créer : `src/domain/workflows/tracking.test.ts`

**Interfaces :**
- Consomme : `DossierEvent` de `@/domain/entities/processes`.
- Produit :
  - `STEP_EVENT_TYPES: Record<string, readonly string[]>`
  - `eventsForStep(events: readonly DossierEvent[], stepCode: string): DossierEvent[]`
  - `unassignedEvents(events: readonly DossierEvent[], stepCodes: readonly string[]): DossierEvent[]`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/domain/workflows/tracking.test.ts` :

```ts
import { describe, expect, it } from "vitest";

import type { DossierEvent } from "@/domain/entities/processes";
import { eventsForStep, unassignedEvents } from "@/domain/workflows/tracking";

function event(overrides: Partial<DossierEvent>): DossierEvent {
  return {
    id: "e1",
    event_type: "KYC_APPROVED",
    actor_role: "GUICHET",
    payload: {},
    legal_basis: null,
    occurred_at: "2026-11-12T10:00:00.000Z",
    ...overrides,
  };
}

describe("suivi — l'historique d'une étape", () => {
  it("attribue un événement par son type", () => {
    const events = [event({ id: "e1", event_type: "KYC_APPROVED" })];

    expect(eventsForStep(events, "CRD-01")).toHaveLength(1);
  });

  it("attribue un événement par le code d'étape qu'il porte", () => {
    const events = [
      event({ id: "e2", event_type: "support.message", payload: { step_code: "CRD-07" } }),
    ];

    expect(eventsForStep(events, "CRD-07")).toHaveLength(1);
    expect(eventsForStep(events, "CRD-01")).toHaveLength(0);
  });

  it("n'attribue pas un événement à une autre étape", () => {
    const events = [event({ id: "e3", event_type: "KYC_APPROVED" })];

    expect(eventsForStep(events, "CRD-12")).toHaveLength(0);
  });

  it("garde les événements qui n'appartiennent à aucune étape", () => {
    const events = [
      event({ id: "e4", event_type: "DOSSIER_UPDATED" }),
      event({ id: "e5", event_type: "KYC_APPROVED" }),
    ];

    const orphans = unassignedEvents(events, ["CRD-01"]);
    expect(orphans.map((item) => item.id)).toEqual(["e4"]);
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/domain/workflows/tracking.test.ts
```
Attendu : échec, `eventsForStep is not a function`.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Dans `src/domain/workflows/tracking.ts`, ajouter en fin de fichier :

```ts
/**
 * Les événements du journal qui attestent chaque étape du circuit.
 *
 * Le mapping est une **décision métier** : il appartient au domaine, pas à
 * l'écran. Un événement qui porte `step_code` dans sa charge utile est
 * attribué à cette étape **quelle que soit son type** — c'est ce qui permet
 * à une pièce déposée ou à un message de support d'atterrir sur la bonne
 * étape du parcours.
 */
export const STEP_EVENT_TYPES: Record<string, readonly string[]> = {
  "CRD-01": [
    "KYC_SUBMITTED",
    "KYC_APPROVED",
    "KYC_REJECTED",
    "kyc.state_changed",
    "DOCUMENT_REQUESTED",
    "DOCUMENT_UPLOADED",
    "document.uploaded",
  ],
  "CRD-02": ["KYC_SUBMITTED", "KYC_APPROVED", "KYC_REJECTED", "kyc.state_changed", "DOSSIER_UPDATED"],
  "CRD-03": ["DOCUMENT_REQUESTED", "DOCUMENT_UPLOADED", "document.uploaded", "DOSSIER_UPDATED"],
  "CRD-04": [
    "DOCUMENT_UPLOADED",
    "document.uploaded",
    "DOCUMENT_VALIDATED",
    "document.validated",
  ],
  "CRD-06": ["DOCUMENT_VALIDATED", "document.validated", "DOSSIER_UPDATED"],
  "CRD-07": ["COMMITTEE_DECISION", "committee.decision"],
  "CRD-08": ["COMMITTEE_DECISION", "committee.decision", "DOSSIER_UPDATED"],
  "CRD-09": ["COMMITTEE_DECISION", "committee.decision"],
  "CRD-10": ["LOAN_OFFER_ISSUED", "loan_offer.issued"],
  "GAR-01": [
    "DOCUMENT_VALIDATED",
    "document.validated",
    "MAINLEVEE_READY",
    "mainlevee.ready",
  ],
  "CRD-11": ["LOAN_OFFER_ISSUED", "loan_offer.issued", "DOSSIER_UPDATED"],
  "CRD-12": ["DISBURSEMENT_RELEASED", "disbursement.released"],
  "CRD-13": ["DISBURSEMENT_RELEASED", "disbursement.released", "DOSSIER_UPDATED"],
};

/** Le code d'étape qu'un événement porte éventuellement dans sa charge utile. */
function stepCodeOf(event: DossierEvent): string | null {
  const value = event.payload?.step_code;
  return typeof value === "string" ? value : null;
}

/**
 * Les événements qui attestent une étape, du plus récent au plus ancien.
 *
 * Deux règles d'attribution, dans cet ordre :
 * 1. l'événement **correspond** s'il porte le code de l'étape dans sa charge
 *    utile — quelle que soit son type ;
 * 2. l'événement **correspond** si son type figure dans le mapping de l'étape.
 */
export function eventsForStep(
  events: readonly DossierEvent[],
  stepCode: string,
): DossierEvent[] {
  const types = STEP_EVENT_TYPES[stepCode] ?? [];

  return events
    .filter(
      (event) => stepCodeOf(event) === stepCode || types.includes(event.event_type),
    )
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}

/**
 * Les événements qui n'attestent aucune des étapes données.
 *
 * Un événement sans correspondance n'est **jamais perdu** : il est montré à
 * part, sous « Autres événements du dossier ».
 */
export function unassignedEvents(
  events: readonly DossierEvent[],
  stepCodes: readonly string[],
): DossierEvent[] {
  return events
    .filter((event) => !stepCodes.some((code) => eventsForStep([event], code).length > 0))
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}
```

Ajouter l'import manquant en tête de `tracking.ts` :

```ts
import type { DossierEvent } from "@/domain/entities/processes";
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/domain/workflows/tracking.test.ts
```
Attendu : **4 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/domain/workflows/tracking.ts src/domain/workflows/tracking.test.ts
git commit -m "feat(tracking): le mapping étape ↔ événements, dans le domaine

C'est une décision métier : elle appartient au domaine, pas à l'écran.
Un événement qui porte step_code est attribué à cette étape, quel que
soit son type."
```

---

## Tâche 2 — « Qui » : le rôle, jamais le nom

**Fichiers :**
- Modifier : `src/domain/entities/processes.ts`

**Interfaces :**
- Consomme : rien.
- Produit : `ACTOR_ROLE_LABELS: Record<string, string>` et `actorRoleLabel(role: string | null): string`.

- [ ] **Étape 1 : écrire le test qui échoue**

Dans `src/domain/workflows/tracking.test.ts`, ajouter :

```ts
import { actorRoleLabel } from "@/domain/entities/processes";

describe("journal — le rôle de l'auteur", () => {
  it("traduit un rôle connu", () => {
    expect(actorRoleLabel("GUICHET")).toBe("Agence");
  });

  it("ne devine pas un rôle inconnu", () => {
    expect(actorRoleLabel("ROLE_INCONNU")).toBe("Acteur");
  });

  it("traite l'absence de rôle", () => {
    expect(actorRoleLabel(null)).toBe("Acteur");
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/domain/workflows/tracking.test.ts
```
Attendu : échec, `actorRoleLabel is not a function`.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Dans `src/domain/entities/processes.ts`, ajouter après `DOSSIER_EVENT_LABELS` :

```ts
/**
 * Les rôles du journal, en langage lisible.
 *
 * Pour l'emprunteur, « qui » est un **rôle** : un nom de personne n'a pas
 * à quitter la banque. C'est un usage interne du dossier ; la console, elle,
 * peut afficher l'agent.
 */
export const ACTOR_ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Emprunteur",
  GUICHET: "Agence",
  GESTIONNAIRE: "Gestionnaire",
  RISQUES_BET: "Risques & BET",
  NOTAIRE: "Notaire",
  COMITE: "Comité de crédit",
  DIASPORA: "Guichet diaspora",
  ADMIN: "Administration",
  SERVICE: "Service interne",
  SYSTEM: "Plateforme",
};

/** Le libellé lisible d'un rôle ; « Acteur » quand le rôle est inconnu ou absent. */
export function actorRoleLabel(role: string | null): string {
  if (!role) return "Acteur";
  return ACTOR_ROLE_LABELS[role] ?? "Acteur";
}
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/domain/workflows/tracking.test.ts
```
Attendu : **7 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/domain/entities/processes.ts src/domain/workflows/tracking.test.ts
git commit -m "feat(tracking): le rôle de l'auteur, traduit en langage lisible"
```

---

## Tâche 3 — Exposer les événements du dossier au suivi

**Fichiers :**
- Modifier : `src/server/queries/citizen-space.ts`
- Modifier : `src/app/tracking/page.tsx`

**Interfaces :**
- Consomme : `getCitizenSpace` (déjà existant).
- Produit : `CitizenTracking.events: DossierEvent[]`.

- [ ] **Étape 1 : modifier le type**

Dans `src/server/queries/citizen-space.ts`, ajouter au type `CitizenTracking` :

```ts
  /**
   * Le journal du dossier.
   *
   * Il est déjà lu pour indexer les étapes : l'exposer évite une seconde
   * lecture et permet au panneau d'étape de dire qui a fait quoi, quand.
   */
  events: DossierEvent[];
```

- [ ] **Étape 2 : exposer les événements**

Dans `getCitizenTracking`, ajouter le champ dans l'objet retourné :

```ts
    return {
      ok: true,
      tracking: {
        dossierId: space.dossierId,
        ducCode: space.ducCode,
        currentPhase: space.currentPhase,
        steps: space.steps,
        progress: processProgress(space.steps),
        checklist: space.checklist,
        events: space.events,
      },
    };
```

- [ ] **Étape 3 : passer les événements à la page**

Dans `src/app/tracking/page.tsx`, passer `tracking.events` au composant :

```tsx
<TrackingStepper
  steps={tracking.steps}
  progress={tracking.progress}
  events={tracking.events}
  discussionPath="/portail-client"
/>
```

- [ ] **Étape 4 : vérifier**

```
npm run typecheck
```
Attendu : exit 0. `TrackingStepper` n'accepte pas encore `events` : ajouter
`events?: DossierEvent[]` à `TrackingStepperProps` dans cette même étape, sans
l'utiliser encore — c'est la tâche 5 qui s'en chargera.

- [ ] **Étape 5 : committer**

```bash
git add src/server/queries/citizen-space.ts src/app/tracking/page.tsx src/app/tracking/_components/tracking-stepper.tsx
git commit -m "feat(tracking): le journal du dossier est exposé au suivi"
```

---

## Tâche 4 — Le panneau latéral d'étape

**Fichiers :**
- Créer : `src/components/tracking/step-detail-drawer.tsx`
- Créer : `src/components/tracking/step-detail-drawer.test.tsx`

**Interfaces :**
- Consomme : `eventsForStep`, `unassignedEvents` (tâche 1), `actorRoleLabel`, `eventLabel` (tâche 2), `ui/sheet`, `ui/tag`, `ui/error-state`.
- Produit : `StepDetailDrawer(props: StepDetailDrawerProps)` avec
  `{ step: IndexedStep | null; events: DossierEvent[]; open: boolean; onOpenChange: (open: boolean) => void; error?: string | null; onRetry?: () => void }`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/components/tracking/step-detail-drawer.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepDetailDrawer } from "@/components/tracking/step-detail-drawer";
import type { DossierEvent } from "@/domain/entities/processes";
import type { IndexedStep } from "@/domain/workflows/tracking";

const STEP: IndexedStep = {
  code: "CRD-07",
  label: "Décision du directeur d'agence",
  phase: "committees",
  phaseLabel: "Décision d'octroi",
  lane: "agence",
  external: false,
  status: "done",
};

const EVENTS: DossierEvent[] = [
  {
    id: "e1",
    event_type: "COMMITTEE_DECISION",
    actor_role: "COMITE",
    payload: {},
    legal_basis: null,
    occurred_at: "2026-11-12T10:00:00.000Z",
  },
  {
    id: "e2",
    event_type: "support.message",
    actor_role: "GUICHET",
    payload: { step_code: "CRD-07" },
    legal_basis: null,
    occurred_at: "2026-11-11T09:00:00.000Z",
  },
];

describe("panneau d'étape", () => {
  it("dit qui a fait quoi, quand", () => {
    render(
      <StepDetailDrawer
        step={STEP}
        events={EVENTS}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("CRD-07")).toBeInTheDocument();
    expect(screen.getByText("Décision du comité de crédit")).toBeInTheDocument();
    expect(screen.getByText("Comité de crédit")).toBeInTheDocument();
    expect(screen.getByText("Message échangé")).toBeInTheDocument();
    expect(screen.getByText("Agence")).toBeInTheDocument();
  });

  it("distingue l'absence d'événement de l'échec de lecture", () => {
    render(
      <StepDetailDrawer
        step={STEP}
        events={[]}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText(/Aucun événement pour cette étape/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("affiche un refus quand la lecture a échoué", () => {
    render(
      <StepDetailDrawer
        step={STEP}
        events={[]}
        open
        onOpenChange={() => {}}
        error="Base de données inaccessible."
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Base de données inaccessible.")).toBeInTheDocument();
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/components/tracking/step-detail-drawer.test.tsx
```
Attendu : échec, module introuvable.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/components/tracking/step-detail-drawer.tsx` :

```tsx
"use client";

import * as React from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tag } from "@/components/ui/tag";
import { ErrorState } from "@/components/ui/error-state";
import { actorRoleLabel, eventLabel } from "@/domain/entities/processes";
import {
  eventsForStep,
  unassignedEvents,
  type IndexedStep,
} from "@/domain/workflows/tracking";
import type { DossierEvent } from "@/domain/entities/processes";

export interface StepDetailDrawerProps {
  /** L'étape ouverte ; `null` ferme le panneau. */
  step: IndexedStep | null;
  /** Le journal du dossier. */
  events: DossierEvent[];
  /** Les étapes du parcours — elles servent à repérer les événements orphelins. */
  steps?: readonly IndexedStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Message d'erreur de la lecture, quand elle a échoué. */
  error?: string | null;
  onRetry?: () => void;
}

/** Une date lisible : « 12 nov. 2026 à 10:00 ». */
function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Le panneau d'une étape du parcours.
 *
 * Il dit **qui** a fait **quoi**, **quand** — le journal du dossier étant la
 * chronologie qui fait foi. Un panneau vide n'est pas un panneau en erreur :
 * les deux états sont distincts, et l'échec porte un refus.
 */
export function StepDetailDrawer({
  step,
  events,
  steps = [],
  open,
  onOpenChange,
  error = null,
  onRetry,
}: StepDetailDrawerProps) {
  const stepEvents = React.useMemo(
    () => (step ? eventsForStep(events, step.code) : []),
    [events, step],
  );

  // Un événement qui n'atteste aucune étape n'est **jamais perdu** : il est
  // montré à part, sous « Autres événements du dossier ».
  const others = React.useMemo(
    () => unassignedEvents(events, steps.map((candidate) => candidate.code)),
    [events, steps],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 p-5 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {step ? step.code : ""}
            {step ? step.label : ""}
          </SheetTitle>
          <SheetDescription>
            {step ? `${step.phaseLabel} · couloir ${step.lane}` : ""}
          </SheetDescription>
        </SheetHeader>

        {error ? (
          <ErrorState
            title="Historique indisponible"
            message={error}
            onRetry={onRetry}
            className="border-none bg-transparent py-6"
          />
        ) : stepEvents.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Aucun événement pour cette étape.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {stepEvents.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 rounded-lg border border-line-strong bg-card px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-foreground">
                    {eventLabel(event.event_type)}
                  </span>
                  <Tag tone="neutral" size="sm" className="text-[10.5px]">
                    {actorRoleLabel(event.actor_role)}
                  </Tag>
                </div>
                <span className="caption-style text-soft">{formatWhen(event.occurred_at)}</span>
              </li>
            ))}
          </ol>
        )}

        {others.length > 0 ? (
          <section className="flex flex-col gap-2 border-t border-line-strong pt-3">
            <h3 className="eyebrow-style font-normal text-subtle">
              Autres événements du dossier
            </h3>
            <ol className="flex flex-col gap-2">
              {others.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-dashed border-line-strong px-3 py-2"
                >
                  <span className="text-[11.5px] text-muted-foreground">
                    {eventLabel(event.event_type)}
                  </span>
                  <span className="caption-style text-soft">
                    {actorRoleLabel(event.actor_role)} · {formatWhen(event.occurred_at)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default StepDetailDrawer;
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/components/tracking/step-detail-drawer.test.tsx
```
Attendu : **3 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/components/tracking
git commit -m "feat(tracking): le panneau latéral d'une étape — qui, quoi, quand"
```

---

## Tâche 5 — Rendre les étapes cliquables

**Fichiers :**
- Modifier : `src/app/tracking/_components/tracking-stepper.tsx`

**Interfaces :**
- Consomme : `StepDetailDrawer` (tâche 4).
- Produit : `TrackingStepper` accepte `events?: DossierEvent[]` et ouvre le panneau au clic.

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/app/tracking/_components/tracking-stepper.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TrackingStepper } from "@/app/tracking/_components/tracking-stepper";
import type { IndexedStep } from "@/domain/workflows/tracking";

const STEPS: IndexedStep[] = [
  {
    code: "CRD-07",
    label: "Décision du directeur d'agence",
    phase: "committees",
    phaseLabel: "Décision d'octroi",
    lane: "agence",
    external: false,
    status: "done",
  },
];

describe("suivi — les étapes sont cliquables", () => {
  it("ouvre le panneau de l'étape", async () => {
    const user = userEvent.setup();

    render(<TrackingStepper steps={STEPS} progress={50} events={[]} />);

    await user.click(screen.getByRole("button", { name: /CRD-07/ }));

    expect(await screen.findByText("Décision du directeur d'agence")).toBeInTheDocument();
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/app/tracking/_components/tracking-stepper.test.tsx
```
Attendu : échec — l'étape n'est pas un bouton.

- [ ] **Étape 3 : rendre l'étape cliquable**

Dans `src/app/tracking/_components/tracking-stepper.tsx` :

1. Ajouter `events?: DossierEvent[]` aux props (défaut `[]`).
2. Ajouter l'état local :

```tsx
  const [openStep, setOpenStep] = React.useState<IndexedStep | null>(null);
```

3. Transformer l'en-tête de l'étape en bouton :

```tsx
                    <button
                      type="button"
                      onClick={() => setOpenStep(step)}
                      aria-expanded={openStep?.code === step.code}
                      className="flex min-w-0 flex-1 flex-col gap-1.5 text-left"
                    >
                      … le contenu actuel de l'étape …
                    </button>
```

4. Rendre le panneau à la fin du composant :

```tsx
      <StepDetailDrawer
        step={openStep}
        events={events}
        steps={steps}
        open={openStep !== null}
        onOpenChange={(open) => {
          if (!open) setOpenStep(null);
        }}
      />
```

5. Importer `StepDetailDrawer` et `type DossierEvent`.

- [ ] **Étape 4 : lancer les tests et vérifier qu'ils passent**

```
npx vitest run src/app/tracking/_components/tracking-stepper.test.tsx src/components/tracking/step-detail-drawer.test.tsx
```
Attendu : **4 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/app/tracking/_components/tracking-stepper.tsx src/app/tracking/_components/tracking-stepper.test.tsx
git commit -m "feat(tracking): cliquer sur une étape ouvre son historique"
```

---

## Tâche 6 — La preuve par le smoke

**Fichiers :**
- Modifier : `scripts/smoke.mjs`

**Interfaces :**
- Consomme : le serveur de développement.
- Produit : une règle supplémentaire.

- [ ] **Étape 1 : ajouter la règle**

Suivre le format des règles existantes de `scripts/smoke.mjs` :

```js
// Le suivi propose l'historique d'une étape : chaque étape est un bouton.
{
  const name = "le suivi rend chaque étape cliquable";
  const html = await authenticatedGet("/tracking", citizenCookie);
  const ok = html.includes("aria-expanded");
  record(name, ok, ok ? "" : "les étapes du parcours ne sont pas cliquables");
}
```

- [ ] **Étape 2 : vérifier**

```
node scripts/smoke.mjs
```
Attendu : **59/59**.

- [ ] **Étape 3 : committer**

```bash
git add scripts/smoke.mjs
git commit -m "test(smoke): les étapes du parcours sont cliquables"
```

---

## Validation finale

```bash
npm run typecheck
npm run lint
npm test
npm run build
node scripts/smoke.mjs
```
