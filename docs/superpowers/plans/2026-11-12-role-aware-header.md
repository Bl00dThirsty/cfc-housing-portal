# En-tête paramétré par le rôle — Plan d'implémentation

> **Pour les agents d'implémentation :** SOUS-SKILL REQUIS : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**Objectif :** une seule coque d'en-tête, pilotée par le rôle — libellé du pôle, recherche scopée, actions rapides filtrées par capacité.

**Architecture :** la **configuration** de l'en-tête vit à côté des autres règles RBAC (`src/config/rbac/role-header.ts`) et s'appuie sur la politique de capacité existante. La **coque** vit dans `src/components/layout/portal-header.tsx`. Les deux portails rendent la même coque : le client et la console ne sont plus deux implémentations parallèles.

**Pile technique :** Next.js 15.5.25 · React 19 · TypeScript strict · Tailwind v4 · Lucide · Vitest

## Contraintes globales

- `src/components/**` ne peut importer ni `@supabase/*` ni `@/server/**` — sauf `@/server/actions/**`.
- `src/config/**` peut importer `@/domain/**` et `@/lib/**`, mais **pas** `@/components/**` ni `@/server/**`.
- **Tout le texte visible par l'utilisateur est en français.**
- Une action rapide porte la **capacité** qu'elle exige : le filtrage repose sur `canSeeNavItem`, donc un rôle ne voit jamais une action qu'il ne peut pas accomplir.
- Un seul exemplaire par concept : la configuration de l'en-tête a **un seul** propriétaire.
- Commandes de validation : `npm run typecheck`, `npm run lint` (0 avertissement), `npm test`, `npm run build` (jamais en même temps que le serveur de développement), `node scripts/smoke.mjs`.

---

## Carte des fichiers

| Fichier | Rôle | Statut |
|---|---|---|
| `src/config/rbac/role-header.ts` | La configuration par rôle | créé |
| `src/config/rbac/role-header.test.ts` | Tests de la configuration | créé |
| `src/components/layout/portal-header.tsx` | La coque unique | créé |
| `src/components/layout/portal-header.test.tsx` | Tests de la coque | créé |
| `src/components/portail-client/client-header.tsx` | Devient une composition | modifié |
| `src/app/portail-cfc/_components/admin-shell.tsx` | Devient une composition | modifié |

---

## Tâche 1 — La configuration par rôle

**Fichiers :**
- Créer : `src/config/rbac/role-header.ts`
- Créer : `src/config/rbac/role-header.test.ts`

**Interfaces :**
- Consomme : `Capability` de `@/domain/policies/capabilities`, `hasCapability` de `@/domain/policies/permissions`, `AppRole` de `@/lib/auth-data`.
- Produit :
  - `type QuickAction = { id: string; label: string; href: string; icon: string; capability?: Capability }`
  - `type RoleHeaderConfig = { contextLabel: string; search?: { placeholder: string; scope: string }; quickActions: QuickAction[]; showSupport: boolean }`
  - `roleHeaderConfigFor(role: AppRole): RoleHeaderConfig`
  - `visibleQuickActions(role: AppRole): QuickAction[]`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/config/rbac/role-header.test.ts` :

```ts
import { describe, expect, it } from "vitest";

import { roleHeaderConfigFor, visibleQuickActions } from "@/config/rbac/role-header";

