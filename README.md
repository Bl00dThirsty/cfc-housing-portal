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

The public surface consists of `/simulator` (financing simulator), `/faq`,
`/tracking` (own-dossier tracking) and `/verify` (registry lookup not yet
connected). A public marketing vitrine at `/accueil` was considered and
dropped; it is not part of the MVP.

## Technologies

- Next.js 15 (App Router) et React 19
- TypeScript et Tailwind CSS 4
- Supabase Auth, Postgres (RLS) et Storage
- Vitest et ESLint

## Démarrage local

### Prérequis

- Node.js 20+ et npm
- Docker (pour la pile Supabase locale)

### 1. Installer

```bash
npm install
```

### 2. (Facultatif) Configurer les variables locales

```powershell
Copy-Item .env.example .env.local
```

Sur macOS ou Linux : `cp .env.example .env.local`.

Supabase ne demande pas de configuration manuelle. `system:local` installe
la version du CLI épinglée par le projet, démarre les services, récupère les
clés générées par le CLI et les enregistre dans `.env.local`. Copiez
`.env.example` seulement si vous voulez ajouter un fournisseur e-mail ou
modifier les valeurs locales facultatives.

La liste complète et commentée est dans [`.env.example`](./.env.example).

### 3. Démarrer le système local

```bash
npm run system:local
```

Cette commande vérifie le CLI Supabase et Next.js du projet, installe les
dépendances épinglées si un outil manque, démarre Supabase local, récupère ses
clés, applique les migrations en attente sans supprimer la base, crée les
comptes et données de démonstration locaux, puis démarre Next.js. Docker doit
être lancé. L'API locale est disponible sur
`http://127.0.0.1:54321`, Studio sur `http://127.0.0.1:54323` et Mailpit sur
`http://127.0.0.1:54324`.

Le CLI npm du projet est utilisé pour garder la même version sur Windows,
macOS et Linux; aucune installation globale n'est requise. Les commandes
système chargent les fichiers d'environnement de développement, dont
`.env.local`, et préservent les variables explicitement exportées par le shell.
Une URL déjà configurée pour `system:local` doit utiliser `localhost`,
`127.0.0.1` ou `::1`; la commande refuse une cible distante même avec une clé
de service.
La commande destructive `npm run db:reset` reste disponible séparément pour
recréer entièrement la base locale.

### 4. Préparer staging ou production

Les commandes distantes utilisent le CLI Supabase 3.2.0 épinglé par le projet.
Renseignez les variables dans un gestionnaire de secrets ou dans un fichier
local ignoré par Git. Ne publiez jamais de clé `service_role`/`secret`, mot de
passe de base ou token d'accès.

| Variable | Staging | Production |
| --- | --- | --- |
| `SUPABASE_STAGING_PROJECT_REF` / `SUPABASE_PRODUCTION_PROJECT_REF` | Référence staging, distincte de la production | Référence du projet de production |
| `SUPABASE_STAGING_URL` / `SUPABASE_PRODUCTION_URL` | URL HTTPS dont l'hôte correspond à la référence | URL HTTPS dont l'hôte correspond à la référence |
| `SUPABASE_STAGING_ANON_KEY` ou `SUPABASE_STAGING_PUBLISHABLE_KEY` | Clé publique staging | — |
| `SUPABASE_PRODUCTION_ANON_KEY` ou `SUPABASE_PRODUCTION_PUBLISHABLE_KEY` | — | Clé publique production |
| `SUPABASE_STAGING_SECRET_KEY` ou `SUPABASE_STAGING_SERVICE_ROLE_KEY` | Clé privée staging, utilisée uniquement pour les fixtures staging | — |
| `SUPABASE_STAGING_DB_PASSWORD` / `SUPABASE_PRODUCTION_DB_PASSWORD` | Mot de passe DB staging | Mot de passe DB production |
| `SUPABASE_STAGING_ACCESS_TOKEN` ou `SUPABASE_ACCESS_TOKEN` | Token Supabase autorisé sur staging | — |
| `SUPABASE_PRODUCTION_ACCESS_TOKEN` ou `SUPABASE_ACCESS_TOKEN` | — | Token Supabase autorisé sur production |
| `CFC_STAGING_DEV_PASSWORD` | Mot de passe des comptes de démonstration staging | — |

### 5. Choisir une cible cloud explicitement

```bash
npm run system:staging
npm run system:production
```

