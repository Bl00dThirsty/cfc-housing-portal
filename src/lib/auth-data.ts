/**
 * Référentiel des rôles CFC — libellés et métadonnées, **jamais d'identités**.
 *
 * Ce module ne contient plus aucun utilisateur de démonstration : ni adresse
 * e-mail, ni mot de passe, ni profil « seedé ». Le rôle d'un agent est lu
 * depuis `public.staff_assignments` (registre de référence) via
 * Supabase Auth ; `app_metadata` n'en est qu'un cache.
 */

/**
 * Les sept rôles métier du back-office CFC.
 *
 * Le nom `STAFF_ROLES` est délibéré : ces rôles sont ceux **d'un agent**,
 * pas ceux « d'un administrateur ». `ADMIN` n'en est qu'un parmi sept — un
 * agent de guichet n'est pas un administrateur, et le confondre a déjà fait
 * hériter les pleins pouvoirs à un agent sans affectation lisible.
 */
export const STAFF_ROLES = [
  "GUICHET",
  "GESTIONNAIRE",
  "RISQUES_BET",
  "NOTAIRE",
  "COMITE",
  "DIASPORA",
  "ADMIN",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Rôle d'un emprunteur authentifié sur le portail citoyen. */
export const CITIZEN_ROLE = "CITIZEN" as const;

export type CitizenRole = typeof CITIZEN_ROLE;

/** Tout rôle connu de la plateforme. */
export type AppRole = StaffRole | CitizenRole;

/** Libellé métier d'un rôle. */
export const ROLE_LABELS: Record<AppRole, string> = {
  GUICHET: "Guichetier & Accueil",
  GESTIONNAIRE: "Conseiller Clientèle",
  RISQUES_BET: "Analyste Risques & BET",
  NOTAIRE: "Notaire Conventionné",
  COMITE: "Comité de Crédit",
  DIASPORA: "Chargé Diaspora & Non-Résidents",
  ADMIN: "Administrateur Système",
  CITIZEN: "Emprunteur",
};

/** Direction / service d'appartenance d'un rôle. */
export const ROLE_DEPARTMENTS: Record<AppRole, string> = {
  GUICHET: "Guichet Unique · Production Crédits (G1)",
  GESTIONNAIRE: "Exploitation & Portefeuille Crédit",
  RISQUES_BET: "Direction des Risques & Ingénierie (G3)",
  NOTAIRE: "Notariat & Inscriptions Hypothécaires (G8)",
  COMITE: "Direction Générale & Arbitrage (G6)",
  DIASPORA: "Cellule Diaspora & Partenariats Internationaux",
  ADMIN: "Direction des Systèmes d'Information & Sécurité",
  CITIZEN: "Portail Citoyen · Épargne Habitat",
};

/** Description métier d'un rôle. */
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  GUICHET:
    "Enrôlement, réception des pièces, vérification préliminaire et ouverture du DUC.",
  GESTIONNAIRE:
    "Instruction, suivi de l'épargne préalable et coordination du DUC.",
  RISQUES_BET:
    "Contre-expertise des devis DQE, études de sols et visites contradictoires BET.",
  NOTAIRE:
    "Rédaction des conventions, réquisition MINDCAF et publication des hypothèques.",
  COMITE:
    "Délibérations collégiales, accords de prêts et résolutions de crédit.",
  DIASPORA:
    "Dossiers des Camerounais de l'étranger, virements SWIFT et procurations.",
  ADMIN:
    "Supervision globale, gestion des habilitations, audit et paramétrage DUC.",
  CITIZEN:
    "Emprunteur : dépôt des pièces, suivi de l'épargne et suivi du dossier.",
};

/** Pole organisationnel de rattachement d'un rôle. */
export const ROLE_POLES: Record<AppRole, string> = {
  GUICHET: "G1",
  GESTIONNAIRE: "G2",
  RISQUES_BET: "G3",
  NOTAIRE: "G8",
  COMITE: "G6",
  DIASPORA: "DIASPORA",
  ADMIN: "ADMIN",
  CITIZEN: "CITIZEN",
};

