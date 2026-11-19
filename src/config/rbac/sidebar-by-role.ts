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
 *
 * **La navigation est aussi la table d'accès.** `route-access.ts` en déduit
 * les routes que chaque rôle peut ouvrir : une page absente de la navigation
 * d'un rôle lui est refusée. Les deux ne peuvent donc pas diverger.
 *
 * Trois règles de fond :
 *
 * 1. **La première entrée est l'écran d'atterrissage** du rôle. L'agent
 *    atterrit là où le menu annonce qu'il est.
 * 2. **Une entrée, une route.** Deux entrées qui mènent à la même page se
 *    mentent l'une l'autre.
 * 3. **Une entrée est un travail réel**, pas un écran de démonstration :
 *    la file des dossiers à orienter, le contrôle KYC, le paramétrage.
 */

import {
  STAFF_ROLES,
  type Capability,
  type Role,
  type StaffRole,
} from "@/domain/policies/capabilities";
import { capabilitiesFor, hasCapability } from "@/domain/policies/permissions";
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
 *
 * L'écran d'atterrissage est **celui du pôle**, et il porte de vrais
 * indicateurs : les chiffres sont mesurés, pas écrits à la main.
 */
export const LANDING_BY_ROLE: Record<StaffRole, string> = {
  GUICHET: "/portail-cfc/actors/agency",
  GESTIONNAIRE: "/portail-cfc/dossiers",
  RISQUES_BET: "/portail-cfc/actors/risk-engineering",
  NOTAIRE: "/portail-cfc/actors/notary-cadastre",
  COMITE: "/portail-cfc/actors/credit-committees",
  DIASPORA: "/portail-cfc/actors/agency/diaspora",
  PMO: "/portail-cfc/settings/workflow",
  ANALYSTE: "/portail-cfc/actors/credit-committees",
  RECOUVREMENT: "/portail-cfc/actors/disbursements/recovery",
  ARCHIVISTE: "/portail-cfc/dossiers",
  AUDIT: "/portail-cfc/dossiers",
  ADMIN: "/portail-cfc/analytics",
};

/** Page d'atterrissage d'un emprunteur. */
export const CITIZEN_LANDING = "/portail-client";

/** Page d'atterrissage d'un rôle, citoyen compris. */
export function landingPathForRole(role: AppRole): string {
  if (role === "CITIZEN") return CITIZEN_LANDING;
  return LANDING_BY_ROLE[role] ?? "/portail-cfc/actors/agency";
}

/** Le rôle peut-il voir cette entrée de navigation ? */
export function canSeeNavItem(
  role: Role,
  item: NavItem | NavSubItem,
  assignedCapabilities?: readonly Capability[],
): boolean {
  if (item.capability && !hasCapability(role, item.capability, assignedCapabilities)) return false;
  if (item.chemises && item.chemises.length > 0) {
    return item.chemises.every((chemise) => canReadChemise(role, chemise));
  }
  return true;
}

function filterSections(
  role: Role,
  sections: NavSection[],
  assignedCapabilities?: readonly Capability[],
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => canSeeNavItem(role, item, assignedCapabilities))
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter((subItem) => canSeeNavItem(role, subItem, assignedCapabilities)),
        })),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * Sections de navigation filtrées par rôle **et** par capacité.
 *
 * Un citoyen n'a pas de console d'administration : la liste est vide.
 */
export function getSidebarSectionsForRole(
  role: AppRole,
  assignedCapabilities?: readonly Capability[],
): NavSection[] {
  if (role === "CITIZEN") return [];
  const effectiveCapabilities = assignedCapabilities ?? capabilitiesFor(role);
  const sections = filterSections(role, NAV_SECTIONS_BY_ROLE[role] ?? [], effectiveCapabilities);

  const existingHrefs = new Set(sections.flatMap((section) => section.items.map((item) => item.href)));
  const additionalItems: NavItem[] = [];
  for (const sourceRole of STAFF_ROLES) {
    for (const section of NAV_SECTIONS_BY_ROLE[sourceRole] ?? []) {
      for (const item of section.items) {
        if (item.capability && item.href && canSeeNavItem(role, item, effectiveCapabilities) && !existingHrefs.has(item.href)) {
          existingHrefs.add(item.href);
          additionalItems.push({
            ...item,
            id: `granted-${sourceRole}-${item.id}`,
            groupCode: "Habilitations supplémentaires",
            subItems: item.subItems?.filter((subItem) => canSeeNavItem(role, subItem, effectiveCapabilities)),
          });
        }
        for (const subItem of item.subItems ?? []) {
          if (!subItem.href || !subItem.capability || !canSeeNavItem(role, subItem, effectiveCapabilities) || existingHrefs.has(subItem.href)) continue;
          existingHrefs.add(subItem.href);
          additionalItems.push({
            id: `granted-${sourceRole}-${subItem.id}`,
            title: subItem.title,
            href: subItem.href,
            badge: subItem.badge,
            groupCode: "Habilitations supplémentaires",
            capability: subItem.capability,
          });
        }
      }
    }
  }

  if (additionalItems.length > 0) {
    sections.push({ title: "Habilitations supplémentaires", items: additionalItems });
  }
  return sections;
}

