<p align="center">
  <img src="./public/images/logo-cfc.png" alt="Crédit Foncier du Cameroun" width="340">
</p>

<h1 align="center">Portail CFC — Épargne Habitat & Guichet Unique</h1>

<p align="center">
  Portail numérique du Crédit Foncier du Cameroun pour l'épargne habitat,
  le dépôt des dossiers et le suivi des demandes de financement.
</p>

<p align="center">
  <a href="https://cfc-housing-portal.vercel.app">Ouvrir l'application</a>
</p>

## Présentation

Le portail accompagne les citoyens dans la constitution et le suivi de leur
Dossier Unique Client (DUC), et fournit aux équipes du CFC des espaces de
travail adaptés à leurs rôles.

### Parcours proposés

- **Espace public** : simulateur, FAQ, suivi de dossier et vérification de
  documents.
- **Espace citoyen** : inscription, dépôt de pièces, suivi de l'épargne et du
  dossier, notifications.
- **Espace agent CFC** : traitement des dossiers, gestion documentaire et
  supervision selon les habilitations.

## Technologies

- Next.js 15 (App Router) et React 19
- TypeScript et Tailwind CSS 4
- Supabase Auth, Postgres et Storage
- Vitest et ESLint

## Démarrage local

### Prérequis

- Node.js et npm
- Un projet Supabase et ses variables d'environnement

### Installation

```bash
npm install
```

Copiez `.env.example` vers `.env.local` :

```powershell
Copy-Item .env.example .env.local
```

Sur macOS ou Linux :

```bash
cp .env.example .env.local
```

Renseignez ensuite les valeurs nécessaires :

| Variable | Usage |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique soumise aux règles RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur uniquement; ne jamais l'exposer au navigateur |
| `NEXT_PUBLIC_SITE_URL` | URL du site, par exemple `http://localhost:3000` |

Lancez l'application :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Commandes utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarrer le serveur de développement |
| `npm run build` | Construire l'application |
| `npm run start` | Démarrer la version construite |
| `npm run lint` | Exécuter ESLint |
| `npm run typecheck` | Vérifier les types TypeScript |
| `npm test` | Exécuter les tests Vitest |
| `npm run smoke` | Lancer les vérifications fonctionnelles rapides |
| `npm run db:reset` | Réinitialiser la base Supabase locale |
| `npm run db:seed:users` | Créer les comptes de démonstration locaux |

## Supabase

Les migrations Postgres et le fichier de seed se trouvent dans `supabase/`.
Pour réinitialiser la base locale, démarrez Supabase localement puis exécutez
`npm run db:reset`.

La commande `supabase db push` applique les migrations à l'instance liée :
vérifiez toujours le projet ciblé avant de l'exécuter.

`npm run db:seed:users` est réservé au Supabase local. Le script refuse toute
URL qui n'utilise pas `localhost`, `127.0.0.1` ou `::1`, même si une clé de
service est définie. Les comptes et dossiers créés par ce script sont des
données de démonstration, pas des identités de production.

### Confirmation d'adresse e-mail

Les e-mails de compte (confirmation, invitation, lien de connexion,
réinitialisation du mot de passe, changement d'adresse et alertes de sécurité)
utilisent **Supabase Auth**, et non le service d'e-mails métier de
l'application. Leurs modèles CFC se trouvent dans `supabase/templates/` et
sont activés dans `supabase/config.toml`. Après le démarrage de Supabase local,
les e-mails de test sont consultables dans Mailpit à
[http://localhost:54324](http://localhost:54324).

Pour le projet Supabase hébergé et Vercel :

1. Définissez `NEXT_PUBLIC_SITE_URL` sur l'URL HTTPS canonique du portail dans
   l'environnement Vercel **Production**. Les Preview utilisent l'URL Vercel
   courante.
2. Dans Supabase **Authentication → URL Configuration**, définissez la même
   URL comme Site URL et autorisez `/auth/callback` pour le domaine de
   production et les domaines Preview requis.
3. Dans Supabase **Authentication → Email Templates**, publiez les modèles
   correspondants de `supabase/templates/` pour Confirm signup, Invite user,
   Magic link, Reset password et Change email. Dans **Email Notifications**,
   activez et publiez les modèles `password_changed` et `email_changed`.
4. Configurez le SMTP personnalisé Supabase Auth avec une adresse CFC vérifiée
   et un domaine dont l'envoi est autorisé (SPF/DKIM). Le SMTP et l'expéditeur
   d'Auth sont distincts de `RESEND_API_KEY` / `EMAIL_FROM`, réservés aux
   notifications métier de l'application.

Le code ne substitue pas d'adresse d'expédition non vérifiée à celle du CFC.
Le propriétaire du domaine doit fournir/configurer l'adresse officielle et les
identifiants SMTP dans les paramètres hébergés, jamais dans le dépôt.

Les notifications métier (soumission KYC, ouverture du dépôt des pièces,
décisions, pièces, offres et messages du conseiller) passent par les modèles
de `src/server/email/defaults.ts` et le fournisseur configuré pour
l'application. Configurez `RESEND_API_KEY` et un `EMAIL_FROM` autorisé dans
Vercel. Les transitions KYC et DUC correspondantes sont journalisées de façon
atomique dans `dossier_events`; les événements directement déclenchés par une
action sont envoyés sans dépendre du relais base de données, désactivé par
défaut. Les livraisons sont journalisées dans `email_deliveries`.

## Structure

```text
src/
  app/          Routes Next.js
  components/   Composants d'interface
  config/       Configuration métier et RBAC
  domain/       Entités et workflows métier
  lib/          Utilitaires partagés
  server/       Services côté serveur
  stores/       État client
supabase/       Configuration, migrations et seeds
docs/           Documentation métier et technique
scripts/        Outils de développement
```

## Documentation

- [Référence métier et technique](./docs/CFC-GREENFIELD-REFERENCE.md)
- [Migrations Supabase](./supabase/migrations/)
- [Variables d'environnement d'exemple](./.env.example)

## Sécurité

Ne commitez jamais `.env.local`, des identifiants réels ou des clés de
production. `SUPABASE_SERVICE_ROLE_KEY` contourne les politiques RLS : elle
doit rester strictement côté serveur.
