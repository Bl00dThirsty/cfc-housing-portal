/**
 * Cartographie officielle des processus CFC.
 *
 * Source : « Cartographie et analyse des processus métiers clés » (chapitre 6),
 * établie par la mission à partir du recueil des manuels de procédures du CFC.
 * Les codes de processus (`CRD-06`, `REC-03`, `GAR-01`…) sont ceux du recueil :
 * ils sont la **référence partagée** entre le back-office, le portail citoyen et
 * le reporting. Un changement d'écran ne doit jamais renommer un code de
 * procédure.
 *
 * Module **pur** : aucune dépendance React, Supabase ou serveur.
 */

export type ProcessFamily = "pilotage" | "realisation" | "support" | "ecosysteme";

export type ProcessCode =
  | "ACC"
  | "CLT"
  | "CPT"
  | "OPE"
  | "CAI"
  | "CRD"
  | "GAR"
  | "REC"
  | "ARC"
  | "COU";

export type DirectorateCode =
  | "CA"
  | "DG"
  | "CODIR"
  | "DCR"
  | "DRAC"
  | "DFBC"
  | "DCM"
  | "DECS"
  | "DGR"
  | "DAI"
  | "PMO"
  | "DAG"
  | "SDI"
  | "SDPA"
  | "PMT"
  | "GRC"
  | "BUD"
  | "CMP"
  | "DEP"
  | "MPT"
  | "SDRH"
  | "HAB"
  | "SEC"
  | "SCOM";

/** Phase applicative du circuit de crédit (colonnes du Kanban). */
export type CreditPhase =
  | "kyc_savings"
  | "risk_bet"
  | "committees"
  | "notary_mortgage"
  | "disbursements"
  | "closing_release";

export type ProcessPriority = "prioritaire" | "standard";

export type ProcessDefinition = {
  code: ProcessCode;
  label: string;
  family: ProcessFamily;
  /** Rattachement à la chaîne de valeur client (ordre de la cartographie). */
  chainOrder: number | null;
  pilote: DirectorateCode[];
  priority: ProcessPriority;
};

export const PROCESSES: ReadonlyArray<ProcessDefinition> = [
  {
    code: "ACC",
    label: "Marketing et développement commercial",
    family: "realisation",
    chainOrder: 1,
    pilote: ["DCM"],
    priority: "standard",
  },
  {
    code: "CLT",
    label: "Accueil et relation client",
    family: "realisation",
    chainOrder: 2,
    pilote: ["DCM"],
    priority: "standard",
  },
  {
    code: "CPT",
    label: "Collecte de l'épargne-logement",
    family: "realisation",
    chainOrder: 3,
    pilote: ["DCM", "DFBC"],
    priority: "prioritaire",
  },
  {
    code: "CRD",
    label: "Octroi et mise en place du crédit habitat",
    family: "realisation",
    chainOrder: 4,
    pilote: ["DCR"],
    priority: "prioritaire",
  },
  {
    code: "GAR",
    label: "Gestion des garanties",
    family: "realisation",
    chainOrder: 5,
    pilote: ["DCR", "DRAC"],
    priority: "prioritaire",
  },
  {
    code: "REC",
    label: "Remboursements, recouvrement et contentieux",
    family: "realisation",
    chainOrder: 6,
    pilote: ["DRAC"],
    priority: "prioritaire",
  },
  {
    code: "ARC",
    label: "Archivage et gestion électronique des documents",
    family: "support",
    chainOrder: null,
    pilote: ["SDPA", "SDI"],
    priority: "prioritaire",
  },
  {
    code: "COU",
    label: "Courrier",
    family: "support",
    chainOrder: null,
    pilote: ["DAG"],
    priority: "standard",
  },
  {
    code: "OPE",
    label: "Opérations d'épargne",
    family: "realisation",
    chainOrder: null,
    pilote: ["DFBC"],
    priority: "standard",
  },
  {
    code: "CAI",
    label: "Caisse et dépot des versements",
    family: "realisation",
    chainOrder: null,
    pilote: ["DFBC"],
    priority: "standard",
  },
];

