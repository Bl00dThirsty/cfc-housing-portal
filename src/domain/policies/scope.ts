/**
 * Périmètres (scopes) d'accès CFC.
 *
 * Une capacité dit *ce qu'on peut faire*. Un périmètre dit *sur quoi on peut
 * le faire*. « Mise à jour autorisée » ne suffit pas : il faut « mise à jour
 * autorisée sur **un dossier de mon agence** ».
 *
 * Le périmètre est donc un prédicat évalué par rôle, et il est appliqué deux
 * fois : côté application (`isInScope`) et côté base (`private.can_act_on_dossier`).
 *
 * Ce module est pur : aucun import React, aucun import Supabase.
 */

import { type Role, type StaffRole } from "./capabilities";

/** Périmètres d'accès gérés par la plateforme. */
export const SCOPES = [
  "OWN_AGENCY",
  "OWN_PORTFOLIO",
  "OWN_FILES",
  "ALL",
  "DIASPORA_FILES",
] as const;

export type Scope = (typeof SCOPES)[number];

/**
 * Décrit le périmètre maximal d'un rôle.
 *
 * - `OWN_AGENCY` — le périmètre est l'agence du dossier (Guichet).
 * - `OWN_PORTFOLIO` — le périmètre est le portefeuille de l'agent (Gestionnaire).
 * - `OWN_FILES` — le périmètre est le dossier dont l'agent est titulaire
 *   ou partie engagée (Notaire, citoyen).
 * - `ALL` — lecture transverse (Risques/BET, Comité, Administrateur).
 * - `DIASPORA_FILES` — le périmètre est le guichet diaspora.
 */
export const ROLE_SCOPES: Record<Role, Scope> = {
  GUICHET: "OWN_AGENCY",
  GESTIONNAIRE: "OWN_PORTFOLIO",
  RISQUES_BET: "ALL",
  NOTAIRE: "OWN_FILES",
  COMITE: "ALL",
  DIASPORA: "DIASPORA_FILES",
  PMO: "ALL",
  ANALYSTE: "ALL",
  RECOUVREMENT: "ALL",
  ARCHIVISTE: "ALL",
  AUDIT: "ALL",
  ADMIN: "ALL",
  CITIZEN: "OWN_FILES",
};

/**
 * Sous-ensemble des champs du dossier qu'un rôle peut modifier.
 *
 * Complète `dossier:update` : un GUICHET possède la capacité de mise à jour
 * mais ne touche qu'à l'identité ; un RISQUES_BET qu'à la partie technique.
 */
export const UPDATE_SCOPES = [
  "IDENTITY",
  "TECHNICAL",
  "LEGAL",
  "FINANCIAL",
  "FULL",
] as const;

export type UpdateScope = (typeof UPDATE_SCOPES)[number];

/** Champs du dossier regroupés par nature. */
export const DOSSIER_FIELDS_BY_UPDATE_SCOPE: Record<UpdateScope, readonly string[]> = {
  IDENTITY: [
    "name",
    "cni_raw",
    "cni_normalised",
    "birth_date",
    "phone",
    "phone2",
    "email",
    "address",
    "city",
    "district",
    "region",
    "agency",
    "advisor",
  ],
  TECHNICAL: [
    "project_type",
    "project_title",
    "project_cost",
    "land_title",
    "current_step",
    "progress",
    "completion_percent",
  ],
  FINANCIAL: [
    "loan_amount",
    "rate",
    "duration",
    "duration_years",
    "monthly_payment",
    "monthly_income",
    "savings_target",
    "savings_current",
    "savings_percent",
    "current_balance",
    "debt_ratio",
  ],
  LEGAL: [
    "land_title",
    "notary_assigned",
    "bet_assigned",
    "land_title_rank",
    "mortgage_rank",
  ],
  FULL: ["*"],
};

export const ROLE_UPDATE_SCOPES: Record<Role, UpdateScope> = {
  GUICHET: "IDENTITY",
  GESTIONNAIRE: "FULL",
  RISQUES_BET: "TECHNICAL",
  NOTAIRE: "LEGAL",
  COMITE: "IDENTITY",
  DIASPORA: "IDENTITY",
  PMO: "IDENTITY",
  ANALYSTE: "TECHNICAL",
  RECOUVREMENT: "IDENTITY",
  ARCHIVISTE: "IDENTITY",
  AUDIT: "IDENTITY",
  ADMIN: "FULL",
  CITIZEN: "IDENTITY",
};

/** Périmètre maximal d'un rôle. */
export function resolveScope(role: Role): Scope {
  return ROLE_SCOPES[role] ?? "OWN_FILES";
}

/** Sous-ensemble des champs modifiables par un rôle. */
export function resolveUpdateScope(role: Role): UpdateScope {
  return ROLE_UPDATE_SCOPES[role] ?? "IDENTITY";
}

/**
 * Contexte d'évaluation d'un périmètre.
 *
 * Les trois champs nommés décrivent **l'acteur** : son identifiant, son
 * agence, et le fait qu'il serve le guichet diaspora. Les attributs du
 * dossier à tester (le cas échéant) sont transmis séparément.
 */
export interface ScopeContext {
  /** Identifiant de l'acteur connecté (`auth.uid()`). */
  ownerUserId: string | null;
  /** Identifiant de l'agence de rattachement de l'acteur. */
  agencyId: string | null;
  /** L'acteur sert-il le guichet diaspora ? */
  isDiaspora: boolean;
}

/** Attributs d'un dossier, sisiés pour l'évaluation d'un périmètre. */
export interface ScopedDossier {
  /** Agent titulaire du dossier (`dossiers.owner_user_id`). */
  owner_user_id: string | null;
  /** Agence de rattachement du dossier (`dossiers.agency_id`). */
  agency_id: string | null;
  /** Le dossier est instruit par le guichet diaspora. */
  is_diaspora: boolean;
}

/**
 * Le périmètre autorise-t-il l'acteur sur ce dossier ?
 *
 * Sans dossier (contrôle de la seule capacité d'accès), la réponse indique
 * si le périmètre est structurellement ouvert à l'acteur.
 */
export function isInScope(
  scope: Scope,
  context: ScopeContext,
  dossier?: ScopedDossier,
): boolean {
  switch (scope) {
    case "ALL":
      return true;

    case "OWN_AGENCY":
      if (!dossier) return context.agencyId !== null;
      return (
        context.agencyId !== null &&
        dossier.agency_id !== null &&
        dossier.agency_id === context.agencyId
      );

    case "OWN_PORTFOLIO":
    case "OWN_FILES":
      if (!dossier) return context.ownerUserId !== null;
      return (
        context.ownerUserId !== null &&
        dossier.owner_user_id !== null &&
        dossier.owner_user_id === context.ownerUserId
      );

    case "DIASPORA_FILES":
      if (!dossier) return context.isDiaspora;
      return context.isDiaspora && dossier.is_diaspora;

    default:
      return false;
  }
}

/** Le rôle peut-il modifier ce champ de dossier ? */
export function canUpdateField(
  role: Role,
  field: string,
): boolean {
  const scope = resolveUpdateScope(role);
  const allowed = DOSSIER_FIELDS_BY_UPDATE_SCOPE[scope];
  return allowed.includes("*") || allowed.includes(field);
}

/** Un rôle métier peut-il administrer les habilitations ? */
export function isStaffRoleWithScope(role: Role): role is StaffRole {
  return role !== "CITIZEN";
}
