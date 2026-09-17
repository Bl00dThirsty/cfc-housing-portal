export type AdminRole =
  | "GUICHET"
  | "GESTIONNAIRE"
  | "RISQUES_BET"
  | "NOTAIRE"
  | "COMITE"
  | "DIASPORA"
  | "ADMIN";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  roleLabel: string;
  department: string;
  agency: string;
  avatarTone: string;
  initials: string;
  phone: string;
  description: string;
}

export const SEEDED_ADMIN_USERS: AdminUser[] = [
  {
    id: "usr-guichet-01",
    email: "guichet@cfc.cm",
    name: "Mme Nicole Mbezele",
    role: "GUICHET",
    roleLabel: "Guichetier & Accueil",
    department: "Guichet Unique · Production Crédits (G1)",
    agency: "Agence Yaoundé Centre",
    avatarTone: "bg-blue-600 text-white",
    initials: "NM",
    phone: "+237 699 12 34 50",
    description: "Enrôlement, réception des pièces, vérification préliminaire et ouverture du DUC.",
  },
  {
    id: "usr-gestionnaire-02",
    email: "gestionnaire@cfc.cm",
    name: "M. Rodrigue Abessolo",
    role: "GESTIONNAIRE",
    roleLabel: "Conseiller Clientèle",
    department: "Exploitation & Portefeuille Crédit",
    agency: "Agence Yaoundé Mendong",
    avatarTone: "bg-emerald-600 text-white",
    initials: "RA",
    phone: "+237 694 55 66 77",
    description: "Instruction, suivi de l'épargne préalable et coordination du DUC.",
  },
  {
    id: "usr-risques-03",
    email: "risques@cfc.cm",
    name: "Ing. Patrice Tchounke",
    role: "RISQUES_BET",
    roleLabel: "Analyste Risques & BET",
    department: "Direction des Risques & Ingénierie (G3)",
    agency: "Siège Social Yaoundé",
    avatarTone: "bg-amber-600 text-white",
    initials: "PT",
    phone: "+237 670 44 33 22",
    description: "Contre-expertise des devis DQE, études de sols et visites contradictoires BET.",
  },
  {
    id: "usr-notaire-04",
    email: "notaire@cfc.cm",
    name: "Me Emmanuel Nkouendjin",
    role: "NOTAIRE",
    roleLabel: "Notaire Conventionné",
    department: "Notariat & Inscriptions Hypothécaires (G8)",
    agency: "Étude Notariale Yaoundé",
    avatarTone: "bg-indigo-600 text-white",
    initials: "EN",
    phone: "+237 222 23 45 67",
    description: "Rédaction des conventions, réquisition MINDCAF et publication des hypothèques.",
  },
  {
    id: "usr-comite-05",
    email: "comite@cfc.cm",
    name: "Secrétariat CGR / CRC",
    role: "COMITE",
    roleLabel: "Comité de Crédit",
    department: "Direction Générale & Arbitrage (G6)",
    agency: "Siège Social Yaoundé",
    avatarTone: "bg-purple-600 text-white",
    initials: "CC",
    phone: "+237 222 21 00 11",
    description: "Délibérations collégiales, accords de prêts et résolutions de crédit.",
  },
  {
    id: "usr-diaspora-06",
    email: "diaspora@cfc.cm",
    name: "M. Charles Zogo",
    role: "DIASPORA",
    roleLabel: "Chargé Diaspora & Non-Résidents",
    department: "Cellule Diaspora & Partenariats Internationaux",
    agency: "Pôle International Siège",
    avatarTone: "bg-cyan-600 text-white",
    initials: "CZ",
    phone: "+237 691 88 77 66",
    description: "Dossiers des Camerounais de l'étranger, virements SWIFT et procurations.",
  },
  {
    id: "usr-admin-07",
    email: "admin@cfc.cm",
    name: "Superviseur DSI",
    role: "ADMIN",
    roleLabel: "Administrateur Système",
    department: "Direction des Systèmes d'Information & Sécurité",
    agency: "Direction Générale CFC",
    avatarTone: "bg-slate-800 text-white",
    initials: "AD",
    phone: "+237 222 22 10 00",
    description: "Supervision globale, gestion des habilitations, audit et paramétrage DUC.",
  },
];

export const DEFAULT_USER = SEEDED_ADMIN_USERS[0]; // Mme Nicole Mbezele par défaut