`system:staging` vérifie que ses références sont distinctes, lie explicitement
le projet staging, affiche l'aperçu des migrations, applique les migrations
et le seed de référence, crée les comptes de démonstration staging puis lance
le portail contre staging. Une instance staging distincte doit être
configurée avant d'utiliser cette commande.

`system:production` lie explicitement le projet de production, affiche
l'aperçu puis applique les migrations après la confirmation demandée par le
CLI. Il ne lance ni `db reset`, ni `--include-seed`, ni le seeder de comptes
de démonstration. Il prépare la base; le déploiement du site reste géré par
la configuration de l'hébergeur (Vercel dans ce dépôt). Vérifiez les variables
d'environnement de l'hébergeur séparément avant le déploiement.

## Comptes de démonstration

Les identités de démonstration sont définies par les fixtures du seeder
local/staging, pas recopiées dans les écrans ou la documentation. Le seeder
affiche les comptes provisionnés. En local, un mot de passe aléatoire est
créé une fois et conservé dans `.env.local` (`CFC_DEV_PASSWORD`). En staging,
définissez un mot de passe distinct dans un gestionnaire de secrets
(`CFC_STAGING_DEV_PASSWORD`). Aucun compte de démonstration n'est créé en
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
| `npm run db:seed:users` | Créer les comptes de démonstration locaux (loopback uniquement par défaut) |
| `npm run system:local` | Démarrer Supabase local, migrer sans reset, seed local, lancer Next.js |
| `npm run system:staging` | Lier staging, prévisualiser/appliquer migrations, seed staging, lancer Next.js |
| `npm run system:production` | Lier production, prévisualiser/appliquer les migrations confirmées |
| `npm run test:system` | Vérifier les gardes de cible, de seed et les plans de commande |

La conception cible, les diagrammes de flux, les rôles, le modèle de données,
les contraintes de sécurité et les étapes d'achèvement sont détaillés dans
[`docs/superpowers/specs/2026-11-18-cfc-system-completion-design.md`](./docs/superpowers/specs/2026-11-18-cfc-system-completion-design.md).
Le plan de vérification et les lots de travail encore ouverts sont suivis dans
[`docs/superpowers/plans/2026-11-18-system-bootstrap.md`](./docs/superpowers/plans/2026-11-18-system-bootstrap.md).

### Source de vérité et périmètre des données

| Donnée | Source autoritative | Règle |
| --- | --- | --- |
| Dossiers, KYC, documents, affectations, notifications, épargne et opérations | Projet Supabase choisi par la commande d'environnement | Les écrans affichent uniquement les lignes lues et autorisées dans ce projet |
| Services, produits, étapes et phases de processus | Tables `ref`, migrations versionnées et vues de lecture `cfc_*` | Les pages chargent les valeurs effectives depuis Supabase |
| Comptes et dossiers synthétiques | `scripts/seed-dev-users.mjs` | Local ou staging uniquement, avec cible vérifiée; jamais production |
| Données de tests | Fabriques de test | Restent dans les tests et ne sont jamais importées par les pages opérationnelles |
| Modules sans tables ni transitions validées | Aucune source tant que le workflow n'est pas défini | L'écran indique que la persistance n'est pas disponible; il ne génère pas de faux enregistrements |

Les commandes système ne sont pas interchangeables : `system:local` ne se lie
jamais à un projet cloud, `system:staging` exige un projet distinct et peut
créer des comptes de démonstration, et `system:production` applique les
migrations après confirmation sans exécuter les seeds de démonstration. Les
migrations cloud n'ont pas été lancées depuis cette session.

### Tests de bout en bout

Les suites `*.e2e.local.test.ts` touchent une vraie base locale. Elles sont
sautées sans configuration. Après `npm run system:local`, pour les exécuter :

```powershell
$env:CFC_E2E="1"
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
npm run system:production
```

La commande utilise les variables production, lie explicitement le projet,
montre l'aperçu des migrations et conserve la confirmation du CLI. Elle
n'inclut jamais les seeds de développement. Une migration doit pouvoir tourner
sur une base neuve sans dépendre de fixtures métier.

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
- La navigation par rôle facilite l'usage, mais ne protège pas les données.
  Les routes sont contrôlées par le middleware, les actions et requêtes
  vérifient l'identité/capacité, et Postgres applique les politiques RLS aux
  lignes. Les fichiers KYC restent privés dans Storage.

## Documentation

- [Référence métier et technique](./docs/CFC-GREENFIELD-REFERENCE.md)
- [Migrations Supabase](./supabase/migrations/)
- [Variables d'environnement d'exemple](./.env.example)
