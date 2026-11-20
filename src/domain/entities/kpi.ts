/**
 * Les indicateurs des pôles CFC.
 *
 * Un indicateur est une **définition** — un titre, une unité, une direction —
 * et une **mesure**. La définition appartient au domaine : elle dit ce que
 * l'agent doit pouvoir surveiller. La mesure appartient à la couche serveur :
 * elle compte.
 *
 * Le nombre affiché n'est jamais écrit à la main : il vient de la base, dans
 * le périmètre de l'agent qui le consulte. Un indicateur qui ne sait pas se
 * mesurer n'est pas un indicateur — il n'est pas déclaré ici.
 */

import type { PoleCode } from "@/domain/policies/capabilities";

/** Format d'affichage d'une mesure. */
export type KpiFormat = "count" | "percent" | "currency";

/**
 * Nature d'une mesure.
 *
 * - `stock` — l'état à l'instant présent (un dossier ouvert, un stock de
 *   pièces). On le compare au même instant, au début de la période.
 * - `flow` — ce qui s'est produit sur la période (un dossier activé, un
 *   comité délibéré). On le compare à la période précédente.
 */
export type KpiKind = "stock" | "flow";

/** Identifiants des indicateurs mesurés par la plateforme. */
export const KPI_IDS = [
  "dossiers_open",
  "dossiers_pending",
  "dossiers_activated",
  "activation_rate",
  "kyc_to_validate",
  "savings_collected",
  "documents_pending",
  "documents_validated",
  "dossiers_in_expertise",
  "risk_rated",
  "committee_deliberations",
  "committee_approval_rate",
  "loan_offers",
  "notary_instruments",
  "land_titles",
  "oppositions",
  "diaspora_files",
  "diaspora_activated",
  "emails_sent",
  "notifications_sent",
] as const;

export type KpiId = (typeof KPI_IDS)[number];

/** Définition d'un indicateur. */
export interface KpiDefinition {
  id: KpiId;
  /** Titre affiché sur la pastille. */
  title: string;
  /** Ce que l'indicateur mesure, en une phrase. */
  description: string;
  format: KpiFormat;
  kind: KpiKind;
  /** Une hausse est-elle une bonne nouvelle ? */
  higherIsBetter: boolean;
}

const SUPPORT_STAFF_KPIS: readonly KpiDefinition[] = [
  {
    id: "dossiers_open",
    title: "Dossiers visibles",
    description: "Dossiers accessibles dans le périmètre défini par les habilitations.",
    format: "count",
    kind: "stock",
    higherIsBetter: true,
  },
  {
    id: "documents_pending",
    title: "Pièces en cours de contrôle",
    description: "Pièces en attente de contrôle dans le périmètre accessible.",
    format: "count",
    kind: "stock",
    higherIsBetter: false,
  },
];

/**
 * Les indicateurs de chaque pôle.
 *
 * Le pôle est l'organisation qui porte l'indicateur : l'agent du guichet
 * surveille l'enrôlement, l'analyste risques surveille l'expertise, le
 * comité surveille l'arbitrage. Les indicateurs communs — dossiers ouverts,
 * dossiers activés — sont repris partout, avec le même sens.
 */
