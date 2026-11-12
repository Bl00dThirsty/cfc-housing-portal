/**
 * Configuration RBAC de la navigation de la console d'administration.
 *
 * Les sections restent décrites par rôle (la structure métier de la banque ne
 * se déduit pas d'un tableau de capacités), mais **le filtrage n'est plus un
 * `switch` sur une chaîne** : chaque entrée porte ses exigences
 * (`capability`, `chemises`) et le module de politique décide.
 *
 * Trois exigences, une seule source :
 * - `src/domain/policies/permissions.ts` — le rôle a-t-il la capacité ?
 * - `src/domain/policies/chemise.ts` — le rôle lit-il cette chemise ?
 * - `src/domain/policies/scope.ts` — sur quel périmètre ?
 */

import {
  type Capability,
  type Role,
  type StaffRole,
} from "@/domain/policies/capabilities";
import { hasCapability } from "@/domain/policies/permissions";
import { type ChemiseCode, canReadChemise } from "@/domain/policies/chemise";
import { type AppRole } from "@/lib/auth-data";

export interface NavSubItem {
  id: string;
  title: string;
  href?: string;
  badge?: "soon" | "live" | "new" | string;
  /** Capacité exigée pour voir cette entrée. */
  capability?: Capability;
  /** Chemises DUC dont cette entrée donne l'accès. */
  chemises?: readonly ChemiseCode[];
}

export interface NavItem {
  id: string;
  title: string;
  href: string;
  badge?: string;
  groupCode?: string;
  /** Capacité exigée pour voir cette entrée. */
  capability?: Capability;
  /** Chemises DUC dont cette entrée donne l'accès. */
  chemises?: readonly ChemiseCode[];
  subItems?: NavSubItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Page d'atterrissage par défaut selon le rôle, après connexion.
 *
 * Un citoyen atterrit sur son portail ; un agent sur l'écran de son pôle.
 */
export const LANDING_BY_ROLE: Record<StaffRole, string> = {
  GUICHET: "/portail-cfc/clients",
  GESTIONNAIRE: "/portail-cfc/clients",
  RISQUES_BET: "/portail-cfc/actors/risk-engineering",
  NOTAIRE: "/portail-cfc/actors/notary-cadastre",
  COMITE: "/portail-cfc/actors/credit-committees",
  DIASPORA: "/portail-cfc/actors/agency/diaspora",
  ADMIN: "/portail-cfc/analytics",
};

/** Page d'atterrissage d'un emprunteur. */
export const CITIZEN_LANDING = "/portail-client";

/** Page d'atterrissage d'un rôle, citoyen compris. */
export function landingPathForRole(role: AppRole): string {
  if (role === "CITIZEN") return CITIZEN_LANDING;
  return LANDING_BY_ROLE[role] ?? "/portail-cfc/clients";
}

/** Le rôle peut-il voir cette entrée de navigation ? */
export function canSeeNavItem(role: Role, item: NavItem | NavSubItem): boolean {
  if (item.capability && !hasCapability(role, item.capability)) return false;
  if (item.chemises && item.chemises.length > 0) {
    return item.chemises.every((chemise) => canReadChemise(role, chemise));
  }
  return true;
}

function filterSections(role: Role, sections: NavSection[]): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => canSeeNavItem(role, item))
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter((subItem) => canSeeNavItem(role, subItem)),
        })),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * Sections de navigation filtrées par rôle **et** par capacité.
 *
 * Un citoyen n'a pas de console d'administration : la liste est vide.
 */
export function getSidebarSectionsForRole(role: AppRole): NavSection[] {
  if (role === "CITIZEN") return [];
  return filterSections(role, NAV_SECTIONS_BY_ROLE[role] ?? []);
}

