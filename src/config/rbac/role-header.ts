/**
 * L'en-tête de la console, paramétré par le rôle.
 *
 * L'en-tête est le **premier** écran que l'agent voit : il doit dire où il
 * est, ce qu'il peut faire, et où chercher. Un en-tête identique pour les
 * sept rôles ne dit rien de tout cela.
 *
 * Cette configuration est le **seul** propriétaire de ces informations. Elle
 * s'appuie sur la politique de capacité existante (`hasCapability`), donc une
 * action rapide qui exige une capacité que le rôle n'a pas n'est jamais
 * proposée — la même règle que la navigation latérale.
 */

import type { Capability } from "@/domain/policies/capabilities";
import { hasCapability } from "@/domain/policies/permissions";
import type { AppRole } from "@/lib/auth-data";

/** Une action rapide de l'en-tête. */
export interface QuickAction {
  id: string;
  label: string;
  href: string;
  /** Nom de l'icône Lucide ; la coque la résout. */
  icon: string;
  /** Capacité exigée pour voir cette action. */
  capability?: Capability;
}

/** Ce que l'en-tête affiche pour un rôle donné. */
export interface RoleHeaderConfig {
  /** Le libellé du pôle, à gauche. */
  contextLabel: string;
  /** La recherche : son libellé et son périmètre réel. */
  search?: { placeholder: string; scope: string };
  /** Les actions rapides, avant filtrage par capacité. */
  quickActions: QuickAction[];
  /** La file de support est-elle pertinente pour ce rôle ? */
  showSupport: boolean;
}

const CITIZEN_CONFIG: RoleHeaderConfig = {
  contextLabel: "Espace citoyen",
  quickActions: [
    { id: "citizen-deposit", label: "Déposer une pièce", href: "/portail-client", icon: "Upload" },
  ],
  showSupport: false,
};

const STAFF_CONFIGS: Record<string, RoleHeaderConfig> = {
  GUICHET: {
    contextLabel: "Agence commerciale",
    search: { placeholder: "Rechercher un dossier, un emprunteur…", scope: "G1" },
    quickActions: [
      { id: "enrol", label: "Enrôler un emprunteur", href: "/portail-cfc/actors/agency", icon: "UserPlus", capability: "dossier:create" },
      { id: "kyc", label: "Valider un KYC", href: "/portail-cfc/actors/agency/kyc-validation", icon: "ShieldCheck", capability: "kyc:read" },
    ],
    showSupport: true,
  },
  GESTIONNAIRE: {
    contextLabel: "Portefeuille emprunteurs",
    search: { placeholder: "Rechercher un dossier, une épargne…", scope: "G2" },
    quickActions: [
      { id: "orienter", label: "Orienter un dossier", href: "/portail-cfc/dossiers", icon: "ClipboardCheck", capability: "dossier:read" },
      { id: "kanban", label: "Ouvrir le kanban", href: "/portail-cfc/kanban", icon: "SquareKanban", capability: "dossier:read" },
      { id: "savings", label: "Consulter l'épargne", href: "/portail-cfc/clients?tab=epargne", icon: "PiggyBank", capability: "savings:read" },
    ],
    showSupport: true,
  },
  RISQUES_BET: {
    contextLabel: "Risques & ingénierie",
    search: { placeholder: "Rechercher un rapport de visite, un dossier…", scope: "G3" },
    quickActions: [
      { id: "site-report", label: "Rapport de visite", href: "/portail-cfc/actors/risk-engineering/site-reports", icon: "ClipboardCheck", capability: "dossier:read" },
      { id: "solvency", label: "Centrale des risques", href: "/portail-cfc/actors/risk-engineering/solvency", icon: "ShieldAlert", capability: "dossier:read" },
    ],
    showSupport: false,
  },
  NOTAIRE: {
    contextLabel: "Notariat & cadastre",
    search: { placeholder: "Rechercher un titre, une convention…", scope: "G8" },
    quickActions: [
      { id: "convention", label: "Convention notariée", href: "/portail-cfc/actors/notary-cadastre", icon: "Stamp", capability: "notary:read" },
      { id: "titles", label: "Titres fonciers", href: "/portail-cfc/actors/notary-cadastre/directory", icon: "Landmark", capability: "notary:read" },
    ],
    showSupport: false,
  },
  COMITE: {
    contextLabel: "Comités de crédit",
    search: { placeholder: "Rechercher un dossier à délibérer…", scope: "G6" },
    quickActions: [
      { id: "deliberation", label: "Dossier en délibération", href: "/portail-cfc/actors/credit-committees", icon: "Gavel", capability: "committee:read" },
      { id: "offers", label: "Accords de prêt", href: "/portail-cfc/actors/credit-committees/loan-offers", icon: "FilePen", capability: "loan_offer:read" },
    ],
    showSupport: false,
  },
  DIASPORA: {
    contextLabel: "Guichet diaspora",
    search: { placeholder: "Rechercher un dossier diaspora…", scope: "DIASPORA" },
    quickActions: [
      { id: "diaspora", label: "Guichet diaspora", href: "/portail-cfc/actors/agency/diaspora", icon: "Globe", capability: "dossier:read" },
      { id: "simulator-fx", label: "Simulateur de devises", href: "/portail-cfc/actors/agency/simulator", icon: "Calculator", capability: "dossier:read" },
    ],
    showSupport: true,
  },
  ADMIN: {
    contextLabel: "Supervision de la banque",
    search: { placeholder: "Rechercher un dossier, un prêt, un client…", scope: "ADMIN" },
    quickActions: [
      { id: "pilotage", label: "Pilotage & analytics", href: "/portail-cfc/analytics", icon: "ChartColumn", capability: "analytics:read" },
      { id: "transfers", label: "Ordres de virement", href: "/portail-cfc/actors/disbursements/systac", icon: "ArrowLeftRight", capability: "disbursement:read" },
    ],
    showSupport: true,
  },
};

/** La configuration d'en-tête d'un rôle. */
export function roleHeaderConfigFor(role: AppRole): RoleHeaderConfig {
  if (role === "CITIZEN") return CITIZEN_CONFIG;
  return STAFF_CONFIGS[role] ?? CITIZEN_CONFIG;
}

/**
 * Les actions rapides qu'un rôle peut **accomplir**.
 *
 * Une action qui exige une capacité que le rôle n'a pas est retirée : elle
 * ne doit pas être offerte à quelqu'un qui ne peut pas la faire.
 */
export function visibleQuickActions(role: AppRole): QuickAction[] {
  if (role === "CITIZEN") return CITIZEN_CONFIG.quickActions;

  return roleHeaderConfigFor(role).quickActions.filter(
    (action) => !action.capability || hasCapability(role, action.capability),
  );
}