export type ProcessStep = {
  /** Code du manuel de procédures. */
  code: string;
  label: string;
  process: ProcessCode;
  /** Phase du circuit de crédit ; `null` pour les étapes transverses. */
  phase: CreditPhase | null;
  /** Couloir de responsibility dans le diagramme en couloirs. */
  lane: "client" | "agence" | "siege" | "partenaires" | "support";
  /** L'étape dépend d'un tiers externe (BET, notaire, banque, BEAC…). */
  external: boolean;
};

/**
 * Étapes du circuit de crédit (CRD-01 à CRD-13) et des garanties, telles que
 * décrites par le diagramme en couloirs de la figure 7.
 */
export const CREDIT_PROCESS_STEPS: ReadonlyArray<ProcessStep> = [
  { code: "CRD-01", label: "Entretien exploratoire et analyse sommaire", process: "CRD", phase: "kyc_savings", lane: "agence", external: false },
  { code: "CRD-02", label: "Analyse sommaire du dossier", process: "CRD", phase: "kyc_savings", lane: "agence", external: false },
  { code: "CRD-03", label: "Frais d'instruction, contrat et numérotation", process: "CRD", phase: "kyc_savings", lane: "agence", external: false },
  { code: "CRD-04", label: "Dossier technique et maîtrise d'œuvre (BET)", process: "CRD", phase: "risk_bet", lane: "partenaires", external: true },
  { code: "CRD-06", label: "Évaluation du dossier", process: "CRD", phase: "risk_bet", lane: "agence", external: false },
  { code: "CRD-07", label: "Décision du directeur d'agence", process: "CRD", phase: "committees", lane: "agence", external: false },
  { code: "CRD-08", label: "Contrôle, évaluation et présentation à la décision", process: "CRD", phase: "committees", lane: "siege", external: false },
  { code: "CRD-09", label: "Notification au client (décision)", process: "CRD", phase: "committees", lane: "agence", external: false },
  { code: "CRD-10", label: "Notification au client (accord)", process: "CRD", phase: "committees", lane: "agence", external: false },
  { code: "GAR-01", label: "Constitution des garanties : notaire, conservation foncière, assurance", process: "GAR", phase: "notary_mortgage", lane: "partenaires", external: true },
  { code: "CRD-11", label: "Mise en place du prêt", process: "CRD", phase: "notary_mortgage", lane: "siege", external: false },
  { code: "CRD-12", label: "Déblocages sur inspection de chantier", process: "CRD", phase: "disbursements", lane: "siege", external: false },
  { code: "CRD-13", label: "Décaissement et comptabilisation (CARTHAGO)", process: "CRD", phase: "disbursements", lane: "support", external: false },
];

export type RecoveryStep = {
  code: string;
  label: string;
  phase: CreditPhase | null;
  lane: "client" | "agence" | "siege" | "partenaires" | "support";
  external: boolean;
};

/** Circuit de recouvrement (figure 8). */
export const RECOVERY_PROCESS_STEPS: ReadonlyArray<RecoveryStep> = [
  { code: "REC-01", label: "Tombée d'échéance", phase: null, lane: "agence", external: false },
  { code: "REC-12", label: "Prélèvement automatique et avis à tiers détenteur", phase: null, lane: "partenaires", external: true },
  { code: "REC-02", label: "Relances amiables (moins de 3 mois)", phase: null, lane: "agence", external: false },
  { code: "REC-08", label: "Relances amiables (moins de 3 mois)", phase: null, lane: "agence", external: false },
  { code: "REC-03", label: "Impayés de 3 à 6 mois, restructuration éventuelle", phase: null, lane: "agence", external: false },
  { code: "CRD-05", label: "Restructuration de la créance", phase: null, lane: "siege", external: false },
  { code: "REC-04", label: "Mise en contentieux", phase: null, lane: "siege", external: false },
  { code: "REC-05", label: "Déclaration à la Centrale des risques (BEAC)", phase: null, lane: "partenaires", external: true },
  { code: "GAR-06", label: "Mise en jeu des garanties, saisie immobilière", phase: "closing_release", lane: "partenaires", external: true },
  { code: "REC-06", label: "Saisie immobilière", phase: "closing_release", lane: "partenaires", external: true },
  { code: "REC-07", label: "Suivi du dossier contentieux", phase: null, lane: "siege", external: false },
  { code: "REC-09", label: "Échéance réglée", phase: "closing_release", lane: "client", external: false },
  { code: "REC-10", label: "Remboursement anticipé", phase: "closing_release", lane: "client", external: false },
  { code: "GAR-05", label: "Mainlevée en fin de prêt", phase: "closing_release", lane: "partenaires", external: true },
];

