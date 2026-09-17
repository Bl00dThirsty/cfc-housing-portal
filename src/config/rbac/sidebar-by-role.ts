/**
 * Configuration RBAC (Role-Based Access Control) pour la navigation de la barre latérale.
 *
 * Règle métier fondamentale :
 * Chaque profil métier (Guichet, Gestionnaire, Risques/BET, Notaire, Comité, Diaspora)
 * ne doit voir QUE les applications, sous-modules et dossiers relevant de son domaine.
 * Seul le rôle ADMIN (DSI / Direction Générale) dispose de la vue transverse globale.
 */

import { type AdminRole } from "@/lib/auth-data";

export interface NavSubItem {
  id: string;
  title: string;
  href?: string;
  badge?: "soon" | "live" | "new" | string;
}

export interface NavItem {
  id: string;
  title: string;
  href: string;
  badge?: string;
  groupCode?: string;
  subItems?: NavSubItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Page d'atterrissage par défaut selon le rôle après connexion ou basculement de profil.
 */
export const LANDING_BY_ROLE: Record<AdminRole, string> = {
  GUICHET: "/admin/clients",
  GESTIONNAIRE: "/admin/clients",
  RISQUES_BET: "/admin/actors/risk-engineering",
  NOTAIRE: "/admin/actors/notary-cadastre",
  COMITE: "/admin/actors/credit-committees",
  DIASPORA: "/admin/actors/agency/diaspora",
  ADMIN: "/admin/analytics",
};

export function landingPathForRole(role: AdminRole): string {
  return LANDING_BY_ROLE[role] ?? "/admin/clients";
}

/**
 * Générateur des sections de navigation filtrées strictement par rôle métier.
 */
export function getSidebarSectionsForRole(role: AdminRole): NavSection[] {
  switch (role) {
    case "GUICHET":
      return [
        {
          title: "Accueil & Enrôlement (G1)",
          items: [
            {
              id: "clients",
              title: "Emprunteurs & Dossier Unique Client (DUC)",
              href: "/admin/clients",
              badge: "G1",
              groupCode: "Accueil & DUC",
              subItems: [
                { id: "clients-table", title: "1. Répertoire Emprunteurs", href: "/admin/clients" },
                { id: "clients-duc", title: "2. Dossier Numérique DUC", href: "/admin/clients?tab=duc" },
                { id: "clients-epargne", title: "3. Carnet d'Épargne Numérisé", href: "/admin/clients?tab=epargne" },
              ],
            },
            {
              id: "agency",
              title: "Agence Commerciale",
              href: "/admin/actors/agency",
              badge: "Guichet",
              groupCode: "Production des Crédits",
              subItems: [
                { id: "agency-main", title: "Enrôlement & Épargne Habitat", href: "/admin/actors/agency" },
                { id: "agency-momo", title: "Collecte Mobile Money (MoMo)", href: "/admin/actors/agency/mobile-money" },
                { id: "agency-simulator", title: "Simulateur d'Apport & Scoring", href: "/admin/actors/agency/simulator" },
              ],
            },
          ],
        },
      ];

    case "GESTIONNAIRE":
      return [
        {
          title: "Portefeuille Emprunteurs",
          items: [
            {
              id: "clients",
              title: "Emprunteurs & Dossier Unique Client (DUC)",
              href: "/admin/clients",
              badge: "Portefeuille",
              groupCode: "Gestion de Comptes",
              subItems: [
                { id: "clients-table", title: "1. Répertoire & État Dossiers", href: "/admin/clients" },
                { id: "clients-kanban", title: "2. Kanban par Client", href: "/admin/clients?tab=kanban" },
                { id: "clients-duc", title: "3. Pièces Justificatives DUC", href: "/admin/clients?tab=duc" },
                { id: "clients-epargne", title: "4. Carnet d'Épargne & Apport", href: "/admin/clients?tab=epargne" },
              ],
            },
            {
              id: "kanban",
              title: "Pipeline Global d'Instruction",
              href: "/admin/kanban",
              badge: "Kanban",
              groupCode: "Délais & Progression",
              subItems: [
                { id: "kanban-board", title: "Tableau Kanban Multi-Clients", href: "/admin/kanban" },
                { id: "kanban-list", title: "Vue Liste Chronologique", href: "/admin/kanban" },
              ],
            },
            {
              id: "agency-promoters",
              title: "Partenariats Promoteurs & SIC",
              href: "/admin/actors/agency/promoters",
              badge: "Partenaires",
              groupCode: "Programmes Immobiliers",
              subItems: [
                { id: "promoters-main", title: "Conventions SIC & MAETUR", href: "/admin/actors/agency/promoters" },
              ],
            },
          ],
        },
      ];

    case "RISQUES_BET":
      return [
        {
          title: "Pôle Risques & BET (G3)",
          items: [
            {
              id: "risk-engineering",
              title: "Risques & Ingénierie",
              href: "/admin/actors/risk-engineering",
              badge: "G3",
              groupCode: "Expertise Technique",
              subItems: [
                { id: "risk-main", title: "Contre-Expertise Devis & Plans", href: "/admin/actors/risk-engineering" },
                { id: "risk-reports", title: "Rapports de Visite Chantier", href: "/admin/actors/risk-engineering/site-reports" },
                { id: "risk-solvency", title: "Centrale des Risques & Solvabilité", href: "/admin/actors/risk-engineering/solvency" },
                { id: "risk-directory", title: "Annuaire BET & Experts Agréés", href: "/admin/actors/risk-engineering/directory" },
                { id: "risk-environment", title: "Scoring Géotechnique & Urbain", href: "/admin/actors/risk-engineering/geotech-urban" },
              ],
            },
            {
              id: "clients-duc-view",
              title: "Consultation DUC (Chemise C2)",
              href: "/admin/clients?tab=duc",
              badge: "C2",
              groupCode: "Pièces d'Instruction",
              subItems: [
                { id: "duc-instruction", title: "DQE, Permis & Rapports BET", href: "/admin/clients?tab=duc" },
              ],
            },
          ],
        },
      ];

    case "NOTAIRE":
      return [
        {
          title: "Pôle Notariat & Cadastre (G8)",
          items: [
            {
              id: "notary-cadastre",
              title: "Notaires & Cadastre",
              href: "/admin/actors/notary-cadastre",
              badge: "G8",
              groupCode: "Affaires Juridiques & Foncier",
              subItems: [
                { id: "notary-main", title: "Conventions & Hypothèque 1er Rang", href: "/admin/actors/notary-cadastre" },
                { id: "notary-cadastre-docs", title: "Liaison Cadastre & MINDCAF", href: "/admin/actors/notary-cadastre/cadastre-docs" },
                { id: "notary-directory", title: "Études Notariales & Suivi Minutes", href: "/admin/actors/notary-cadastre/directory" },
                { id: "notary-insurances", title: "Assurances Décès, Incendie & TRC", href: "/admin/actors/notary-cadastre/insurances" },
                { id: "notary-oppositions", title: "Contrôle Pré-notations Foncier", href: "/admin/actors/notary-cadastre/oppositions" },
              ],
            },
            {
              id: "clients-duc-notary",
              title: "Garanties DUC (Chemise C3)",
              href: "/admin/clients?tab=duc",
              badge: "C3",
              groupCode: "Garanties & Hypothèques",
              subItems: [
                { id: "duc-garanties", title: "Titres Fonciers & Actes Notariés", href: "/admin/clients?tab=duc" },
              ],
            },
          ],
        },
      ];

    case "COMITE":
      return [
        {
          title: "Comités Décisionnels (G6)",
          items: [
            {
              id: "credit-committees",
              title: "Comités CGR / CRC",
              href: "/admin/actors/credit-committees",
              badge: "G6",
              groupCode: "Arbitrage & Délibérations",
              subItems: [
                { id: "committees-main", title: "Arbitrages & Délibérations Octroi", href: "/admin/actors/credit-committees" },
                { id: "committees-cgr", title: "Comité Gestion des Risques (CGR)", href: "/admin/actors/credit-committees/cgr" },
                { id: "committees-crc", title: "Comité Règlement Créances (CRC)", href: "/admin/actors/credit-committees/crc" },
                { id: "committees-offers", title: "Génération Accords & Offres de Prêt", href: "/admin/actors/credit-committees/loan-offers" },
                { id: "committees-board", title: "Dossiers Institutionnels Attaché PCA", href: "/admin/actors/credit-committees/board-institutional" },
              ],
            },
            {
              id: "kanban-comite",
              title: "Pipeline d'Arbitrage",
              href: "/admin/kanban",
              badge: "Arbitrage",
              groupCode: "Instruction Collégiale",
              subItems: [
                { id: "kanban-deliberation", title: "Dossiers Prêts pour Comité", href: "/admin/kanban" },
              ],
            },
          ],
        },
      ];

    case "DIASPORA":
      return [
        {
          title: "Guichet Diaspora & Étranger",
          items: [
            {
              id: "agency-diaspora",
              title: "Guichet Diaspora Siège",
              href: "/admin/actors/agency/diaspora",
              badge: "Diaspora",
              groupCode: "Cellule Non-Résidents",
              subItems: [
                { id: "diaspora-main", title: "Accueil & Souscriptions Non-Résidents", href: "/admin/actors/agency/diaspora" },
                { id: "diaspora-simulator", title: "Simulateur Devises & Rapatriement", href: "/admin/actors/agency/simulator" },
              ],
            },
            {
              id: "clients-diaspora",
              title: "Emprunteurs Diaspora & DUC",
              href: "/admin/clients",
              badge: "DUC",
              groupCode: "Dossiers Internationaux",
              subItems: [
                { id: "diaspora-clients", title: "Répertoire Emprunteurs Diaspora", href: "/admin/clients" },
                { id: "diaspora-duc", title: "Procurations & Garanties DUC", href: "/admin/clients?tab=duc" },
              ],
            },
          ],
        },
      ];

    case "ADMIN":
    default:
      // Superviseur DSI / Direction Générale : Accès transverse complet
      return [
        {
          title: "Supervision Stratégique",
          items: [
            {
              id: "analytics",
              title: "Analytics & Pilotage",
              href: "/admin/analytics",
              badge: "Live",
              groupCode: "Supervision Stratégique",
              subItems: [
                { id: "analytics-overview", title: "Synthèse Indicateurs & KPI", href: "/admin/analytics" },
                { id: "analytics-core-banking", title: "Supervision Core Banking Carthago", badge: "soon" },
                { id: "analytics-audit", title: "Journal d'Audit & Conformité", badge: "soon" },
              ],
            },
            {
              id: "clients",
              title: "Emprunteurs & Dossier Unique Client (DUC)",
              href: "/admin/clients",
              badge: "Hub",
              groupCode: "Portefeuille, Kanban & DUC",
              subItems: [
                { id: "clients-table", title: "1. Répertoire Emprunteurs", href: "/admin/clients" },
                { id: "clients-kanban", title: "2. Kanban par Client", href: "/admin/clients?tab=kanban" },
                { id: "clients-duc", title: "3. Dossier Numérique DUC", href: "/admin/clients?tab=duc" },
                { id: "clients-epargne", title: "4. Carnet d'Épargne Numérisé", href: "/admin/clients?tab=epargne" },
              ],
            },
            {
              id: "kanban",
              title: "Pipeline Global (Multi-Clients)",
              href: "/admin/kanban",
              badge: "Global",
              groupCode: "Instruction & Délais",
              subItems: [
                { id: "kanban-board", title: "Tableau Kanban Global", href: "/admin/kanban" },
                { id: "kanban-list", title: "Vue Liste Chronologique", href: "/admin/kanban" },
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
              href: "/admin/actors/agency",
              badge: "G1",
              groupCode: "Groupe G1 · Production des Crédits",
              subItems: [
                { id: "agency-main", title: "Enrôlement & Épargne Habitat", href: "/admin/actors/agency" },
                { id: "agency-momo", title: "Collecte Mobile Money (MoMo)", href: "/admin/actors/agency/mobile-money" },
                { id: "agency-simulator", title: "Simulateur d'Apport & Scoring", href: "/admin/actors/agency/simulator" },
                { id: "agency-promoters", title: "Partenariats Promoteurs & SIC", href: "/admin/actors/agency/promoters" },
                { id: "agency-diaspora", title: "Guichet Diaspora & Étranger", href: "/admin/actors/agency/diaspora" },
              ],
            },
            {
              id: "risk-engineering",
              title: "Risques & BET",
              href: "/admin/actors/risk-engineering",
              badge: "G3",
              groupCode: "Groupe G3 · Expertise Technique & Risques",
              subItems: [
                { id: "risk-main", title: "Contre-Expertise Devis & Plans", href: "/admin/actors/risk-engineering" },
                { id: "risk-reports", title: "Rapports de Visite Chantier", href: "/admin/actors/risk-engineering/site-reports" },
                { id: "risk-solvency", title: "Centrale des Risques & Solvabilité", href: "/admin/actors/risk-engineering/solvency" },
                { id: "risk-directory", title: "Annuaire BET & Experts Agréés", href: "/admin/actors/risk-engineering/directory" },
                { id: "risk-environment", title: "Scoring Géotechnique & Urbain", href: "/admin/actors/risk-engineering/geotech-urban" },
              ],
            },
            {
              id: "credit-committees",
              title: "Comités CGR / CRC",
              href: "/admin/actors/credit-committees",
              badge: "G6",
              groupCode: "Groupe G6 · Comités Décisionnels & Gouvernance",
              subItems: [
                { id: "committees-main", title: "Arbitrages & Délibérations Octroi", href: "/admin/actors/credit-committees" },
                { id: "committees-cgr", title: "Comité Gestion des Risques (CGR)", href: "/admin/actors/credit-committees/cgr" },
                { id: "committees-crc", title: "Comité Règlement Créances (CRC)", href: "/admin/actors/credit-committees/crc" },
                { id: "committees-offers", title: "Génération Accords & Offres de Prêt", href: "/admin/actors/credit-committees/loan-offers" },
                { id: "committees-board", title: "Dossiers Institutionnels Attaché PCA", href: "/admin/actors/credit-committees/board-institutional" },
              ],
            },
            {
              id: "notary-cadastre",
              title: "Notaires & Cadastre",
              href: "/admin/actors/notary-cadastre",
              badge: "G8",
              groupCode: "Groupe G8 · Notariat & Affaires Juridiques",
              subItems: [
                { id: "notary-main", title: "Conventions & Hypothèque 1er Rang", href: "/admin/actors/notary-cadastre" },
                { id: "notary-cadastre-docs", title: "Liaison Cadastre & Certificats MINDCAF", href: "/admin/actors/notary-cadastre/cadastre-docs" },
                { id: "notary-directory", title: "Études Notariales & Suivi Minutes", href: "/admin/actors/notary-cadastre/directory" },
                { id: "notary-insurances", title: "Assurances Décès, Incendie & TRC", href: "/admin/actors/notary-cadastre/insurances" },
                { id: "notary-oppositions", title: "Contrôle Pré-notations Foncier", href: "/admin/actors/notary-cadastre/oppositions" },
              ],
            },
            {
              id: "disbursements",
              title: "DFBC Décaissements",
              href: "/admin/actors/disbursements",
              badge: "G7",
              groupCode: "Groupe G7 · Finances, Budget & Comptabilité",
              subItems: [
                { id: "disbursements-main", title: "Déblocages par Tranche (VD)", href: "/admin/actors/disbursements" },
                { id: "disbursements-systac", title: "Ordres de Virement SYSTAC", href: "/admin/actors/disbursements/systac" },
                { id: "disbursements-schedules", title: "Tableaux d'Amortissement", href: "/admin/actors/disbursements/schedules" },
                { id: "disbursements-subsidies", title: "Comptabilité Prêts Bonifiés", href: "/admin/actors/disbursements/subsidies" },
                { id: "disbursements-recovery", title: "Recouvrement & Pré-Contentieux", href: "/admin/actors/disbursements/recovery" },
              ],
            },
            {
              id: "mortgage-release",
              title: "Clôture & Mainlevée",
              href: "/admin/actors/mortgage-release",
              badge: "G4",
              groupCode: "Groupe G4 · Clôture, Mainlevée & Conservation",
              subItems: [
                { id: "release-main", title: "Décompte Extinction à Solde Nul", href: "/admin/actors/mortgage-release" },
                { id: "release-deeds", title: "Actes de Mainlevée Notariée", href: "/admin/actors/mortgage-release/deeds" },
                { id: "release-registry", title: "Radiation Hypothèque Cadastre", href: "/admin/actors/mortgage-release/registry" },
                { id: "release-titles", title: "Restitution Titres Fonciers Originaux", href: "/admin/actors/mortgage-release/titles" },
                { id: "release-archive", title: "Clôture Définitive & Archivage DUC", href: "/admin/actors/mortgage-release/archive" },
              ],
            },
          ],
        },
      ];
  }
}
