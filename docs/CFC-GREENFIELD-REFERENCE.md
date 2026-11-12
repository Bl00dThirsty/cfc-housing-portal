# CFC GREENFIELD REFERENCE

**Crédit Foncier du Cameroun — Guichet Unique**
Greenfield reference for rebuilding the CFC Housing Portal onto Supabase.

| | |
|---|---|
| **Status** | **Living document.** Part 0–11 are the target reference; **Part 12 records what has already been implemented** (2026-11-11). Where Part 1 describes the pre-refactor state, Part 12 supersedes it. |
| **Date** | 2026-11-11 |
| **Application** | CFC Housing Portal (current) → CFC Guichet Unique (target) |
| **Target stack** | Next.js 16 · React 19 · Tailwind v4 · Supabase (Postgres + Auth + Storage) · Zustand 5 |
| **Supabase project** | `yyqfqsmsfaccsstwlpog` — MCP registered & OAuth-authenticated |
| **Evidence base** | `cfc-housing-portal` @ `main` / `6fc5cf1` (v1.6.3) · `guichet-unque-cfc` @ `2bb8556` · Supabase + COBAC/CEMAC primary sources |

---

## PART 0 — HOW TO READ THIS

### 0.1 What this document is

A **specification of what the greenfield system must be**, derived from three inputs, in decreasing order of authority:

1. **Regulation** — COBAC, CEMAC, Cameroon law. Binding. Cited with real URLs.
2. **The existing code** — what the business already believes it is doing. Evidential, not binding.
3. **The reference UI kit** — `guichet-unque-cfc`. Presentational, transferable.

Where these three disagree, this document says so explicitly and names a winner. It does not average them.

### 0.2 Citation conventions

- `path:line` — file and line in the repository named in the section header.
- Source URLs — full URLs, with a **CONFIRMED / COULD NOT CONFIRM / secondary** marker.
- Every claim about the current code is traceable to a file. Claims about the target state are design decisions and are marked as such.

### 0.3 The four decisions that shape everything

These were posed as a questionnaire that **timed out**; the recommended option of each was selected automatically. **They are proposals, not your decisions.** Each is cheap to overturn now and expensive to overturn after the build. §2.1 restates them with the cost of reversal.

| # | Decision | Auto-selected proposal | Reversal cost |
|---|---|---|---|
| D1 | Stack baseline | Next 16 + Tailwind v4, aligned with `guichet-unque-cfc` so primitives copy unchanged | Medium — a styling/token migration, but do it once, early |
| D2 | Identity model | One `auth.users`, `actor_type` separates borrower from staff | Low now, high later — re-partitioning identities is a data migration |
| D3 | Supabase project | `yyqfqsmsfaccsstwlpog` (the ref from your command) | Trivial — one URL |
| D4 | Root route | `/` becomes the **login**; public marketing moves to `/accueil` | Low — one redirect |

> **Note on D3.** `guichet-unque-cfc/.mcp.json` points at a *different* project (`noolofgfrxeoajyozkkg`). Two Supabase projects now exist in the setup. If the intent was one shared project, D3 is wrong and the MCP URL must be re-pointed. See OQ-1.

### 0.4 What is deliberately **not** in this document

- No implementation code beyond schema/RLS sketches that carry a regulatory obligation.
- No pixel-level UI specification — the reference kit is the source of truth for that.
- No migration SQL — §9.2 defines the *sequence*; the SQL belongs in the spec.

---

## PART 1 — CURRENT STATE

### 1.1 Two repositories, two jobs

| | `cfc-housing-portal` | `guichet-unque-cfc` |
|---|---|---|
| Role | **The application.** 50 routes, 7 roles, 6-phase credit circuit. | **The UI kit.** A generic companies-CRM template, package name `sales-crm`. |
| Stack | Next 15.5.25 · React 19.0 · Tailwind 3.4.1 | Next 16.3 · React 19.2 · Tailwind 4 · Zustand 5.0.11 |
| Radix | per-package (`@radix-ui/react-*`) | unified `radix-ui` package |
| Icons | `lucide-react` | Figma-exported SVG components |
| Theming | Light + `.dark` class, `next-themes` | **Dark only**, no `.dark` block |
| Persistence | **None** | **None** |
| Supabase | **None** | **None** — MCP URL + 2 skills only |
| Tests | **0** | **0** |

The reference kit contains **no data layer** — a repo-wide search for `supabase|createClient|DATABASE_URL|SUPABASE_` returned exactly 4 hits, all in `.mcp.json` and `skills-lock.json`. It gives you primitives, a table layout, a store pattern and a side sheet. **The backend must be written from scratch.**

### 1.2 The CFC portal today

**Scale:** 50 `page.tsx` routes · 0 API routes · 0 server actions · 0 middleware · 0 test files.

**Git:** branch `main`, clean tree, HEAD `6fc5cf1 chore(release): version 1.6.3`, remote `github.com/Bl00dThirsty/cfc-housing-portal`.

**Architecture:** every screen is a client component over a hardcoded array. Every mutation — client create/edit, DUC upload, savings transaction, kanban drag — is lost on navigation.

### 1.3 The 50 routes

| Route | Audience | Purpose | Data source |
|---|---|---|---|
| `/` | public | Showcase vitrine + embedded savings calculator | component state |
| `/simulator` | public | Official financing simulator | component state |
| `/onboarding` | citizen | KYC + DUC identification form | component state |
| `/portal` | citizen | DUC document manager + 6-phase guided dropzone | hardcoded `CFC-2026-DUC-04829` |
| `/tracking` | public | Loan tracking by DUC / CNI / phone | `MOCK_TRACKING_DOSSIERS` |
| `/verify/[code]` | public | Certificate authenticity check | `CERTIFICATES_DATABASE` |
| `/admin` | staff | → `/admin/analytics` (unconditional) | — |
| `/admin/login` | staff | Email form + demo persona picker | `SEEDED_ADMIN_USERS` |
| `/admin/analytics` | staff | KPI dashboard, 5 tabs | hardcoded + recharts |
| `/admin/analytics/{dossiers,savers,simulations,transactions}/[id]` | staff | 4 drill-downs | local arrays |
| `/admin/clients` | staff | Borrower hub — 4 tabs (repertoire / kanban / DUC / épargne) | `clientsData` |
| `/admin/clients/[id]` | staff | Client record: info, editable form, draggable docs | `clientsData` + local edit state |
| `/admin/file-manager` | staff | **Redirect stub** → `/admin/clients?tab=duc` | — |
| `/admin/kanban` · `/admin/kanban/[id]` | staff | 6-column pipeline board + task detail | `initialBoard` |
| `/admin/actors/agency` | G1 | Enrollment, savings, DUC completeness | `agenceDossiers` |
| `/admin/actors/agency/diaspora` | G1 | Non-resident desk, KYC | `diasporaDossiers` |
| `/admin/actors/agency/mobile-money` · `[id]` | G1 | MoMo/OM collection & SYSTAC reconciliation | `momoTransactions` |
| `/admin/actors/agency/promoters` · `[id]` | G1 | Promoter / SIC / MAETUR programmes | `promotersData` |
| `/admin/actors/agency/simulator` | G1 | Apport & scoring simulator | local `simulations` |
| `/admin/actors/risk-engineering` | G3 | BET counter-expertise | `betDossiers` |
| `/admin/actors/risk-engineering/{site-reports,solvency,directory,geotech-urban}` | G3 | Site visits, solvency, BET directory, geotech | local arrays |
| `/admin/actors/credit-committees` | G6 | Arbitration & deliberations | `comiteDossiers` |
| `/admin/actors/credit-committees/{cgr,crc,board-institutional,loan-offers}` | G6 | CGR, CRC, PCA board, OPP generation | local arrays |
| `/admin/actors/notary-cadastre` | G8 | Conventions, 1st-rank mortgage | `notaireDossiers` |
| `/admin/actors/notary-cadastre/{cadastre-docs,directory,insurances,oppositions}` | G8 | MINDCAF, notaries, insurance, pre-notation | local arrays |
| `/admin/actors/disbursements` | G7 | Tranche release (Valeur Disponible) | `dfbcDossiers` |
| `/admin/actors/disbursements/{systac,schedules,subsidies,recovery}` | G7 | SYSTAC, amortisation, subsidies, recovery | local arrays |
| `/admin/actors/mortgage-release` | G4 | Payoff statement at zero balance | `mainleveeDossiers` |
| `/admin/actors/mortgage-release/{deeds,registry,titles,archive}` | G4 | Release deeds, cadastre discharge, title restitution, archiving | local arrays |

### 1.4 The central finding — RBAC is navigation-only, and even that leaks

This is the single most important thing in Part 1. The application *claims* COBAC-grade RBAC in its own UI copy and delivers none.

**What exists:**

| Element | Reality |
|---|---|
| `middleware.ts` / `proxy.ts` | **None.** Zero files. |
| Server actions (`use server`) | **None.** Zero matches. |
| API routes (`src/app/api/**`) | **None.** |
| Server-side session/role reading (`cookies()`, `headers()`, `getServerSession`) | **None.** |
| `redirect()` calls | **Unconditional only** — `admin/page.tsx:4` → `/admin/analytics`; `admin/file-manager/page.tsx:4` → `/admin/clients?tab=duc`. Neither is role-aware. |
| `isAuthenticated` | Initialised `true` (`auth-context.tsx:21`), set `false` only by `logout()`, and **never read by any component**. Logging out leaves every `/admin/**` route reachable. |
| Role checks in the whole codebase | **4 lines**, all in one file — `clients/[id]/_components/client-edit-form.tsx:25-28`: `canEditIdentity`, `canEditFinancials`, `canEditTechnical`, `canEditLegal`. |

**The consequence:** a GUICHET user types `/admin/actors/notary-cadastre` and gets the notary's screen. None of the 20 actor sub-pages call `useAuth()` — verified by grep, zero hits under `src/app/admin/actors/`.

**Aggravating leaks:**

- `/admin` redirects every role to `/admin/analytics` — the ADMIN KPI dashboard — rather than to `LANDING_BY_ROLE[role]`.
- The sidebar brand link "CFC Admin" points to `/admin/analytics` for every role (`admin-sidebar.tsx:31`).
- The public `/tracking` page links straight to `/admin/clients` (`tracking/page.tsx:91-96`).
- The DUC manager renders **all three chemises C1/C2/C3 to every role** (`client-duc-manager.tsx:82-84`, no role filter in the file). The "Consultation DUC (Chemise C2)" nav entry for RISQUES_BET and "Garanties DUC (Chemise C3)" for NOTAIRE are **decorative labels pointing at the same unfiltered tab**.

**The auth mechanism itself is a demo.** `login(email, password)` executes `void password;` (`auth-context.tsx:40`), matches on email alone (`:42-44`), and on no match **silently falls back to `DEFAULT_USER` and still returns `true`** (`:57-65`). Any email and any password succeed. The demo tab calls `loginAsUser(selectedUserId)` with no credential check at all (`admin/login/page.tsx:67`). A **live role switcher sits in the authenticated chrome** (`admin/layout.tsx:106-128`, `admin-sidebar.tsx:213-228`) — any staff user can self-escalate to ADMIN in one click.

**And the UI copy is factually false:**

> *"Connexion sécurisée avec contrôle d'habilitation et journalisation des accès"* — `admin/login/page.tsx:229`
> *"Session chiffrée & journalisée conformément aux règles COBAC"* — `admin/login/page.tsx:303`
> *"Cloisonnement RBAC … conformément aux exigences COBAC et au secret bancaire"* — `admin/login/page.tsx:117-121`

None of that exists. The password is displayed in cleartext (`mot de passe · défaut : cfc2026`, `admin/login/page.tsx:218`) and pre-filled (`:28`).

> **This is a compliance exposure, not a bug.** A bank whose back-office advertises COBAC-compliant segregation and journalisation while providing neither is exposed on exactly the point it claims to satisfy. Part 3 and Part 6 replace this.

### 1.5 Two structural faults beyond RBAC

**1.5.1 Two poles are unreachable by any business role.** The `G4` (Clôture, Mainlevée & Conservation) and `G7` (Finances, Budget & Comptabilité) sections appear **only** in the `ADMIN` branch of `getSidebarSectionsForRole` (`sidebar-by-role.ts:379-392` and `:365-378`). No business role's `case` block references them. **10 routes are therefore unreachable from the UI by anyone but ADMIN**: deconsolidation, payoff statement, release deeds, mortgage discharge, title restitution, DUC archiving, tranche release, SYSTAC, amortisation, subsidies, recovery.

These are precisely the phases where a mortgage is released and money moves. **The two most regulated ends of the credit circuit are the two nobody but a superuser can reach.**

**1.5.2 There is no data isolation whatsoever.** All seven roles receive the same `clientsData` array, the same `initialBoard`, and the same actor-page record arrays. No per-role, per-agency or per-pole scoping exists anywhere in `src/`. The public `/tracking` page renders a full dossier — name, CNI, loan amount, rate, agency, advisor — for any lookup by name, phone or CNI (`tracking/page.tsx:41-47`).

### 1.6 Dead code (delete, do not port)

| Asset | Size | Why it is dead |
|---|---|---|
| `src/app/admin/file-manager/_components/**` | 6 files + 191-line `data.ts` | The route redirects; `FoldersSection`, `FileManagerToolbar`, `FileListView`, `FileGridView`, `FileActions` are imported only by each other. |
| `src/components/admin/kanban-board.tsx` | 472 lines | Never imported — the live board is `app/admin/kanban/_components/kanban.tsx`. |
| `src/components/admin/analytics-dashboard.tsx`, `kpi-summary.tsx` | — | Never imported. |
| `src/components/ui/chart.tsx` | — | The recharts wrapper, never imported; all charts are hand-rolled. |
| `src/styles/presets/{tangerine,soft-pop,brutalist}.css` | 3 files | `data-theme-preset` is never set and the CSS is never imported. |
| `src/app/admin/clients/_components/duc-investigation-data.ts` | 282 lines | Investigation dataset used by no page. |
| `src/lib/calculations.ts` | — | **Not imported by any page.** The only plausible home for real amortisation/scoring logic — and it is unused. |

`next-themes` is a dependency but `ThemeProvider` appears nowhere → **no dark-mode toggle exists**; the `.dark` classes scattered through the codebase are unreachable.

### 1.7 Structural debt — the ten largest files

| Lines | File |
|---|---|
| 739 | `src/app/admin/clients/_components/client-duc-manager.tsx` |
| 716 | `src/app/admin/kanban/_components/kanban.tsx` |
| 643 | `src/app/admin/clients/_components/client-kanban.tsx` |
| 635 | `src/app/admin/clients/_components/data.ts` |
| 608 | `src/app/admin/clients/_components/client-creation-dialog.tsx` |
| 596 | `src/app/admin/clients/_components/clients-table.tsx` |
| 566 | `src/lib/tracking-data.ts` |
| 517 | `src/app/admin/clients/_components/client-savings-passbook.tsx` |
| 505 | `src/components/portal/duc-file-manager.tsx` |
| 503 | `src/app/admin/kanban/[id]/page.tsx` |

**Data lives next to components.** Eight modules hold domain data in `_components/`: `clients/_components/data.ts` (635 lines, 9 exported types + the client array), `clients/_components/duc-investigation-data.ts` (282), `kanban/_components/data.ts` (358), `kanban/_components/types.ts`, `kanban/_components/utils.ts`, `file-manager/_components/data.ts` (191), `agency/mobile-money/data.ts`, `agency/promoters/data.ts`.

**The same eight borrower personas are hand-copied across up to four modules** — ABANDA Eric, TCHOUNGUI Alain, FOKAM Emmanuel, KAMGA Pascal, MBALLA Jean-Paul, EBAH Rodrigue, FOTSO Michel, NGO NSOA Marie. The DUC id `CFC-2026-DUC-04829` is hardcoded in at least 4 places.

**Zero route-segment files.** For 50 route segments there are **zero** `loading.tsx`, **zero** `error.tsx`, **zero** `not-found.tsx`. The only fallback UI is two inline `<Suspense>` blocks.

**Accessibility — top offenders:**

1. **~74 `<label>` elements with no `htmlFor`** — 19 in `client-edit-form.tsx` (`:72…:354`), 14 in `client-creation-dialog.tsx`, 10 in `duc-upload-dialog.tsx`, 8 in `savings-new-transaction-dialog.tsx`, 11 in `kyc-form.tsx`, 5 in `savings-calculator.tsx`, 4 on the **login screen** (`admin/login/page.tsx:196,214,248,275`).
2. **One `onClick` on a non-interactive element** in the whole tree — `clients-table.tsx:306`, a `<div>` with no `role`/`tabIndex`/keyboard handler.
3. **Clickable `<TableRow>` everywhere** (`agency/page.tsx:310-313` and every actor table) — no `tabIndex`, no `role`, no `onKeyDown`. **The entire application is keyboard-operable only through the side buttons.**
4. `kanban-column.tsx:59` — `aria-label` on a drag handle with no keyboard equivalent.

### 1.8 The reference kit — what to lift

**1.8.1 Its conventions are largely unrecoverable.** `CLAUDE.md` imports `@CONVENTIONS.md`, **which does not exist on disk**; `.builderrules` rule 1 references `ExampleSection.tsx`, **which also does not exist**. `AGENTS.md` is a machine-generated `nextjs-agent-rules` block that `next dev` re-adds — it contains zero house-style rules. The only enforceable list is `.builderrules`:

```
1. use the section sturcture that is used in ExampleSection.tsx file.
2. make sure you don't any extra font styles to p, h1, h2 ,h3 because i have already made them global.css
3. please use button component whenever there is a button
4. always use em for max-width for headings, paragraph tags just do max-width-px/font-size and use em
5. always prefer tailwind css
6. use tailwind divide class for border based stacked elements
7. don't add any type of comments
```

> **Consequence:** a CFC document must not cite "CONVENTIONS.md Rule 3". The rules must be **re-declared** in CFC's own `AGENTS.md` — see §2.4.

**1.8.2 The zustand pattern — copy exactly.**

`persist` is **not** used. No middleware, no slices, no `localStorage`. One flat `create<T>()((set) => ({...}))`; **one narrow selector per read** (`useCompaniesStore((state) => state.companies)`), never a destructured object; `getState()` inside event handlers; filters as plain scalars with a `DEFAULT_FILTERS` object spread into the initial state and reused verbatim by `resetFilters`; **no derived data in the store**; **all filtering/sorting computed in a pure `lib/<domain>.ts` helper and memoised in the component**.

That last rule is the important one: the store holds UI intent, the pure function derives the view. It keeps the store trivially testable and stops it becoming a cache.

**1.8.3 The data-table pattern — the template.** Not TanStack Table; a **CSS Grid subgrid**:

```ts
export const TABLE_COLUMNS = [
  { key: "name", label: "Companies", className: "justify-start" },
  { key: "openDeals", label: "Open Deals", className: "justify-end tabular-nums" },
  // …
] as const;
export type TableColumnKey = (typeof TABLE_COLUMNS)[number]["key"];
export const TABLE_GRID_CLASS = "grid min-w-max grid-cols-[repeat(9,max-content)] justify-between";
export const TABLE_ROW_CLASS = "col-span-full grid grid-cols-subgrid";
```

A `const` tuple of `{key, label, className}` — **no render function, no accessor, no `sortable` flag**. `TableHeader role="rowgroup" className="contents"` is what makes subgrid work. The select-all checkbox lives in the first header with tri-state `indeterminate`. The **whole row** opens the detail sheet; nested interactive cells call `stopPropagation()`. The empty state is a full-width `<td colSpan={full}>`. The body is a `<ScrollArea orientation="both">`. The row component takes **props, not store reads** — the store is read only by the parent.

**1.8.4 The side-sheet pattern.** `Sheet` + `SheetContent side="right" className="sm:w-[560px] sm:max-w-[560px]"` → `SheetHeader` (icon + title + sr-only description + ghost close) → `ScrollArea` → a sequence of `DetailSection`s → `SheetFooter` (link left, subtle + primary right). `DetailSection` is domain-agnostic (`{title, action?, children, className?}`) and uses `shadow-[inset_0_-1px_0_var(--line-strong)]` as the hairline between sections. `PipelineHealth` (big % + per-stage `SegmentBar`), `ActivityTrend` (total + `Sparkline` + 4 stat cards), `ScoreCard` (shadow-stack card with reviewer avatar + verdict + star pill).

A second `Profile` sheet at `sm:w-[480px]` exists for the secondary entity, and the store makes them **mutually exclusive** (`openProfile` closes `detail`, `openDetail` closes `profile`).

**1.8.5 Its gaps you must not inherit.**

- **No pagination.** `table-footer.tsx` is a *summary strip* (count + three placeholder "Add Calculation" cells), not a pager. A CFC clients table needs real pagination and must build it.
- **No server layer at all** — no fetch, no async, no loading/error state, no SWR, no server action. `data/companies.ts` is 18 literal records with `TODAY = "2026-09-14"` faking "now".
- **No normalised store.** Lookup is `Array.find` / `Array.filter`. There is no `byId` index.
- **The toolbar has no search input** — search is a ⌘K command dialog indexing the **full unfiltered** array.