export const POLE_KPIS: Record<PoleCode, readonly KpiDefinition[]> = {
  G1: [
    {
      id: "dossiers_open",
      title: "Dossiers ouverts",
      description: "Dossiers ouverts sur le pôle, tous stades confondus.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
    {
      id: "dossiers_pending",
      title: "Dossiers à orienter",
      description: "Dossiers en attente d'une décision de l'agent.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
    {
      id: "kyc_to_validate",
      title: "Dossiers KYC à contrôler",
      description: "Emprunteurs dont l'identité n'a pas encore été statuée.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
    {
      id: "savings_collected",
      title: "Épargne mobilisée",
      description: "Épargne constituée sur les dossiers du pôle.",
      format: "currency",
      kind: "stock",
      higherIsBetter: true,
    },
  ],

  G2: [
    {
      id: "dossiers_open",
      title: "Dossiers ouverts",
      description: "Dossiers du portefeuille de l'agent.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
    {
      id: "dossiers_pending",
      title: "Dossiers à orienter",
      description: "Dossiers en attente d'une décision.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
    {
      id: "dossiers_activated",
      title: "Dossiers activés",
      description: "Dossiers dont le DUC a été activé.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "documents_pending",
      title: "Pièces à vérifier",
      description: "Pièces déposées qui attendent la décision de l'agent.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
  ],

  G3: [
    {
      id: "dossiers_in_expertise",
      title: "Dossiers en expertise",
      description: "Dossiers confiés à la contre-expertise technique.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
    {
      id: "risk_rated",
      title: "Dossiers évalués",
      description: "Emprunteurs dont le risque a été coté.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
    {
      id: "documents_pending",
      title: "Pièces à vérifier",
      description: "Pièces déposées qui attendent la décision de l'agent.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
    {
      id: "dossiers_open",
      title: "Dossiers ouverts",
      description: "Dossiers ouverts sur le pôle.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
  ],

  G6: [
    {
      id: "committee_deliberations",
      title: "Dossiers délibérés",
      description: "Dossiers portés devant un comité de crédit.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "committee_approval_rate",
      title: "Taux d'accord",
      description: "Part des décisions de comité favorables.",
      format: "percent",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "loan_offers",
      title: "Offres de prêt",
      description: "Offres de prêt émises.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "dossiers_open",
      title: "Dossiers ouverts",
      description: "Dossiers ouverts sur le pôle.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
  ],

  G8: [
    {
      id: "notary_instruments",
      title: "Actes enregistrés",
      description: "Actes notariés enregistrés au dossier.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "land_titles",
      title: "Titres fonciers",
      description: "Titres fonciers-Etudes des garanties constituées.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
    {
      id: "oppositions",
      title: "Oppositions",
      description: "Oppositions relevées sur les garanties.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
    {
      id: "dossiers_open",
      title: "Dossiers ouverts",
      description: "Dossiers ouverts sur le pôle.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
  ],

  DIASPORA: [
    {
      id: "diaspora_files",
      title: "Dossiers non-résidents",
      description: "Dossiers instruits par le guichet diaspora.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
    {
      id: "diaspora_activated",
      title: "Dossiers activés",
      description: "Dossiers non-résidents dont le DUC a été activé.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "dossiers_pending",
      title: "Dossiers à orienter",
      description: "Dossiers en attente d'une décision.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
    {
      id: "kyc_to_validate",
      title: "Dossiers KYC à contrôler",
      description: "Emprunteurs non-résident dont l'identité n'a pas été statuée.",
      format: "count",
      kind: "stock",
      higherIsBetter: false,
    },
  ],

  ADMIN: [
    {
      id: "dossiers_open",
      title: "Dossiers ouverts",
      description: "Dossiers ouverts sur l'ensemble de la plateforme.",
      format: "count",
      kind: "stock",
      higherIsBetter: true,
    },
    {
      id: "dossiers_activated",
      title: "Dossiers activés",
      description: "Dossiers dont le DUC a été activé.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "activation_rate",
      title: "Taux d'activation",
      description: "Part des dossiers ouverts dont le DUC a été activé.",
      format: "percent",
      kind: "stock",
      higherIsBetter: true,
    },
    {
      id: "emails_sent",
      title: "Courriels envoyés",
      description: "Messages adressés aux emprunteurs.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
    {
      id: "notifications_sent",
      title: "Signaux in-app",
      description: "Notifications adressées aux acteurs.",
      format: "count",
      kind: "flow",
      higherIsBetter: true,
    },
  ],

  G4: [],
  G7: [],
  DG: SUPPORT_STAFF_KPIS,
  DCM: SUPPORT_STAFF_KPIS,
  DCR: SUPPORT_STAFF_KPIS,
  DRAC: SUPPORT_STAFF_KPIS,
  SDA: SUPPORT_STAFF_KPIS,
  "SDA-AUDIT": SUPPORT_STAFF_KPIS,
};

/** Les indicateurs d'un pôle, dans l'ordre d'affichage. */
export function kpisForPole(pole: PoleCode): readonly KpiDefinition[] {
  return POLE_KPIS[pole] ?? [];
}

/** Formate une mesure selon le format de son indicateur. */
export function formatKpiValue(format: KpiFormat, value: number): string {
  switch (format) {
    case "percent":
      return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value)} %`;
    case "currency":
      return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
    default:
      return new Intl.NumberFormat("fr-FR").format(value);
  }
}

/**
 * L'évolution d'une mesure entre deux périodes.
 *
 * Un indicateur dont la valeur n'a pas bougé n'affiche pas de variation :
 * un « 0,0 % » sur deux périodes identiques n'apprend rien à l'agent.
 */
export function kpiChange(input: {
  current: number;
  previous: number;
  higherIsBetter: boolean;
}): { label: string; isPositive: boolean } {
  const { current, previous, higherIsBetter } = input;

  if (previous === 0) {
    if (current === 0) return { label: "—", isPositive: true };
    return { label: "nouveau", isPositive: higherIsBetter };
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(delta * 10) / 10;

  if (rounded === 0) return { label: "—", isPositive: true };

  const isPositive = rounded > 0 ? higherIsBetter : !higherIsBetter;

  return {
    label: `${rounded > 0 ? "+" : ""}${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 1,
    }).format(rounded)} %`,
    isPositive,
  };
}
