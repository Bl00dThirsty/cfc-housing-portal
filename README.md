# CFC Housing Portal

Application web de gestion du crédit logement et du Guichet Unique CFC, construite avec Next.js et Supabase.

## Vue d'ensemble

Le projet vise à fournir une plateforme CFC complète pour :

- la vitrine publique et le simulateur de financement,
- l'onboarding citoyen et la gestion des dossiers,
- la connexion des agents et la gestion des rôles,
- le suivi documentaire et la conformité des dossiers,
- le pilotage administratif et la supervision des dossiers.

Le code est structuré autour d'une app Next.js 15, d'un schéma Supabase/Postgres et d'une logique d'authentification et de droits (RBAC) orientée métier.

## Stack

- Next.js 15.5.25
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage)
- Vitest
- ESLint

## Projets et environnement

Le projet attendu est le projet Supabase CFC :

- project ref : `yyqfqsmsfaccsstwlpog`

Le fichier `.env.example` décrit les variables minimales à renseigner pour le démarrage local.

## Démarrage rapide

### 1) Installer les dépendances

```bash
npm install
```

### 2) Configurer les variables d'environnement

Copiez le modèle :

```bash
cp .env.example .env.local
```

Puis renseignez :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (en dev : `http://localhost:3000`)

### 3) Démarrer le projet

```bash
npm run dev
```

Ouvrez ensuite :

- http://localhost:3000

## Supabase

### Authentification / liaison du projet

```bash
supabase login
supabase link --project-ref yyqfqsmsfaccsstwlpog
supabase db push
```

### Réinitialiser et recharger la base locale

```bash
npm run db:reset
```

### Peupler les utilisateurs de dev

```bash
npm run db:seed:users
```

## Scripts disponibles

```bash
npm run dev          # démarre le serveur de développement
npm run build        # build de production
npm run start        # serveur de production
npm run lint         # vérification ESLint
npm run typecheck    # vérification TypeScript
npm run test         # tests Vitest
npm run smoke        # vérification fonctionnelle rapide
npm run db:reset     # reset local Supabase database
npm run db:seed:users # seed utilisateurs de dév
```

## Structure du projet

```text
.
├── src/
│   ├── app/              # routes Next.js App Router
│   ├── components/       # composants UI
│   ├── config/           # configuration métier / RBAC
│   ├── domain/           # modèle métier et workflows
│   ├── lib/              # helpers, filtres, utils, données
│   ├── server/           # environnement et services serveur
│   └── stores/           # Zustand stores
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── public/
├── docs/
├── scripts/
├── .env.example
├── package.json
├── README.md
└── next.config.ts
```

## Rôles et parcours

L'application est dimensionnée pour couvrir plusieurs parcours :

- portail citoyen / demandeur,
- parcours d'onboarding,
- gestion documentaire de dossier,
- suivi et vérification,
- console d’administration et rôles internes CFC.

La cible fonctionnelle est documentée dans le dossier `docs/` et notamment dans `docs/CFC-GREENFIELD-REFERENCE.md`.

## Documentation de référence

- `docs/CFC-GREENFIELD-REFERENCE.md` : document de cadrage métier et technique du projet CFC.
- `supabase/seed.sql` : référentiel initial et données de départ.
- `supabase/migrations/` : migrations de schéma et sécurité.

## Notes importantes

- Le build ne doit pas dépendre d'une configuration Supabase complète au chargement du module ; les variables sont validées avec tolérance lors des accès réellement nécessaires.
- Les URLs publiques de callback doivent utiliser `NEXT_PUBLIC_SITE_URL`.
- Ne commitez pas les vraies clés de production ni le contenu de `.env.local`.

## Contribution

Les changements fonctionnels et les évolutions sont à valider dans le contexte du projet CFC, en respectant le schéma de données Supabase, les règles RBAC et les parcours métier documentés.