export interface RoleReference {
  role: StaffRole;
  label: string;
  department: string;
  pole: string;
  description: string;
}

/** Référentiel affichable des rôles métier. */
export const ROLE_REFERENCE: readonly RoleReference[] = STAFF_ROLES.map((role) => ({
  role,
  label: ROLE_LABELS[role],
  department: ROLE_DEPARTMENTS[role],
  pole: ROLE_POLES[role],
  description: ROLE_DESCRIPTIONS[role],
}));

const STAFF_ROLE_SET: ReadonlySet<string> = new Set<string>(STAFF_ROLES);

const APP_ROLE_SET: ReadonlySet<string> = new Set<string>([...STAFF_ROLES, CITIZEN_ROLE]);

/** La valeur désigne-t-elle l'un des sept rôles d'agent ? */
export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLE_SET.has(value);
}

export function isAppRole(value: string): value is AppRole {
  return APP_ROLE_SET.has(value);
}

/**
 * Vue d'un profil connecté, exposée par `useAuth()`.
 *
 * Ce n'est pas une identité seedée : c'est la projection du profil réel
 * (Supabase Auth + `public.actors` + `public.staff_assignments`) sur la forme
 * attendue par les écrans existants.
 */
export interface AdminUser {
  /** Identifiant de l'acteur (`auth.users.id`). */
  id: string;
  /** Adresse e-mail de connexion. */
  email: string;
  /** Nom affiché. */
  name: string;
  /** Rôle effectif. */
  role: AppRole;
  /** Libellé du rôle. */
  roleLabel: string;
  /** Direction / service d'appartenance. */
  department: string;
  /** Agence de rattachement (libellé). */
  agency: string;
  /** Classes Tailwind du ton d'avatar. */
  avatarTone: string;
  /** Initiales affichées dans l'avatar. */
  initials: string;
  /** Numéro de téléphone professionnel. */
  phone: string;
  /** Description du périmètre métier. */
  description: string;
}

/** Ton d'avatar par défaut, dérivé du rôle. */
export const ROLE_AVATAR_TONES: Record<AppRole, string> = {
  GUICHET: "bg-blue-600 text-white",
  GESTIONNAIRE: "bg-emerald-600 text-white",
  RISQUES_BET: "bg-amber-600 text-white",
  NOTAIRE: "bg-indigo-600 text-white",
  COMITE: "bg-purple-600 text-white",
  DIASPORA: "bg-cyan-600 text-white",
  ADMIN: "bg-slate-800 text-white",
  CITIZEN: "bg-teal-600 text-white",
};

/** Initiales d'un nom complet (au plus deux lettres). */
export function initialsFromName(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Nature d'un acteur dans `public.actors`. */
export type ActorType = "citizen" | "staff" | "service";

/**
 * Profil métier d'un acteur connecté.
 *
 * Lu côté serveur (Server Components, middleware) comme côté client
 * (navigateur) : la forme est identique pour que les deux couches ne
 * puissent pas diverger.
 */
export interface AuthProfile {
  /** Identifiant de l'acteur (`auth.users.id`). */
  actorId: string;
  /** Nature de l'acteur. */
  actorType: ActorType;
  /** Rôle effectif (métier ou citoyen). */
  role: AppRole;
  /** Libellé du rôle. */
  roleLabel: string;
  /** Pôle organisationnel, `null` pour un citoyen. */
  pole: string | null;
  /** Agence de rattachement. */
  agencyId: string | null;
  /** Libellé de l'agence de rattachement. */
  agencyLabel: string | null;
  /** Nom affiché. */
  fullName: string;
  /** Adresse e-mail de connexion. */
  email: string;
  /** Téléphone professionnel. */
  phone: string | null;
}