const NAV_SECTIONS_BY_ROLE: Record<StaffRole, NavSection[]> = {
  GUICHET: [
    {
      title: "Accueil & Enrôlement (G1)",
      items: [
        {
          id: "clients",
          title: "Emprunteurs & Dossier Unique Client (DUC)",
          href: "/portail-cfc/clients",
          badge: "G1",
          groupCode: "Accueil & DUC",
          capability: "dossier:read",
          subItems: [
            { id: "clients-table", title: "1. Répertoire Emprunteurs", href: "/portail-cfc/clients" },
            { id: "clients-duc", title: "2. Dossier Numérique DUC", href: "/portail-cfc/clients?tab=duc", chemises: ["C1"] },
            { id: "clients-epargne", title: "3. Carnet d'Épargne Numérisé", href: "/portail-cfc/clients?tab=epargne", capability: "savings:read" },
          ],
        },
        {
          id: "agency",
          title: "Agence Commerciale",
          href: "/portail-cfc/actors/agency",
          badge: "Guichet",
          groupCode: "Production des Crédits",
          capability: "dossier:read",
          subItems: [
            { id: "agency-main", title: "Enrôlement & Épargne Habitat", href: "/portail-cfc/actors/agency" },
            {
              id: "agency-kyc",
              title: "Validation KYC & Vigilance Renforcée",
              href: "/portail-cfc/actors/agency/kyc-validation",
              capability: "kyc:read",
            },
            { id: "agency-momo", title: "Collecte Mobile Money (MoMo)", href: "/portail-cfc/actors/agency/mobile-money" },
            { id: "agency-simulator", title: "Simulateur d'Apport & Scoring", href: "/portail-cfc/actors/agency/simulator" },
          ],
        },
      ],
    },
  ],

  GESTIONNAIRE: [
    {
      title: "Portefeuille Emprunteurs",
      items: [
        {
          id: "clients",
          title: "Emprunteurs & Dossier Unique Client (DUC)",
          href: "/portail-cfc/clients",
          badge: "Portefeuille",
          groupCode: "Gestion de Comptes",
          capability: "dossier:read",
          subItems: [
            { id: "clients-table", title: "1. Répertoire & État Dossiers", href: "/portail-cfc/clients" },
            { id: "clients-kanban", title: "2. Kanban par Client", href: "/portail-cfc/clients?tab=kanban" },
            { id: "clients-duc", title: "3. Pièces Justificatives DUC", href: "/portail-cfc/clients?tab=duc", chemises: ["C1", "C2"] },
            { id: "clients-epargne", title: "4. Carnet d'Épargne & Apport", href: "/portail-cfc/clients?tab=epargne", capability: "savings:read" },
          ],
        },
        {
          id: "kanban",
          title: "Pipeline Global d'Instruction",
          href: "/portail-cfc/kanban",
          badge: "Kanban",
          groupCode: "Délais & Progression",
          capability: "dossier:read",
          subItems: [
            { id: "kanban-board", title: "Tableau Kanban Multi-Clients", href: "/portail-cfc/kanban" },
            { id: "kanban-list", title: "Vue Liste Chronologique", href: "/portail-cfc/kanban" },
          ],
        },
        {
          id: "agency-promoters",
          title: "Partenariats Promoteurs & SIC",
          href: "/portail-cfc/actors/agency/promoters",
          badge: "Partenaires",
          groupCode: "Programmes Immobiliers",
          capability: "dossier:read",
          subItems: [
            { id: "promoters-main", title: "Conventions SIC & MAETUR", href: "/portail-cfc/actors/agency/promoters" },
          ],
        },
      ],
    },
  ],

  RISQUES_BET: [
    {
      title: "Pôle Risques & BET (G3)",
      items: [
        {
          id: "risk-engineering",
          title: "Risques & Ingénierie",
          href: "/portail-cfc/actors/risk-engineering",
          badge: "G3",
          groupCode: "Expertise Technique",
          capability: "dossier:read",
          subItems: [
            { id: "risk-main", title: "Contre-Expertise Devis & Plans", href: "/portail-cfc/actors/risk-engineering" },
            { id: "risk-reports", title: "Rapports de Visite Chantier", href: "/portail-cfc/actors/risk-engineering/site-reports" },
            { id: "risk-solvency", title: "Centrale des Risques & Solvabilité", href: "/portail-cfc/actors/risk-engineering/solvency" },
            { id: "risk-directory", title: "Annuaire BET & Experts Agréés", href: "/portail-cfc/actors/risk-engineering/directory" },
            { id: "risk-environment", title: "Scoring Géotechnique & Urbain", href: "/portail-cfc/actors/risk-engineering/geotech-urban" },
          ],
        },
        {
          id: "clients-duc-view",
          title: "Consultation DUC (Chemise C2)",
          href: "/portail-cfc/clients?tab=duc",
          badge: "C2",
          groupCode: "Pièces d'Instruction",
          capability: "document:read",
          chemises: ["C2"],
          subItems: [
            { id: "duc-instruction", title: "DQE, Permis & Rapports BET", href: "/portail-cfc/clients?tab=duc", chemises: ["C2"] },
          ],
        },
      ],
    },
  ],

  NOTAIRE: [
    {
      title: "Pôle Notariat & Cadastre (G8)",
      items: [
        {
          id: "notary-cadastre",
          title: "Notaires & Cadastre",
          href: "/portail-cfc/actors/notary-cadastre",
          badge: "G8",
          groupCode: "Affaires Juridiques & Foncier",
          capability: "notary:read",
          subItems: [
            { id: "notary-main", title: "Conventions & Hypothèque 1er Rang", href: "/portail-cfc/actors/notary-cadastre" },
            { id: "notary-cadastre-docs", title: "Liaison Cadastre & MINDCAF", href: "/portail-cfc/actors/notary-cadastre/cadastre-docs" },
            { id: "notary-directory", title: "Études Notariales & Suivi Minutes", href: "/portail-cfc/actors/notary-cadastre/directory" },
            { id: "notary-insurances", title: "Assurances Décès, Incendie & TRC", href: "/portail-cfc/actors/notary-cadastre/insurances" },
            { id: "notary-oppositions", title: "Contrôle Pré-notations Foncier", href: "/portail-cfc/actors/notary-cadastre/oppositions" },
          ],
        },
        {
          id: "clients-duc-notary",
          title: "Garanties DUC (Chemise C3)",
          href: "/portail-cfc/clients?tab=duc",
          badge: "C3",
          groupCode: "Garanties & Hypothèques",
          capability: "document:read",
          chemises: ["C3"],
          subItems: [
            { id: "duc-garanties", title: "Titres Fonciers & Actes Notariés", href: "/portail-cfc/clients?tab=duc", chemises: ["C3"] },
          ],
        },
      ],
    },
  ],

  COMITE: [
    {
      title: "Comités Décisionnels (G6)",
      items: [
        {
          id: "credit-committees",
          title: "Comités CGR / CRC",
          href: "/portail-cfc/actors/credit-committees",
          badge: "G6",
          groupCode: "Arbitrage & Délibérations",
          capability: "committee:read",
          subItems: [
            { id: "committees-main", title: "Arbitrages & Délibérations Octroi", href: "/portail-cfc/actors/credit-committees" },
            { id: "committees-cgr", title: "Comité Gestion des Risques (CGR)", href: "/portail-cfc/actors/credit-committees/cgr" },
            { id: "committees-crc", title: "Comité Règlement Créances (CRC)", href: "/portail-cfc/actors/credit-committees/crc" },
            { id: "committees-offers", title: "Génération Accords & Offres de Prêt", href: "/portail-cfc/actors/credit-committees/loan-offers", capability: "loan_offer:read" },
            { id: "committees-board", title: "Dossiers Institutionnels Attaché PCA", href: "/portail-cfc/actors/credit-committees/board-institutional" },
          ],
        },
        {
          id: "kanban-comite",
          title: "Pipeline d'Arbitrage",
          href: "/portail-cfc/kanban",
          badge: "Arbitrage",
          groupCode: "Instruction Collégiale",
          capability: "dossier:read",
          subItems: [
            { id: "kanban-deliberation", title: "Dossiers Prêts pour Comité", href: "/portail-cfc/kanban" },
          ],
        },
      ],
    },
  ],

  DIASPORA: [
    {
      title: "Guichet Diaspora & Étranger",
      items: [
        {
          id: "agency-diaspora",
          title: "Guichet Diaspora Siège",
          href: "/portail-cfc/actors/agency/diaspora",
          badge: "Diaspora",
          groupCode: "Cellule Non-Résidents",
          capability: "dossier:read",
          subItems: [
            { id: "diaspora-main", title: "Accueil & Souscriptions Non-Résidents", href: "/portail-cfc/actors/agency/diaspora" },
            { id: "diaspora-simulator", title: "Simulateur Devises & Rapatriement", href: "/portail-cfc/actors/agency/simulator" },
          ],
        },
        {
          id: "clients-diaspora",
          title: "Emprunteurs Diaspora & DUC",
          href: "/portail-cfc/clients",
          badge: "DUC",
          groupCode: "Dossiers Internationaux",
          capability: "dossier:read",
          subItems: [
            { id: "diaspora-clients", title: "Répertoire Emprunteurs Diaspora", href: "/portail-cfc/clients" },
            { id: "diaspora-duc", title: "Procurations & Garanties DUC", href: "/portail-cfc/clients?tab=duc", chemises: ["C1"] },
          ],
        },
      ],
    },
  ],

  ADMIN: [
    {
      title: "Supervision Stratégique",
      items: [
        {
          id: "analytics",
          title: "Analytics & Pilotage",
          href: "/portail-cfc/analytics",
          badge: "Live",
          groupCode: "Supervision Stratégique",
          capability: "analytics:read",
          subItems: [
            { id: "analytics-overview", title: "Synthèse Indicateurs & KPI", href: "/portail-cfc/analytics" },
            { id: "analytics-core-banking", title: "Supervision Core Banking Carthago", badge: "soon" },
            { id: "analytics-audit", title: "Journal d'Audit & Conformité", badge: "soon" },
          ],
        },
        {
          id: "clients",
          title: "Emprunteurs & Dossier Unique Client (DUC)",
          href: "/portail-cfc/clients",
          badge: "Hub",
          groupCode: "Portefeuille, Kanban & DUC",
          capability: "dossier:read",
          subItems: [
            { id: "clients-table", title: "1. Répertoire Emprunteurs", href: "/portail-cfc/clients" },
            { id: "clients-kanban", title: "2. Kanban par Client", href: "/portail-cfc/clients?tab=kanban" },
            { id: "clients-duc", title: "3. Dossier Numérique DUC", href: "/portail-cfc/clients?tab=duc" },
            { id: "clients-epargne", title: "4. Carnet d'Épargne Numérisé", href: "/portail-cfc/clients?tab=epargne" },
          ],
        },
        {
          id: "kanban",
          title: "Pipeline Global (Multi-Clients)",
          href: "/portail-cfc/kanban",
          badge: "Global",
          groupCode: "Instruction & Délais",
          capability: "dossier:read",
          subItems: [
            { id: "kanban-board", title: "Tableau Kanban Global", href: "/portail-cfc/kanban" },
            { id: "kanban-list", title: "Vue Liste Chronologique", href: "/portail-cfc/kanban" },
          ],
        },
      ],
    },
    {
      title: "Acteurs Guichet Unique (Tous les Pôles)",
      items: [
        {
          id: "agency",
          title: "Agence Commerciale",
          href: "/portail-cfc/actors/agency",
          badge: "G1",
          groupCode: "Groupe G1 · Production des Crédits",
          capability: "dossier:read",
          subItems: [
            { id: "agency-main", title: "Enrôlement & Épargne Habitat", href: "/portail-cfc/actors/agency" },
            {
              id: "agency-kyc",
              title: "Validation KYC & Vigilance Renforcée",
              href: "/portail-cfc/actors/agency/kyc-validation",
              capability: "kyc:read",
            },
            { id: "agency-momo", title: "Collecte Mobile Money (MoMo)", href: "/portail-cfc/actors/agency/mobile-money" },
            { id: "agency-simulator", title: "Simulateur d'Apport & Scoring", href: "/portail-cfc/actors/agency/simulator" },
            { id: "agency-promoters", title: "Partenariats Promoteurs & SIC", href: "/portail-cfc/actors/agency/promoters" },
            { id: "agency-diaspora", title: "Guichet Diaspora & Étranger", href: "/portail-cfc/actors/agency/diaspora" },
          ],
        },
        {
          id: "risk-engineering",
          title: "Risques & BET",
          href: "/portail-cfc/actors/risk-engineering",
          badge: "G3",
          groupCode: "Groupe G3 · Expertise Technique & Risques",
          capability: "dossier:read",
          subItems: [
            { id: "risk-main", title: "Contre-Expertise Devis & Plans", href: "/portail-cfc/actors/risk-engineering" },
            { id: "risk-reports", title: "Rapports de Visite Chantier", href: "/portail-cfc/actors/risk-engineering/site-reports" },
            { id: "risk-solvency", title: "Centrale des Risques & Solvabilité", href: "/portail-cfc/actors/risk-engineering/solvency" },
            { id: "risk-directory", title: "Annuaire BET & Experts Agréés", href: "/portail-cfc/actors/risk-engineering/directory" },
            { id: "risk-environment", title: "Scoring Géotechnique & Urbain", href: "/portail-cfc/actors/risk-engineering/geotech-urban" },
          ],
        },
        {
          id: "credit-committees",
          title: "Comités CGR / CRC",
          href: "/portail-cfc/actors/credit-committees",
          badge: "G6",
          groupCode: "Groupe G6 · Comités Décisionnels & Gouvernance",
          capability: "committee:read",
          subItems: [
            { id: "committees-main", title: "Arbitrages & Délibérations Octroi", href: "/portail-cfc/actors/credit-committees" },
            { id: "committees-cgr", title: "Comité Gestion des Risques (CGR)", href: "/portail-cfc/actors/credit-committees/cgr" },
            { id: "committees-crc", title: "Comité Règlement Créances (CRC)", href: "/portail-cfc/actors/credit-committees/crc" },
            { id: "committees-offers", title: "Génération Accords & Offres de Prêt", href: "/portail-cfc/actors/credit-committees/loan-offers", capability: "loan_offer:read" },
            { id: "committees-board", title: "Dossiers Institutionnels Attaché PCA", href: "/portail-cfc/actors/credit-committees/board-institutional" },
          ],
        },
        {
          id: "notary-cadastre",
          title: "Notaires & Cadastre",
          href: "/portail-cfc/actors/notary-cadastre",
          badge: "G8",
          groupCode: "Groupe G8 · Notariat & Affaires Juridiques",
          capability: "notary:read",
          subItems: [
            { id: "notary-main", title: "Conventions & Hypothèque 1er Rang", href: "/portail-cfc/actors/notary-cadastre" },
            { id: "notary-cadastre-docs", title: "Liaison Cadastre & Certificats MINDCAF", href: "/portail-cfc/actors/notary-cadastre/cadastre-docs" },
            { id: "notary-directory", title: "Études Notariales & Suivi Minutes", href: "/portail-cfc/actors/notary-cadastre/directory" },
            { id: "notary-insurances", title: "Assurances Décès, Incendie & TRC", href: "/portail-cfc/actors/notary-cadastre/insurances" },
            { id: "notary-oppositions", title: "Contrôle Pré-notations Foncier", href: "/portail-cfc/actors/notary-cadastre/oppositions" },
          ],
        },
        {
          id: "disbursements",
          title: "DFBC Décaissements",
          href: "/portail-cfc/actors/disbursements",
          badge: "G7",
          groupCode: "Groupe G7 · Finances, Budget & Comptabilité",
          capability: "disbursement:read",
          subItems: [
            { id: "disbursements-main", title: "Déblocages par Tranche (VD)", href: "/portail-cfc/actors/disbursements" },
            { id: "disbursements-systac", title: "Ordres de Virement SYSTAC", href: "/portail-cfc/actors/disbursements/systac" },
            { id: "disbursements-schedules", title: "Tableaux d'Amortissement", href: "/portail-cfc/actors/disbursements/schedules" },
            { id: "disbursements-subsidies", title: "Comptabilité Prêts Bonifiés", href: "/portail-cfc/actors/disbursements/subsidies" },
            { id: "disbursements-recovery", title: "Recouvrement & Pré-Contentieux", href: "/portail-cfc/actors/disbursements/recovery", capability: "recovery:read" },
          ],
        },
        {
          id: "mortgage-release",
          title: "Clôture & Mainlevée",
          href: "/portail-cfc/actors/mortgage-release",
          badge: "G4",
          groupCode: "Groupe G4 · Clôture, Mainlevée & Conservation",
          capability: "dossier:read",
          subItems: [
            { id: "release-main", title: "Décompte Extinction à Solde Nul", href: "/portail-cfc/actors/mortgage-release" },
            { id: "release-deeds", title: "Actes de Mainlevée Notariée", href: "/portail-cfc/actors/mortgage-release/deeds" },
            { id: "release-registry", title: "Radiation Hypothèque Cadastre", href: "/portail-cfc/actors/mortgage-release/registry" },
            { id: "release-titles", title: "Restitution Titres Fonciers Originaux", href: "/portail-cfc/actors/mortgage-release/titles" },
            { id: "release-archive", title: "Clôture Définitive & Archivage DUC", href: "/portail-cfc/actors/mortgage-release/archive" },
          ],
        },
      ],
    },
    {
      title: "Paramétrage & Journalisation",
      items: [
        {
          id: "settings",
          title: "Paramétrage Direction Générale",
          href: "/portail-cfc/settings/catalogue",
          badge: "DG",
          groupCode: "Paramétrage & Journalisation",
          capability: "catalogue:write",
          subItems: [
            {
              id: "settings-catalogue",
              title: "Catalogue Documentaire",
              href: "/portail-cfc/settings/catalogue",
              capability: "catalogue:write",
            },
            {
              id: "settings-email",
              title: "Modèles de Courriels",
              href: "/portail-cfc/settings/email",
              capability: "catalogue:write",
            },
            {
              id: "settings-email-deliveries",
              title: "Journal des Envois",
              href: "/portail-cfc/settings/email/deliveries",
              capability: "catalogue:write",
            },
          ],
        },
      ],
    },
  ],
};
