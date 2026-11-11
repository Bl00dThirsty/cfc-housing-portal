/**
 * Échelle de recouvrement.
 *
 * Source : diagramme en couloirs de la figure 8 (PR-02 — Remboursements,
 * recouvrement et contentieux). L'échelle est celle de l'ancienneté de
 * l'impayé, et non une liste d'actions : une créance change de **phase**,
 * et chaque phase a son obligation propre.
 *
 * Module **pur**.
 */

export type ArrearsStage =
  | "current"
  | "relance_amiable"
  | "restructuring"
  | "contentieux"
  | "central_risks"
  | "mise_en_jeu_garanties"
  | "closed";

export type ArrearsPhase = {
  stage: ArrearsStage;
  label: string;
  /** Ancienneté minimale en mois pour entrer dans la phase (`null` = phase initiale). */
  fromMonth: number | null;
  /** Ancienneté maximale en mois (bornes incluses). */
  toMonth: number | null;
  /** Actions obligatoires du CFC dans cette phase. */
  obligations: string[];
  /** Procédures du manuel mobilisées. */
  procedures: string[];
  /** La phase dépend d'un tiers (banque, BEAC, juridiction, notaire). */
  external: boolean;
  /** Délai de traitement cible, en jours. */
  slaDays: number;
};

export const ARREARS_PHASES: ReadonlyArray<ArrearsPhase> = [
  {
    stage: "current",
    label: "Échéance",
    fromMonth: null,
    toMonth: 0,
    obligations: [
      "Prélèvement automatique sur le compte domiciliataire",
      "Avis à tiers détenteur auprès de l'employeur",
    ],
    procedures: ["REC-01", "REC-12"],
    external: true,
    slaDays: 5,
  },
  {
    stage: "relance_amiable",
    label: "Relances amiables",
    fromMonth: 1,
    toMonth: 2,
    obligations: ["Relance téléphonique", "Relance écrite", "Appel de l'emprunteur"],
    procedures: ["REC-02", "REC-08"],
    external: false,
    slaDays: 15,
  },
  {
    stage: "restructuring",
    label: "Restructuration éventuelle",
    fromMonth: 3,
    toMonth: 6,
    obligations: [
      "Évaluation de la capacité de remboursement résiduelle",
      "Proposition de restructuration ou d'échéancier",
    ],
    procedures: ["REC-03", "CRD-05"],
    external: false,
    slaDays: 30,
  },
  {
    stage: "contentieux",
    label: "Mise en contentieux",
    fromMonth: 7,
    toMonth: null,
    obligations: ["Saisine contentieuse", "Constitution du dossier de contentieux"],
    procedures: ["REC-04"],
    external: true,
    slaDays: 45,
  },
  {
    stage: "central_risks",
    label: "Déclaration à la Centrale des risques",
    fromMonth: 7,
    toMonth: null,
    obligations: ["Déclaration de la créance impayée au registre BEAC"],
    procedures: ["REC-05"],
    external: true,
    slaDays: 15,
  },
  {
    stage: "mise_en_jeu_garanties",
    label: "Mise en jeu des garanties",
    fromMonth: 7,
    toMonth: null,
    obligations: [
      "Saisie immobilière",
      "Mainlevée ou maintien de la garantie",
      "Suivi du dossier contentieux",
    ],
    procedures: ["GAR-06", "REC-06", "REC-07"],
    external: true,
    slaDays: 90,
  },
  {
    stage: "closed",
    label: "Créance soldée",
    fromMonth: null,
    toMonth: null,
    obligations: [
      "Échéance réglée",
      "Remboursement anticipé",
      "Mainlevée en fin de prêt",
    ],
    procedures: ["REC-09", "REC-10", "GAR-05"],
    external: true,
    slaDays: 30,
  },
];

/**
 * Détermine la phase de recouvrement d'un impayé.
 *
 * Le seuil de trois mois est la bascule documentée : en dessous on relance,
 * à partir de trois mois on restructure, au-delà on passe au contentieux.
 */
export function arrearsPhaseFor(monthsOverdue: number): ArrearsPhase {
  if (monthsOverdue <= 0) return phaseByStage("current");
  if (monthsOverdue <= 2) return phaseByStage("relance_amiable");
  if (monthsOverdue <= 6) return phaseByStage("restructuring");
  return phaseByStage("contentieux");
}

export function phaseByStage(stage: ArrearsStage): ArrearsPhase {
  const phase = ARREARS_PHASES.find((item) => item.stage === stage);
  if (!phase) throw new Error(`Phase de recouvrement inconnue : ${stage}`);
  return phase;
}

/** La créance doit-elle être déclarée à la Centrale des risques ? */
export function requiresCentralRisksDeclaration(monthsOverdue: number): boolean {
  return monthsOverdue >= 7;
}

/**
 * La créance peut-elle encore être régularisée par voie amiable ?
 *
 * Au-delà de six mois, la bascule en contentieux est engagée : une
 * restructuration n'est plus proposée d'office.
 */
export function isStillAmenable(monthsOverdue: number): boolean {
  return monthsOverdue > 0 && monthsOverdue <= 6;
}

/**
 * Délai de prévenance avant l'échéance.
 *
 * L'alerte précoce est le point de rupture n°2 du diagnostic (restructurations
 * tardives faute d'alerte). Le délai cible est donc une **règle de gestion**
 * à confirmer par la DRAC.
 */
export const EARLY_ALERT_DAYS_BEFORE_DUE = 15;