describe("en-tête — la configuration par rôle", () => {
  it("nomme le pôle du guichet", () => {
    expect(roleHeaderConfigFor("GUICHET").contextLabel).toBe("Agence commerciale");
  });

  it("donne au citoyen son propre libellé", () => {
    expect(roleHeaderConfigFor("CITIZEN").contextLabel).toBe("Espace citoyen");
  });

  it("n'offre pas de recherche au citoyen", () => {
    expect(roleHeaderConfigFor("CITIZEN").search).toBeUndefined();
  });

  it("scope la recherche de l'agent à son pôle", () => {
    const config = roleHeaderConfigFor("RISQUES_BET");
    expect(config.search?.placeholder).toContain("rapport");
    expect(config.search?.scope).toBe("G3");
  });

  it("ne propose au guichet que les actions qu'il peut accomplir", () => {
    const actions = visibleQuickActions("GUICHET");
    const labels = actions.map((action) => action.label);

    expect(labels).toContain("Enrôler un emprunteur");
    // Le comité n'appartient pas au guichet.
    expect(labels).not.toContain("Dossier en délibération");
  });

  it("donne au comité son action d'arbitrage", () => {
    const labels = visibleQuickActions("COMITE").map((action) => action.label);
    expect(labels).toContain("Dossier en délibération");
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/config/rbac/role-header.test.ts
```
Attendu : échec, module introuvable.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/config/rbac/role-header.ts` :

```ts
/**
 * L'en-tête de la console, paramétré par le rôle.
 *
 * L'en-tête est le **premier** écran que l'agent voit : il doit dire où il
 * est, ce qu'il peut faire, et où chercher. Un en-tête identique pour les
 * sept rôles ne dit rien de tout cela.
 *
 * Cette configuration est le **seul** propriétaire de ces informations. Elle
 * s'appuie sur la politique de capacité existante (`hasCapability`), donc une
 * action rapide qui exige une capacité que le rôle n'a pas n'est jamais
 * proposée — la même règle que la navigation latérale.
 */

import type { Capability } from "@/domain/policies/capabilities";
import { hasCapability } from "@/domain/policies/permissions";
import type { AppRole } from "@/lib/auth-data";

/** Une action rapide de l'en-tête. */
export interface QuickAction {
  id: string;
  label: string;
  href: string;
  /** Nom de l'icône Lucide ; la coque la résout. */
  icon: string;
  /** Capacité exigée pour voir cette action. */
  capability?: Capability;
}

/** Ce que l'en-tête affiche pour un rôle donné. */
export interface RoleHeaderConfig {
  /** Le libellé du pôle, à gauche. */
  contextLabel: string;
  /** La recherche : son libellé et son périmètre réel. */
  search?: { placeholder: string; scope: string };
  /** Les actions rapides, avant filtrage par capacité. */
  quickActions: QuickAction[];
  /** La file de support est-elle pertinente pour ce rôle ? */
  showSupport: boolean;
}

const CITIZEN_CONFIG: RoleHeaderConfig = {
  contextLabel: "Espace citoyen",
  quickActions: [
    { id: "citizen-deposit", label: "Déposer une pièce", href: "/portail-client", icon: "Upload" },
  ],
  showSupport: false,
};

const STAFF_CONFIGS: Record<string, RoleHeaderConfig> = {
  GUICHET: {
    contextLabel: "Agence commerciale",
    search: { placeholder: "Rechercher un dossier, un emprunteur…", scope: "G1" },
    quickActions: [
      { id: "enrol", label: "Enrôler un emprunteur", href: "/portail-cfc/clients", icon: "UserPlus", capability: "dossier:create" },
      { id: "kyc", label: "Valider un KYC", href: "/portail-cfc/actors/agency/kyc-validation", icon: "ShieldCheck", capability: "kyc:read" },
    ],
    showSupport: true,
  },
  GESTIONNAIRE: {
    contextLabel: "Portefeuille emprunteurs",
    search: { placeholder: "Rechercher un dossier, une épargne…", scope: "G2" },
    quickActions: [
      { id: "kanban", label: "Ouvrir le kanban", href: "/portail-cfc/kanban", icon: "KanbanSquare", capability: "dossier:read" },
      { id: "savings", label: "Consulter l'épargne", href: "/portail-cfc/clients?tab=epargne", icon: "PiggyBank", capability: "savings:read" },
    ],
    showSupport: true,
  },
  RISQUES_BET: {
    contextLabel: "Risques & ingénierie",
    search: { placeholder: "Rechercher un rapport de visite, un dossier…", scope: "G3" },
    quickActions: [
      { id: "site-report", label: "Rapport de visite", href: "/portail-cfc/actors/risk-engineering/site-reports", icon: "ClipboardCheck", capability: "dossier:read" },
      { id: "solvency", label: "Centrale des risques", href: "/portail-cfc/actors/risk-engineering/solvency", icon: "ShieldAlert", capability: "dossier:read" },
    ],
    showSupport: false,
  },
  NOTAIRE: {
    contextLabel: "Notariat & cadastre",
    search: { placeholder: "Rechercher un titre, une convention…", scope: "G8" },
    quickActions: [
      { id: "convention", label: "Convention notariée", href: "/portail-cfc/actors/notary-cadastre", icon: "Stamp", capability: "notary:read" },
      { id: "titles", label: "Titres fonciers", href: "/portail-cfc/actors/notary-cadastre/directory", icon: "Landmark", capability: "notary:read" },
    ],
    showSupport: false,
  },
  COMITE: {
    contextLabel: "Comités de crédit",
    search: { placeholder: "Rechercher un dossier à délibérer…", scope: "G6" },
    quickActions: [
      { id: "deliberation", label: "Dossier en délibération", href: "/portail-cfc/actors/credit-committees", icon: "Gavel", capability: "committee:read" },
      { id: "offers", label: "Accords de prêt", href: "/portail-cfc/actors/credit-committees/loan-offers", icon: "FileSignature", capability: "loan_offer:read" },
    ],
    showSupport: false,
  },
  DIASPORA: {
    contextLabel: "Guichet diaspora",
    search: { placeholder: "Rechercher un dossier diaspora…", scope: "DIASPORA" },
    quickActions: [
      { id: "diaspora", label: "Guichet diaspora", href: "/portail-cfc/actors/agency/diaspora", icon: "Globe2", capability: "dossier:read" },
      { id: "simulator-fx", label: "Simulateur de devises", href: "/portail-cfc/actors/agency/simulator", icon: "Calculator", capability: "dossier:read" },
    ],
    showSupport: true,
  },
  ADMIN: {
    contextLabel: "Supervision de la banque",
    search: { placeholder: "Rechercher un dossier, un prêt, un client…", scope: "ADMIN" },
    quickActions: [
      { id: "pilotage", label: "Pilotage & analytics", href: "/portail-cfc/analytics", icon: "BarChart3", capability: "analytics:read" },
      { id: "transfers", label: "Ordres de virement", href: "/portail-cfc/actors/disbursements/systac", icon: "ArrowLeftRight", capability: "disbursement:read" },
    ],
    showSupport: true,
  },
};

/** La configuration d'en-tête d'un rôle. */
export function roleHeaderConfigFor(role: AppRole): RoleHeaderConfig {
  if (role === "CITIZEN") return CITIZEN_CONFIG;
  return STAFF_CONFIGS[role] ?? CITIZEN_CONFIG;
}

/**
 * Les actions rapides qu'un rôle peut **accomplir**.
 *
 * Une action qui exige une capacité que le rôle n'a pas est retirée : elle
 * ne doit pas être offerte à quelqu'un qui ne peut pas la faire.
 */
export function visibleQuickActions(role: AppRole): QuickAction[] {
  if (role === "CITIZEN") return CITIZEN_CONFIG.quickActions;

  return roleHeaderConfigFor(role).quickActions.filter(
    (action) => !action.capability || hasCapability(role, action.capability),
  );
}
```

> Si `AppRole` n'est pas importable depuis `@/lib/auth-data` dans ce fichier,
> vérifier l'export exact :
> ```
> rg -n "AppRole" src/lib/auth-data.ts
> ```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/config/rbac/role-header.test.ts
```
Attendu : **6 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/config/rbac/role-header.ts src/config/rbac/role-header.test.ts
git commit -m "feat(header): la configuration d'en-tête par rôle

Le libellé du pôle, la recherche scopée et les actions rapides vivent à
côté des autres règles RBAC. Une action rapide exige une capacité : elle
n'est jamais offerte à qui ne peut pas l'accomplir."
```

---

## Tâche 2 — La coque unique

**Fichiers :**
- Créer : `src/components/layout/portal-header.tsx`
- Créer : `src/components/layout/portal-header.test.tsx`

**Interfaces :**
- Consomme : `src/components/ui/separator`, `lucide-react`.
- Produit : `PortalHeader(props: PortalHeaderProps)` avec
  `{ contextLabel: string; logo?: React.ReactNode; children?: React.ReactNode; actions?: React.ReactNode; className?: string }`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/components/layout/portal-header.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortalHeader } from "@/components/layout/portal-header";

describe("coque d'en-tête", () => {
  it("affiche le libellé du rôle", () => {
    render(<PortalHeader contextLabel="Agence commerciale" />);

    expect(screen.getByText("Agence commerciale")).toBeInTheDocument();
  });

  it("rend les actions fournies", () => {
    render(
      <PortalHeader
        contextLabel="Comités de crédit"
        actions={<button type="button">Dossier en délibération</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Dossier en délibération" }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/components/layout/portal-header.test.tsx
```
Attendu : échec, module introuvable.

- [ ] **Étape 3 : écrire l'implémentation minimale**

Créer `src/components/layout/portal-header.tsx` :

```tsx
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface PortalHeaderProps {
  /** Le libellé du rôle : « Espace citoyen », « Agence commerciale »… */
  contextLabel: string;
  /** Le logo, à gauche. */
  logo?: React.ReactNode;
  /** Le contenu central : onglets, recherche… */
  children?: React.ReactNode;
  /** Les actions du rôle, avant la cloche et le menu d'identité. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * La coque d'en-tête — **unique**.
 *
 * Les deux portails rendent cette coque : le client et la console ne sont
 * plus deux implémentations parallèles d'une barre supérieure. Ce qui change
 * d'un écran à l'autre est le **contenu** — libellé de rôle, onglets ou
 * recherche, actions rapides — pas la coque.
 */
export function PortalHeader({
  contextLabel,
  logo,
  children,
  actions,
  className,
}: PortalHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {logo}
          <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
            {contextLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">{children}</div>

        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

export default PortalHeader;
```

- [ ] **Étape 4 : lancer le test et vérifier qu'il passe**

```
npx vitest run src/components/layout/portal-header.test.tsx
```
Attendu : **2 tests passés**.

- [ ] **Étape 5 : committer**

```bash
git add src/components/layout/portal-header.tsx src/components/layout/portal-header.test.tsx
git commit -m "feat(header): la coque unique d'en-tête"
```

---

## Tâche 3 — L'en-tête citoyen devient une composition

**Fichiers :**
- Modifier : `src/components/portail-client/client-header.tsx`

**Interfaces :**
- Consomme : `PortalHeader` (tâche 2).
- Produit : `ClientHeader` — inchangé pour l'utilisateur, mais bâti sur la coque.

- [ ] **Étape 1 : réécrire le composant**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, FileText, HelpCircle, ShieldCheck } from "lucide-react";

import { PortalHeader } from "@/components/layout/portal-header";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Onglets du portail client. */
const TABS = [
  { href: "/portail-client", label: "Mon dossier", icon: FileText },
  { href: "/simulator", label: "Simulateur", icon: Calculator },
  { href: "/tracking", label: "Suivi DUC", icon: ShieldCheck },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
] as const;

/**
 * En-tête de l'espace citoyen.
 *
 * C'est la **coque** d'en-tête,Habillée pour le citoyen : ses onglets, sa
 * cloche, son thème et son menu d'identité. La coque elle-même est partagée
 * avec la console.
 */
export function ClientHeader() {
  const pathname = usePathname();

  return (
    <PortalHeader
      contextLabel="Espace citoyen"
      logo={
        <Link href="/portail-client" className="group flex items-center gap-3">
          <div className="relative h-9 w-32 transition-transform group-hover:scale-[1.02]">
            <Image
              src="/images/logo-cfc.png"
              alt="Crédit Foncier du Cameroun"
              fill
              sizes="128px"
              priority
              className="object-contain"
            />
          </div>
        </Link>
      }
      actions={
        <>
          <NotificationBell />
          <ThemeToggle />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <UserMenu profileHref="/portail-client/profil" />
        </>
      }
    >
      <nav
        aria-label="Navigation de l'espace citoyen"
        className="hidden items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1 text-xs font-medium md:flex"
      >
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
                active
                  ? "bg-background font-semibold text-cfc-brown shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </PortalHeader>
  );
}
```

> La bande d'onglets mobile (`md:hidden`) disparait de l'en-tête : elle
> appartient à la coque, pas au client. La déplacer dans
> `PortalHeader` sous la forme d'un emplacement `tabs` — ou la conserver dans
> `ClientHeader` sous la coque, selon la maquette retenue. **Dans tous les
> cas**, il ne doit y avoir qu'une barre d'onglets : la duplication actuelle
> (version `md:flex` et version `md:hidden` dans le même fichier) est
> supprimée au profit d'une seule, portée par la coque.

- [ ] **Étape 2 : vérifier**

```bash
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 3 : committer**

```bash
git add src/components/portail-client/client-header.tsx
git commit -m "refactor(header): l'en-tête citoyen devient une composition de la coque"
```

---

## Tâche 4 — L'en-tête de la console devient une composition

**Fichiers :**
- Modifier : `src/app/portail-cfc/_components/admin-shell.tsx`

**Interfaces :**
- Consomme : `PortalHeader`, `roleHeaderConfigFor`, `visibleQuickActions`.
- Produit : un en-tête de console qui porte le pôle, la recherche scopée et les actions rapides du rôle.

- [ ] **Étape 1 : lire le rôle disponible**

`AdminShell` est un composant client ; le rôle vient de `AuthProvider`.
`src/lib/auth-context.tsx` expose `useAuth()`, dont le profil porte le rôle :

```tsx
const { profile } = useAuth();
const role = profile?.role ?? "CITIZEN";
```

C'est le **même** chemin que celui de `admin-sidebar.tsx` — un seul accès à
l'identité, jamais deux.

- [ ] **Étape 2 : réécrire l'en-tête**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { MessagesSquare, Search } from "lucide-react";

import AdminSidebar from "@/components/portail-cfc/admin-sidebar";
import { PortalHeader } from "@/components/layout/portal-header";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { roleHeaderConfigFor, visibleQuickActions } from "@/config/rbac/role-header";
import { useAuth } from "@/lib/auth-context";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const role = profile?.role ?? "CITIZEN";
  const config = roleHeaderConfigFor(role);
  const quickActions = visibleQuickActions(role);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <PortalHeader
          contextLabel={config.contextLabel}
          className="sticky top-0 z-20 h-12 border-b bg-background/95 px-4 backdrop-blur lg:px-6"
          actions={
            <>
              {config.showSupport ? (
                <Button
                  asChild
                  variant="muted"
                  size="sm"
                  className="hidden h-8 gap-1.5 text-xs md:inline-flex"
                >
                  <Link href="/portail-cfc/support">
                    <MessagesSquare className="size-3.5" aria-hidden />
                    File de support
                  </Link>
                </Button>
              ) : null}

              <NotificationBell />
              <ThemeToggle />
              <Separator orientation="vertical" className="mx-1 h-4" />
              <UserMenu profileHref="/portail-cfc/profil" />
            </>
          }
        >
          <div className="relative w-64 md:w-80">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              aria-label={config.search?.placeholder ?? "Rechercher"}
              placeholder={config.search?.placeholder ?? "Rechercher"}
              className="h-8 w-full rounded-md border bg-muted/30 pl-8 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring"
            />
          </div>
        </PortalHeader>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

Les **actions rapides** du rôle s'ajoutent dans l'emplacement `actions`, avant
la cloche :

```tsx
{quickActions.map((action) => (
  <Button key={action.id} asChild variant="muted" size="sm" className="hidden h-8 gap-1.5 text-xs xl:inline-flex">
    <Link href={action.href}>{action.label}</Link>
  </Button>
))}
```

- [ ] **Étape 3 : vérifier**

```bash
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 4 : committer**

```bash
git add src/app/portail-cfc/_components/admin-shell.tsx
git commit -m "feat(header): l'en-tête de la console porte le pôle, la recherche et les actions du rôle"
```

---

## Tâche 5 — La preuve par le smoke

**Fichiers :**
- Modifier : `scripts/smoke.mjs`

**Interfaces :**
- Consomme : le serveur de développement.
- Produit : deux règles supplémentaires.

- [ ] **Étape 1 : ajouter les règles**

Suivre le format des règles existantes :

```js
// L'en-tête de la console nomme le pôle de l'agent connecté.
{
  const name = "l'en-tête de la console nomme le pôle";
  const html = await authenticatedGet("/portail-cfc/clients", agentCookie);
  const ok = html.includes("Agence commerciale") || html.includes("Pilotage");
  record(name, ok, ok ? "" : "le libellé de pôle est absent de l'en-tête");
}

// L'en-tête citoyen offre le simulateur et la FAQ, et rien d'autre.
{
  const name = "l'en-tête citoyen porte le simulateur et la FAQ";
  const html = await authenticatedGet("/portail-client", citizenCookie);
  const ok = html.includes("Simulateur") && html.includes("FAQ");
  record(name, ok, ok ? "" : "les onglets du portail citoyen sont absents");
}
```

- [ ] **Étape 2 : vérifier**

```bash
node scripts/smoke.mjs
```
Attendu : **60/60** (58 + 2).

- [ ] **Étape 3 : committer**

```bash
git add scripts/smoke.mjs
git commit -m "test(smoke): l'en-tête porte le rôle et ses actions"
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
