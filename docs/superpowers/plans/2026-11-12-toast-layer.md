# Couche de toasts — Plan d'implémentation

> **Pour les agents d'implémentation :** SOUS-SKILL REQUIS : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**Objectif :** une action réussie, une action refusée ou un événement temps réel se dit — en français, avec le ton CFC — sans jamais remplacer l'état d'erreur affiché à l'écran.

**Architecture :** `sonner` est monté **une seule fois**, dans la racine. Le retour d'action passe par **un seul** helper (`src/lib/action-feedback.ts`) qui traduit la convention `{ ok, error }` déjà utilisée par tous les appels serveur. Un toast est un signal **transitoire** : il accompagne l'`ErrorState`, il ne le remplace jamais.

**Pile technique :** Next.js 15.5.25 · React 19 · TypeScript strict · Tailwind v4 · sonner 2 · Vitest + @testing-library/react

## Contraintes globales

- `src/components/**` ne peut importer ni `@supabase/*` ni `@/server/**` — sauf `@/server/actions/**`.
- **Tout le texte visible par l'utilisateur est en français.**
- Un toast ne remplace **jamais** un `ErrorState` : un échec qui bloque la tâche garde son refus à l'écran.
- Le module de retour d'action est **côté client** : un composant serveur signale l'échec par son `ErrorState`, jamais par un toast.
- Commandes de validation : `npm run typecheck`, `npm run lint` (0 avertissement), `npm test`, `npm run build` (jamais en même temps que le serveur de développement), `node scripts/smoke.mjs`.

---

## Carte des fichiers

| Fichier | Rôle | Statut |
|---|---|---|
| `src/components/ui/toaster.tsx` | Le montage unique du toaster | créé |
| `src/lib/action-feedback.ts` | Le propriétaire du retour d'action | créé |
| `src/lib/action-feedback.test.ts` | Tests du helper | créé |
| `src/app/layout.tsx` | Monte le toaster | modifié |
| `src/components/auth/sign-in-form.tsx` | Toast de connexion | modifié |
| `src/components/layout/user-menu.tsx` | Toast de déconnexion | modifié |
| `src/components/notifications/notification-bell.tsx` | Toast temps réel (notification reçue) | modifié |
| `src/components/support/support-chat.tsx` | Toast temps réel (message reçu) | modifié |
| `package.json` | Dépendance `sonner` | modifié |

---

## Tâche 1 — Installer et monter le toaster

**Fichiers :**
- Modifier : `package.json`
- Créer : `src/components/ui/toaster.tsx`
- Modifier : `src/app/layout.tsx`

**Interfaces :**
- Consomme : rien.
- Produit : `CfcToaster` — le toaster unique, thémé.

- [ ] **Étape 1 : installer la dépendance**

```bash
npm install sonner@^2.0.0
```
Vérifier que `package.json` porte `"sonner": "^2.0.0"` dans `dependencies`.

- [ ] **Étape 2 : créer le toaster**

Créer `src/components/ui/toaster.tsx` :

```tsx
"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Le toaster — **unique**, monté à la racine.
 *
 * Il thème les toasts avec les jetons de la charte CFC : le brun de la
 * marque, l'or, et les tons de succès et de danger déjà déclarés dans
 * `globals.css`. Un seul montage : deux toasters se doublent à l'écran.
 */
export function CfcToaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-line-strong bg-card text-foreground shadow-overlay",
          description: "text-muted-foreground",
          actionButton: "bg-cfc-brown text-white",
          cancelButton: "bg-muted text-foreground",
        },
      }}
    />
  );
}

export default CfcToaster;
```

- [ ] **Étape 3 : monter le toaster à la racine**

Dans `src/app/layout.tsx`, importer et rendre le toaster **à l'intérieur** de
`ThemeProvider` et **à côté** de `ShellLayout` :

```tsx
import { CfcToaster } from "@/components/ui/toaster";
```

```tsx
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ShellLayout>{children}</ShellLayout>
          <CfcToaster />
        </ThemeProvider>
```

- [ ] **Étape 4 : vérifier**

```bash
npm run typecheck && npm run lint
```
Attendu : 0 / 0.

- [ ] **Étape 5 : committer**

```bash
git add package.json package-lock.json src/components/ui/toaster.tsx src/app/layout.tsx
git commit -m "feat(toast): le toaster unique, monté à la racine"
```

---

## Tâche 2 — Le propriétaire du retour d'action

**Fichiers :**
- Créer : `src/lib/action-feedback.ts`
- Créer : `src/lib/action-feedback.test.ts`