export type SavingsStep = {
  code: string;
  label: string;
  lane: "client" | "agence" | "siege" | "partenaires" | "support";
  external: boolean;
};

/** Circuit de l'épargne-logement (figure 9). */
export const SAVINGS_PROCESS_STEPS: ReadonlyArray<SavingsStep> = [
  { code: "ACC-02", label: "Information et prospection", lane: "siege", external: false },
  { code: "ACC-03", label: "Information et prospection", lane: "siege", external: false },
  { code: "CLT-04", label: "Entrée en relation et ouverture du compte épargne-logement (carnet A ou B)", lane: "agence", external: false },
  { code: "CPT-02", label: "Ouverture du compte épargne-logement", lane: "agence", external: false },
  { code: "OPE-01", label: "Versements initiaux", lane: "client", external: false },
  { code: "CAI", label: "Versements périodiques", lane: "client", external: false },
  { code: "OPE-02", label: "Rémunération et droits acquis (période ≥ 1 an)", lane: "support", external: false },
  { code: "CPT-09", label: "Option de fin de période contractuelle", lane: "siege", external: false },
  { code: "CPT-08", label: "Clôture ou prorogation du compte", lane: "agence", external: false },
];

export type ProcessRupture = {
  code: string;
  label: string;
  /** Levier d'amélioration retenu par la mission. */
  lever: string;
};

/**
 * Points de rupture documentés par les diagrammes en couloirs.
 *
 * Ce ne sont pas des commentaires : ce sont les **irritants** que la
 * réingénierie doit traiter, et à qui l'orientation cible est imputée.
 */
export const PROCESS_RUPTURES: ReadonlyArray<ProcessRupture> = [
  { code: "CRD-R1", label: "Support papier et ressaisies", lever: "Capture à la source, dossier client numérique de référence" },
  { code: "CRD-R2", label: "Dépendance aux bureaux d'études", lever: "Dossier technique numérisé et suivi des inspections de chantier" },
  { code: "CRD-R3", label: "Navettes agence–siège", lever: "Workflow unique et traçable" },
  { code: "CRD-R4", label: "Niveaux de validation multiples", lever: "Délégations clarifiées" },
  { code: "CRD-R5", label: "Délais externes (titre foncier, hypothèque)", lever: "Engagements de délai (SLA) internes et externes" },
  { code: "CRD-R6", label: "Inspections de chantier non outillées", lever: "Géolocalisation des biens, déblocages sur inspection outillée" },
  { code: "REC-R1", label: "Faible coopération des banques domiciliataires (prélèvements, ATD) et absence de domiciliation des revenus au CFC", lever: "Domiciliation des revenus, alerte précoce" },
  { code: "REC-R2", label: "Restructurations tardives, faute d'alerte précoce", lever: "Segmentation des impayés, restructuration proactive" },
  { code: "REC-R3", label: "Litiges fonciers et procédures judiciaires longues", lever: "Pilotage des contentieux" },
  { code: "REC-R4", label: "Suivi des contentieux peu outillé, données historiques incomplètes", lever: "Tableau de bord du portefeuille" },
  { code: "CPT-R1", label: "Produit peu connu (7,2 % des personnes interrogées)", lever: "Offre simple et segmentée" },
  { code: "CPT-R2", label: "Distribution limitée aux agences des chefs-lieux de région", lever: "Souscription et versements à distance" },
  { code: "CPT-R3", label: "Pas de collecte à distance (mobile money, diaspora)", lever: "Versements par mobile money et partenaires" },
  { code: "CPT-R4", label: "Cadre réglementaire du PEL inchangé depuis 1987", lever: "Révision du cadre réglementaire" },
];

export function processByCode(code: ProcessCode): ProcessDefinition | undefined {
  return PROCESSES.find((process) => process.code === code);
}

/**
 * Étapes qui jalonnent une phase du circuit de crédit.
 *
 * Une phase n'appartient pas à un seul processus : la phase de clôture tire
 * ses étapes du recouvrement (REC-09, REC-10) et des garanties (GAR-05), pas
 * du crédit lui-même.
 */
