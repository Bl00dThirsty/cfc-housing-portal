/**
 * Matrice de capacités CFC — la source de vérité unique du RBAC applicatif.
 *
 * Trois invariants :
 *
 * 1. Le contrôle d'accès se fait à trois endroits et les trois doivent
 *    concorder : l'action serveur (autoritaire), la politique RLS (le filet),
 *    l'interface (cosmétique). Masquer un bouton n'est jamais un contrôle.
 * 2. Décider et modifier sont séparés (`dossier:update` ≠ `dossier:decide`).
 * 3. Le périmètre est un prédicat, pas un booléen : voir `scope.ts`.
 *
 * Ce module est pur : aucun import React, aucun import Supabase.
 */

import {
  ALL_CAPABILITIES,
  type Capability,
  type Role,
  type StaffRole,
} from "./capabilities";

/**
 * Capacités du citoyen (emprunteur).
 *
 * L'accès du citoyen n'est **pas** piloté par son rôle : il est fondé sur la
 * propriété (`dossiers.citizen_id = auth.uid()`). Ces capacités ne servent
 * qu'à typer l'API ; l'isolement réel est assuré par les politiques RLS.
 */
export const CITIZEN_CAPABILITIES: readonly Capability[] = [
  "dossier:read",
  "kyc:read",
  "document:read",
  "document:upload",
  "savings:read",
  "catalogue:read",
];

/**
 * Paquets de capacités par rôle métier.
 *
 * Lecture :
 * - `◐` = capacité accordée mais **restreinte par le périmètre** (`scope.ts`)
 *   ou par la chemise documentaire (`chemise.ts`).
 * - `●` = capacité complète.
 *
 * Une capacité absente est refusée : la liste est une fermeture, pas un
 * point de départ.
 */
const STAFF_CAPABILITIES: Record<StaffRole, readonly Capability[]> = {
  // G1 — Guichet Unique & Accueil : enrôlement, réception des pièces,
  // vérification préliminaire KYC, constitution de l'épargne.
  GUICHET: [
    "dossier:read",
    "dossier:create",
    "dossier:update",
    "kyc:read",
    "kyc:verify",
    "document:read",
    "document:upload",
    "document:validate",
    "document:reject",
    "savings:read",
    "savings:credit",
    "savings:validate",
    "catalogue:read",
    "analytics:read",
  ],

  // Exploitation & Portefeuille Crédit : instruction, suivi de l'épargne
  // préalable, coordination du DUC, décision opérationnelle courante.
  GESTIONNAIRE: [
    "dossier:read",
    "dossier:update",
    "dossier:decide",
    "dossier:export",
    "kyc:read",
    "kyc:verify",
    "kyc:decide",
    "document:read",
    "document:upload",
    "document:validate",
    "document:reject",
    "savings:read",
    "savings:credit",
    "savings:debit",
    "savings:validate",
    "committee:read",
    "analytics:read",
  ],

  // G3 — Direction des Risques & Ingénierie : contre-expertise BET, solvabilité,
  // visite de chantier. Lecture transverse, écriture strictement technique.
  RISQUES_BET: [
    "dossier:read",
    "dossier:update",
    "kyc:read",
    "document:read",
    "document:upload",
    "document:validate",
    "savings:read",
    "committee:read",
    "analytics:read",
  ],

  // G8 — Notariat & Affaires Juridiques : conventions, hypothèque 1er rang,
  // réquisition MINDCAF. Écriture strictement juridique.
  NOTAIRE: [
    "dossier:read",
    "dossier:update",
    "document:read",
    "document:upload",
    "document:validate",
    "document:reject",
    "notary:read",
    "notary:draft",
    "notary:record",
    "notary:release",
    "committee:read",
    "catalogue:read",
  ],

  // G6 — Direction Générale & Arbitrage : comités CGR/CRC, offres de prêt,
  // déblocages, recouvrement. Ne modifie pas le dossier : il l'arbitre.
  COMITE: [
    "dossier:read",
    "dossier:decide",
    "dossier:approve",
    "dossier:export",
    "document:read",
    "committee:read",
    "committee:deliberate",
    "committee:sign",
    "loan_offer:read",
    "loan_offer:create",
    "loan_offer:issue",
    "disbursement:read",
    "disbursement:release",
    "recovery:read",
    "recovery:manage",
    "analytics:read",
    "analytics:export",
  ],

  // Cellule Diaspora & Non-Résidents : dossiers des Camerounais de l'étranger,
  // procurations et mandat limité, virements SWIFT.
  DIASPORA: [
    "dossier:read",
    "dossier:create",
    "dossier:update",
    "kyc:read",
    "kyc:verify",
    "kyc:decide",
    "document:read",
    "document:upload",
    "document:validate",
    "document:reject",
    "savings:read",
    "savings:credit",
    "savings:validate",
    "catalogue:read",
  ],

  // DSI & Direction Générale : supervision transverse, paramétrage du
  // catalogue documentaire, gestion des habilitations et journal d'audit.
  ADMIN: ALL_CAPABILITIES,
};

/**
 * Matrice complète, rôle de staff y compris le citoyen.
 *
 * Les capacités du citoyen sont volontairement restreintes : son accès réel
 * est fondé sur la propriété de son dossier, pas sur ce paquet.
 */
export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  ...STAFF_CAPABILITIES,
  CITIZEN: CITIZEN_CAPABILITIES,
};

/** Capacités accordées à un rôle donné. */
export function capabilitiesFor(role: Role): readonly Capability[] {
  return ROLE_CAPABILITIES[role] ?? [];
}

/** Le rôle possède-t-il cette capacité ? */
export function hasCapability(role: Role, capability: Capability): boolean {
  const granted = ROLE_CAPABILITIES[role];
  if (!granted) return false;
  return granted.includes(capability);
}

/** Le rôle possède-t-il au moins une de ces capacités ? */
export function hasAnyCapability(
  role: Role,
  capabilities: readonly Capability[],
): boolean {
  if (capabilities.length === 0) return false;
  return capabilities.some((capability) => hasCapability(role, capability));
}

/** Le rôle possède-t-il toutes ces capacités ? */
export function hasAllCapabilities(
  role: Role,
  capabilities: readonly Capability[],
): boolean {
  if (capabilities.length === 0) return true;
  return capabilities.every((capability) => hasCapability(role, capability));
}
