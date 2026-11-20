/**
 * Les trois chemises du Dossier Unique Client (DUC).
 *
 * Les chemises ne sont pas trois onglets d'interface : ce sont trois
 * **frontières d'accès**. Un NOTAIRE lit la chemise C3 (Garanties) et ne doit
 * pas lire la C1 (Identification) ; la contrainte se joue au niveau de la
 * ligne, pas au niveau du rendu.
 *
 * Ce module est pur : aucun import React, aucun import Supabase.
 */

import { type PoleCode, type Role, type StaffRole } from "./capabilities";

export const CHEMISE_CODES = ["C1", "C2", "C3"] as const;

export type ChemiseCode = (typeof CHEMISE_CODES)[number];

export interface ChemiseDefinition {
  /** Code de la chemise (`C1`, `C2`, `C3`). */
  code: ChemiseCode;
  /** Libellé métier. */
  label: string;
  /** Contenu couvert par la chemise. */
  description: string;
  /** Pôle qui porte la chemise. */
  owningPole: PoleCode;
  /** Pôles autorisés à lire le contenu de la chemise. */
  readableByPoles: readonly PoleCode[];
  /** Rôles autorisés à lire le contenu de la chemise. */
  readableByRoles: readonly StaffRole[];
  /** Ordre d'affichage. */
  sortOrder: number;
}

/**
 * Rattachement pôle ↔ rôle. Les rôles sans pôle propre (ADMIN) y figurent
 * pour la lisibilité du tableau de garde.
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

export const CHEMISES: Record<ChemiseCode, ChemiseDefinition> = {
  C1: {
    code: "C1",
    label: "Identification",
    description:
      "Pièces d'identification du candidat : CNI ou passeport, justificatif de domicile, état civil, revenus, plan d'épargne et carnet d'épargne.",
    owningPole: "G1",
    readableByPoles: ["G2"],
    readableByRoles: ["GESTIONNAIRE"],
    sortOrder: 1,
  },
  C2: {
    code: "C2",
    label: "Instruction",
    description:
      "Dossier d'instruction technique : devis quantitatif estimatif, étude de sols, rapports de visite de chantier, solvabilité et scoring.",
    owningPole: "G3",
    readableByPoles: ["G1", "G3", "G6", "ADMIN"],
    readableByRoles: ["GUICHET", "GESTIONNAIRE", "RISQUES_BET", "NOTAIRE", "COMITE", "DIASPORA", "PMO", "ANALYSTE", "ARCHIVISTE", "AUDIT", "ADMIN"],
    sortOrder: 2,
  },
  C3: {
    code: "C3",
    label: "Garanties",
    description:
      "Pièces de garantie : titre foncier et son rang, conventions notariées, hypothèque de premier rang, polices d'assurance et oppositions.",
    owningPole: "G8",
    readableByPoles: ["G3", "G4", "G6", "G8", "ADMIN"],
    readableByRoles: ["GESTIONNAIRE", "RISQUES_BET", "NOTAIRE", "COMITE", "PMO", "ANALYSTE", "RECOUVREMENT", "ARCHIVISTE", "AUDIT", "ADMIN"],
    sortOrder: 3,
  },
};

/** Liste des chemises dans l'ordre d'affichage. */
export const ORDERED_CHEMISES: readonly ChemiseDefinition[] = CHEMISE_CODES.map(
  (code) => CHEMISES[code],
).sort((a, b) => a.sortOrder - b.sortOrder);

/** Définition d'une chemise par son code. */
export function getChemise(code: ChemiseCode): ChemiseDefinition {
  return CHEMISES[code];
}

/** Pôle porteur d'une chemise. */
export function owningPole(code: ChemiseCode): PoleCode {
  return CHEMISES[code].owningPole;
}

/**
 * Le rôle peut-il lire le contenu de cette chemise ?
 *
 * Un citoyen lit la C1 de son propre dossier : son accès est fondé sur la
 * propriété, pas sur le rôle.
 */
export function canReadChemise(role: Role, code: ChemiseCode): boolean {
  if (role === "CITIZEN") return code === "C1";
  return CHEMISES[code].readableByRoles.includes(role);
}

/** Codes de chemises lisibles par un rôle. */
export function readableChemises(role: Role): ChemiseCode[] {
  return CHEMISE_CODES.filter((code) => canReadChemise(role, code));
}

/** Le rôle peut-il déposer une pièce dans cette chemise ? */
export function canWriteChemise(role: Role, code: ChemiseCode): boolean {
  if (role === "CITIZEN") return code === "C1";
  return CHEMISES[code].readableByRoles.includes(role);
}