const NAV_SECTIONS_BY_ROLE: Partial<Record<StaffRole, NavSection[]>> = {
  // ---------------------------------------------------------------------------
  // G1 — Guichetier & Accueil : enrôler, contrôler, constituer l'épargne.
  // ---------------------------------------------------------------------------
  GUICHET: [
    {
      title: "Accueil & Enrôlement (G1)",
      items: [
        {
          id: "agency",
          title: "Enrôlement & Épargne Habitat",
          href: "/portail-cfc/actors/agency",
          badge: "G1",
          groupCode: "Accueil & DUC",
          capability: "dossier:read",
          subItems: [
            { id: "agency-main", title: "Tableau de bord du pôle", href: "/portail-cfc/actors/agency" },
            { id: "agency-momo", title: "Collecte Mobile Money (MoMo)", href: "/portail-cfc/actors/agency/mobile-money" },
            { id: "agency-simulator", title: "Simulateur d'Apport & Scoring", href: "/portail-cfc/actors/agency/simulator" },
          ],
        },
        {
          id: "dossiers-a-orienter",
          title: "Dossiers à orienter",
          href: "/portail-cfc/dossiers",
          badge: "File",
          groupCode: "Accueil & DUC",
          capability: "dossier:read",
        },
        {
          id: "clients",
          title: "Emprunteurs & Dossier Unique Client (DUC)",
          href: "/portail-cfc/clients",
          badge: "DUC",
          groupCode: "Accueil & DUC",
          capability: "dossier:read",
          subItems: [
            { id: "clients-table", title: "Répertoire Emprunteurs", href: "/portail-cfc/clients" },
            { id: "clients-duc", title: "Dossier Numérique DUC", href: "/portail-cfc/clients?tab=duc", chemises: ["C1"] },
            { id: "clients-epargne", title: "Carnet d'Épargne Numérisé", href: "/portail-cfc/clients?tab=epargne", capability: "savings:read" },
          ],
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // G2 — Conseiller Clientèle : orienter les dossiers, suivre le portefeuille.
  // ---------------------------------------------------------------------------
  GESTIONNAIRE: [
    {
      title: "Portefeuille Emprunteurs (G2)",
      items: [
        {
          id: "dossiers-a-orienter",
          title: "Dossiers à orienter",
          href: "/portail-cfc/dossiers",
          badge: "File",
          groupCode: "Portefeuille & DUC",
          capability: "dossier:read",
        },
        {
          id: "agency-kyc",
          title: "Validation KYC & Vigilance Renforcée",
          href: "/portail-cfc/actors/agency/kyc-validation",
          badge: "KYC",
          groupCode: "Portefeuille & DUC",
          capability: "kyc:read",
        },
        {
          id: "clients",
          title: "Emprunteurs & Dossier Unique Client (DUC)",
          href: "/portail-cfc/clients",
          badge: "DUC",
          groupCode: "Portefeuille & DUC",
          capability: "dossier:read",
          subItems: [
            { id: "clients-table", title: "Répertoire & État Dossiers", href: "/portail-cfc/clients" },
            { id: "clients-kanban", title: "Kanban par Client", href: "/portail-cfc/clients?tab=kanban" },
            { id: "clients-duc", title: "Pièces Justificatives DUC", href: "/portail-cfc/clients?tab=duc", chemises: ["C1", "C2"] },
            { id: "clients-epargne", title: "Carnet d'Épargne & Apport", href: "/portail-cfc/clients?tab=epargne", capability: "savings:read" },
          ],
        },
        {
          id: "kanban",
          title: "Pipeline Global d'Instruction",
          href: "/portail-cfc/kanban",
          badge: "Kanban",
          groupCode: "Délais & Progression",
          capability: "dossier:read",
        },
        {
          id: "agency-promoters",
          title: "Partenariats Promoteurs & SIC",
          href: "/portail-cfc/actors/agency/promoters",
          badge: "Partenaires",
          groupCode: "Programmes Immobiliers",
          capability: "dossier:read",
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // G3 — Risques & Ingénierie : contre-expertise, solvabilité, chantier.
  // ---------------------------------------------------------------------------
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
            { id: "risk-main", title: "Tableau de bord du pôle", href: "/portail-cfc/actors/risk-engineering" },
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
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // G8 — Notariat & Affaires Juridiques : conventions, hypothèque, cadastre.
  // ---------------------------------------------------------------------------
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
            { id: "notary-main", title: "Tableau de bord du pôle", href: "/portail-cfc/actors/notary-cadastre" },
            { id: "notary-cadastre-docs", title: "Liaison Cadastre & Certificats MINDCAF", href: "/portail-cfc/actors/notary-cadastre/cadastre-docs" },
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
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // G6 — Direction Générale & Arbitrage : comités, offres, déblocages.
  // ---------------------------------------------------------------------------
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
            { id: "committees-main", title: "Tableau de bord du pôle", href: "/portail-cfc/actors/credit-committees" },
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
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // Cellule Diaspora & Non-Résidents.
  // ---------------------------------------------------------------------------
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
        },
        {
          id: "dossiers-a-orienter",
          title: "Dossiers à orienter",
          href: "/portail-cfc/dossiers",
          badge: "File",
          groupCode: "Cellule Non-Résidents",
          capability: "dossier:read",
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
        {
          id: "diaspora-simulator",
          title: "Simulateur Devises et Rapatriement",
          href: "/portail-cfc/actors/agency/simulator",
          groupCode: "Cellule Non-Résidents",
          capability: "dossier:read",
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // Direction Générale & DSI : supervision transverse et paramétrage.
  // ---------------------------------------------------------------------------
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
          id: "dossiers-a-orienter",
          title: "Dossiers à orienter",
          href: "/portail-cfc/dossiers",
          badge: "File",
          groupCode: "Supervision Stratégique",
          capability: "dossier:read",
        },
        {
          id: "clients",
          title: "Emprunteurs & Dossier Unique Client (DUC)",
          href: "/portail-cfc/clients",
          badge: "DUC",
          groupCode: "Portefeuille, Kanban & DUC",
          capability: "dossier:read",
          subItems: [
            { id: "clients-table", title: "Répertoire Emprunteurs", href: "/portail-cfc/clients" },
            { id: "clients-kanban", title: "Kanban par Client", href: "/portail-cfc/clients?tab=kanban" },
            { id: "clients-duc", title: "Dossier Numérique DUC", href: "/portail-cfc/clients?tab=duc" },
            { id: "clients-epargne", title: "Carnet d'Épargne Numérisé", href: "/portail-cfc/clients?tab=epargne" },
          ],
        },
        {
          id: "kanban",
          title: "Pipeline Global (Multi-Clients)",
          href: "/portail-cfc/kanban",
          badge: "Global",
          groupCode: "Instruction & Délais",
          capability: "dossier:read",
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
              capability: "email:manage",
            },
            {
              id: "settings-email-deliveries",
              title: "Journal des Envois",
              href: "/portail-cfc/settings/email/deliveries",
              capability: "email:manage",
            },
            {
              id: "settings-email-provider",
              title: "Relais & état de santé",
              href: "/portail-cfc/settings/email/provider",
              capability: "email:manage",
            },
          ],
        },
        {
          id: "settings-users",
          title: "Comptes & Affectations du Personnel",
          href: "/portail-cfc/settings/users",
          badge: "Accès",
          groupCode: "Paramétrage & Journalisation",
          capability: "admin:users",
        },
        {
          id: "settings-roles",
          title: "Rôles & habilitations",
          href: "/portail-cfc/settings/roles",
          badge: "Sécurité",
          groupCode: "Paramétrage & Journalisation",
          capability: "admin:roles",
        },
        {
          id: "settings-groups",
          title: "Pôles & Agences",
          href: "/portail-cfc/settings/groups",
          badge: "Organisation",
          groupCode: "Paramétrage & Journalisation",
          capability: "admin:groups",
        },
        {
          id: "settings-workflow",
          title: "Étapes & workflows",
          href: "/portail-cfc/settings/workflow",
          badge: "Processus",
          groupCode: "Paramétrage & Journalisation",
          capability: "workflow:manage",
        },
        {
          id: "settings-audit",
          title: "Journal & état du système",
          href: "/portail-cfc/settings/audit",
          badge: "Audit",
          groupCode: "Paramétrage & Journalisation",
          capability: "admin:audit",
        },
      ],
    },
  ],
};
