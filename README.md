<p align="center">
  <img src="./public/images/logo-cfc.png" alt="Crédit Foncier du Cameroun" width="340">
</p>

<h1 align="center">Portail CFC — Épargne Habitat & Guichet Unique</h1>

<p align="center">
  Portail numérique du Crédit Foncier du Cameroun pour l'épargne habitat,
  le dépôt des dossiers et le suivi des demandes de financement.
</p>

<p align="center">
  <a href="https://cfc-housing-portal-sooty.vercel.app">Production →</a> ·
  <a href="#démarrage-local">Démarrage local</a> ·
  <a href="#déploiement">Déploiement</a> ·
  <a href="#comptes-de-démonstration">Comptes de démonstration</a>
</p>

## Présentation

Le portail accompagne les citoyens dans la constitution et le suivi de leur
Dossier Unique Client (DUC), et fournit aux équipes du CFC des espaces de
travail adaptés à leurs rôles.

### Parcours proposés

- **Espace public** : simulateur, FAQ, suivi de dossier et vérification de
  documents.
- **Espace citoyen** (`/login` → `/portail-client`) : inscription, dépôt de
  pièces, suivi de l'épargne et du dossier, notifications.
- **Espace agent CFC** (`/portail-cfc/login`) : traitement des dossiers,
  gestion documentaire et supervision selon les habilitations.

### Deux portes, deux publics

| Porte | Public | Après connexion |
| --- | --- | --- |
| `/login` | Emprunteur | `/portail-client` |
| `/portail-cfc/login` | Agent CFC | Écran du pôle (déduit du rôle réel) |

Un emprunteur qui ouvre la porte agent est renvoyé vers la sienne, et
réciproquement. La décision est prise dans `middleware.ts`, avant tout rendu :
une page masquée du menu n'est jamais une protection.

## Technologies

- Next.js 15 (App Router) et React 19
- TypeScript et Tailwind CSS 4
- Supabase Auth, Postgres (RLS) et Storage
- Vitest et ESLint

## Démarrage local

### Prérequis

- Node.js 20+ et npm
- Docker (pour la pile Supabase locale)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 1. Installer

```bash
npm install
```

### 2. Démarrer Supabase localement

```bash
supabase start
```

La commande affiche l'API (`http://127.0.0.1:54321`), la base
(`127.0.0.1:54322`), Studio (`http://127.0.0.1:54323`) et Mailpit
(`http://127.0.0.1:54324`).

### 3. Configurer les variables

```powershell
Copy-Item .env.example .env.local
```

Sur macOS ou Linux : `cp .env.example .env.local`.

Reportez les valeurs de `supabase status -o env` :

| Variable | Usage |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique soumise aux règles RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur uniquement; ne jamais l'exposer au navigateur |
| `NEXT_PUBLIC_SITE_URL` | URL du site, par exemple `http://localhost:3000` |
| `RESEND_API_KEY` / `SMTP_*` | Messagerie métier (facultative : envois journalisés `skipped`) |

La liste complète et commentée est dans [`.env.example`](./.env.example).

### 4. Créer le schéma et les comptes de démonstration

```bash
npm run db:reset        # applique toutes les migrations + seed.sql
npm run db:seed:users   # crée les comptes de démonstration locaux
```

`npm run db:seed:users` refuse toute URL qui n'utilise pas `localhost`,
`127.0.0.1` ou `::1`, même avec une clé de service définie.

### 5. Lancer

```bash
npm run dev
```

Si le port 3000 est occupé : `PORT=3001 npm run dev` (PowerShell :
`$env:PORT="3001"; npm run dev`).

## Comptes de démonstration

Mot de passe commun : **`CfcDev2026!`** (surchargez-le au seed avec
`CFC_DEV_PASSWORD`).

| Adresse | Rôle | Écran d'atterrissage |
| --- | --- | --- |
| `guichet@cfc.cm` | GUICHET | `/portail-cfc/actors/agency` |
| `gestionnaire@cfc.cm` | GESTIONNAIRE | `/portail-cfc/dossiers` |
| `risques@cfc.cm` | RISQUES_BET | `/portail-cfc/actors/risk-engineering` |
| `notaire@cfc.cm` | NOTAIRE | `/portail-cfc/actors/notary-cadastre` |
| `comite@cfc.cm` | COMITE | `/portail-cfc/actors/credit-committees` |
| `diaspora@cfc.cm` | DIASPORA | `/portail-cfc/actors/agency/diaspora` |
| `admin@cfc.cm` | ADMIN | `/portail-cfc/analytics` |
| `emprunteur@cfc.cm` | Citoyen | `/portail-client` |
| `emprunteur.diaspora@cfc.cm` | Citoyen diaspora | `/portail-client` |
| `emprunteur.pieces@cfc.cm` | Citoyen (pièces) | `/portail-client` |

Ces comptes sont des **données de démonstration**, pas des identités de
production. Un citoyen sans dossier est conduit vers `/onboarding` : c'est le
parcours normal d'un compte neuf, pas une erreur.