**1.8.6 Primitive inventory.** IN BOTH **11** · ONLY IN GUICHET **11** (9 files + `asset/` + `lightbox/`) · ONLY IN CFC **14**.

Lift from the kit: `tag`, `count-badge`, `command` (cmdk), `field`, `label`, `popover`, `scroll-area`, `asset/` (13 files), `lightbox/`.
Adapt: `button` (kit has `variant="none"`, `size="icon-sm"`, `size="none"` — the CRM needs them), `checkbox` (kit's is Figma-SVG tri-state, matching the indeterminate header), `dropdown-menu` (kit adds `RadioGroup`/`RadioItem`, needed by `FilterMenu`), `sheet` (kit adds `side="bottom"`, needed by mobile filters), `table` (the kit's bare `<table>` with `data-slot` is the one the subgrid layout assumes), `avatar`, `dialog`, `input`, `select`, `tabs`.
Keep CFC's: `toggle`, `toggle-group`, `textarea`, `separator`, `progress`, `password-input`, `input-group`, `empty`, `data-table-toolbar`, `data-table-faceted-filter`, `chart`, `card`, `button-group`, `badge`.

> **Do not mix the two facet systems.** CFC's `data-table-faceted-filter` is a shadcn/Facet pattern; the kit's `FilterMenu` is the CRM's facet primitive. Pick the kit's for the CRM surfaces.

**1.8.7 The theming conflict — the biggest lift risk.**

| | Kit | CFC | Conflict |
|---|---|---|---|
| Mode | **Dark only** (`color-scheme: dark`, no `.dark` block) | Light + `.dark` class | **Blocking.** `globals.css` cannot be copied verbatim. |
| Font | Geist (`next/font/google`) | Plus Jakarta Sans | Rename or re-point `--font-sans` |
| Icons | Figma SVG components via `@svgr/webpack` | `lucide-react` | Wholesale divergence |
| Radix | unified `radix-ui` | per-package | Rewrite import lines only — APIs identical |
| Tailwind | v4 CSS-first (`@theme inline`, `@plugin`, `@variant`, `border-(--x)`) | v3.4 + `tailwind.config.ts` | **Blocking.** None of the v4 syntax compiles on 3.4. |

**The correct lift is the token *architecture* with CFC's *values*:** the role names (`line-strong`, `subtle`, `faint`, `soft`, `chip`, `success`, `warning`, `danger`, `trend`, `status`), the 9-step neutral ramp, the `--tag-<tone>-bg/border/text` triple pattern, the `.<role>-style` type classes, and the power-easing set — with CFC's warm-brown/gold brand, CFC's `.dark` block preserved.

CFC's palette maps as: `cfc.brown #7B2E15` → `--primary` (action), `cfc.gold #E59819` → `--warning`, `cfc.lightgold #FDF6E9` → `--muted`, `cfc.darkbrown #5C220F` → `--primary` hover, `cfc.surface #FFFFFF` → `--background`, `cfc.muted #64748B` → `--muted-foreground`, `cfc.border #E2E8F0` → `--border`.

The kit's type scale is unusually flat — `h1`, `h2`, `h3` are **all 16px** and differ only by weight (`medium`/`semibold`/`normal`); `h4`–`h6` 14px; `p` 14px; `.lead-style` 14px; `.caption-style` 12px; `.eyebrow-style` 12px uppercase. Hierarchy comes from **colour and spacing, not size**. The `.<role>-style` companion classes let a non-heading element borrow a level's type — that mechanism must survive the port.

---

## PART 2 — TARGET ARCHITECTURE

### 2.1 The stack decision (D1)

**Proposal: Next 16 + Tailwind v4, aligned with the kit.**

The reason is not fashion. It is that the kit's primitives are *written against* Tailwind v4 — `border-(--tag-blue-border)`, `origin-(--radix-popover-content-transform-origin)`, `bg-white/6`, `@theme inline`, `@variant sm/md/lg`, `@plugin "tailwind-scrollbar"`. **None of that compiles on 3.4.** Staying on v3 means hand-porting every primitive and re-deriving the token layer, with no guarantee the result matches the kit's behaviour.

**Cost of D1, stated honestly:** a CSS-first token migration (`tailwind.config.ts` → `@theme` in `globals.css`), a `next lint` → `eslint` script change, the `params`/`searchParams` async-Promise change in Next 16, and a font/icon decision. That is roughly one focused sprint of groundwork **before** any feature work — which is cheaper than discovering the incompatibility at every primitive port.

**If you instead keep Next 15 + Tailwind 3**, then the kit is advisory rather than authoritative, `FilterMenu`/`ScrollArea`/`command` must be rewritten, and CFC's `cfc-*` colour tokens must be mapped onto the kit's role names by hand. The document below assumes D1; §1.8.6–1.8.7 state exactly which conclusions change if you do not take it.

### 2.2 Target folder structure

```
cfc-housing-portal/
├─ AGENTS.md                          # house rules (re-declared, §2.4)
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/                     # every migration, ordered, reviewed
│  ├─ seed.sql                        # reference data (document catalogue, poles, roles)
│  └─ schemas/
│     ├─ public.sql                    # domain tables
│     ├─ ref.sql                       # declarable reference data (§4.5)
│     └─ private.sql                   # helper functions — NEVER exposed via API
├─ src/
│  ├─ app/
│  │  ├─ (public)/                    # marketing — /accueil, /simulator
│  │  ├─ (auth)/                      # /login, /reset-password, /verify-email
│  │  ├─ onboarding/                  # citizen onboarding wizard
│  │  ├─ portal/                      # citizen Guichet Unique
│  │  ├─ track/                       # public tracking (tokenised, no PII)
│  │  └─ admin/                       # staff console, ALL role-guarded
│  │     ├─ layout.tsx                # server component: reads session, gates
│  │     └─ clients/ kanban/ analytics/ actors/ …   # §10.2 maps the 50 routes
│  ├─ components/
│  │  ├─ _ui/                         # kit primitives, lifted verbatim (§1.8.6)
│  │  ├─ _common/                     # FilterMenu, SegmentBar, Sparkline, ScrollToTop
│  │  ├─ clients/                     # domain assembly: header/ toolbar/ table/ detail/
│  │  │  └─ .../                      #   command-menu/ sheets/ kanban/
│  │  ├─ dossiers/ actors/ kyc/ documents/ savings/
│  │  └─ layout/                      # shell, navbar, sidebar
│  ├─ server/
│  │  ├─ supabase/                    # client.ts (browser), server.ts (RSC), admin.ts
│  │  ├─ auth/                        # session, guards, permissions
│  │  ├─ queries/                     # one function per read model
│  │  └─ actions/                     # server actions, one per mutation
│  ├─ domain/                         # PURE — no react, no supabase
│  │  ├─ entities/ types.ts
│  │  ├─ workflows/                   # state machines (§5)
│  │  ├─ policies/                    # permission predicates (§3.3)
│  │  └─ calculations/                # annuity, DTI, apport, amortisation
│  ├─ lib/                            # cn, format, money, dates, validation
│  └─ stores/                         # zustand — UI state only (§2.5)
├─ supabase-skills?  →  .agents/skills/  (installed 2026-11-11)
└─ docs/
   └─ CFC-GREENFIELD-REFERENCE.md     # this document
```

**Three rules the structure encodes:**

1. **`domain/` is pure.** No React, no Supabase imports. Every state machine, formula and permission predicate is a pure function of its inputs. This is what makes the credit circuit and the amortisation engine testable without a database — the exact gap in the current code, where `src/lib/calculations.ts` exists but is imported by nobody.
2. **`server/` is the only place that touches the database.** Clients never construct a Supabase client directly; they call a query function or a server action.
3. **`_ui/` and `_common/` are lifted from the kit and never edited for domain reasons.** A domain-specific change goes in the domain folder. This prevents the kit from eroding into a second copy of shadcn.

### 2.3 Layering and dependency rules

```
app/  →  components/  →  domain/  →  (nothing)
  ↓          ↓
server/ ─────┘
  ↓
supabase (Postgres + RLS)
```

**Hard rules:**

| Rule | Enforcement |
|---|---|
| `domain/` imports nothing from `app/`, `components/`, `server/`, `supabase` | ESLint `no-restricted-imports` |
| `components/` must not import `server/` | ESLint |
| `components/` must not import `@supabase/supabase-js` directly | ESLint — use `server/queries` |
| RLS is the last line of defence, not the first | Server actions re-check permissions; RLS catches what slips through |
| No business data in `_components/data.ts` | The eight offending modules move to `domain/entities` + `server/queries` |

### 2.4 Re-declare the house rules

Because the kit's `CONVENTIONS.md` does not exist (§1.8.1), CFC must publish its own `AGENTS.md`. Minimum content, derived from the kit's surviving rules and its actual code:

1. **Tailwind only.** No inline `style` except CSS-variable-driven positioning.
2. **Type comes from the `@layer base` scale.** Do not add font styles to `h1`–`h6` or `p`; use the `.<role>-style` companions.
3. **Always the `Button` component**, with an explicit `variant`.
4. **`em` for max-width on headings**; `px`/font-size + `em` for paragraphs.
5. **No comments in code.** (The kit's rule 7 — unusual, but it is the reference's rule.)
6. **`_ui/` is frozen.** Lifted primitives are not edited for domain reasons.
7. **Every data table is a grid-subgrid table** with a `TABLE_COLUMNS` const tuple (§1.8.3).
8. **Filters/sorting are pure functions** in `lib/<domain>.ts`; the store holds intent only.
9. **Every mutation is a server action**; no local-only state that pretends to persist.
10. **Every table row and every icon control is keyboard-operable.** (Directly answers §1.7's defect 3.)

### 2.5 State management — the zustand contract

Zustand is for **UI state**, not data. The current app has no data layer; the temptation will be to put the server data in the store. Don't.

| Goes in the store | Stays out of the store |
|---|---|
| Filters, sort key, page, page size | Server rows |
| Selection (`selectedIds`) | Derived/filtered lists |
| Which sheet/dialog is open | Domain objects |
| Sidebar collapsed, mobile filter open | Auth session |
| Command-menu query | Anything that must survive a reload |

**Rules:** no `persist` unless the session genuinely must survive reload (the kit doesn't use it); one narrow selector per read; `getState()` inside event handlers; `DEFAULT_FILTERS` spread into initial state and reused by `resetFilters`; derived data computed in a pure function and memoised in the component; **the store never holds a derived array**.

**Stores required:**

| Store | Holds |
|---|---|
| `useClientsStore` | clients filters, sort, selection, detail/profile sheet ids, command query |
| `useDossierStore` | per-dossier tab, active document, upload dialog state |
| `useSessionStore` | current profile summary, pole, unread notifications |
| `useUiStore` | sidebar, mobile filters, theme |

---

## PART 3 — IDENTITY, ACCESS & RBAC

### 3.1 Actor taxonomy

Four distinct kinds of actor exist. The current code models only two (a staff role string, and nothing for citizens).

| Actor class | Who | Identity |
|---|---|---|
| **Citizen** (emprunteur) | The applicant/borrower | `auth.users` + `public.citizen_profiles` |
| **Staff** | CFC employees across 7 roles | `auth.users` + `public.staff_profiles` + `public.staff_assignments` |
| **Third party** | BET, notaries, promoters, diaspora agents, mobile money, insurers, MINDCAF | `public.parties` — a counterparty record, **not** an auth user unless they get portal access |
| **System** | Sync jobs, SYSTAC reconciliation, ANIF STR filing, scheduled reviews | `public.service_accounts` / Edge Functions with service-role |

**D2 (proposal): one `auth.users` table, `actor_type` discriminator.** Concretely:

```sql
create table public.actors (
  id           uuid primary key references auth.users on delete cascade,
  actor_type   text not null check (actor_type in ('citizen','staff','service')),
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users on delete set null,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users on delete set null,
  deleted_at   timestamptz,
  deleted_by   uuid references auth.users on delete set null
);
```

`public.citizen_profiles` and `public.staff_profiles` both FK to `actors(id)` with `on delete cascade`. The role lives **only** in `app_metadata` (server-trusted) and in `staff_assignments` (system of record) — **never** in `user_metadata`, which the user can rewrite.

> **Why one table.** Separate auth realms would mean two login surfaces, two password-reset flows and two session systems for what is, institutionally, one employer and one customer base. Splitting by *profile table* (not by auth table) gives the same isolation where it matters — RLS policies are written per table — without duplicating the auth machinery.

### 3.2 The role hierarchy

Seven staff roles, six organisational poles, three DUC "chemises". This is the structure already implied by the code (`auth-data.ts:1-8`, `sidebar-by-role.ts:36-396`).

| Role | Label | Pole | Landing | Sidebar groups |
|---|---|---|---|---|
| `GUICHET` | Guichetier & Accueil | **G1** Production des Crédits | `/admin/clients` | G1 + DUC |
| `GESTIONNAIRE` | Conseiller Clientèle | Exploitation & Portefeuille Crédit | `/admin/clients` | Portefeuille, Kanban, Promoteurs |
| `RISQUES_BET` | Analyste Risques & BET | **G3** Direction des Risques & Ingénierie | `/admin/actors/risk-engineering` | G3 + C2 |
| `NOTAIRE` | Notaire Conventionné | **G8** Notariat & Inscriptions Hypothécaires | `/admin/actors/notary-cadastre` | G8 + C3 |
| `COMITE` | Comité de Crédit | **G6** Direction Générale & Arbitrage | `/admin/actors/credit-committees` | G6 + Kanban |
| `DIASPORA` | Chargé Diaspora & Non-Résidents | Cellule Diaspora | `/admin/actors/agency/diaspora` | Diaspora + DUC |
| `ADMIN` | Administrateur Système | DSI & Sécurité | `/admin/analytics` | all |

**Pole codes and their routes:**

| Code | Pole | Routes | Currently reachable by |
|---|---|---|---|
| G1 | Production des Crédits | 6 | GUICHET, ADMIN |
| G3 | Expertise Technique & Risques | 5 | RISQUES_BET, ADMIN |
| **G4** | **Clôture, Mainlevée & Conservation** | 5 | **ADMIN only** ⚠ |
| G6 | Comités Décisionnels & Gouvernance | 5 | COMITE, ADMIN |
| **G7** | **Finances, Budget & Comptabilité** | 5 | **ADMIN only** ⚠ |
| G8 | Notariat & Affaires Juridiques | 5 | NOTAIRE, ADMIN |

⚠ **Fix in the greenfield:** G4 and G7 need a business owner. Proposal: **G4 → a `CLOTURE` role** (or fold it into GESTIONNAIRE); **G7 → a `FINANCES` role** (or fold into COMITE). See OQ-3.

**DUC chemises** (the physical filing structure the business already uses):

| Code | Name | Content | Currently |
|---|---|---|---|
| **C1** | Identification | KYC, CNI, residence, income, savings plan, epargne account | all roles (unfiltered) ⚠ |
| **C2** | Instruction | BET counter-opinion, site report, solvency, geotech, scoring | nav label only ⚠ |
| **C3** | Garanties | Titre foncier, convention notariée, hypothèque, insurance | nav label only ⚠ |

⚠ The chemises exist as a **business concept and a UI label, but not as an access-control boundary**. §4.3 makes them one.

**The 6-phase credit circuit** (`mock-data.ts:42-91`) with the kanban columns (`kanban/_components/types.ts:1-7`) and the SLAs read from `kanban/_components/data.ts`:

| # | Phase | Kanban column | From → To | Responsible actors | SLA |
|---|---|---|---|---|---|
| 1 | Enrôlement, KYC & Constitution Épargne | `kyc_savings` | Public → G1 | Agence CFC, Direction Commerciale, Client | **15 j** |
| 2 | Analyse Technique & Visite Chantier BET | `risk_bet` | G1 → G3 | BET, Direction du Crédit, CGR | **15 j** |
| 3 | Arbitrage Comités CGR / CRC | `committees` | G3 → G6 | CGR, CRC, DG/CA | **10 j** |
| 4 | Formalisation Notariée & Hypothèque MINDCAF | `notary_mortgage` | G6 → G8 | Notaire, Conservation Foncière, Assureurs | **15 j** |
| 5 | Déblocages Échelonnés — Valeur Disponible | `disbursements` | G8 → G7 | BET, Direction Crédit, Comptabilité Clientèle | **12 j** |
| 6 | Extinction de Dette & Mainlevée d'Hypothèque | `closing_release` | G7 → G4 | Comptabilité Clientèle, Notaire, Conservation Foncière | **7 j** |

> **The phase → pole mapping is not 1:1.** Phase 5 is G7 and phase 6 is G4, yet neither pole has a business role. The SLA data is excellent — the target is that each phase has an owning role, a SLA, and a measured breach count.

**Third parties as actors:** BET · notaires conventionnés · promoteurs & SIC/MAETUR · diaspora non-résidents · mobile money (MTN MoMo, Orange Money) · insurers (décès/incendie/TRC) · MINDCAF & Conservation Foncière · core banking **Carthago** · **SYSTAC** telecompensation · **MAETUR** · **COBAC**.

### 3.3 The permission model — capabilities, not role strings

The current model is `role === "X" || role === "Y"`. That does not scale to 7 roles × 30+ resources and cannot express "this Gestionnaire may edit financials on a dossier **they do not own**".

**Proposal: a capability matrix, with roles as named bundles.**

```
capability := "<resource>:<action>"
action     := read | create | update | delete | decide | approve | export | assign
```

```ts
export type Capability =
  | "dossier:read" | "dossier:create" | "dossier:update" | "dossier:delete"
  | "dossier:decide" | "dossier:approve" | "dossier:export" | "dossier:assign"
  | "kyc:read" | "kyc:verify" | "kyc:decide" | "kyc:escalate"
  | "document:read" | "document:upload" | "document:validate" | "document:reject"
  | "savings:read" | "savings:credit" | "savings:debit" | "savings:validate"
  | "committee:read" | "committee:deliberate" | "committee:sign"
  | "notary:read" | "notary:draft" | "notary:record" | "notary:release"
  | "disbursement:read" | "disbursement:release" | "disbursement:reconcile"
  | "recovery:read" | "recovery:manage"
  | "catalogue:read" | "catalogue:write"
  | "analytics:read" | "analytics:export"
  | "admin:users" | "admin:roles" | "admin:audit";
```

**Three rules make this real:**

1. **The capability check happens in three places, and all three must agree:** the server action (authoritative), the RLS policy (the backstop), and the UI (cosmetic, for affordance only). A UI hide is never a control.
2. **Decisions are separate from edits.** `dossier:update` and `dossier:decide` are different capabilities. This is what enforces COBAC's separation of duties (§8.1, R-2001/07 art. 37) — the unit that *prepares* a file must not be the unit that *approves* it.
3. **Scope is a predicate, not a boolean.** `dossier:read` is granted to a role, then narrowed by a scope rule: *own agency only* / *own dossiers only* / *all dossiers* / *all dossiers except those under an active opposition*. Scope lives in `private.can_act_on_dossier(p_pole, p_owner)` (§9.3).

### 3.4 The capability matrix

Baseline for the target. `●` full · `◐` scoped · `○` none. **This is a proposal for the Compliance officer to ratify** (OQ-2).

| Capability | GUICHET | GESTIONNAIRE | RISQUES_BET | NOTAIRE | COMITE | DIASPORA | ADMIN |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `dossier:read` | ◐ own agency | ◐ portfolio | ● | ◐ | ● | ◐ diaspora | ● |
| `dossier:create` | ● | ● | ○ | ○ | ○ | ● | ● |
| `dossier:update` | ◐ identity only | ● | ◐ technical | ◐ legal | ○ | ◐ identity | ● |
| `dossier:decide` | ○ | ○ | ◐ | ○ | ● | ○ | ● |
| `dossier:approve` | ○ | ○ | ○ | ○ | ● | ○ | ● |
| `dossier:export` | ○ | ◐ | ○ | ○ | ◐ | ○ | ● |
| `dossier:assign` | ◐ | ◐ | ○ | ○ | ○ | ○ | ● |
| `kyc:read` | ● | ● | ◐ | ○ | ○ | ● | ● |
| `kyc:verify` | ● | ● | ○ | ○ | ○ | ● | ● |
| `kyc:decide` | ○ | ◐ | ○ | ○ | ○ | ◐ | ● |
| `kyc:escalate` | ● | ● | ● | ○ | ● | ● | ● |
| `document:read` | ◐ C1 | ◐ C1+C2 | ◐ C2 | ◐ C3 | ● | ◐ C1 | ● |
| `document:upload` | ● | ● | ◐ | ● | ○ | ● | ● |
| `document:validate` | ● | ● | ● | ● | ○ | ● | ● |
| `document:reject` | ● | ● | ● | ◐ | ○ | ● | ● |
| `savings:read` | ● | ● | ◐ | ○ | ◐ | ● | ● |
| `savings:credit` | ● | ● | ○ | ○ | ○ | ● | ● |
| `savings:debit` | ◐ reversal only | ● | ○ | ○ | ○ | ◐ | ● |
| `savings:validate` | ● | ● | ○ | ○ | ○ | ● | ● |
| `committee:read` | ○ | ◐ | ◐ | ○ | ● | ○ | ● |
| `committee:deliberate` | ○ | ○ | ◐ | ○ | ● | ○ | ● |
| `committee:sign` | ○ | ○ | ○ | ○ | ● | ○ | ● |
| `notary:read` | ○ | ○ | ○ | ● | ◐ | ○ | ● |
| `notary:draft` | ○ | ○ | ○ | ● | ○ | ○ | ● |
| `notary:record` | ○ | ○ | ○ | ● | ○ | ○ | ● |
| `notary:release` | ○ | ○ | ○ | ● | ○ | ○ | ● |
| `disbursement:read` | ○ | ◐ | ○ | ○ | ◐ | ○ | ● |
| `disbursement:release` | ○ | ○ | ○ | ○ | ◐ | ○ | ● |
| `disbursement:reconcile` | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| `recovery:read` | ○ | ● | ○ | ○ | ● | ○ | ● |
| `recovery:manage` | ○ | ● | ○ | ○ | ● | ○ | ● |
| `catalogue:read` | ● | ● | ● | ● | ● | ● | ● |
| `catalogue:write` | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| `analytics:read` | ◐ | ◐ | ◐ | ○ | ● | ◐ | ● |
| `analytics:export` | ○ | ○ | ○ | ○ | ◐ | ○ | ● |
| `admin:users` | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| `admin:roles` | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| `admin:audit` | ○ | ○ | ○ | ○ | ○ | ○ | ● |

**`catalogue:write` is deliberately ADMIN-only** (OQ-4) — see §4.5 for why the document catalogue is the most dangerous configuration surface in the system.

**Third-party access** is modelled through `public.parties` + a scoped, time-boxed `public.grants` table (party ↔ dossier ↔ capability set ↔ valid_from/valid_to). A notary sees only the dossiers where they are engaged. A BET sees only the dossiers they are instructed on. This is what makes the diaspora *mandat limité* workflow auditable (§8.1, art. 18).

### 3.5 RLS implementation

**One institution, many poles.** CFC is one legal entity; poles are departments, and dossiers must traverse them (Guichet → Gestionnaire → Risques → Notaire → Comité → Déblocage → Clôture). So: **one tenant, pole as a discriminator**, not schema-per-pole and not `app.current_tenant`.

```sql
create schema if not exists private;   -- NEVER exposed via the API settings

create or replace function private.current_pole() returns text
language sql stable security definer set search_path = ''
as $$ select nullif(current_setting('app.current_pole', true), '') $$;

create or replace function private.current_user_id() returns uuid
language sql stable security definer set search_path = ''
as $$ select nullif(current_setting('app.current_user_id', true), '')::uuid $$;

create or replace function private.set_session_context(p_pole text, p_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$ begin
  perform set_config('app.current_pole',    coalesce(p_pole, ''),    true);
  perform set_config('app.current_user_id', coalesce(p_user_id::text, ''), true);
end $$;
```

`set_config(…, true)` is transaction-local, so the context cannot leak across pooled connections. **`app.current_user_id` must be set server-side from the validated JWT, never from client input** — otherwise the audit columns are attacker-controlled.

**Policy shape.** `USING` governs which existing rows a statement may see; `WITH CHECK` governs what the resulting row may contain. `INSERT` needs only `WITH CHECK`; `UPDATE` needs **both**; `DELETE` needs only `USING`. Omitting `WITH CHECK` on `UPDATE` is the classic hole.

```sql
alter table public.dossiers enable row level security;

create policy dossiers_read on public.dossiers
  for select to authenticated
  using (
    owner_user_id = (select auth.uid())
    or (select private.current_pole()) in ('guichet','gestionnaire','risques','comite_credit','notaire','admin')
  );

create policy dossiers_update on public.dossiers
  for update to authenticated
  using      ( (select private.can_act_on_dossier((select private.current_pole()), owner_user_id)) )
  with check ( (select private.can_act_on_dossier((select private.current_pole()), owner_user_id)) );
```

**Wrap `auth.uid()` in `(select auth.uid())`** so it evaluates once as an InitPlan instead of per row, and index every column used in a policy.

**Hard rules from the Supabase security checklist:**

- Never authorise on `user_metadata` — use `app_metadata`.
- Never expose `service_role`.
- Views bypass RLS by default — use `security_invoker = true`.
- `UPDATE` requires a `SELECT` policy or it silently returns 0 rows.
- `auth.role()` is deprecated — use `TO authenticated`.
- `TO authenticated` alone is *authentication*, not *authorisation* (BOLA/IDOR) — always add an ownership predicate.
- Never add `SECURITY DEFINER` to "fix" a permission error — it silently removes access control.
- `SECURITY DEFINER` functions in an exposed schema are callable by all roles → put them in `private`.

**The pole/role cache trap.** If the pole is carried in `app_metadata` (a JWT claim), it is only refreshed on re-login — a pole change would not take effect until the token rotates. Either force a token refresh on pole change, or read the pole from `staff_assignments` (the system of record) and use `app_metadata` only as a cache.

### 3.6 The journeys

**3.6.1 `/` becomes the login (D4).** Public marketing moves to `/accueil`. The root renders a single login screen that handles **both** actor classes: an email + password field, a magic-link option, and a "I already have a CFC account" path. After authentication the server reads `actors.actor_type` and redirects — citizen → `/portal`, staff → `LANDING_BY_ROLE[role]`.

> **D4 consequence:** the current `/` showcase and the simulator must move to `/accueil` and `/simulator` respectively (the simulator route already exists). The `/admin/login` route is deleted — there is **one** login, not two. The demo persona picker is replaced by a **seeded demo mode** enabled only by an env flag, never in production.

**3.6.2 Email service.** Supabase Auth with a custom SMTP provider (the default Supabase SMTP is rate-limited and unsuitable for institutional volume). Configuration belongs in the dashboard; the reset-password email template must be institutional (French, CFC branding, `nexteight`/route names). Email delivery must be observable — a `public.email_deliveries` log, because "the client says they never got the reset link" is otherwise unanswerable.

**3.6.3 Reset password.** `supabase.auth.resetPasswordForEmail()` → email with a recovery link → the link lands on `/reset-password` → `updateUser({ password })`. Two requirements the current app has no notion of:
- **The reset must not disclose account existence.** A single generic response for known and unknown emails.
- **The reset link must be single-use and short-lived.** Supabase's `recovery_token` handles this; the app must not add a parallel mechanism.
- After a successful reset the user is **not** logged in automatically — they log in with the new password, so the audit trail shows the credential change as a separate event from the session start.

**3.6.4 Onboarding — the citizen journey.** The user said: *"the user should go through onboarding with the goal of creating the profile … the user would select which service he is coming for, taking into consideration if it is first time, if he was already affiliated to a bank or if he was already affiliated to CFC."*

**Proposal — 4 steps, each resumable, each writing to a draft citizen profile:**

| Step | Title | Content | Writes |
|---|---|---|---|
| 1 | **Qui êtes-vous ?** | Email + phone + password → creates `auth.users` + `actors(actor_type='citizen')`. Also captures the **affiliation branch** (§3.6.5). | actor, session |
| 2 | **Quel service ?** | The **service catalogue** — the product the citizen is applying for. Each service declares its own required-document set (§4.5). | `dossiers.service_code` |
| 3 | **Votre dossier** | Identity, address, income, dependants, existing loans. **Reuses the existing `kyc-form.tsx` field set.** | `citizen_profiles`, `kyc_profiles` |
| 4 | **Vos pièces** | The declarable checklist for the chosen service, with the dropzone already built (`document-dropzone.tsx`). | `dossier_documents` |

**On completion:** a DUC is opened, the citizen lands in `/portal` with their DUC, and the dossier enters **phase 1** (`kyc_savings`) in the pipeline.

**3.6.5 The affiliation branch — a first-class concept.**

This is the most interesting requirement in the brief and it deserves to be modelled properly, because it drives *which* documents are required and *which* regulatory regime applies.

| Branch | Meaning | Consequence |
|---|---|---|
| `first_time` | Never banked, never applied | Full KYC. Full document set. EDD not triggered. |
| `other_bank` | Banked elsewhere, new to CFC | Full KYC **plus** a **transparency consent** allowing CFC to obtain the credit history from that institution. If the other bank is a CEMAC establishment, this is a CEMAC credit-information flow; if foreign, it is the anchor of the **non-resident** case. |
| `cfc_existing` | Already a CFC client | **No re-KYC.** The existing `citizen_profiles` row and KYC file are reused and *extended*, not re-created. A **new dossier** is opened on the existing identity. |
| `non_resident` (diaspora) | Resident outside the CEMAC area | **Enhanced due diligence** is mandatory (R-2023/01 art. 42): an **attestation de conformité** issued by the account-holding bank in the country of residence, plus identification and verification of the **mandat limité** holder (art. 18). |

> **This branch must be a data attribute, not a UI conditional.** Store `citizen_profiles.affiliation_status` and `affiliation_verified_at`, and let the document-requirement engine read it (`condition_expr`, §4.5). If it lives in React, the rules will drift from the rules.

**3.6.6 The two leaks fixed.** (1) `/admin` redirects per role, not unconditionally. (2) `/tracking` — the public dossier lookup — must be replaced by a **tokenised** lookup: the citizen receives a signed, single-purpose tracking code (`/track/[token]`), not a search over CNI/phone/name. The current `/tracking` page exposes name, CNI, loan amount, rate, agency and advisor for any name/phone/CNI lookup (`tracking/page.tsx:41-47`). **This is a personal-data exposure under Loi n° 2024/017** (§8.3) and must not survive the rebuild.

---

## PART 4 — DOMAIN MODEL

### 4.1 The entity map

```
actor (auth.users) ──┬─ citizen_profile ──── citizen_kyc ──── kyc_risk_rating
                     │        │                                    │
                     │        └────────── dossier ──┬── dossier_parties ──── party
                     │                             ├── dossier_documents ─── document_type
                     │                             ├── savings_account ─── savings_transaction
                     │                             ├── assessments ──── committee_deliberations
                     │                             ├── notary_instruments
                     │                             ├── disbursements ─── disbursement_schedules
                     │                             └── dossier_events  (append-only evidence)
                     │
                     └─ staff_profile ─── staff_assignments (pole, scope, reporting line)
```

### 4.2 The aggregator

`dossier` is the aggregate root. It is the current `ClientItem` (`clients/_components/data.ts`), grown into a first-class record.

**Current `ClientItem` fields** (the seed for the target entity):

`id`, `name`, `cni`, `phone`, `email`, `birthDate`, `address`, `city`, `district`, `phone2`, `region`, `agency`, `advisor`, `projectType`, `projectTitle`, `projectCost`, `savingsPercent`, `savingsTarget`, `currentBalance`, `monthlyIncome`, `loanAmount`, `rate`, `duration`, `monthlyPayment`, `status`, `phase`, `step`, `progress`, `riskLevel`, `rating`, `landTitle`, `documents`, `visa`, `passbook`, `createdAt`, `lastActivity`.

**Target `dossier` additions:** `service_code`, `product_code`, `citizen_id`, `owner_user_id` (the agent who holds it), `agency_id`, `current_phase`, `current_step`, `sla_deadline`, `closed_at`, plus the audit columns (§4.4) and the soft-delete pair.

### 4.3 The DUC chemises become real access boundaries

The chemises C1/C2/C3 are the bank's own filing taxonomy. In the greenfield they are **not** three UI tabs — they are a **document classification** that the RLS policies use.

```sql
create table ref.chemise (
  code        text primary key,        -- 'C1' | 'C2' | 'C3'
  label       text not null,
  description text,
  sort_order  smallint not null default 0
);
```

| Chemise | Scope | Pole that owns it | Who may read |
|---|---|---|---|
| C1 | Identification — KYC, CNI, residence, income, savings plan | G1 (Guichet) | G1, G2, G6, DIASPORA, ADMIN |
| C2 | Instruction — BET counter-opinion, site report, solvency, geotech, scoring | G3 (Risques) | G1, G3, G6, ADMIN |
| C3 | Garanties — titre foncier, convention notariée, hypothèque, insurance | G8 (Notaire) | G3, G6, G8, G4, ADMIN |

**The RLS predicate reads the chemise off the document.** A NOTAIRE reads C3 and must not read C1 — so the chemises are enforced at the row level, not by hiding a tab.

### 4.4 Audit columns — the `createdBy / updatedBy / deletedBy` convention

**This is the standard every table in the schema follows. No exceptions.**

| Column | Type | Set by | Notes |
|---|---|---|---|
| `created_at` | `timestamptz` | trigger | `default now()` |
| `created_by` | `uuid` → `auth.users` | trigger | from `private.current_user_id()` |
| `updated_at` | `timestamptz` | trigger | on every update |
| `updated_by` | `uuid` → `auth.users` | trigger | from `private.current_user_id()` |
| `deleted_at` | `timestamptz` | trigger | soft delete |
| `deleted_by` | `uuid` → `auth.users` | trigger | set with `deleted_at` |

**The trigger is the only way to make `updated_by` unforgeable.** If the application sets it, a crafted request sets it too.

```sql
create or replace function private.audit_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, private.current_user_id());
  end if;
  new.updated_at := now();
  new.updated_by := private.current_user_id();
  if tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null then
    new.deleted_by := private.current_user_id();
  end if;
  return new;
end $$;
```

**Soft delete + partial unique index** — the pattern that lets a citizen re-register with the same CNI without a hard delete:

```sql
create unique index dossiers_active_cni_key on public.dossiers (cni_normalised)
  where deleted_at is null;
```

**Current state:** the codebase has `createdAt` and `lastActivity` on `ClientItem` and nothing else. There is **no `updatedBy`, no `deletedBy`, no soft delete, and no versioning anywhere.** §6 covers the evidence model built on top of this.

### 4.5 The declarable document catalogue

**The requirement:** *"the labels of the required document and their nature should be declarable by the admin"*. This is the single most important configurability feature in the system, and it must be a **lookup table, not a Postgres enum** — because the catalogue carries metadata (issuer, validity, accepted formats) and must be editable by Compliance **with an effective date**.

**Why not an enum:** a PG enum cannot carry metadata, and altering one requires `ALTER TYPE … ADD VALUE` (non-transactional before PG 12) or a full type rewrite. A catalogue the business declares per product is *reference data with effective dates*. It needs `valid_from`, `valid_to`, `created_by` and admin editability. **Reserve PG enums for closed technical states the code owns.**

```sql
create schema if not exists ref;   -- RLS read-only for authenticated, write for admin

create table ref.document_nature (
  code                     text primary key,
  label                    text not null,
  description              text,
  requires_issuer_check    boolean not null default false,
  requires_validity_check  boolean not null default false,
  requires_human_review    boolean not null default false,
  sort_order               smallint not null default 0
);

create table ref.document_type (
  code                  text primary key,               -- 'CNI_BIOMETRIQUE'
  nature_code           text not null references ref.document_nature(code),
  label                 text not null,
  issuing_authority     text not null,                   -- 'DGSN', 'MINDCAF/Conservation Foncière', 'Notaire', 'Employeur'
  issuing_country       char(2) not null default 'CM',
  validity_months       integer check (validity_months is null or validity_months > 0),
  renewal_reminder_days integer check (renewal_reminder_days >= 0),
  accepted_mime         text[] not null default array['application/pdf','image/jpeg','image/png'],
  max_size_bytes        bigint not null default 20971520,
  min_count             smallint not null default 1 check (min_count > 0),
  max_count             smallint check (max_count is null or max_count >= min_count),
  standalone_ok         boolean not null default true,   -- may it satisfy the requirement alone?
  requires_signature    boolean not null default false,
  requires_photograph   boolean not null default false,
  valid_from            date not null default current_date,
  valid_to              date,
  created_by            uuid references auth.users on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users on delete set null
);
create index document_type_nature_idx on ref.document_type (nature_code);

-- What may substitute for what (e.g. a passport for a CNI abroad)
create table ref.document_type_equivalent (
  from_code text not null references ref.document_type(code),
  to_code   text not null references ref.document_type(code),
  primary key (from_code, to_code)
);

-- THE DECLARABLE REQUIREMENT SET, per service and stage
create table ref.service_document_requirement (
  service_code     text not null,                          -- 'PRET_FONCIER_CLASSIQUE_ORDINAIRE'
  stage            text not null,                          -- 'ONBOARDING' | 'SAVINGS' | 'CREDIT_FILE' | 'NOTARY' | 'MORTGAGE' | 'PAYOFF'
  doc_type_code    text not null references ref.document_type(code),
  required         boolean not null default true,
  min_count        smallint not null default 1,
  max_count        smallint,
  alternative_group text,      -- documents in one group satisfy the requirement together
  condition_expr   text,        -- 'citizen.affiliation_status = ''non_resident''' — declarative, not code
  depends_on_doc   text references ref.document_type(code),
  effective_from   date not null default current_date,
  effective_to     date,
  created_by       uuid references auth.users on delete set null,
  created_at       timestamptz not null default now(),
  primary key (service_code, stage, doc_type_code, effective_from)
);
```

**And the engine that both the portal and the back-office read — in SQL, so they cannot disagree:**

```sql
create or replace function ref.missing_documents(p_service_code text, p_dossier_id uuid, p_stage text)
returns table (doc_type_code text, label text, nature_code text)
language sql stable security definer set search_path = '' as $$
  select r.doc_type_code, d.label, d.nature_code
  from ref.service_document_requirement r
  join ref.document_type d on d.code = r.doc_type_code
  where r.service_code = p_service_code
    and r.stage = p_stage
    and r.required
    and r.effective_from <= current_date
    and (r.effective_to is null or r.effective_to > current_date)
    and not exists (
      select 1 from public.dossier_documents dd
      where dd.dossier_id = p_dossier_id
        and dd.doc_type_code = r.doc_type_code
        and dd.deleted_at is null
    )
  order by 2;
$$;
```

**Four design points that matter:**

1. **Requirements are versioned by effective date.** A loan file opened under the 2026 rules must still be auditable under them. Never edit a shipped requirement row — close it (`effective_to`) and open a new one.
2. **`condition_expr` is declarative, not application code**, so Compliance changes the rule set without a deploy. It must be a *constrained* expression language, not raw SQL from a form.
3. **Equivalence is first-class**, so a diaspora client's passport satisfies the CNI requirement.
4. **The satisfied-check lives in SQL**, so the citizen portal and the back-office always agree.

**`catalogue:write` is ADMIN-only by default** — OQ-4 asks whether Compliance should have it directly. A document-type change silently alters the legal requirement set, so it is the highest-consequence configuration surface in the system and must be audit-logged specially.

### 4.6 KYC profile and validation

**The canonical KYC state machine** (derived from FATF Recommendation 10 + its Interpretive Note, and R-2023/01 arts. 16–23, 33–34, 41):

```
PRE_BOARDING → IDENTITY_CAPTURE → DOCUMENT_VERIFICATION
  → SCREENING_PENDING → SCREENING_CLEARED | SCREENING_POTENTIAL_MATCH
  → ENHANCED_DUE_DILIGENCE → RISK_RATED → APPROVAL_PENDING
  → APPROVED → ACTIVE → DORMANT → REVIEW_DUE → REVIEW_IN_PROGRESS
  → EXITED → OFFBOARDED
  (any state) → BLOCKED
```

**Two rules:**

1. **Screening is a gate, not a step.** `APPROVED` must be unreachable while any screening is unresolved.
2. **Risk rating and KYC state are separate axes.** A customer can be `ACTIVE` and `HIGH` risk. Conflating them produces a state machine nobody can reason about.

**EDD triggers** (R-2023/01): high ML/TF risk (art. 41) · non-face-to-face (art. 23) · non-resident/diaspora (art. 42) · legal person or legal arrangement (arts. 26, 28, 29) · PEP (LC-COB/01) · complex or unusually large transactions · source-of-funds doubt.

**Risk rating** is `LOW | STANDARD | HIGH`, **written, dated and rule-versioned** (`risk_rules_version`) — the same discipline as the e-money tier (§8.4).

**What a housing loan file must capture** — from the Cameroon credit-activity law, art. 4, which enumerates exactly what the bank may require: payslips, other income, **a declaration of patrimoine**, existing instalments, rent, maintenance charges, **taxe foncière**, salary garnishments, taxes, insurance. Plus identity and capacity to repay, the technical study of the project, the land title and its rank, the apport, the insurance, the property value, and the source of funds.

**Mobile Money onboarding — the honest constraint.** The World Bank documents that **Cameroon has no cross-sector digital identity verification service**. So Mobile-Money onboarding **cannot** rely on an authoritative CNI↔MSISDN lookup. The realistic design is document-based verification plus **name + MSISDN matching against the Mobile Money wallet's own KYC record**, with **manual KYC-agent review** on mismatch. FATF's *Guidance on Digital Identity* (2020) supports this tiered-assurance framing. (See OQ-9 — "API-ANE" could not be confirmed as a Cameroonian identity authority.)

**`isCobacCompliant` — the honest answer.** There is **no COBAC debt-to-income threshold.** The current code's flag is `DTI ≤ 33` (`src/lib/calculations.ts`). What actually exists:

- The Cameroon credit-activity law obliges the borrower to communicate the information allowing the bank to evaluate repayment capacity, and obliges the bank to **assess suitability** (art. 6) — a **duty to assess with no prescribed ratio**.
- CFC's own *Guide Pratique du Prêt Foncier Classique* shows **"capacité d'endettement 33 %"** for three variants and **"40 %"** for four — **two institutional tiers, not one regulatory number**. (Secondary source — mirrored PDF.)
- The flat "33 % COBAC" is widely repeated in blogs but has no regulatory anchor.

**Recommendation:** rename the flag `is_within_debt_capacity`, make the threshold a **declarable, versioned policy value** (not a constant in code), and carry the applicable tier in the decision record. The 33 %/40 % split must be ratified by CFC (OQ-6).

### 4.7 Numbers: money, rates, thresholds

**The current calculations** (`src/lib/calculations.ts` — note: *imported by nobody*):

| Quantity | Formula |
|---|---|
| Apport | `projectCost × savingsPercent / 100` |
| Monthly savings target | `apportTotal / durationMonths` |
| Loan amount | `projectCost − apport` |
| Annuity | `M = C · r · (1+r)^n / ((1+r)^n − 1)` |
| Debt ratio (DTI) | `monthlyPayment / monthlyIncome × 100` |
| COBAC compliance | `DTI ≤ 33` |

**Rates currently in the mock data:** 5.5 % (taux bonifié) · 5.75 % · 5.25 % · 5.0 %. Savings interest rate 3.5 %.

> **These figures need review.** The World Bank reports CFC mortgage rates at **≈ 7 %**, and the CFC guide indicates the **apport is 10–20 %** and the **déblocage happens by acomptes** with a **différé of 1–24 months**. The code's 5.0–5.75 % range and its unrestricted `savingsPercent` do not match the institution's published product. Rates must become **declarable product attributes** (`ref.product`, `ref.product_rate`), not constants in a mock array. See OQ-7.

**Money storage:** `numeric(15,2)`. Never float. XAF has no subunit in practice, but `numeric` is safe and lets the account use a currency-precise column if needed.

**Identity normalisation:** store the raw CNI **and** a deterministic normalised form, so `AB12345` and `ab12345` are the same identity while the original remains auditable:

```sql
create extension if not exists citext;
-- cni_raw text, plus:
cni_normalised citext generated always as
  (upper(regexp_replace(cni_raw, '[^A-Za-z0-9]', '', 'g'))) stored
```

**Land titles** follow the *titre foncier* format — the mock uses `TF N° 12844/Mfoundi`. Model as `land_title` with `reference`, `conservation_fonciere`, `rank` (1st/2nd), `holder`, `issued_at`, `charges` — because rank drives the 75 % capital weighting (§8.1).

---

## PART 5 — WORKFLOWS & LIFECYCLES

### 5.1 The six-phase circuit as a state machine

Each phase is a **separate, explicit state machine** in `domain/workflows/`, not a string field. The current code encodes the phase as `ClientItem.phase` (a string) plus `step` (a number) plus `progress` (a percentage) — three unsynchronised sources of truth.

```ts
// domain/workflows/credit-circuit.ts
export type Phase =
  | "kyc_savings" | "risk_bet" | "committees"
  | "notary_mortgage" | "disbursements" | "closing_release";

export type PhaseState = {
  phase: Phase;
  state: string;            // phase-specific state
  entered_at: string;       // ISO
  sla_days: number;
  exited_at: string | null;
  exited_by: string | null; // actor id
};
```

**Target rules:**

- A dossier has **exactly one** open phase. Entering the next phase closes the previous one, in the same transaction, with the producing artefact attached.
- `progress` is **derived**, never stored. A percentage that can disagree with the state machine is a defect.
- Every phase transition writes a `dossier_event` (§6).
- **SLA breach is computed** from `entered_at + sla_days`, never stored, so a policy change re-computes history correctly.
- **Transitions are capability-gated** — moving a dossier from `committees` to `notary_mortgage` requires `dossier:approve` and `notary:record`.

### 5.2 Phase-by-phase

**Phase 1 — Enrôlement, KYC & Constitution Épargne** (SLA 15 j)
Owner: **G1 / Guichet**. Citizen + Agence CFC + Direction Commerciale.
Gate to phase 2: KYC `APPROVED`; savings account opened with a target; `ref.service_document_requirement` for stage `ONBOARDING` and `SAVINGS` satisfied.
Artefacts: `kyc_profile`, `savings_account`, `dossier_documents` (chemise C1).

**Phase 2 — Analyse Technique & Visite Chantier BET** (SLA 15 j)
Owner: **G3 / Risques & BET**. BET + Direction du Crédit + CGR.
Gate to phase 3: BET counter-opinion recorded; site report attached; solvency computed; risk rating assigned.
Artefacts: `assessments` (chemise C2).

> **Independence requirement.** COBAC R-2001/07 art. 37 requires the credit file to be analysed by a **unit independent of the operational unit**. The BET is therefore a **party**, not an employee (§4.1) — and `private.can_act_on_dossier` must prevent the G1 agent who built the file from producing its own risk assessment.

**Phase 3 — Arbitrage Comités CGR / CRC** (SLA 10 j)
Owner: **G6 / Comité de Crédit**.
Gate to phase 4: a `committee_deliberation` in state `APPROVED` with the required **signatures**.
> **Signature rule.** R-2001/07 art. 37: decisions "must be taken by **at least two persons placed at different and sufficiently high hierarchical levels**", by a unit independent of the operational units. The implementation: a `deliberation` has a required number of signers drawn from *distinct* roles, and a signer may not be the file's originator. Enforcement belongs in the server action, not the UI.

**Phase 4 — Formalisation Notariée & Hypothèque MINDCAF** (SLA 15 j)
Owner: **G8 / Notariat**.
Artefacts: `notary_instruments` (chemise C3) — convention d'hypothèque, acte d'assurance, **certificat d'inscription hypothécaire**.

**Phase 5 — Déblocages Échelonnés — Valeur Disponible** (SLA 12 j)
Owner: **G7 / Finances** (currently unreachable — §1.5.1).
Artefacts: `disbursements` + `disbursement_schedules` (amortisation) + SYSTAC transfer orders.
> **The drawdown gate is technical.** The CFC guide requires the bank's own technical services to certify progress before each drawdown. A disbursement must therefore carry a **certification reference** and a **progress percentage**, and the release action must refuse without one.

**Phase 6 — Extinction de Dette & Mainlevée d'Hypothèque** (SLA 7 j)
Owner: **G4 / Clôture** (currently unreachable — §1.5.1).
Artefacts: décompte d'apurement → acte de mainlevée → radiation de l'inscription → titre foncier mis à jour + certificat de radiation → restitution du titre original → archivage du DUC.

> **The single most important business rule in the system:** **"loan repaid" ≠ "mortgage released."** The mortgage stays on the *livre foncier* until a *mainlevée* is issued **and registered**. The dossier cannot reach `CLOSED` until the **certificat de radiation** is attached. This is the MINDCAF chain in reverse (§8.2), and it must be modelled as a state machine with its own artefacts, not as a status flag.

### 5.3 Document lifecycle

Current vocabulary — **two conflicting taxonomies exist today** and must be reconciled:

| Source | Categories |
|---|---|
| `src/lib/types.ts` (`DocumentItem.category`) | `kyc` · `income` · `land` · `technical` |
| `clients/_components/data.ts` (`ClientDocument.category`) | `Identité` · `Foncier` · `Technique` · `Finances` · `Assurance` |

And two status vocabularies:

| Source | Statuses |
|---|---|
| `src/lib/types.ts` (`DocumentStatus`) | `missing` · `pending_upload` · `uploaded` · `verified` · `rejected` |
| `clients/_components/data.ts` (`ClientDocument.status`) | `Validé` · `En attente` · `En cours` · `Rejeté` |

**Target:** one taxonomy — the `ref.document_nature` table (§4.5), with natures `IDENTITE`, `JUSTIFICATIF_DOMICILE`, `REVENUS`, `FONCIER`, `ETUDE_TECHNIQUE`, `GARANTIE`, `ASSURANCE`, `PATRIMOINE`, `MANDAT`, `ATTESTATION_CONFORMITE`. The French labels live in the catalogue, not in code.

```sql
create type public.document_status as enum
  ('expected', 'awaiting_upload', 'uploaded', 'in_review', 'verified', 'rejected', 'expired');
```

> Use a PG enum **only** here — a closed technical state the code owns. Everything the business declares is a lookup table (§4.5).

**Transitions:** `expected → awaiting_upload → uploaded → in_review → verified | rejected`. `verified → expired` when `valid_until` passes. A rejected document re-enters `awaiting_upload` with the rejection reason retained.

**Every transition is evidence:** who, when, what they saw, what they decided, and the legal basis.

### 5.4 Savings and apport

**Current model** (`clients/_components/data.ts`): `SavingsPassbook` with `accountNumber`, `openDate`, `savingsTarget`, `currentBalance`, `interestRate` (3.5 %), `status` (`Actif` | `Objectif Atteint` | `Suspendu` | `Clôturé`), `nextDueDate`, `monthlyTarget`, `transactions[]`.

`SavingsTransaction`: `type` (`Dépôt` | `Retrait` | `Intérêts` | `Frais` | `Ajustement`), `date`, `amount`, `debit`, `credit`, `balance`, `channel`, `reference`, `validatedBy`, `receiptRef`.

**This is already a double-entry-shaped ledger** with validation evidence (`validatedBy`) and receipt references (`receiptRef`) — that is a genuinely good foundation and should be preserved.

**Target:** `savings_account` + `savings_transaction`, with the account's `interest_rate` a **declarable product attribute**, and `savings_transaction` carrying `posted_by`, `validated_by`, `validated_at`, `receipt_ref`, `channel`, `external_ref` (the MoMo/OM transaction id), and `reversal_of` for corrections.

**Channels** (the mock defines 7, including SWIFT for diaspora) become `ref.savings_channel` — declarable, with the SWIFT channel restricted to non-resident accounts.

**The apport gate:** the dossier cannot leave phase 1 until the account balance reaches the apport computed by the declared product's `apport_rate` (§4.7). The rate must come from the product catalogue, not from `ClientItem.savingsPercent`.

### 5.5 Committee decision lifecycle

```
DRAFT → DELIBERATING → [FAVORABLE | RESERVES | UNFAVORABLE] → NOTIFIED → OPPOSED → ARCHIVED
```

**Current `ClientVisa`** carries `stage`, `actor`, `decision` (`Favorable` | `En attente` | `Réserves`), `date`, `comment` — a good minimal shape to grow into `committee_deliberation` with `deliberation_lines` (one per member, with signature, role, vote, comment, timestamp).

**Two-signature enforcement** (§5.2) lives in the server action.

**Loan offers (OPP)** — the mock already has a `loan-offers` page with `loanOffersRecords`. In the target, an approved deliberation produces a **formal `loan_offer`** with: principal, rate, duration, échéance schedule, the apport, the guarantee package, the TEG (taux effectif global) and the pre-contractual information required by the Cameroon credit-activity law art. 7 (TEG disclosure + amortisation table). **The TEG disclosure is a legal obligation, not a nicety** (§8.1).

### 5.6 Notary and mortgage lifecycle

```
DRAFT_CONVENTION → NOTARISED → REGISTERED (15 j) → INSCRIBED (3 j) → CERTIFICATE_ISSUED
```

The three-step MINDCAF chain and its delays are in §8.2. The target records each step with its own artefact and its own date, and the phase-4 gate requires the **certificat d'inscription hypothécaire**.

**Pre-notation and opposition** is a separate workflow: an opposition request (`requête timbrée`) must be answered within **30 days** of notification. The mock has an `oppositions` page; the target models `opposition` with `received_at`, `response_due_at`, `response`, `outcome`. **An open opposition must be visible on the dossier and block disbursement** — this is a hard gate, not a display.

### 5.7 Disbursement lifecycle

```
SCHEDULED → CERTIFIED (progress + technical certification) → RELEASED → TRANSFERRED (SYSTAC) → RECONCILED
```

Each tranche records: amount, scheduled date, certification reference, progress %, release actor, release timestamp, SYSTAC order reference, and reconciliation status against the settlement bordereau.

**Reconciliation is the evidence:** the mock has a `systac` page and a `mobile-money` page with a reconciliation view. In the target, `reconciliation_run` compares expected vs settled and produces an exception list — exceptions are items, not toasts.

### 5.8 Payoff and mainlevée lifecycle

```
BALLOUT_REQUESTED → STATEMENT_ISSUED → SETTLED → MAINLEVEE_REQUESTED → DEED_ISSUED
  → RADIATED (livre foncier updated) → CERTIFICATE_OF_RADIATION → TITLE_RESTITUTED → DUC_ARCHIVED → CLOSED
```

The payoff statement is a **formal document** (décompte d'apurement) with capital, interests, insurance, arrears, fees, and the total. It must be generated from the amortisation schedule, not typed.

**The gate:** `CLOSED` requires the **certificat de radiation**. Until then the dossier is `RADIATION_PENDING` and the original *titre foncier* is still encumbered.

### 5.9 The end-to-end lifecycle map

```
Citizen            G1              G3              G6              G8              G7              G4
  │                │               │               │               │               │               │
  ├─ login ────────▶│               │               │               │               │               │
  ├─ onboarding ───▶│               │               │               │               │               │
  ├─ DUC C1 ───────▶│               │               │               │               │               │
  ├─ épargne ──────▶│               │               │               │               │               │
  │                ├── analyse ────▶│               │               │               │               │
  │                ├── avis BET ───▶│               │               │               │               │
  │                │               ├── comité ────▶│               │               │               │
  │                │               │               ├── conventions▶│               │               │
  │                │               │               │               ├── déblocage ▶│               │
  │                │               │               │               │               ├── mainlevée ▶│
  │                │               │               │               │               │               ├── clos │
```

---

## PART 6 — EVIDENCE & AUDIT

### 6.1 The question the system must answer

For any dossier, the bank must be able to answer, without reconstructing from memory:

1. **Who** did this, **when**, and **under which authority**?
2. **What** did they see when they decided? (the document set at that moment)
3. **What** was the legal basis for the decision?
4. **Has** the dossier been altered since? By whom?
5. **Who else** was involved, and did they have authority?

Five of these are unanswerable today.

### 6.2 Three layers of evidence

| Layer | What | Where |
|---|---|---|
| **1 — Row audit** | Who created/updated/deleted this row, and when | `created_by/updated_at/updated_by/deleted_at/deleted_by` on every table (§4.4) |
| **2 — Domain events** | What *happened*: a decision, a validation, a transfer, a signature | `dossier_events` — append-only, typed |
| **3 — Artefacts** | The documents themselves, with checksum and immutability | `dossier_documents` + Supabase Storage |

**Layer 2 is the one that is missing entirely.** The current code has a cosmetic `visa` array on the client record and an in-component audit log in `client-duc-manager.tsx` (`:280,291,299`) that vanishes on reload.

```sql
create table public.dossier_events (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid not null references public.dossiers on delete restrict,
  event_type   text not null,        -- 'phase.changed' | 'document.validated' | 'deliberation.signed' | …
  actor_id     uuid references auth.users on delete set null,
  actor_role   text,                 -- the pole/role at the time — denormalised on purpose
  occurred_at  timestamptz not null default now(),
  payload      jsonb,                -- variable-shape, non-joinable detail
  legal_basis  text,                 -- e.g. 'COBAC R-2023/01 art. 17'
  ip_address   inet,
  user_agent   text
);
create index dossier_events_dossier_idx on public.dossier_events (dossier_id, occurred_at desc);
```

**`actor_role` is denormalised on purpose.** A role can change; the event must record the role *as it was* when the event happened. Reading it from `staff_assignments` today would rewrite history.

**`payload` is JSONB** — the right choice here, because screening results and technical-study payloads are variable-shape and not joined. But **the queryable facts must be columns**: "all PEP hits" and "all dossiers overdue for periodic review" must not require a JSONB scan.

### 6.3 Immutability

- `dossier_events` is **append-only**. `REVOKE UPDATE, DELETE` from `authenticated`; the only writer is a `SECURITY DEFINER` function in `private`.
- Document files are content-addressed: `checksum_sha256` on `dossier_documents`. A changed document is a **new version row**, never an overwrite. The version chain is `supersedes_id`.
- Signatures and decisions capture a **hash of the document set** they were taken against.

### 6.4 Retention

**10 years** — the binding regional figure under Règlement CEMAC n° 02/24 (20 Dec 2024), art. 105 area. FATF's international baseline is 5 years; use 10.

Retention must be **per-category**, reconciled with data minimisation (Loi n° 2024/017):

| Category | Retention |
|---|---|
| KYC / CDD file | 10 years after relationship closure |
| Transaction records | 10 years |
| Screening results & PEP determinations | 10 years |
| CNI scans | per the KYC file (10 years) — highest sensitivity |
| Operational events / notifications | 1 year |
| Analytics aggregates | 5 years |

### 6.5 The admin audit view

`admin:audit` capability → a read-only screen over `dossier_events` + the row-audit columns, filterable by actor, dossier, pole, event type and date. It is the screen that makes §6.1 answerable, and it is the direct evidence for the COBAC internal-control reporting requirement (R-2001/07 art. 47 — annual internal-control report).

---

## PART 7 — FEATURE CATALOGUE

Every feature that exists today is listed with its verdict. **STATIC MOCK** = hardcoded array, no state mutation · **INTERACTIVE** = real local state (filters, tabs, drag-and-drop, forms) · **STUB** = placeholder.

### A. Enrollment, KYC, savings

| Feature | Route | Pole | Verdict | Target |
|---|---|---|---|---|
| Citizen KYC onboarding | `/onboarding` | — | INTERACTIVE | 4-step wizard (§3.6.4), persisted |
| G1 enrollment & DUC completeness | `/admin/actors/agency` | G1 | INTERACTIVE | Real queries, completeness computed by `ref.missing_documents` |
| Savings passbook (carnet numérisé) | `/admin/clients?tab=epargne` | G1/G2 | INTERACTIVE | Real ledger |
| Diaspora / non-resident desk | `/admin/actors/agency/diaspora` | DIASPORA | INTERACTIVE | **+ attestation de conformité & mandat limité workflow (§3.6.5)** |

### B. Mobile money collection

| Feature | Route | Verdict | Target |
|---|---|---|---|
| MoMo/OM collection & reconciliation | `/admin/actors/agency/mobile-money` | INTERACTIVE | Real collection + `reconciliation_run` |
| Receipt detail | `…/mobile-money/[id]` | STATIC MOCK | Real receipt, signed URL to the proof |

### C. Scoring simulator

| Feature | Route | Verdict | Target |
|---|---|---|---|
| Staff apport & scoring | `/admin/actors/agency/simulator` | INTERACTIVE | Uses the **pure** `domain/calculations` + the product catalogue |
| Public simulator | `/simulator`, `/` | INTERACTIVE | Moves to `/accueil` + `/simulator`; rates from the catalogue |

### D. DUC & documents

| Feature | Route | Verdict | Target |
|---|---|---|---|
| DUC manager (chemises C1/C2/C3) | `/admin/clients?tab=duc` | INTERACTIVE | Chemises become RLS boundaries (§4.3) |
| DUC upload dialog | `clients/_components/duc-upload-dialog.tsx` | INTERACTIVE | Supabase Storage + checksum + version |
| Document viewer / PDF modal | — | INTERACTIVE | Signed URL, short TTL |
| File manager (dedicated app) | `/admin/file-manager` | **STUB** (redirects) | Either delete, or revive as a real cross-dossier document search. **OQ-8** |
| Citizen DUC file manager + dropzone | `/portal` | INTERACTIVE | Persisted; requirement-driven checklist |

### E. Promoters / SIC / MAETUR

| Feature | Route | Verdict | Target |
|---|---|---|---|
| Conventions SIC & MAETUR | `/admin/actors/agency/promoters` | INTERACTIVE | `party` + `programme` |
| Programme detail | `…/promoters/[id]` | STATIC MOCK | Real |

### F. Notary / cadastral / MINDCAF

| Feature | Route | Verdict | Target |
|---|---|---|---|
| Conventions & 1st-rank mortgage | `/admin/actors/notary-cadastre` | INTERACTIVE | Full chain (§8.2) |
| Cadastre–MINDCAF liaison | `…/cadastre-docs` | INTERACTIVE | `land_title` + inscription state |
| Notary directory / minutes | `…/directory` | INTERACTIVE | `party` (notaries) |
| Insurance (death/fire/TRC) | `…/insurances` | INTERACTIVE | `policy` as an obligation artefact |
| Pre-notation / opposition | `…/oppositions` | INTERACTIVE | **Blocking gate on disbursement** |

### G. Credit committees

| Feature | Route | Verdict | Target |
|---|---|---|---|
| Committee hub, CGR, CRC, PCA board | 4 routes | INTERACTIVE | `committee_deliberation` + signature enforcement |
| Loan offer generation (OPP) | `…/loan-offers` | INTERACTIVE | Formal offer with TEG disclosure (§5.5) |

### H. Disbursement, finance, recovery

| Feature | Route | Verdict | Target |
|---|---|---|---|
| Tranche release (VD) | `/admin/actors/disbursements` | INTERACTIVE | **Give G7 a business owner** (§1.5.1) |
| SYSTAC transfers | `…/systac` | INTERACTIVE | Transfer orders + reconciliation |
| Amortisation schedules | `…/schedules` | INTERACTIVE | Generated from `domain/calculations` |
| Subsidised loan accounting | `…/subsidies` | INTERACTIVE | Subsidy as a separate ledger |
| Recovery / pre-litigation | `…/recovery` | INTERACTIVE | Recovery workflow with evidence |

### I. Clôture / mainlevée

| Feature | Route | Verdict | Target |
|---|---|---|---|
| Payoff statement | `/admin/actors/mortgage-release` | INTERACTIVE | **Give G4 a business owner** |
| Notarised release deeds | `…/deeds` | INTERACTIVE | |
| Mortgage discharge at cadastre | `…/registry` | INTERACTIVE | Radiation state machine |
| Restitution of original titles | `…/titles` | INTERACTIVE | |
| Final closure & DUC archiving | `…/archive` | INTERACTIVE | Closure requires the certificat de radiation |

### J. Analytics & KPI

`/admin/analytics` + 4 drill-downs — INTERACTIVE. Target: real queries, **pole-scoped** (today every role sees every number), and every panel exportable with the CSV-injection escaping the kit already implements (`lib/csv.ts` escapes `/^[=+\-@\t\r]/`).

### K. Kanban

Global board + per-client kanban + task detail — INTERACTIVE, `@dnd-kit` drag. Target: real transitions, capability-gated, and **driven by the phase state machine** — not a parallel source of truth.

### L. Tracking / verification / directories

| Feature | Route | Verdict | Target |
|---|---|---|---|
| Loan tracking | `/tracking` | INTERACTIVE | **Tokenised** (§3.6.6) — the current CNI/phone/name search is a personal-data exposure |
| Certificate verification | `/verify/[code]` | STATIC MOCK | Signed, single-purpose codes |
| BET directory | `…/risk-engineering/directory` | INTERACTIVE | `party` + `grants` |
| Geotech & urban scoring | `…/risk-engineering/geotech-urban` | INTERACTIVE | `assessment` |

### M. New features this rebuild must add

These do not exist today and are required by the objective or by regulation:

1. **Real authentication** — password, magic link, reset, session, no role switcher.
2. **Enforced RBAC** — server actions + RLS (§3.3).
3. **Audit trail** — row audit + `dossier_events` + immutable artefacts (§6).
4. **Declarable document catalogue** with admin editing (§4.5).
5. **KYC engine** — state machine, screening gate, risk rating, EDD (§4.6).
6. **Affiliation branch** — first-time / other-bank / existing-CFC / non-resident (§3.6.5).
7. **Document storage** — private bucket, signed URLs, checksums.
8. **Realtime console** — new dossiers and stage changes (§9.5).
9. **Audit view** for Compliance and internal control (§6.5).
10. **Data-subject request queue** — a first-class entity under Loi n° 2024/017 (§8.3).
11. **Notification service** — the app has a notification bell with no handler.
12. **Error/loading/not-found per route segment** — zero today.
13. **Test suite** — zero today.

---

## PART 8 — POLICIES

### 8.1 Regulatory — what is confirmed, and what is not

| Instrument | Status | What it obliges |
|---|---|---|
| **Règlement COBAC R-2023/01** (19 Dec 2023, in force 2024) — LBC/FT-P | **CONFIRMED** | art. 16 vigilance triggers · **art. 17 identification from reliable independent sources** · **art. 18 persons acting on behalf** (the *mandat limité* basis) · art. 19 beneficial owner · art. 20 purpose & nature · art. 23 non-face-to-face · arts. 26/28/29 legal persons · art. 33/34 ongoing diligence · art. 41 enhanced measures · **art. 42 non-resident → attestation de conformité from the residence-country bank** |
| **Règlement CEMAC n° 02/24** (20 Dec 2024) | **CONFIRMED** | art. 29 identification · arts. 36–39 transfer data · art. 63 enhanced measures · **art. 105 area: 10-year retention** |
| **Règlement CEMAC n° 04/24** | **CONFIRMED** | Targeted financial sanctions (referenced from CEMAC 02/24 art. 127) |
| **Lignes directrices LC-COB/01** (25 Feb 2025) | **CONFIRMED** | Application modalities for R-2023/01: identification, beneficial owners, **PEP handling**, correspondent banking, STR reporting. **This is what the Compliance officer is audited against.** |
| **Règlement COBAC R-2018/01** + **Instruction I-2015/01** (PCEC) | **CONFIRMED** | Classification: *créances saines / sensibles / en souffrance → immobilisées, impayées, douteuses*. Art. 10 **contamination**: a doubtful part transfers the whole exposure. General provision floor 0.5 % p.a., target ≥ 2 %. |
| **Règlement COBAC R-2010/01** | **CONFIRMED** | Minimum risk-coverage ratio **8 %** |
| **Règlement COBAC R-2010/02** (as amended by R-2020/01) | **CONFIRMED** | **75 % risk weight for *hypothèque ferme* 1st/2nd rank on immovables** (the 100 % bucket expressly excludes them) · single-beneficiary exposure **45 % → 25 %** of own funds (R-2020/01, 15 Apr 2020) · large exposures ≤ 800 % |
| **Règlement COBAC R-2001/07** art. 37 (superseded by **R-2016/04**) | **CONFIRMED in principle; article numbering must be re-verified against R-2016/04** | Loan decisions "taken by **at least two persons at different and sufficiently high hierarchical levels**"; credit file analysed by a **unit independent of the operational units**; art. 47 annual internal-control report. **Separation of tasks is mandatory.** |
| **"Accord à deux signatures" as a named COBAC concept** | **COULD NOT CONFIRM** | The two-person rule is confirmed; the *monetary thresholds* are institutional. CFC's own guide: **DA ≤ 8 M FCFA**, above → DCR → Comité de prêts / CIEP-DG → Conseil d'administration, with a *feuille de décision*. **Treat 8 M as CFC policy, not regulation.** |
| **"Écart de garantie"** | **COULD NOT CONFIRM as a COBAC term** | Most plausibly the over-collateralisation margin between the mortgage's security value and the outstanding debt — which is exactly what the 75 % weighting and the 10–20 % apport are about. **Confirm the intended meaning with CFC.** |
| **CEMAC Règlement n° 04/19** (TEG / usury) | **CONFIRMED** | Usury threshold = TEG moyen national of the previous semester **+ 33 %**; rates set **quarterly** by the Comité de Politique Monétaire. The 2019 communiqué showed *crédits immobiliers* TEG moyen ≈ 14.14 %, usury ≈ 18.85 % — **historical; pull the current quarterly communiqué from CNEF for each product.** |
| **Cameroon credit-activity law** arts. 4, 6, 7 | **CONFIRMED** | art. 4 the documents the borrower must disclose (payslips, other income, **declaration de patrimoine**, existing instalments, rent, maintenance charges, **taxe foncière**, garnishments, taxes, insurance) · art. 6 suitability assessment · art. 7 **pre-contractual TEG disclosure + amortisation table** |
| **CFC *Guide Pratique du Prêt Foncier Classique*** | **Secondary source** (mirrored PDF) | *hypothèque ferme de 1er rang* · *assurance vie-invalidité* + *assurance incendie* · **apport 10–20 %** · **différé 1–24 months** · **déblocage par acomptes** · **capacité d'endettement 33 % or 40 %** by variant · DA ≤ 8 M FCFA threshold |
| **CEMAC e-money / wallet KYC tiers** | **PARTIALLY CONFIRMED** | The regime is tiered (full identification above a threshold, light below). Règlement CEMAC n° 04/18 is the instrument — **medium confidence on the number, high on existence. The exact thresholds were NOT confirmed and must be pulled before the onboarding UI hardcodes a tier boundary.** |
| **Screening lists** | **CONFIRMED** | **UN Security Council Consolidated List** (primary, XML) · **CEMAC 04/24** (regional designations; **publication endpoint not confirmed** — ask ANIF) · **ANIF** is the national FIU · **GABAC** is the regional assessment body, **not** a list publisher. **No published CEMAC PEP register** — the obligation is procedural, so the app records the PEP determination *and its evidence*. Adverse media needs a commercial provider. OFAC SDN is **not** a Cameroonian requirement — configure it as an extra list, never hardcoded. |

**Freeze protocol.** A hit must **never** auto-close an account from a background job. It must raise a **case** that a human disposes of, with the disposition reason recorded. Freeze without delay and without prior notice; block the movement of funds; escalate; file an STR with ANIF; keep the full decision record with timestamps and legal basis.

### 8.2 Land registry and the mortgage chain

**MINDCAF** = *Ministère des Domaines, du Cadastre et des Affaires Foncières*. The regime is **immatriculation** (registration), not publicity. **The *titre foncier* is the official certification of property**; each **Conservation Foncière** keeps the **livre foncier** and registers all real rights on it.

**Titre foncier content** (Ordonnance 74/1, art. 35): property description (consistance, contenance, situation, limites, tenants, aboutissants) · owner's civil status · **existing real rights and the charges encumbering them** · order number and name · plan signed by an *assermenté géomètre* and visa'd by the chef de service départemental du cadastre.

**The chain a bank must satisfy for a first-rank mortgage** (official MINDCAF *Manuel des procédures foncières, domaniales et cadastrales*):

| Phase | Actor | Result | Delay |
|---|---|---|---|
| B | Grantor + beneficiary + lender, **before the notary** | *acte notarié portant convention d'hypothèque* | 2 j |
| C | Notary → *services de l'enregistrement* | Registered notarial mortgage deed | **15 j** |
| D | Notary + Délégué départemental MINDCAF + **Conservateur foncier** + Receveur des domaines | **Inscription de la garantie hypothécaire in the *livre foncier***, copy of the *titre foncier*, and the **certificat d'inscription hypothécaire** | 3 j |

Fees: notarial emoluments + registration/stamp duty + *redevances foncières* (MINDCAF schedules them from 1 % of the mortgage amount down to 0.3 % above 500 M FCFA).

**Mainlevée** — the chain in reverse: *demande de mainlevée* → *acte de mainlevée* → **radiation de l'inscription** in the *livre foncier* → updated *titre foncier* + **certificat de radiation**. Oppositions and registration requests are lodged by *requête timbrée* and must be answered within **30 days** of notification.

**CFC-specific:** the guide requires *« Domiciliation des procédures foncières chez le notaire agréé par le CFC »* — the bank's own approved notary. And the World Bank notes Cameroonian mortgages are **weakly reliable because *titres fonciers* are unreliable** — which is precisely why COBAC's 75 % weighting is valuable and why the **first-rank title check is a hard gate, not a formality**.

> **Documented conclusion:** the *titre foncier* check with its existing charges is the highest-value single validation in the system. It should be a blocking gate at phase 4 entry, not a field in a form.

### 8.3 Personal data — Loi n° 2024/017

> **The premise needs correcting.** The law is **Loi n° 2024/017 du 23 décembre 2024** relative à la protection des données à caractère personnel. It is **not** loi n° 2021/025 — that number corresponds to a Gabonese law. A cross-border mix-up.

**Obligations that bind this system:**

- **Lawfulness, purpose limitation, minimisation** — collect only what the credit file needs. A CNI scan is a *copy of a state-issued identity document*, the most sensitive class held.
- **Consent and information** — the portal onboarding must carry an explicit, **versioned, timestamped** notice and a consent record **per processing purpose**.
- **Security** — the strongest technical argument for private Storage buckets + signed URLs + RLS, and for keeping the CNI number out of reach of ordinary back-office readers.
- **Registry and oversight** — **APD** (Autorité de Protection des Données).
- **Retention** must reconcile the **10-year AML duty** with minimisation → per-category retention, not one global purge.
- **Rights** (access, rectification, deletion) must be answerable by a human → **`data_subject_request` is a first-class entity with a queue**, not a support ticket.

### 8.4 Security and data-handling policy

| Rule | Where it lands |
|---|---|
| Service-role key never in the browser, never `NEXT_PUBLIC_*` | `server/admin.ts` only |
| All authorisation in `app_metadata`, never `user_metadata` | §3.1 |
| RLS enabled on **every** table in every exposed schema | §9.3 |
| `SECURITY DEFINER` functions only in `private`, with `set search_path = ''` | §9.3 |
| `views` need `security_invoker = true` | §9.3 |
| Private storage buckets; signed URLs with **minutes**, not hours | §9.4 |
| CNI numbers encrypted or tokenised outside ordinary reader reach | §4.7, §8.3 |
| Never log PII to application logs | `data_subject_request` handles access lawfully |
| Every shipment rule change → new migration | §9.2 |

### 8.5 Business rules to encode (and where)

| Rule | Value | Source | Encoded in |
|---|---|---|---|
| Debt capacity | 33 % or 40 % by variant | CFC guide (secondary) | `ref.debt_capacity_policy` (declarable, versioned) |
| Apport | 10–20 % | CFC guide | `ref.product.apport_rate` |
| Différé | 1–24 months | CFC guide | `ref.product.deferred_months` |
| Decision threshold | DA ≤ 8 M FCFA | CFC guide (institutional, not regulatory) | `ref.approval_threshold` |
| Interest rate | product-specific | Product catalogue | `ref.product_rate` |
| Savings interest | product-specific | — | `ref.product.savings_rate` |
| TEG disclosure | mandatory pre-contractual | Credit law art. 7 | `domain/calculations/teg.ts` |
| Usury ceiling | TEG moyen + 33 pts, quarterly | CEMAC 04/19 | `ref.usury_rate` (versioned, effective-dated) |
| Single-beneficiary cap | 25 % of own funds | R-2010/02 + R-2020/01 | Monitoring, not a per-dossier field |
| Mortgage risk weight | 75 % | R-2010/01 / R-2010/02 | `ref.risk_weight` |
| Record retention | 10 years | CEMAC 02/24 | `ref.retention_policy` |
| Drawdown certification | required before each tranche | CFC guide | `disbursement.certification_ref` NOT NULL |

---

## PART 9 — SUPABASE IMPLEMENTATION

### 9.1 Setup — already done

| Step | Status |
|---|---|
| `codex mcp add supabase --url 'https://mcp.supabase.com/mcp?project_ref=yyqfqsmsfaccsstwlpog&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cfeedback%2Cnotebooks'` | ✅ Done, `enabled: true`, **Auth: OAuth** (login completed) |
| `npx skills add supabase/agent-skills --skill supabase --skill supabase-postgres-best-practices -y` | ✅ Done — `.agents/skills/`, `.claude/skills/` symlinks, `skills-lock.json` |
| `codex mcp login supabase` | ✅ Completed automatically inside `codex mcp add` |
| `/mcp` in Codex | ⏳ Manual verification in the Codex UI |

**Tooling available on this workstation:** node v24.17.0 · npm 11.13.0 · codex-cli 0.166.0 · **supabase CLI 2.117.0** · `npx skills` working.

> **One gap.** The MCP URL does not enable the **`storage`** feature group — it is a distinct group and is **not on by default**. You will need it for the private document bucket. One-line change:
> ```powershell
> codex mcp remove supabase
> codex mcp add supabase --url 'https://mcp.supabase.com/mcp?project_ref=yyqfqsmsfaccsstwlpog&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cfeedback%2Cnotebooks%2Cstorage'
> ```
> Defer this until the Storage work begins — it requires a re-auth.

**CLI version note:** current CLI is **v2.x**. The flags `--linked`, `--project-ref`, `--db-url`, `--local` **still work in v3 but are deprecated and removed in v4** — v3+ wants `--remote[=<ref|branch|url>]`. Pin the CLI version in CI and write scripts against `--remote`.

### 9.2 Migration discipline

- Migrations live in `supabase/migrations/<timestamp>_name.sql`.
- `supabase db diff -f <name>` generates a migration against a shadow database; `supabase db push --remote` applies it; `supabase db reset` (local) tears down and re-applies.
- `supabase db lint` runs `plpgsql_check` (wrong parameter types, unused variables, dead code after `RETURN`, missing `RETURN`, hidden casts, `EXECUTE` injection risk) with `--level warning|error` and `--fail-on none|warning|error`.
- **Never edit a shipped RLS policy in place.** `drop policy` + `create policy` in a new migration — a policy change is a security change and must be reviewable in the diff.
- **Never edit a shipped requirement row** in `ref.service_document_requirement` — close it (`effective_to`) and insert a new one. Same for `ref.document_type`.
- Local dev: `supabase start` gives the full stack on `localhost:54321`; `supabase status` reports it.

**Proposed migration sequence:**

| # | Migration | Contents |
|---|---|---|
| 001 | `extensions_and_schemas` | `citext`, `pgcrypto`; schemas `public`, `ref`, `private` |
| 002 | `private_context` | `current_pole`, `current_user_id`, `set_session_context`, `touch_updated_at`, `audit_columns` |
| 003 | `auth_actors` | `actors`, `citizen_profiles`, `staff_profiles`, `staff_assignments` |
| 004 | `ref_catalogue` | `document_nature`, `document_type`, `document_type_equivalent`, `chemise` |
| 005 | `ref_products` | `product`, `product_rate`, `service`, `service_document_requirement`, `debt_capacity_policy`, `approval_threshold`, `retention_policy` |
| 006 | `dossier_core` | `dossier`, `dossier_parties`, `grants` |
| 007 | `documents` | `dossier_documents` (version chain, checksum) |
| 008 | `savings` | `savings_account`, `savings_transaction`, `savings_channel` |
| 009 | `credit` | `assessments`, `committee_deliberations`, `deliberation_lines`, `loan_offers` |
| 010 | `notary` | `land_title`, `notary_instruments`, `oppositions`, `insurances` |
| 011 | `disbursement` | `disbursements`, `disbursement_schedules`, `reconciliation_runs` |
| 012 | `events` | `dossier_events` (append-only) + `data_subject_request` |
| 013 | `rls_policies` | every policy, one table per statement |
| 014 | `storage_buckets` | bucket + `storage.objects` policies |
| 015 | `realtime` | `supabase_realtime` publication + channel setup |
| 016 | `seed_reference` | poles, roles, natures, product catalogue, default requirement sets |

### 9.3 Core RLS skeleton

```sql
-- storage.objects policies
insert into storage.buckets (id, name, public) values ('dossier-docs','dossier-docs', false);

create policy "staff read dossier docs" on storage.objects for select to authenticated
using ( bucket_id = 'dossier-docs'
       and (select private.current_pole()) in ('guichet','gestionnaire','risques','notaire','comite_credit','admin') );

create policy "citizen upload to own dossier folder" on storage.objects for insert to authenticated
with check ( bucket_id = 'dossier-docs'
             and (storage.foldername(name))[1] = (select auth.jwt()->>'sub') );

create policy "owner delete own doc" on storage.objects for delete to authenticated
using ( bucket_id = 'dossier-docs' and owner_id = (select auth.jwt()->>'sub') );
```

**And the domain attachment — never inferred from the path alone:**

```sql
create table public.dossier_documents (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references public.dossiers on delete cascade,
  doc_type_code     text not null references ref.document_type(code),
  chemise_code      text not null references ref.chemise(code),
  version           integer not null default 1,
  supersedes_id     uuid references public.dossier_documents(id),
  storage_path      text not null,
  original_filename text not null,
  mime_type         text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  size_bytes        bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  checksum_sha256   text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  status            public.document_status not null default 'awaiting_upload',
  valid_from        date,
  valid_until       date,
  uploaded_by       uuid not null references auth.users on delete restrict,
  uploaded_at       timestamptz not null default now(),
  validated_by      uuid references auth.users on delete set null,
  validated_at      timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users on delete set null,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users on delete set null,
  deleted_at        timestamptz,
  deleted_by        uuid references auth.users on delete set null,
  unique (storage_path)
);
create index dossier_documents_dossier_idx on public.dossier_documents (dossier_id, status);
create index dossier_documents_type_idx   on public.dossier_documents (doc_type_code);
```

**Serve through signed URLs with a short TTL.** Never a permanent public URL for a CNI scan.

### 9.4 The citizen/borrower side — what Supabase gives and what it does not

**Gives:** Auth (password, magic link, OTP, reset), Storage, RLS, Realtime, `pg_crypto`, and the Data API.

**Does not give — and CFC must build:**

1. **The domain state machines** (`domain/workflows/`) — pure TypeScript, enforced in server actions, mirrored by RLS.
2. **The document requirement engine** (`ref.missing_documents`) — declarative SQL.
3. **The approval / two-signature workflow.**
4. **The audit event log** (`dossier_events`) — append-only, written by `SECURITY DEFINER` functions.
5. **Email delivery** — custom SMTP; the default is rate-limited.
6. **The regulatory catalogue** — seed data from Compliance, versioned.
7. **Periodic review scheduling** — a cron/Edge Function driving `REVIEW_DUE`.
8. **Screening** — UN list ingestion, PEP determination workflow, adverse-media provider.

### 9.5 Realtime — all three primitives, three jobs

| Primitive | Use for | Caveat |
|---|---|---|
| **Postgres Changes** (`postgres_changes`) | **New dossiers and pipeline stage changes** — you want the row itself | The table must be in the `supabase_realtime` publication; RLS applies to subscribers; `DELETE` on filtered tables is unreliable → use soft delete + an append-only `dossier_events` log as the source of truth |
| **Broadcast** | Ephemeral "dossier X is now with the Notary" toasts | **Not persisted** — never the audit trail |
| **Presence** | "2 agents are on this file right now" | **Not persisted** |

**Recommendation:** `postgres_changes` on `dossiers` + `dossier_events` is the backbone; Broadcast for ephemeral pings; Presence for the concurrency indicator.

---

## PART 10 — MIGRATION FROM THE CURRENT CODE

### 10.1 Disposition of every asset

| Class | Assets | Action |
|---|---|---|
| **Keep as-is** | `src/components/ui/*` (the 14 CFC-only primitives), the layout shell, the savings calculator logic, the kanban DnD behaviour, `document-dropzone.tsx`, `kyc-form.tsx` field set, `client-savings-passbook.tsx` UI, the DUC manager UI | Port to Tailwind v4, keep the interaction design |
| **Lift from the kit** | `tag`, `count-badge`, `command`, `field`, `label`, `popover`, `scroll-area`, `asset/`, `lightbox/`, `FilterMenu`, `SegmentBar`, `Sparkline` | Copy with the version fixes in §1.8.6–1.8.7 |
| **Rewrite** | `clients-table.tsx` → grid-subgrid + side sheet · `client-duc-manager.tsx` (739 lines → ~200) · `kanban.tsx` (716 → ~250) · `client-edit-form.tsx` (permissions → capabilities) · `auth-context.tsx` → Supabase session · `sidebar-by-role.ts` → capabilities + RLS | New code against the target architecture |
| **Move** | the 8 `_components/data.ts` modules → `domain/entities` + `server/queries`; `src/lib/calculations.ts` → `domain/calculations` | Relocate with the types split out of the components |
| **Delete** | `file-manager/_components/**` (6 files) · `kanban-board.tsx` · `analytics-dashboard.tsx` · `kpi-summary.tsx` · `ui/chart.tsx` · `styles/presets/**` · `duc-investigation-data.ts` · `admin/login/` (merged into `/login`) | Dead code and the duplicate login (§1.6) |

### 10.2 The 50 routes → target route map

| Current | Target | Change |
|---|---|---|
| `/` | `/accueil` | Marketing moves; `/` becomes the login (D4) |
| `/simulator` | `/simulator` | Unchanged; rates from the catalogue |
| `/onboarding` | `/onboarding` | 4-step wizard, persisted |
| `/portal` | `/portal` | Real data; requirement-driven checklist |
| `/tracking` | `/track/[token]` | **Tokenised** — the CNI/phone/name search is removed |
| `/verify/[code]` | `/verify/[token]` | Signed single-purpose code |
| `/admin` | *deleted* | Per-role redirect happens in `/admin/layout.tsx` |
| `/admin/login` | `/login` | **One login**; the persona picker becomes a seed-gated demo mode |
| `/admin/analytics` + 4 | `/admin/analytics` + 4 | Real, pole-scoped queries |
| `/admin/clients` | `/admin/clients` | Grid-subgrid table + side sheet |
| `/admin/clients/[id]` | `/admin/clients/[id]` | **Kept** — deep view; the side sheet is the *primary* interaction |
| `/admin/file-manager` | *deleted* | Redirect stub today (OQ-8) |
| `/admin/kanban` + `[id]` | same | Driven by the phase state machine |
| `/admin/actors/**` (20 routes) | same | Regrouped under capability gates; G4 and G7 get owners (OQ-3) |

### 10.3 Sequencing

| Phase | Work | Exit criterion |
|---|---|---|
| **0 — Groundwork** | Tailwind v4 token migration; `AGENTS.md`; kit primitives lifted; `domain/` skeleton; ESLint boundary rules | The app builds on Tailwind v4 with the kit's primitives rendering |
| **1 — Schema** | Migrations 001–012; RLS; storage buckets; seed reference data | `supabase db lint` clean; a policy test suite proves cross-pole denial |
| **2 — Identity** | Supabase Auth; `/login`; reset; SMTP; `actors` split; capabilities | Login works; a role cannot reach another role's route or data |
| **3 — CRM surface** | Clients table (subgrid) + side sheet + toolbar + command menu + zustand stores | The clients table is filterable, sortable, selectable, and opens a side sheet |
| **4 — Domain** | Dossier, documents, savings, deliberations, disbursements; the requirement engine | A dossier moves through all six phases with evidence at every transition |
| **5 — Onboarding** | The 4-step wizard, the affiliation branch, the document checklist | A citizen completes onboarding and lands in `/portal` with a real DUC |
| **6 — Analytics, realtime, audit** | Real KPIs; the operations console; `admin:audit` | The console updates live; the audit view answers §6.1 |
| **7 — Hardening** | Accessibility pass (the ~74 labels, the clickable rows); error/loading/not-found per segment; the test suite | Keyboard-only operation of every table; every route segment has boundaries |

> **Sequencing principle:** phases 1–2 are the compliance-critical ones and they are also the ones that touch the least UI. Do not let a beautiful CRM surface ship over a system that still has no access control.

---

## PART 11 — OPEN QUESTIONS FOR CFC

**These require a decision by someone at the institution. Each is numbered so it can be answered in order.**

| # | Question | Why it blocks | Proposed default |
|---|---|---|---|
| **OQ-1** | Is the CFC target the project `yyqfqsmsfaccsstwlpog`, or should CFC and the reference kit share `noolofgfrxeoajyozkkg`? | Two Supabase projects now exist in the setup | Use `yyqfqsmsfaccsstwlpog` for CFC; keep the kit's separate |
| **OQ-2** | Ratify the capability matrix in §3.4 | Every policy and every route depends on it | Adopt as drafted; Compliance adjusts |
| **OQ-3** | Which role owns **G7** (Finances/Budget/Comptabilité) and **G4** (Clôture/Mainlevée/Conservation)? | 10 routes — including disbursement and mainlevée — are currently reachable by ADMIN only | Add `FINANCES` (G7) and `CLOTURE` (G4) roles |
| **OQ-4** | Should Compliance have `catalogue:write`, or only ADMIN? | A document-type change silently alters the legal requirement set | ADMIN only, with a special audit trail |
| **OQ-5** | Confirm the **debt capacity** rule: 33 % or 40 %, by which product variant? And what is the *field* name? | `isCobacCompliant` is a misnomer with no regulatory basis | Declarable, versioned policy; rename to `is_within_debt_capacity` |
| **OQ-6** | Confirm the **decision threshold** (DA ≤ 8 M FCFA) and the escalation chain | It is institutional policy sourced from a mirrored PDF | Adopt, flagged as policy not regulation |
| **OQ-7** | Reconcile the mock rates (5.0–5.75 %) with the published product (≈ 7 %, apport 10–20 %, différé 1–24 months) | The product catalogue must be right before it is declared | Take the published figures; confirm each product |
| **OQ-8** | Rebuild the **file manager** as a real cross-dossier document search, or delete it? | It is a redirect stub with ~440 orphaned lines | Delete; the DUC tab + search already cover it |
| **OQ-9** | What is **"API-ANE"**? | It could not be confirmed as a Cameroonian identity authority; it may be an internal CFC endpoint or a mis-expansion | Do not build on it; use document-based verification + name/MSISDN match + manual review |
| **OQ-10** | Confirm the **current quarterly usury rate** and the applicable **TEG moyen** for mortgages | The usury ceiling is set quarterly and the code's rates are stale | Pull the current CNEF/Comité de Politique Monétaire communiqué |
| **OQ-11** | Which **e-money KYC tiers** apply to the mobile-money onboarding? | Tier boundaries are regulatory and change; hardcoding one is a breach | Pull Règlement CEMAC 04/18 + ART/COBAC guidance |
| **OQ-12** | What is the intended meaning of **"écart de garantie"**? | It is not a confirmed COBAC term | Treat as the over-collateralisation margin; confirm |
| **OQ-13** | Which **adverse-media** provider, if any? | No official regional list exists | Start without it; add a configurable provider later |
| **OQ-14** | Who may see the **CNI scan**, and in what form? | The most sensitive data the bank holds | Tokenised; visible only to roles with `kyc:read`, never exported |
| **OQ-15** | Is the **D2 single-`auth.users`** identity model accepted? | Re-partitioning identities later is a data migration | Single `auth.users`, split profile tables |
| **OQ-16** | Are the **side sheets** restored as the primary CRM interaction, with dedicated pages kept as deep views? | v1.6.0 removed side sheets in favour of dedicated pages; the brief says the side sheets are preferred | **Restore side sheets as primary**; keep `[id]` pages as the deep view |
| **OQ-17** | Confirm the **dark/light** mode decision | The kit is dark-only; CFC is light | **Keep CFC light + the `.dark` block**; lift the kit's token architecture, not its `:root` |
| **OQ-18** | **Icons**: keep `lucide-react`, or adopt the kit's Figma-exported SVG components? | Wholesale divergence | Keep `lucide-react`; it is not worth 60 asset conversions |

---

## APPENDIX A — EVIDENCE INDEX

### A.1 Repositories

| Repo | Path | Branch / commit | Role |
|---|---|---|---|
| CFC Housing Portal | `C:/Users/DTA_WorkStation/Documents/cfc-housing-portal` | `main` @ `6fc5cf1` (v1.6.3) | The application |
| Guichet Unique reference | `C:/Users/DTA_WorkStation/Documents/guichet-unque-cfc` | `2bb8556` (`sales-crm`) | The UI kit |

### A.2 Primary sources — Supabase

| Claim | URL |
|---|---|
| `auth.users` columns (note `confirmed_at` is the physical column; `email_confirmed_at` is the API name; `encrypted_password` is a bcrypt **hash**) | https://github.com/supabase/auth/blob/master/migrations/00_init_auth_schema.up.sql |
| Current auth schema dump | https://github.com/supabase/postgres/blob/develop/migrations/schema-17.sql |
| `app_metadata` server-trusted vs `user_metadata` user-writable | https://supabase.com/docs/guides/auth/managing-user-data |
| `profiles` + `handle_new_user()` + `on delete cascade` | https://supabase.com/docs/guides/auth/managing-user-data |
| RLS model, `USING` vs `WITH CHECK`, `(select auth.uid())`, `search_path` hardening | https://supabase.com/docs/guides/database/postgres/row-level-security |
| Multi-tenancy (shared schema + RLS) | https://supabase.com/docs/guides/database/multi-tenancy |
| Storage access control / `storage.objects` RLS | https://supabase.com/docs/guides/storage/security/access-control |
| Signed URLs for private objects | https://supabase.com/docs/guides/storage/serving/downloads |
| Database migrations | https://supabase.com/docs/guides/deployment/database-migrations |
| `supabase db lint` | https://supabase.com/reference/cli/supabase-db-lint |
| CLI testing & linting (`--linked`/`--local` deprecated in v3, removed in v4) | https://supabase.com/docs/guides/local-development/cli/testing-and-linting |
| MCP server (`?project_ref=`, `?read_only=`, `?features=`, `?skip_elicitations=`) | https://supabase.com/docs/guides/ai-tools/mcp |
| Realtime `postgres_changes` | https://supabase.com/docs/guides/realtime/postgres-changes |
| Realtime architecture (Postgres Changes vs Broadcast vs Presence) | https://supabase.com/docs/guides/realtime/architecture |
| Agent Skills repository (`supabase`, `supabase-postgres-best-practices`) | https://github.com/supabase/agent-skills |

### A.3 Primary sources — Cameroon / CEMAC

| Claim | URL |
|---|---|
| COBAC regulations index | https://beac.int/supervision-bancaire/reglements-de-cobac/ |
| **Règlement COBAC R-2023/01** (LBC/FT-P) — arts. 16–42, 63, 71 | https://gabac.org/wp-content/uploads/2025/01/DEUXIEME-RAPPORT-DE-SUIVI-RENFORCE-DU-CAMEROUN.pdf |
| COBAC Annual Report 2024 — confirms R-2023/01 | https://www.beac.int/wp-content/uploads/2016/10/Rapport-annuel-de-la-COBAC-2024-PDF-14.8-Mo_compressed-1.pdf |
| **Règlement CEMAC n° 02/24** (LBC/FT-P; 10-year retention) | https://gabac.org/wp-content/uploads/2025/05/Reglement-N%C2%B002-24-CEMAC-UMAC-LBC-FT-Eng.pdf |
| Règlement COBAC **R-2010/02** (risk division; 75 % mortgage weighting) | https://www.beac.int/wp-content/uploads/2016/10/Reglement-_COBAC-_R_2010_02_divrisq-1.pdf |
| Règlement COBAC **R-2010/01** (risk coverage, 8 %) | https://www.beac.int/wp-content/uploads/2016/10/RgltCOBAC_-R_2010_01_couvrisq.pdf |
| Règlement COBAC **R-2018/01** (classification, art. 10 contamination) | https://www.beac.int/wp-content/uploads/2016/10/reglement_cobac_r_2018-01_relatif_a_la_classification_a_la_comptabilisation_et_au_provisionnement_des_creances.pdf |
| Instruction COBAC **I-2015/01** (PCEC; 0.5 %→2 % general provision) | https://www.beac.int/wp-content/uploads/2016/10/instruction_cobac_i_2015_01_pcec.pdf |
| Règlement COBAC **R-2001/07** (internal control, art. 37 two-person rule) | https://www.beac.int/wp-content/uploads/2016/10/Evaluation-de-la-Mise-en-oeuvre-du-R%C3%A8glement-COBAC-R-200107-relatif-au-contro%CC%82le-interne-dans-les-e%CC%81tablissements-de-cr%C3%A9dit-de-la-CEMAC.pdf |
| Cameroon credit-activity law (arts. 4, 6, 7) | https://cnefcameroun.cm/images/tele/REGLE_ACTIVITE_CREDIT_BANQUE_EMF.pdf |
| MINDCAF — mission | https://mindcaf.gov.cm/fr/mission/ |
| MINDCAF — *Manuel des procédures foncières* (the 2j/15j/3j chain) | https://mindcaf.gov.cm/media/filer_public/6a/cb/6acb60c5-4852-48a4-be8a-d806aca2c0a2/matrice_des_procedures.pdf |
| MINDCAF — fees (hypothèque et privilège) | https://mindcaf.gov.cm/fr/faq/ |
| CFC official site / *Prêt Foncier Classique* (max 150 M FCFA) | https://www.creditfoncier.cm/fr/ and https://www.creditfoncier.cm/fr/produits-prets/pret-foncier-classique/pret-foncier-classique-ordinaire.html |
| CFC *Guide Pratique du Prêt Foncier Classique* (**secondary** — mirrored PDF) | https://fr.scribd.com/document/381433109/Guide-Pret-Foncier-Classique |
| World Bank — *Financement du Logement au Cameroun* (MAETUR/SIC/CFC; rates ≈ 7 %; default > 30 %) | https://documents1.worldbank.org/curated/en/358971591000376962/pdf/Financement-du-Logement-au-Cameroun-Vers-un-Logement-Affordable-pour-Tous.pdf |
| World Bank — Cameroon has **no cross-sector digital identity verification service** | https://openknowledge.worldbank.org/server/api/core/bitstreams/4f804927-b777-48e7-9e6f-97f729ec788e/content |
| UN-Habitat — Cameroon Habitat III national report | https://habitat3.org/wp-content/uploads/Cameroon-Rapport-national-Habitat-III-Version-fev-16.pdf |
| MAETUR official site | https://www.maetur-cameroun.com/ |
| FATF Recommendations (R10 + Interpretive Note) | https://www.fatf-gafi.org/content/dam/fatf-gafi/recommendations/FATF%20Recommendations%20(approved%20February%202012)%20reprint%20Feb%202013%20web%20version.pdf |
| FATF *Guidance on Digital Identity* (2020) | https://www.fatf-gafi.org/content/dam/fatf-gafi/guidance/Guidance-on-Digital-Identity-report.pdf |
| UN Security Council Consolidated List | https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list |
| GABAC (regional FATF-style body) | https://gabac.org/ |

### A.4 Method

Four read-only sweeps over the two repositories (entities & workflows · routes, features & RBAC reality · the reference kit · external research), plus direct reads of the RBAC spine, the domain types, the calculation module, the CRM table, the kit's store/table/sheet, and the schema-catalogue design. No source file was modified during the analysis; `git diff --stat` is empty on tracked files.

---

## APPENDIX B — GLOSSARY

| Term | Meaning |
|---|---|
| **CFC** | Crédit Foncier du Cameroun — the housing bank |
| **Guichet Unique** | The single-window service: one dossier, one counter, one file |
| **DUC** | *Dossier Unique Client* — the customer's single federating file |
| **Chemise C1 / C2 / C3** | The three physical sub-folders: Identification / Instruction / Garanties |
| **Apport** | The customer's own equity contribution, 10–20 % |
| **Épargne** | The savings account building the apport |
| **Carnet d'épargne** | The savings passbook |
| **BET** | *Bureau d'Études Techniques* — the technical study office (site report, geotechnics) |
| **CGR / CRC** | Two credit committees — the second-level and institutional levels |
| **PCA** | *Prêt à conditions administratives* — the institutional-board file |
| **OPP** | *Offre de Prêt de Prêt* — the formal loan offer |
| **VD** | *Valeur Disponible* — the releasable disbursement |
| **SYSTAC** | The telecompensation / settlement rail |
| **DA / DCR / CIEP** | *Directeur d'Agence* / *Direction du Crédit* / committee tiers |
| **TF** | *Titre Foncier* — the definitive land title, held in the *livre foncier* |
| **Mainlevée** | The deed releasing the mortgage; its **radiation** removes it from the *livre foncier* |
| **Pré-notation / opposition** | The check for third-party rights before mortgage registration |
| **MINDCAF** | The ministry of lands, cadastre and land affairs |
| **Conservation Foncière** | The land registry office holding the *livre foncier* |
| **Mandat limité** | The limited power of attorney used by a diaspora customer's local agent |
| **Attestation de conformité** | The certificate a non-resident's bank must issue (COBAC R-2023/01 art. 42) |
| **TEG** | *Taux Effectif Global* — the APR, which must be disclosed pre-contractually |
| **Carthago** | The core banking system |
| **MAETUR / SIC** | The public land developer and the public housing developer |
| **ANIF / APD / GABAC** | The FIU, the data-protection authority, the regional AML assessment body |
| **Décompte d'apurement** | The formal payoff statement |
| **Différé** | The grace period before first repayment, 1–24 months |

---

## PART 12 — IMPLEMENTATION STATUS (2026-11-11)

> **Partially superseded by Part 14 (2026-11-12).** Part 12 predates the two
> portals, the removal of the public vitrine, the working document deposit and
> the business-event signalling. Where the two disagree, **Part 14 wins**.
> Part 12 remains true for what it does not cover.

Part 0–11 describe the **target**. This part records what has **actually been built and verified** on the `cfc-housing-portal` repository. Where Part 1 describes the pre-refactor state, this part supersedes it.

### 12.1 What was implemented

| Workstream | Delivered | Evidence |
|---|---|---|
| **Cleanup** | 7 dead assets deleted (`file-manager/_components/**` 6 files + 191-line data module, `kanban-board.tsx` 472 lines, `analytics-dashboard.tsx`, `kpi-summary.tsx`, `ui/chart.tsx`, `styles/presets/**` 3 files, `duc-investigation-data.ts` 282 lines) | `git status` — gone from the tree |
| **Structure** | 8 domain data modules moved out of `_components/` into `src/domain/{entities,data,calculations}/`; ~55 import sites rewritten; ESLint `no-restricted-imports` now forbids `src/domain/**` → `react`/`next`/`@supabase/*`/`components`/`server` | `eslint.config.mjs`; `npm run lint` = 0 |
| **Taxonomy** | The two conflicting document vocabularies unified into one canonical French set in `src/domain/entities/types.ts` (`DocumentCategory`, `DocumentStatus`); `src/domain/entities/client.ts` imports those exact aliases | `src/domain/entities/documents.test.ts` |
| **Database** | 15 migrations under `supabase/migrations/` — schemas `public` / `ref` / `private`; audit trigger (`created_at/by`, `updated_at/by`, `deleted_at/by`) on every domain table; `private.current_pole()` / `current_user_id()` / `set_session_context()`; RLS on every table in `public` and `ref`; append-only `dossier_events`; private storage bucket `dossier-docs`; realtime publication | `supabase db reset --local` applies all 15 + seed cleanly |
| **Declarable catalogue** | `ref.document_nature`, `ref.document_type`, `ref.document_type_equivalent`, `ref.chemise`, `ref.service`, `ref.service_document_requirement` (effective-dated, `condition_expr`), `ref.product`, `ref.product_rate`, `ref.debt_capacity_policy`, `ref.approval_threshold`, `ref.retention_policy` | `supabase/seed.sql` |
| **RLS proof** | Policies validated against a **live local Postgres** with real Supabase auth sessions — cross-pole denial confirmed (G1 ≠ G8 on C3, G3 blocked on C1, citizen blocked on staff dossiers, `ref` read-only to `authenticated`, events append-only) | local Supabase stack, 5 sessions |
| **Auth** | The fake auth is **gone**: `loginAsUser`, `SEEDED_ADMIN_USERS`, `DEFAULT_USER`, `void password` and the silent `DEFAULT_USER` fallback all removed. Real Supabase email+password, magic link, and password reset behind `/login`. The live **role switcher in the admin chrome is deleted** — that was the self-escalation hole. | grep returns no matches; `src/app/login/**`, `src/lib/auth-context.tsx` |
| **Session** | Root `middleware.ts` refreshes the session on every request and redirects unauthenticated `/admin/**` → `/login`; an authenticated user on `/login` is sent to their **real** landing, derived from `public.staff_assignments` (never hardcoded) | `src/server/auth/landing.ts` |
| **Root route (D4)** | `/` now **redirects to `/login`**; the public vitrine moved to `/accueil`. One login for citizens and agents, each routed to their own console afterwards | `src/app/page.tsx`, `src/app/accueil/page.tsx` |
| **RBAC model** | `src/domain/policies/{capabilities,permissions,scope,chemise}.ts` — capability matrix replacing role-string comparisons; scopes (`OWN_AGENCY`, `OWN_PORTFOLIO`, `ALL`, `OWN_FILES`, `DIASPORA_FILES`) | `src/domain/policies/**` |
| **State** | Zustand 5 stores — the store holds **UI intent only**; every derived list is a pure function memoised in the component | `src/stores/clients-store.ts`, `src/lib/clients-filters.ts` |
| **Design tokens** | The kit's token *architecture* lifted onto CFC's palette and Tailwind v3 (so the code is v4-ready without the migration): 13 role tokens in light + dark, the GSAP power easing set, the `.<role>-style` type companions as **opt-in** (`@layer components`, so no existing page changes) | `src/app/globals.css`, `tailwind.config.ts` |
| **CRM surface** | The clients table rebuilt on the kit's **CSS-grid subgrid** pattern (not `<table>` layout): column tuple + `grid-cols-subgrid` rows, tri-state select-all, row-click opens a **side sheet**; a `DetailSection` composition; a filter toolbar (search + 4 `FilterMenu` facets + CSV export with formula-injection escaping); a ⌘K `cmdk` palette | `src/components/clients/**` |
| **Primitives** | `FilterMenu`, `SegmentBar`, `Sparkline` (kit, ported to v3); `scroll-area.tsx` with orientation support; `checkbox.tsx` extended to true tri-state (`boolean \| "indeterminate"`) | `src/components/_common/**`, `src/components/ui/**` |
| **Tooling** | `typecheck`, `test` (vitest), `lint` (`eslint .` replaces the deprecated `next lint`), `db:reset`, `db:seed:users` scripts; 21 tests green | `package.json` |
| **Dev users** | `scripts/seed-dev-users.mjs` provisions 7 staff accounts (one per role, with pole + scope + agency) and 2 citizens (first-time + non-resident) — each with `app_metadata` role/pole, `actors`, `staff_profiles`, `staff_assignments` | `npm run db:seed:users` |

### 12.2 Verified

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | 21 passed (2 files) |
| `npm run build` | exit 0 — middleware compiled (109 kB) and in the route table |
| `supabase db reset --local` | 15 migrations + seed applied cleanly |
| RLS behaviour | cross-pole denial proven with real sessions against local Postgres |
| HTTP probe (unauthenticated) | `/admin/clients` → **307 → `/login`** (the guard works) |
| HTTP probe (authenticated) | `scripts/smoke.mjs` — 22 assertions over public routes, the guard, both role landings, the KYC queue and the catalogue gating |

### 12.3 Explicitly not yet done

These are **not** claims of completion — they are the remaining gap between this state and Part 0–11. *Updated 2026-11-11, after the cartography alignment (Part 13).*

1. **Most screens still read hardcoded arrays.** The citizen portal now reads the
   citizen's real dossier and the declarable checklist, and the CRM, the
   catalogue, the KYC queue and the e-mail settings read the database — but the
   actor-pole screens (risk engineering, committees, notariat, disbursements,
   recovery) are still mock-backed. The seam exists (§9.3,
   `src/server/queries/`); it must be filled in pole by pole.
2. **Server actions exist but do not yet cover every mutation.** `onboarding`,
   `catalogue`, `kyc`, `email` and `storage` all re-check the capability before
   writing. The remaining screens still mutate local state only.
3. ~~No document storage~~ — **done**: signed-URL upload, SHA-256 checksum,
   version chain, and `dossier_events` are implemented
   (`src/server/storage/**`, `src/components/upload/**`).
4. ~~The KYC engine is not built~~ — **done as a domain module**: the state
   machine, the eight enhanced-due-diligence triggers with their regulatory
   basis, and the risk rating (`src/domain/workflows/kyc.ts`), plus the agent
   validation screen. **Still missing**: the screening providers (UN list,
   PEP, adverse media) and the automated periodic review.
5. **`/tracking` still exposes PII** by CNI / phone / name (§3.6.6). This is
   the most serious remaining item.
6. **G4, G7 and the `DRAC` pole still have no business owner** (§1.5.1,
   Part 13.4) — OQ-3 is unanswered, so 10 routes remain ADMIN-only.
7. ~~Tailwind v4 migration not done~~ — **done**: CSS-first `@theme`, the kit's
   token architecture in `src/app/globals.css`, the kit's primitives merged
   into `src/components/ui/`, and a working light/dark theme toggle.
8. **No CI.** `typecheck` / `lint` / `test` / `build` / `smoke` are scriptable
   but not wired to a pipeline.
9. **Public key exposure is untested** — the auth paths were exercised locally
   only.
10. **The `DRAC` / recouvrement scale exists as a domain module** but has no
    screen and no persistence yet.

### 12.4 How to run it locally

```powershell
npm install
supabase start                 # local stack (Docker)
npm run db:reset               # 15 migrations + seed
npm run db:seed:users          # 7 staff + 2 citizen accounts
npm run dev                    # http://localhost:3000
```

`.env.local` points at `http://127.0.0.1:54321`. Dev password for every seeded account: `CfcDev2026!`.
Accounts: `guichet@cfc.cm`, `gestionnaire@cfc.cm`, `risques@cfc.cm`, `notaire@cfc.cm`, `comite@cfc.cm`, `diaspora@cfc.cm`, `admin@cfc.cm`, `emprunteur@cfc.cm`, `emprunteur.diaspora@cfc.cm`.

Verification: `npm run typecheck && npm run lint && npm test && npm run build && node scripts/smoke.mjs`

---

---

## PART 13 — ALIGNEMENT SUR LA CARTOGRAPHIE OFFICIELLE (2026-11-11)

Une cartographie officielle des processus CFC a été transmise après la rédaction
des Parties 0–12 : *« Cartographie et analyse des processus métiers clés »*
(chapitre 6), établie par la mission à partir du recueil des manuels de
procédures, avec trois familles de processus, six processus prioritaires et
quatre diagrammes en couloirs (figures 6 à 9).

**Elle fait autorité sur le modèle métier.** Le modèle applicatif en a été
recalé : les codes de procédure sont désormais la référence partagée entre le
back-office, le portail et le reporting.

### 13.1 Ce que la cartographie corrige

| Point | Modèle initial (Parts 0–12) | Cartographie officielle | Conséquence |
|---|---|---|---|
| Codes de procédure | absents | `CRD-01`…`CRD-15`, `GAR-01`…`07`, `REC-01`…`12`, `ACC/CLT/CPT/OPE/CAI`, `ARC/COU` | `ref.process` + `ref.process_step` (migration 018) ; `src/domain/entities/processes.ts` |
| Périmètre du crédit | 6 phases | 13 étapes `CRD-01`…`CRD-13` réparties en 3 bandes : **Instruction**, **Évaluation et décision**, **Mise en place** | Les 6 phases applicatives sont conservées comme vue opérationnelle, et chaque étape est désormais rattachée à une phase |
| Épargne-logement | « phase 1 » du crédit | **processus prioritaire distinct** (PR-03), préalable au prêt | L'épargne n'est plus une phase du crédit mais un processus amont, avec ses règles propres |
| Recouvrement | écran « recouvrement » | **PR-06, pilote DRAC**, échelle d'ancienneté de l'impayé | `src/domain/workflows/recovery.ts` + `ref.arrears_phase` |
| Pilotes | 7 rôles applicatifs | **directions réelles** : DCR, DRAC, DFBC, DCM, DECS, DGR, DAI, SDI, SDPA, DAG, PMT, GRC, BUD, CMP, DEP, MPT, SDRH, HAB, SEC, SCOM | `ref.process.pilote` ; le pole `DRAC` **manquait** — il porte le recouvrement et le contentieux |
| Droits acquis de l'épargne | absents | « Rémunération et droits acquis · période ≥ 1 an » | `src/domain/calculations/savings.ts` — droit acquis à 12 mois, carnet A ou B, conversion en prêt à l'issue de la période contractuelle |
| Domiciliation | absente | rupture n°2 du recouvrement (prélèvements, ATD) | Levier identifié, non encore implémenté |
| Points de rupture | absents | 14 ruptures documentées avec un **levier d'amélioration** par rupture | `ref.process_rupture` ; chaque rupture porte son levier |

### 13.2 Le circuit de crédit en codes de procédure

| Phase applicative | Étapes | Bande officielle |
|---|---|---|
| `kyc_savings` | `CRD-01` entretien exploratoire · `CRD-02` analyse sommaire · `CRD-03` frais d'instruction, contrat, numérotation | Instruction |
| `risk_bet` | `CRD-04` dossier technique BET *(externe)* · `CRD-06` évaluation du dossier | Instruction / Évaluation |
| `committees` | `CRD-07` décision du directeur d'agence · `CRD-08` contrôle et présentation à la décision · `CRD-09`·`CRD-10` notification | Évaluation et décision |
| `notary_mortgage` | `GAR-01` garanties : notaire, conservation foncière, assurance *(externe)* · `CRD-11` mise en place du prêt | Mise en place |
| `disbursements` | `CRD-12` déblocages sur inspection de chantier · `CRD-13` décaissement et comptabilisation (CARTHAGO) | Mise en place |
| `closing_release` | `REC-09` échéance réglée · `REC-10` remboursement anticipé · `GAR-05` mainlevée | Recouvrement / Garanties |

> La phase de clôture tire ses étapes du **recouvrement** et des **garanties**,
> pas du crédit : `stepsForPhase()` assemble les deux catalogues.

### 13.3 Les quatre propositions de la mission qui structurent la cible

1. **« Le crédit est le processus de référence. »** Sa réingénierie conditionne
   la valeur de l'ERP et du Guichet : digitaliser un parcours non simplifié
   reproduirait ses lenteurs. → le workflow unique et traçable est prioritaire
   sur l'élargissement fonctionnel.
2. **« La donnée traverse tous les processus. »** Référentiel client, crédit,
   garanties et archives forment **un même patrimoine informationnel**, à
   gouverner comme tel. → le stockage, le catalogue documentaire et la piste
   d'audit partagent le même modèle d'audit (`created_by`/`updated_by`/`deleted_by`).
3. **« Les points de rupture externes appellent des partenariats. »** Notaires,
   conservation foncière, banques et employeurs sont des maillons du
   processus. → la Plateforme Filière Habitat et le guichet unique foncier
   recommandé par MAZARS en sont les réponses.
4. **Les indicateurs proposés par processus** deviennent les KPI du tableau de
   bord : délai demande→décision et décision→premier déblocage, taux de
   dossiers complets au premier dépôt, taux de transformation, taux de crédits
   sains à 12 mois, délai de mainlevée, taux de recouvrement, coût du risque,
   délai moyen de recherche d'un document.

### 13.4 Ce qui reste ouvert après cet alignement

- **Le pole `DRAC`** (Direction du Recouvrement et des Affaires Contentieuses)
  n'a pas de rôle applicatif. C'est la même lacune que G4/G7, mais côté
  recouvrement. → OQ-3.
- **La domiciliation des revenus** (rupture `REC-R1`) n'est pas modélisée :
  elle conditionne le prélèvement automatique et l'ATD. → à traiter avec la
  DRAC.
- **Le cadre PEL de 1987** (rupture `CPT-R4`) : les règles de droit acquis et
  de carnet sont modélisées, le cadre réglementaire lui-même est à faire
  confirmer par la Direction Commerciale.

---

## PART 14 — DEUX PORTAILS, DÉPÔT RÉEL ET SIGNALISATION (2026-11-12)

Cette partie **supersède la partie 12** sur tous les points qu'elle couvre : les
deux portails, la vitrine publique retirée, le dépôt documentaire, les
notifications et le fil de support n'existaient pas à la date de la partie 12.
La partie 12 reste vraie pour ce qu'elle ne traite pas (structure du domaine,
RLS, cartographie).

### 14.1 Les deux portails

| | Portail client | Portail CFC |
|---|---|---|
| **Porte** | `/login` (e-mail + mot de passe **ou** lien magique) | `/portail-cfc/login` (**mot de passe seul**) |
| **Racine** | `/portail-client` | `/portail-cfc` → redirection **307** vers l'écran du pôle |
| **Écran d'atterrissage** | `/portail-client` | déduit du rôle réel (`public.staff_assignments`), jamais codé en dur |

- **Plus de vitrine publique.** `/` répond **307 → `/login`** ; `/accueil`
  répond **404** (la page et ses composants `showcase/**` ont été supprimés).
- Les routes ont été renommées : `src/app/admin/**` → `src/app/portail-cfc/**`
  (85 fichiers), `src/app/portal/**` → `src/app/portail-client/**`,
  `src/components/admin/**` → `src/components/portail-cfc/**`,
  `src/components/portal/**` → `src/components/portail-client/**`.

### 14.2 Le dépôt documentaire — cause racine du blocage « 42P10 »

Le dépôt échouait sur **toute** écriture, y compris sur un seau neuf sans
politique RLS. Ce n'était ni notre RLS, ni nos politiques, ni la danse des
URLs signées : c'était un **décalage de version entre l'image de l'API Storage
et le schéma de la base**.

| | Version | Migrations `storage` embarquées |
|---|---|---|
| Image **exécutée** | `supabase/storage-api:v1.72.1` | 1 → 67 |
| Schéma **de la base** | migration 79 (`lifecycle-writer-coordination`) | 1 → 79 |

La migration `0072-drop-bucketid-objname-index` a supprimé l'index unique
`(bucket_id, name)` ; les index d'unicité restants sont **partiels**
(`idx_objects_current_version`, `idx_objects_null_version`). Or `v1.72.1`
écrit toujours :

```sql
INSERT INTO storage.objects (...) ON CONFLICT (name, bucket_id) DO UPDATE ...
```

Cette forme n'infère plus aucun index → PostgreSQL répond **42P10**. La
version `v1.89.13` teste la présence de la migration
`objects-current-version-index` et choisit alors
`ON CONFLICT (bucket_id, name COLLATE "C") WHERE archived_at IS NULL`, qui
s'infère.

**Correctif** : `supabase/config.toml` épingle désormais l'image —

```toml
[storage]
image = "public.ecr.aws/supabase/storage-api:v1.89.13"
```

**Image et schéma doivent rester alignés** : c'est le conteneur qui migre la
base, donc c'est lui qui décide de la version du schéma. Un `supabase db reset`
appliqué par une image plus ancienne que le schéma laisse la base en avance ;
un `supabase db reset` avec une image plus récente que le schéma la laisse en
retard.

Second correctif, dans l'application : la verb du dépôt signé. Le client
officiel (`storage-js`, `uploadToSignedUrl`) fait un **PUT** sur l'URI de
signature ; un `POST` renvoie la *description* de la signature et n'écrit
rien. `src/components/upload/document-uploader.tsx` est revenu à `PUT`.

### 14.3 La signalisation des événements métier

Un événement important produit **deux** signaux : une notification in-app
(`public.notifications`) et un courriel. Le module
`src/server/notifications/notify.ts` en est le **seul** propriétaire :

- `DOMAIN_EVENT_NOTIFICATIONS` — le catalogue : type de notification et titre
  affichés, par type d'événement ;
- `notify()` — l'écriture de la ligne (rôle de service) ;
- `notifyBusinessEvent()` — le dispatch : résout le destinataire, écrit la
  notification, déclenche le courriel ;
- `handleBusinessEventEnvelope()` — la lecture des enveloppes du relais base.

Le relais HTTP est passé de `/api/email/dispatch` à **`/api/events/dispatch`** :
il ne dispatche plus un e-mail, il dispatche un **fait métier**. L'URL est
toujours celle de `ref.email_settings.dispatch_url` (désactivée par défaut).

Événements câblés : **décision KYC** (l'emprunteur), **dépôt d'une pièce** (le
conseiller du dossier), **message de support** (l'interlocuteur).

### 14.4 Défauts trouvés et corrigés en chemin

| Défaut | Cause | Correctif |
|---|---|---|
| La décision KYC échouait toujours | insertion directe dans `dossier_events`, qui est en **ajout seul** sous RLS forcé : aucune politique d'insertion, seule la fonction `security definer` écrit | passage par `public.append_dossier_event`, qui contrôle l'habilitation de l'agent sur le dossier |
| `/portail-cfc/login` en **boucle de redirection** | le middleware renvoyait toute route `/portail-cfc/**` vers la porte agent, y compris la porte elle-même | la porte est exclue du renvoi |
| `/portail-cfc` renvoyait un **200 + rafraîchissement** | `redirect()` dans la page, alors que le gabarit de la console était déjà envoyé | redirection **307** posée dans le middleware |
| La checklist affichait des états bruts | `status` casté sans normalisation (`awaiting_upload` hors énumération) | `checklistStatusFor()` dans le domaine |
| Deux vocabulaires de phases et d'événements | `PHASE_LABELS` dupliqué dans la couche serveur | le domaine (`src/domain/entities/processes.ts`) est le seul propriétaire |
| Un événement s'appelait autrement selon l'écran | la notification avait son propre titre, la chronologie le sien | un seul libellé par fait métier, dans le domaine ; la cloche et la chronologie l'emploient |
| Le composant client importait la couche serveur | contournement de la règle ESLint par un import relatif | les types passent par `@/domain/entities/services` |
| L'emprunteur de démonstration n'avait **aucun dossier** | le script de provisionnement créait les comptes, pas les dossiers | `scripts/seed-dev-users.mjs` ouvre un dossier par emprunteur, avec son conseiller, sa phase et sa chronologie |

### 14.5 Vérifié

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 — 0 erreur, 0 avertissement |
| `npm test` | **229 passés** (18 fichiers) |
| `CFC_E2E=1 vitest run src/server/storage/e2e.local.test.ts` | 5 passés — dépôt réel, chaînage de versions, substitution refusée, intrusion refusée |
| `CFC_E2E=1 vitest run src/server/notifications/e2e.local.test.ts` | 3 passés — décision KYC notifiée et journalisée, pièce notifiée au conseiller, événement hors catalogue ignoré |
| `npm run build` | exit 0 |
| `node scripts/smoke.mjs` | **23/23** — portes, garde d'accès, atterrissages de rôle, file KYC, catalogue, page agent |
| `supabase db reset --local` | 20 migrations + seed appliqués |
| `supabase migration list` (projet `yyqfqsmsfaccsstwlpog`) | **19/19** — local et hébergé alignés |
| Rendu authentifié (session réelle) | portail client : phase, chronologie, complétude, fil de support et cloche présents ; console CFC : cloche, filtres, tableau CRM, export — **16/16** |

### 14.6 Ce qui n'a pas été vérifié

- **L'apparence des portails authentifiés** n'a pas été revue à l'écran : la
  connexion dans le Browser n'a pas abouti, et je n'inscris jamais de mot de
  passe moi-même. Ce qui est vérifié, c'est le **rendu** : le HTML rendu par
  le serveur avec une session réelle contient bien la phase, la chronologie,
  la checklist, le fil de support et la cloche des deux côtés.
- Les pages publiques (`/login`, `/portail-cfc/login`) ont été vues à l'écran.

### 14.7 Ce qui reste ouvert

Inchangé sur l'essentiel de la partie 12.3, plus :

1. **Les écrans par pôle restent adossés à des tableaux statiques** (risques,
   comités, notariat, déblocages, recouvrement) : le câblage existe, il doit
   être rempli pôle par pôle.
2. **Le coffre local dépend d'une image épinglée.** Un `supabase start` avec
   une pile plus récente réintroduirait le décalage : vérifier
   `supabase/config.toml` avant toute remise à jour de la CLI.
3. **Le relais base → application est désactivé par défaut** : sans
   `ref.email_settings.is_enabled`, seuls les événements produits par une
   action serveur notifient l'acteur.
4. **`/tracking` expose encore des PII** par CNI / téléphone / nom (§3.6.6) —
   l'item le plus sérieux qui reste.
5. **Aucune CI** : `typecheck` / `lint` / `test` / `build` / `smoke` sont
   scriptables mais ne sont pas câblés à une chaîne d'intégration.

---

---

## PART 15 — ESPACE CITOYEN, MESSAGERIE ET ISOLEMENT DES RÔLES (2026-11-12)

Cette partie décrit l'état de l'application après la refonte de l'espace
citoyen, la messagerie et le cloisonnement des rôles. Elle **supersède la
partie 14** sur ces points.

### 15.1 L'espace citoyen n'est plus une liste

| Écran | Ce qu'il est |
|---|---|
| `/portail-client` | **Tableau de bord** : bandeau d'indicateurs (avancement, complétude des pièces, épargne constituée, échéance) et trois graphiques (anneau des pièces par état, barres des pièces obligatoires par étape, activité des événements par mois) |
| `/tracking` | **Suivi indexé** du parcours : les étapes du circuit (`CRD-01`…`CRD-13`, `GAR-01`) avec leur état — franchie, en cours, à venir — et les pièces encore dues |
| `/portail-client/profil` | **Profil** : identité, dossier, préférences d'affichage, déconnexion |
| `/simulator` | Simulateur d'épargne, accessible depuis l'en-tête de l'espace citoyen |

L'en-tête de l'espace citoyen porte les trois parcours (Mon dossier,
Simulateur, Suivi DUC), la cloche de notifications et le menu d'identité.
C'est le **même** menu d'identité et la **même** cloche que dans la console
CFC (`src/components/layout/user-menu.tsx`) : un seul chemin vers son compte,
dans les deux portails.

`/tracking` n'interroge plus de données fictives et n'affiche plus de CNI, de
téléphone ni de nom : il ne montre que **le dossier du visiteur**, à travers
`getCitizenTracking()`.

### 15.2 L'indexation du parcours

`src/domain/workflows/tracking.ts` est le propriétaire de l'indexation : il
combine la phase courante du dossier et les événements de son journal pour
étatiser chaque étape. Le principe retenu : **le journal l'emporte sur
l'ordre théorique** — un dossier peut sauter une phase, l'événement
atteste.

### 15.3 La messagerie

Le fil de support est une conversation **indexée par dossier**. Un message
peut porter un texte, une **pièce jointe** (image ou document, 10 Mo), une
**réponse** à un message précis et un **ancrage** dans le parcours (étape du
circuit ou pièce du dossier).

- Bulles de type messagerie instantanée : réponse citée, aperçu d'image,
  pastille de fichier, horodatage.
- Sélecteur d'émojis (palette courte, dans la `Popover` du kit).
- Dépôt par **URL signée** : les octets ne transitent jamais par le serveur.
- La pièce jointe est servie par une **URL signée** à durée courte : le
  coffre `support-attachments` est privé.
- Le fil est cloisonné par le **périmètre** du dossier, pas par le seul rôle.

L'agent dispose d'une **file de support** (`/portail-cfc/support`) : la liste
des conversations de son périmètre et la conversation ouverte.

#### Deux défauts du fil, corrigés

- **La réponse citée ne s'affichait pas.** Le message chargé depuis la base
  portait `reply_to_id`, mais l'aperçu cité n'était jamais résolu : la bulle
  ne montrait donc aucun bloc de citation. L'aperçu est désormais **résolu
  depuis le fil** au moment du rendu (`withResolvedReplies`) — jamais stocké
  deux fois. Un message reçu par diffusion et un message relu depuis la base
  sont traités de la même façon.
- **Répondre à un message à l'instant était refusé** par la clé étrangère
  `reply_to_id` : le message visé portait un identifiant **optimiste**,
  inconnu de la base. Le fil **écrit avant de diffuser** — l'identifiant
  diffusé est donc celui de la base, et une réponse peut le viser des deux
  côtés. Quand la réponse vise un message dont l'écriture est en cours,
  l'identifiant stocké est **attendu** avant l'insertion.

Ces deux points sont couverts par des tests : `src/components/support/support-chat.test.tsx`
(citation rendue) et `src/hooks/use-realtime-chat.test.tsx` (identifiant
diffusé).

#### L'indexation, câblée de bout en bout

L'ancrage n'est pas une colonne décorative : il relie la conversation au
parcours.

- Le **suivi** propose, sur chaque étape, une action « Discuter » qui ouvre
  la conversation **sur cette étape** (`/portail-client?etape=CRD-07`).
- La **liste des pièces** propose la même chose pour une pièce déjà
  déposée (`/portail-client?piece=<id>`) : c'est la seule qui a une
  identité dans le dossier, et donc une conversation qui peut y être
  rattachée.
- L'espace citoyen affiche l'ancrage au-dessus du fil, et **chaque message
  écrit** porte le sien : `step_code` ou `document_id`.
- La file de support de l'agent affiche l'étape de la conversation, et
  l'agent y répond **sur le même ancrage**.

À défaut de contexte, l'ancrage est l'**étape en cours** du parcours
(`currentStepOf`).

### 15.4 L'isolement des rôles — un défaut fermé

La navigation était filtrée par rôle, mais **la route n'était pas
contrôlée** : n'importe quel utilisateur authentifié — y compris un
emprunteur — obtenait un `200` sur tous les écrans de la console CFC.

Le contrôle est désormais posé dans le **middleware**, avant tout rendu, et
il est **fermé par défaut** :

- `src/config/rbac/route-access.ts` déduit les rôles autorisés sur chaque
  route **de la navigation elle-même** : ce qu'un agent voit dans le menu est
  exactement ce qu'il peut ouvrir. Une route de console qu'aucun rôle ne
  porte est refusée.
- Un emprunteur qui ouvre la console est renvoyé vers son portail.
- Un agent dont le rôle ne porte pas l'écran demandé reçoit un refus
  explicite (`/portail-cfc/acces-refuse`), qui explique le refus.

La matrice complète est vérifiée par `scripts/smoke.mjs` (rôles × écrans) et
par `src/config/rbac/route-access.test.ts`.

### 15.5 Structure et code mort

- **Un seul propriétaire par concept** : le vocabulaire des phases et des
  événements est dans le domaine (`src/domain/entities/processes.ts`), les
  règles des pièces jointes dans `src/server/support/attachments.ts`, le
  libellé d'un fait métier est partagé par la chronologie et la notification.
- Les doublons retirés : `Field` local de l'éditeur de catalogue (le
  primitive du kit est désormais utilisé), `STAGES` local (le catalogue du
  domaine fait autorité).
- Fichiers supprimés, sans importeur : `components/ui/asset/**` (7),
  `components/ui/slider.tsx`, `components/ui/video.tsx`,
  `components/_common/sparkline.tsx`,
  `portail-cfc/clients/_components/client-creation-dialog.tsx`, et les cinq
  composants de la page `/tracking` devenue réelle.
- Un audit d'imports automatisé ne trouve plus **aucun** fichier source sans
  importeur, hors les conventions de routage de Next.js.

### 15.6 L'isolation des suites de bout en bout

Les trois suites e2e partageaient **le même emprunteur** et la même base. Une
action qui résout « le dossier de l'emprunteur » — la décision KYC, par
exemple — pouvait donc journaliser sur le dossier d'une autre suite, et
l'échec n'apparaissait qu'une fois sur trois ou quatre. Chaque suite a
désormais son **propre compte** (`src/server/testing/e2e-accounts.ts`) :
l'isolation est un fait du test, pas une hypothèse.

### 15.7 Vérifié

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 — 0 erreur, 0 avertissement |
| `npm test` | **254 tests** passés (20 fichiers) |
| `CFC_E2E=1 vitest run` (3 fichiers e2e) | **14 tests** passés — dépôt DUC, notifications, fil de support (pièce jointe, réponse, ancrage) ; **8 exécutions consécutives sans échec** |
| `npm run build` | exit 0 |
| `node scripts/smoke.mjs` | **53/53** — dont la matrice des rôles × écrans, le parcours citoyen et l'indexation des messages |
| `supabase migration list` (hébergé) | **20/20** — local et hébergé alignés |

### 15.8 Ce qui reste ouvert

1. **L'apparence des écrans authentifiés** n'a pas été revue à l'écran : la
   connexion dans le Browser n'a pas abouti. Ce qui est vérifié, c'est le
   **rendu** : le HTML produit par le serveur avec une session réelle.
2. Les écrans par pôle de la console CFC restent adossés à des données
   statiques (la file de support, elle, est réelle).
3. **`/verify/[code]`** garde un certificat de démonstration qui porte un
   faux CNI : c'est l'empreinte du sceau, pas une page de suivi.
4. `/tracking` ne propose plus de recherche par identifiant : la recherche
   publique d'un dossier par CNI ou téléphone reste à décider (elle
   exposerait des données personnelles).
5. Le **filtrage** de la file de support par étape ou par pièce n'est pas
   encore dans l'interface : l'ancrage est affiché, pas filtrable.

---

---

## PART 16 — NAVIGATION, INTÉGRITÉ DES DONNÉES (2026-11-12)

Cette partie décrit la correction du **parcours** affiché et la mise en
cohérence des **données** avec le workflow déclaré. Elle supersède les points
concernés des parties 14 et 15.

### 16.1 La navigation suit le parcours réel

L'en-tête public n'annonce plus que ce qui est **ouvert à tous**.

| Ce qui est proposé | Où | Pourquoi |
|---|---|---|
| Simulateur d'épargne | en-tête public | seul service ouvert à tous |
| Espace Agent CFC | lien discret en-tête **et** pied de page | l'agent a sa porte ; un agent n'est pas un visiteur du site public |
| Se connecter | en-tête public | la porte de l'emprunteur |
| Mon dossier · Simulateur · Suivi DUC | en-tête de l'espace **authentifié** | ces écrans ne montrent que les données du visiteur |
| Onboarding | **après l'inscription** | l'ouverture du dossier unique client est l'étape qui suit la création du compte |

Un emprunteur qui n'a pas encore de dossier est **conduit directement** vers
l'onboarding : le tableau de bord ne s'affiche jamais vide.

### 16.2 Les valeurs dérivées sont tenues par la base

Trois colonnes du dossier sont des **conséquences** de l'état réel des
pièces et de l'épargne. Aucune action applicative ne les écrivait : elles
restaient à leur valeur par défaut et **contredisaient les graphiques
affichés sur le même écran** (un « avancement » à 20 % alors que le donut
annonçait 0/12).

La migration 021 installe :

- `private.refresh_dossier_progress()` — recalcule l'avancement (part du
  référentiel **obligatoire** satisfaite) et la part d'épargne ;
- un déclencheur sur `dossier_documents` (dépôt, validation, retrait) et un
  autre sur `dossiers` ;
- `dossiers_status_check` — l'état du dossier devient un vocabulaire **fermé**
  (`open`, `on_hold`, `closed`), validé après coup.

Le garde-fou des champs (un citoyen ne modifie ni le taux ni l'avancement de
son dossier) distingue désormais l'écriture du citoyen de la **mise à jour
système** : la transaction est marquée par le drapeau local
`app.system_update`. Sans cette distinction, la tenue de l'avancement
refusait le dépôt lui-même.

### 16.3 Les données de démonstration dérivent des règles

Les dossiers de démonstration ne décrivent plus que leurs **entrées** — coût
du projet, apport, durée d'épargne, revenu, taux, versements effectués. Le
montant du prêt, l'échéance, le taux d'endettement et la part d'épargne sont
**calculés par le domaine** (`calculateHousingPlan`). Un scenario ne peut
donc plus afficher une mensualité que la plateforme ne produirait pas.

La cohérence du scénario suit le parcours : neuf versements pour un dossier
encore en phase d'épargne (le droit acquis exige douze mois), quarante-huit
pour un dossier qui l'a franchie.

### 16.4 Un état français, et des comptes qui disent la vérité

- L'état du dossier est affiché **en français** (`open` → « En cours ») ;
  le code brut reste visible s'il sort du vocabulaire, pour qu'un défaut de
  données se voie au lieu de se masquer.
- Le rôle qui a produit un événement est affiché **en français**
  (« Emprunteur », « Guichetier ») et non par son code.
- La checklist distingue l'**obligatoire** du facultatif : elle dit
  « 3 pièce(s) obligatoire(s) sur 8 » et « 4 pièce(s) facultative(s) », au
  lieu de « 3 sur 12 attendues » — un compte qui exagérait l'effort.

### 16.5 Code mort retiré

La page du portail portait une branche « visiteur anonyme » et une branche
« configuration absente » **inatteignables** : la coquille (`layout.tsx`)
les traite déjà. Elles sont retirées, avec leurs imports.

### 16.6 Vérifié

> Comptes relevés au moment de la rédaction de cette partie ; la **partie 17**
> porte les comptes suivants.

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 — 0 erreur, 0 avertissement |
| `npm test` | **254 tests** passés (20 fichiers) |
| `CFC_E2E=1 vitest run` (3 fichiers e2e) | **14 tests** passés — dont l'avancement tenu par la base |
| `npm run build` | exit 0 |
| `node scripts/smoke.mjs` | **56/56** — dont les règles de navigation publique |
| `supabase db reset --local` | 21 migrations + seed appliqués |
| `supabase migration list` (hébergé) | **21/21** — local et hébergé alignés |
| Navigateur | en-tête public vérifié à l'écran ; console **0 erreur, 0 avertissement** |

### 16.7 Ce qui reste ouvert

1. **L'apparence des écrans authentifiés** n'a pas été revue à l'écran : la
   connexion dans le Browser n'aboutit pas. Ce qui est vérifié, c'est le
   **rendu** produit par le serveur avec une session réelle.
2. Les écrans par pôle de la console CFC restent adossés à des données
   statiques.
3. `/verify/[code]` garde un certificat de démonstration portant un faux
   CNI : c'est l'empreinte du sceau, pas une page de suivi.
4. La recherche publique d'un dossier par identifiant a été **retirée** : elle
   exposait des données personnelles. Une recherche par **code DUC** et un
   mot de passe reste à décider.

---

## PART 17 — LA FAQ, LES ÉCHECS AFFICHÉS, LA MESSAGERIE PROUVÉE (2026-11-12)

### 17.1 La FAQ publique

`src/domain/entities/faq.ts` porte **13 questions** réparties en **5 groupes**
(le prêt, l'épargne habitat, les pièces, le suivi, le dataspace). La page
`/faq` les rend en accordéon, sans JavaScript obligatoire, et l'en-tête public
l'expose en onglet à côté du simulateur.

Le FAQ est **une entité du domaine**, pas une page : son contenu est donc
testable et réutilisable, et il ne dépend d'aucune donnée de session.

### 17.2 Un échec ne doit jamais ressembler à une absence

Le principe est désormais tenu par **un seul composant**,
`src/components/ui/error-state.tsx` : `role="alert"`, le refus, la cause quand
elle est connue, et l'action de reprise.

Il est branché sur :

- la **cloche de notifications** — un chargement, un marquage lu, un
  « tout marquer comme lu » qui échoue ne s'affichent jamais comme une boîte
  vide ;
- le **fil de support** — une conversation illisible ne ressemble pas à une
  conversation vide ;
- la **messagerie temps réel** — un envoi refusé laisse le texte et la pièce
  jointe au composeur, et un bandeau le dit ; rien n'est diffusé à
  l'interlocuteur.

### 17.3 Le blocage `scrollTo` sous jsdom

`use-chat-scroll` appelait `container.scrollTo(...)`. jsdom n'implémente pas
cette méthode : l'effet levait une `TypeError`, le composant de chat ne se
montrait pas, et les trois tests du fil échouaient. La correction est à deux
niveaux, parce que ce sont deux défauts distincts : une **garde défensive** dans
le hook (il doit être correct dans tout environnement, pas seulement sous
test) et une **doublure** `Element.prototype.scrollTo` dans `vitest.setup.ts`,
dans le même esprit que la doublure `scrollIntoView` existante.

### 17.4 La réponse citée, prouvée

La réponse à un message précis est un bloc cité dans la bulle. Deux
comportements meritaient une preuve, et n'avaient que des tests absents :

| Comportement | Preuve |
|---|---|
| Le bloc cité s'affiche pour un message **déjà enregistré** | `support-chat.test.tsx` — l'auteur et le texte du message cité apparaissent deux fois : dans la bulle d'origine, et dans la citation |
| Une réponse à un message **qui part à l'instant** est enregistrée sous son identifiant **réel** | `support-chat.test.tsx` — l'identifiant optimiste n'existe pas en base ; le test attend l'identifiant stocké, sinon la clé étrangère `reply_to_id` refuse l'écriture |

Les deux portails partagent le même composant (`SupportChat`), donc la preuve
vaut pour l'espace citoyen **et** pour la file de support de la console.

### 17.5 La décision KYC ne peut plus être appliquée sans trace

`advanceKycAction` applique la décision au dossier citoyen et la journalise
dans `public.dossier_events`. Deux défauts ont été fermés :

1. **Une absence silencieuse.** Quand aucun dossier n'était trouvé, l'événement
   était ignoré : la décision s'appliquait, l'emprunteur était notifié, et
   **aucune trace** n'était écrite. Le résultat porte désormais `journaled`,
   et la file de validation affiche l'avertissement au lieu d'un succès.
2. **Une cible implicite.** Le dossier visé était déduit de l'emprunteur par
   « le plus récent » — un critère qui dépend d'une égalité de date de
   création. L'appelant peut maintenant **nommer** le dossier, et la déduction
   départage à égalité par l'identifiant.

La suite de bout en bout nomme son dossier : la décision est journalisée sur
celui-là, pas sur celui que le hasard désignerait.

### 17.6 L'isolation des suites de bout en bout

La suite de dépôt s'identifiait avec un **emprunteur de démonstration** et lui
créait un dossier témoin. Une assertion en échec laissait ce dossier derrière
elle, dans les données de démonstration. Elle utilise maintenant un **compte de
test** dédié (`e2e.cloisonnement@cfc.cm`) et un nettoyage garanti par `finally`.

### 17.7 Vérifié

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 — 0 erreur, 0 avertissement |
| `npm test` | **257 tests** passés (20 fichiers), 14 ignorés (e2e) |
| `CFC_E2E=1 vitest run` (3 fichiers e2e) | **14 tests** passés — **5 exécutions consécutives** sans échec |
| `npm run build` | exit 0 |
| `node scripts/smoke.mjs` | **58/58** — dont la FAQ, le profil et le suivi des étapes |

### 17.8 Ce qui reste ouvert

1. **L'apparence des écrans authentifiés** reste non revue à l'écran, pour la
   même raison qu'en 16.7 : la connexion dans le Browser n'aboutit pas.
2. Les écrans par pôle de la console CFC restent adossés à des données
   statiques.
3. `/verify/[code]` garde un certificat de démonstration portant un faux CNI.
4. La recherche publique par **code DUC** et mot de passe reste à décider.
5. Le chantier de **cohérence de l'interface** — moteur de table partagé,
   drawer de suivi interactif, couche de toasts, en-tête paramétré par le
   rôle — est spécifié dans
   `docs/superpowers/specs/2026-11-12-portal-ui-conformance-design.md` et
   n'est pas encore implémenté.

---

*End of document. Part 17 records the FAQ, the surfacing of failures, the
proven messaging and the traced KYC decision; Part 16 the navigation and the
data integrity; Part 15 the citizen space, the messaging and the role
isolation; Part 14 the two portals and the working document deposit; Part 13
the alignment on the official cartography; Parts 0–11 remain the target.*