export function stepsForPhase(phase: CreditPhase): ProcessStep[] {
  const credit = CREDIT_PROCESS_STEPS.filter((step) => step.phase === phase);
  const recovery = RECOVERY_PROCESS_STEPS.filter((step) => step.phase === phase);
  return [...credit, ...recovery] as ProcessStep[];
}

export function stepByCode(code: string): ProcessStep | undefined {
  return CREDIT_PROCESS_STEPS.find((step) => step.code === code);
}

export const PROCESS_PHASE_LABELS: Record<CreditPhase, string> = {
  kyc_savings: "Instruction et constitution de l'épargne",
  risk_bet: "Évaluation technique et contre-expertise BET",
  committees: "Décision d'octroi",
  notary_mortgage: "Constitution des garanties et mise en place",
  disbursements: "Déblocages sur inspection de chantier",
  closing_release: "Extinction de dette et mainlevée",
};

/**
 * Événement du journal de dossier, tel que l'emprunteur le consulte.
 *
 * `public.dossier_events` est la chronologie : la même trace que l'agent
 * lit, sans interprétation.
 */
export type DossierEvent = {
  id: string;
  event_type: string;
  actor_role: string | null;
  payload: Record<string, unknown>;
  legal_basis: string | null;
  occurred_at: string;
};

/**
 * Libellés lisibles des événements du journal.
 *
 * C'est le **vocabulaire unique** des faits métier : la chronologie de
 * l'emprunteur et le titre de la notification reprennent le même libellé, pour
 * qu'un événement ne s'appelle pas autrement selon l'écran où il apparaît.
 */
export const DOSSIER_EVENT_LABELS: Record<string, string> = {
  "document.uploaded": "Pièce déposée",
  "document.validated": "Pièce validée",
  "document.rejected": "Pièce rejetée",
  "kyc.state_changed": "Décision KYC",
  KYC_SUBMITTED: "Dossier KYC transmis",
  KYC_APPROVED: "Décision KYC approuvée",
  KYC_REJECTED: "Décision KYC refusée",
  DOCUMENT_REQUESTED: "Pièce justificative demandée",
  DOCUMENT_UPLOADED: "Pièce déposée au dossier",
  DOCUMENT_VALIDATED: "Pièce validée",
  COMMITTEE_DECISION: "Décision du comité de crédit",
  LOAN_OFFER_ISSUED: "Offre de prêt émise",
  DISBURSEMENT_RELEASED: "Déblocage effectué",
  PAYOFF_STATEMENT: "Décompte d'apurement émis",
  MAINLEVEE_READY: "Mainlevée prête",
  DOSSIER_UPDATED: "Dossier mis à jour",
  "dossier.phase_changed": "Étape du dossier franchie",
  "committee.decision": "Décision du comité de crédit",
  "loan_offer.issued": "Offre de prêt émise",
  "disbursement.released": "Déblocage effectué",
  "payoff.statement": "Décompte d'apurement émis",
  "mainlevee.ready": "Mainlevée prête",
  "support.message": "Message échangé",
};

/** Libellé lisible d'un événement du journal. */
export function eventLabel(eventType: string): string {
  return DOSSIER_EVENT_LABELS[eventType] ?? eventType.replace(/[._]/g, " ");
}

/**
 * Les rôles du journal, en langage lisible.
 *
 * Pour l'emprunteur, « qui » est un **rôle** : un nom de personne n'a pas
 * à quitter la banque. C'est un usage interne du dossier ; la console, elle,
 * peut afficher l'agent.
 */
export const ACTOR_ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Emprunteur",
  GUICHET: "Agence",
  GESTIONNAIRE: "Gestionnaire",
  RISQUES_BET: "Risques & BET",
  NOTAIRE: "Notaire",
  COMITE: "Comité de crédit",
  DIASPORA: "Guichet diaspora",
  ADMIN: "Administration",
  SERVICE: "Service interne",
  SYSTEM: "Plateforme",
};

/** Le libellé lisible d'un rôle ; « Acteur » quand le rôle est inconnu ou absent. */
export function actorRoleLabel(role: string | null): string {
  if (!role) return "Acteur";
  return ACTOR_ROLE_LABELS[role] ?? "Acteur";
}

/** Libellé d'une phase du circuit de crédit. */
export function phaseLabel(phase: string | null): string {
  if (!phase) return "—";
  return PROCESS_PHASE_LABELS[phase as CreditPhase] ?? phase;
}