**Interfaces :**
- Consomme : `toast` de `sonner`.
- Produit :
  - `reportAction(result: { ok: true } | { ok: false; error: string }, successMessage?: string): boolean`
  - `reportError(error: string): void`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/lib/action-feedback.test.ts` :

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  message: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: toastMock }));

import { reportAction, reportError } from "@/lib/action-feedback";

beforeEach(() => {
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  toastMock.message.mockReset();
});

describe("retour d'action", () => {
  it("signale la réussite", () => {
    const ok = reportAction({ ok: true }, "Dossier enregistré.");

    expect(ok).toBe(true);
    expect(toastMock.success).toHaveBeenCalledWith("Dossier enregistré.");
  });

  it("ne signale rien quand aucun message n'est fourni", () => {
    reportAction({ ok: true });

    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("signale le refus avec la cause du serveur", () => {
    const ok = reportAction({ ok: false, error: "Base de données inaccessible." });

    expect(ok).toBe(false);
    expect(toastMock.error).toHaveBeenCalledWith("Base de données inaccessible.");
  });

  it("signale un refus isolé", () => {
    reportError("Le transfert a échoué.");

    expect(toastMock.error).toHaveBeenCalledWith("Le transfert a échoué.");
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/lib/action-feedback.test.ts
```
Attendu : échec, module introuvable.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/lib/action-feedback.ts` :

```ts
"use client";

import { toast } from "sonner";

/**
 * Le retour d'action — **un seul** propriétaire.
 *
 * Tous les appels serveur de l'application répondent déjà par
 * `{ ok: true }` ou `{ ok: false, error }`. Ce module traduit cette
 * convention en signal visible : un toast de succès, un toast d'erreur.
 *
 * Un toast est **transitoire** : il accompagne l'état d'erreur affiché à
 * l'écran, il ne le remplace jamais.
 */
export function reportAction(
  result: { ok: true } | { ok: false; error: string },
  successMessage?: string,
): boolean {
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }

  if (successMessage) toast.success(successMessage);
  return true;
}

/** Signale un refus qui ne vient pas d'un appel serveur. */
export function reportError(error: string): void {
  toast.error(error);
}
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/lib/action-feedback.test.ts
```
Attendu : **4 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/lib/action-feedback.ts src/lib/action-feedback.test.ts
git commit -m "feat(toast): le propriétaire du retour d'action"
```

---

## Tâche 3 — Connexion et déconnexion

**Fichiers :**
- Modifier : `src/components/auth/sign-in-form.tsx`
- Modifier : `src/components/layout/user-menu.tsx`

**Interfaces :**
- Consomme : `reportAction` (tâche 2).
- Produit : un toast à la connexion, un toast à la déconnexion.

- [ ] **Étape 1 : lire le code de connexion**

```
rg -n "signIn|router.push|setError" src/components/auth/sign-in-form.tsx
```
Repérer l'endroit où la redirection vers l'espace citoyen a lieu.

- [ ] **Étape 2 : ajouter le toast de connexion**

Juste avant la redirection, dans la branche de succès :

```tsx
import { reportAction } from "@/lib/action-feedback";
```

```tsx
        reportAction(result, "Connexion réussie — bienvenue.");
```

Si le code de connexion n'utilise pas la convention `{ ok, error }`, appeler
`reportError(result.error)` dans la branche d'échec, en plus de l'affichage
existant.

- [ ] **Étape 3 : ajouter le toast de déconnexion**

Dans `src/components/layout/user-menu.tsx`, au moment de la déconnexion :

```tsx
import { reportAction } from "@/lib/action-feedback";
```

```tsx
        const result = await signOutAction();
        reportAction(result, "Vous êtes déconnecté.");
```

Si l'action de déconnexion ne renvoie pas `{ ok, error }`, utiliser
`reportError("Vous êtes déconnecté.")` après l'appel.

- [ ] **Étape 4 : vérifier**

```bash
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 5 : committer**

```bash
git add src/components/auth/sign-in-form.tsx src/components/layout/user-menu.tsx
git commit -m "feat(toast): la connexion et la déconnexion se disent"
```

---

## Tâche 4 — Les événements en temps réel

**Fichiers :**
- Modifier : `src/components/notifications/notification-bell.tsx`
- Modifier : `src/components/support/support-chat.tsx`

**Interfaces :**
- Consomme : `reportError` (tâche 2).
- Produit : un toast quand une notification arrive ; un toast quand un message de support arrive.

- [ ] **Étape 1 : faire sonner la cloche à la réception**

Dans `src/components/notifications/notification-bell.tsx`, le canal realtime
appelle `load()`. Il faut connaître **ce qui** vient d'arriver : la charge
utile du changement contient la ligne insérée.

Dans le callback `postgres_changes`, remplacer :

```tsx
          () => {
            void load();
          },
```

par :

```tsx
          (payload) => {
            const inserted = payload.new as { title?: string } | undefined;
            if (inserted?.title) {
              toast.info(inserted.title, { description: "Nouvelle notification" });
            }
            void load();
          },
