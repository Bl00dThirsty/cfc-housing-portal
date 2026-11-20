/**
 * Taxonomie des capacités CFC.
 *
 * Le modèle historique du portail comparait des chaînes de rôle (`role === "X"`).
 * Ce fichier remplace ces comparaisons par une capacité typée
 * `"<ressource>:<action>"`, puis `permissions.ts` associe chaque rôle à un
 * paquet de capacités.
 *
 * Règle structurante (séparation des fonctions — COBAC R-2001/07 art. 37) :
 * *modifier* un dossier et *décider* sur un dossier sont deux capacités
 * distinctes. L'unité qui prépare un dossier ne doit jamais être celle qui
 * l'approuve.
 *
 * Ce module est pur : aucun import React, aucun import Supabase.
 */

/** Capacité d'accès, exprimée comme `"<ressource>:<action>"`. */
export type Capability =
  | "dossier:read"
  | "dossier:create"
  | "dossier:update"
  | "dossier:delete"
  | "dossier:decide"
  | "dossier:approve"
  | "dossier:export"
  | "dossier:assign"
  | "kyc:read"
  | "kyc:verify"
  | "kyc:decide"
  | "kyc:escalate"
  | "document:read"
  | "document:upload"
  | "document:request"
  | "document:validate"
  | "document:reject"
  | "savings:read"
  | "savings:credit"
  | "savings:debit"
  | "savings:validate"
  | "savings:reverse"
  | "committee:read"
  | "committee:deliberate"
  | "committee:sign"
  | "notary:read"
  | "notary:draft"
  | "notary:record"
  | "notary:release"
  | "loan_offer:read"
  | "loan_offer:create"
  | "loan_offer:issue"
  | "disbursement:read"
  | "disbursement:release"
  | "disbursement:reconcile"
  | "recovery:read"
  | "recovery:manage"
  | "catalogue:read"
  | "catalogue:write"
  | "register:read"
  | "register:write"
  | "email:read"
  | "email:send"
  | "email:manage"
  | "message:read"
  | "message:send"
  | "workflow:read"
  | "workflow:manage"
  | "workflow:execute"
  | "analytics:read"
  | "analytics:export"
  | "admin:users"
  | "admin:groups"
  | "admin:roles"
  | "admin:audit";

/** Codes staff déjà présents dans le référentiel Supabase du projet. */
export const STAFF_ROLES = [
  "GUICHET",
  "GESTIONNAIRE",
  "RISQUES_BET",
  "NOTAIRE",
  "COMITE",
  "DIASPORA",
  "PMO",
  "ANALYSTE",
  "RECOUVREMENT",
  "ARCHIVISTE",
  "AUDIT",
  "ADMIN",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Rôle porté par un emprunteur authentifié sur le portail citoyen. */
export const CITIZEN_ROLE = "CITIZEN" as const;

export type CitizenRole = typeof CITIZEN_ROLE;

/** Tout rôle connu de la plateforme (métier ou citoyen). */
export type Role = StaffRole | CitizenRole;

/** Codes de pôle organisationnel CFC (G5 n'existe pas : la numérotation saute). */
export const POLE_CODES = [
  "G1",
  "G2",
  "G3",
  "G4",
  "G6",
  "G7",
  "G8",
  "DIASPORA",
  "DG",
  "DCM",
  "DCR",
  "DRAC",
  "SDA",
  "SDA-AUDIT",
  "ADMIN",
] as const;

export type PoleCode = (typeof POLE_CODES)[number];

/**
 * Le pôle organisationnel de chaque rôle.
 *
 * La relation est bijective : un rôle, un pôle. Elle est la même en base
 * (`ref.role.pole_code`) — l'application s'en sert pour choisir les
 * indicateurs qu'un agent surveille.
 */
export const ROLE_POLES: Record<StaffRole, PoleCode> = {
  GUICHET: "G1",
  GESTIONNAIRE: "G2",
  RISQUES_BET: "G3",
  NOTAIRE: "G8",
  COMITE: "G6",
  DIASPORA: "DIASPORA",
  PMO: "DG",
  ANALYSTE: "DCR",
  RECOUVREMENT: "DRAC",
  ARCHIVISTE: "SDA",
  AUDIT: "SDA-AUDIT",
  ADMIN: "ADMIN",
};

/** Capacité du super-utilisateur : la totalité du modèle. */
export const ALL_CAPABILITIES: readonly Capability[] = [
  "dossier:read",
  "dossier:create",
  "dossier:update",
  "dossier:delete",
  "dossier:decide",
  "dossier:approve",
  "dossier:export",
  "dossier:assign",
  "kyc:read",
  "kyc:verify",
  "kyc:decide",
  "kyc:escalate",
  "document:read",
  "document:upload",
  "document:request",
  "document:validate",
  "document:reject",
  "savings:read",
  "savings:credit",
  "savings:debit",
  "savings:validate",
  "savings:reverse",
  "committee:read",
  "committee:deliberate",
  "committee:sign",
  "notary:read",
  "notary:draft",
  "notary:record",
  "notary:release",
  "loan_offer:read",
  "loan_offer:create",
  "loan_offer:issue",
  "disbursement:read",
  "disbursement:release",
  "disbursement:reconcile",
  "recovery:read",
  "recovery:manage",
  "catalogue:read",
  "catalogue:write",
  "register:read",
  "register:write",
  "email:read",
  "email:send",
  "email:manage",
  "message:read",
  "message:send",
  "workflow:read",
  "workflow:manage",
  "workflow:execute",
  "analytics:read",
  "analytics:export",
  "admin:users",
  "admin:groups",
  "admin:roles",
  "admin:audit",
];

const CAPABILITY_SET: ReadonlySet<string> = new Set<string>(ALL_CAPABILITIES);

const STAFF_ROLE_SET: ReadonlySet<string> = new Set<string>(STAFF_ROLES);

const ROLE_SET: ReadonlySet<string> = new Set<string>([...STAFF_ROLES, CITIZEN_ROLE]);

export function isCapability(value: string): value is Capability {
  return CAPABILITY_SET.has(value);
}

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLE_SET.has(value);
}

export function isRole(value: string): value is Role {
  return ROLE_SET.has(value);
}

/** Ressource d'une capacité (`"dossier"` pour `"dossier:read"`). */
export function capabilityResource(capability: Capability): string {
  const separator = capability.indexOf(":");
  return separator === -1 ? capability : capability.slice(0, separator);
}

/** Action d'une capacité (`"read"` pour `"dossier:read"`). */
export function capabilityAction(capability: Capability): string {
  const separator = capability.indexOf(":");
  return separator === -1 ? capability : capability.slice(separator + 1);
}