## Commandes utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarrer le serveur de développement |
| `npm run build` | Construire l'application |
| `npm run start` | Démarrer la version construite |
| `npm run lint` | Exécuter ESLint |
| `npm run typecheck` | Vérifier les types TypeScript |
| `npm test` | Exécuter les tests Vitest |
| `npm run smoke` | Vérifications HTTP authentifiées contre l'app en cours |
| `npm run db:reset` | Réinitialiser la base Supabase locale |
| `npm run db:seed:users` | Créer les comptes de démonstration locaux |

### Tests de bout en bout

Les suites `*.e2e.local.test.ts` touchent une vraie base locale. Elles sont
sautées sans configuration. Pour les exécuter :

```powershell
$env:CFC_E2E="1"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role locale>"
npm test
```

## Déploiement

Production : **<https://cfc-housing-portal-sooty.vercel.app>**.

### Vercel

```bash
vercel --prod
```

Le projet est lié (`menoc61s-projects/cfc-housing-portal`). Variables à
définir dans **Vercel → Settings → Environment Variables** (Production) :

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (sensibles — jamais dans le dépôt)
- `NEXT_PUBLIC_SITE_URL` = URL HTTPS canonique du portail
- `RESEND_API_KEY` / `EMAIL_FROM` si les notifications métier sont actives

`NEXT_PUBLIC_APP_VERSION` n'est **pas** à saisir : elle est déduite de
`package.json` par `next.config.ts`.

### Supabase hébergé

```bash
supabase link --project-ref yyqfqsmsfaccsstwlpog
supabase migration list          # vérifier ce qui est déjà appliqué
supabase db push --include-all   # appliquer les migrations manquantes
```

`--include-all` est indispensable : certaines migrations précèdent celles déjà
appliquées. Une migration doit toujours pouvoir tourner sur une base **neuve**
(sans dépendre de `seed.sql`).

### Authentification (Supabase → Authentication)

1. **URL Configuration** : Site URL = URL de production ; autoriser
   `<url>/auth/callback` (et les domaines Preview si nécessaire).
2. **Email Templates** : publier les modèles de `supabase/templates/`
   (confirm signup, invite, magic link, recovery, change email,
   `password_changed`, `email_changed`).
3. **SMTP personnalisé** : domaine CFC vérifié (SPF/DKIM).

Les notifications métier (soumission KYC, décisions, pièces, offres,
messages) utilisent `src/server/email/defaults.ts` et le fournisseur de
l'application ; leurs livraisons sont journalisées dans `email_deliveries`.

## Versions et livraison

Une **seule** version fait foi : `version` dans `package.json`.

```bash
npm version patch      # 1.0.1 → 1.0.2, crée le commit et le tag
git push origin develop --follow-tags
```

`next.config.ts` expose `v<version>` comme `NEXT_PUBLIC_APP_VERSION`, et
`src/config/app-version.ts` la lit. Aucun écran n'écrit de version en dur.
Les versions de **documents** (`v1.0`, `v0.9` dans les journaux de pièces)
sont des données métier, pas la version de l'application.

## Structure

```text
src/
  app/          Routes Next.js (App Router)
  components/   Composants d'interface
  config/       Configuration métier, RBAC et navigation
  domain/       Entités, politiques et workflows métier
  hooks/        Hooks React partagés
  lib/          Utilitaires partagés
  server/       Services côté serveur (actions, requêtes, e-mail, stockage)
  stores/       État client
middleware.ts   Session Supabase et contrôle d'accès aux routes
supabase/       Configuration, migrations, seed et modèles d'e-mail
scripts/        Outils de développement (seed, smoke)
docs/           Documentation métier et technique
```

## Dépannage

| Symptôme | Cause probable | Correction |
| --- | --- | --- |
| « Configuration Supabase manquante » | variables absentes au build | renseigner `.env.local`, redémarrer |
| Connexion agent renvoie vers `/login` | compte sans `staff_assignments` | exécuter `npm run db:seed:users` ou affecter un rôle |
| `next start` échoue sur le port 3000 | port occupé | `PORT=3001 npm run start` |
| e2e sautés | `CFC_E2E` absent | cf. « Tests de bout en bout » |
| Emails non envoyés | aucun fournisseur configuré | normal : journalisés `skipped` ; configurer Resend/SMTP |

## Sécurité

- Ne jamais committer `.env.local`, des identifiants réels ou des clés de
  production : `.gitignore` couvre déjà tout `.env*` sauf `.env.example`.
- `SUPABASE_SERVICE_ROLE_KEY` contourne les politiques RLS : strictement
  côté serveur, jamais préfixée `NEXT_PUBLIC_`.
- Les en-têtes de sécurité (nosniff, frame-ancestors, HSTS,
  `Permissions-Policy`) sont posés par `next.config.ts`.
- L'accès aux routes de la console se déduit de la navigation par rôle : ce
  qu'un agent ne voit pas, il ne peut pas l'ouvrir.

## Documentation

- [Référence métier et technique](./docs/CFC-GREENFIELD-REFERENCE.md)
- [Migrations Supabase](./supabase/migrations/)
- [Variables d'environnement d'exemple](./.env.example)