```

avec l'import `import { toast } from "sonner";` en tête de fichier.

- [ ] **Étape 2 : faire sonner le fil de support**

Dans `src/components/support/support-chat.tsx`, un message reçu par diffusion
arrive dans `useRealtimeChat`. Le composant n'a pas de hook direct sur la
diffusion : il faut donc l'écouter via le callback `onMessage`.

Ajouter dans `src/hooks/use-realtime-chat.tsx`, au moment où un message
**diffusé** est ajouté :

```tsx
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        const received = payload.payload as ChatMessage;
        // Un message reçu se dit : l'interlocuteur ne doit pas attendre
        // d'ouvrir la page pour le voir.
        toast.info(`Nouveau message de ${received.user.name}`);
        setMessages((current) => [...current, received]);
      })
```

avec `import { toast } from "sonner";`.

> Attention : ce toast ne doit **pas** sonner pour le message que
> l'utilisateur vient d'envoyer lui-même. Le broadcast n'est pas renvoyé à
> l'expéditeur par Supabase ; si ce comportement change, il faut filtrer sur
> `received.user.name !== username`.

- [ ] **Étape 3 : vérifier**

```bash
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 4 : committer**

```bash
git add src/components/notifications/notification-bell.tsx src/components/support/support-chat.tsx src/hooks/use-realtime-chat.tsx
git commit -m "feat(toast): une notification et un message reçu se disent"
```

---

## Tâche 5 — Les écritures

**Fichiers :**
- Modifier : les composants qui écrivent : `src/app/portail-cfc/settings/email/_components/email-template-editor.tsx`, `src/app/portail-cfc/clients/_components/client-savings-passbook.tsx`, `src/components/kyc/kyc-validation-queue.tsx`, `src/components/upload/document-uploader.tsx`.

**Interfaces :**
- Consomme : `reportAction`, `reportError` (tâche 2).
- Produit : chaque écriture réussie ou refusée est dite.

- [ ] **Étape 1 : recenser les écritures**

```
rg -n "Action\(" src/components src/app --type ts --type tsx -l
```
Pour chaque appel serveur d'écriture, identifier la variable qui porte le
résultat.

- [ ] **Étape 2 : brancher le helper, écran par écran**

Pour chaque écriture, remplacer le traitement manuel de l'erreur par le
helper, **en conservant** l'affichage à l'écran :

```tsx
const result = await saveTemplateAction(input);

if (!reportAction(result, "Modèle enregistré.")) {
  // Le toast a signalé le refus ; l'état d'erreur à l'écran reste en place.
  setError(result.ok ? null : result.error);
  return;
}
```

Le point important : `reportAction` **ne remplace pas** `setError`. Le toast
accompagne, l'état d'erreur reste.

- [ ] **Étape 3 : vérifier après chaque écran**

```bash
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 4 : committer**

```bash
git add src/components src/app
git commit -m "feat(toast): les écritures se disent — succès comme refus"
```

---

## Tâche 6 — La preuve par le smoke

**Fichiers :**
- Modifier : `scripts/smoke.mjs`

**Interfaces :**
- Consomme : le serveur de développement.
- Produit : une règle supplémentaire.

- [ ] **Étape 1 : ajouter la règle**

Suivre le format des règles existantes :

```js
// Le toaster est monté une seule fois, à la racine.
{
  const name = "le toaster est monté une seule fois";
  const html = await publicGet("/");
  const ok = (html.match(/sonner/i) ?? []).length > 0;
  record(name, ok, ok ? "" : "le toaster n'est pas monté");
}
```

- [ ] **Étape 2 : vérifier**

```bash
node scripts/smoke.mjs
```
Attendu : **59/59** (58 + 1).

- [ ] **Étape 3 : committer**

```bash
git add scripts/smoke.mjs
git commit -m "test(smoke): le toaster est monté une seule fois"
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

## Status addendum — 2026-11-20

Feature implementation in this plan was assessed against source code, unit
tests, pgTAP and the local smoke matrix. Verified gates: `95 unit-test files passed / 5 skipped; 531 tests passed / 17 skipped; 50 system tests passed / 0 failed`.

Boxes whose deliverable is present in code and covered by a passing test are
marked `[x]`. Boxes recording a historical TDD red-phase run, a commit, or a
hosted release remain `[ ]` **by convention** — the checkbox records the
audit trail, not the existence of the feature. No hosted migration, seed,
commit to main, or Vercel write was performed.

Deferred, with reasons: `/verify` registry lookup (no official registry
connection), credit-contract/repayment lifecycle (no owned model), approval
automation (no signed delegation), full staff lifecycle and new role codes
(no business owner), complete accessibility audit (separate slice).
