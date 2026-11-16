import { phaseLabel, type DossierEvent } from "@/domain/entities/processes";
import {
  stageLabel,
  type ChecklistItem,
  type ChecklistStatus,
} from "@/domain/entities/services";

/**
 * Tableau de bord de l'emprunteur — modèle de vue.
 *
 * Une seule lecture côté serveur (`getCitizenSpace`) alimente cette
 * transformation : le résultat est un objet **sérialisable**, que la page
 * passe aux graphiques clients. Aucune requête, aucun client Supabase ne
 * franchit la couture.
 *
 * Toute valeur absente reste `null` : l'affichage décide de « — » et d'une
 * note « non renseigné », jamais d'un `NaN` ou d'un `null` imprimé.
 */

/** Ce dont le tableau de bord a besoin — un fragment de l'espace citoyen. */
export type DashboardInput = {
  completionPercent: number | null;
  currentPhase: string | null;
  checklist: ChecklistItem[];
  events: DossierEvent[];
  finance: {
    loanAmount: number | null;
    rate: number | null;
    durationYears: number | null;
    monthlyPayment: number | null;
    savingsTarget: number | null;
    savingsCurrent: number | null;
    savingsPercent: number | null;
  };
};

/** Une carte d'indicateur : libellé, valeur, unité, note. */
export type KpiCard = {
  id: string;
  label: string;
  value: string;
  unit: string;
  note: string | null;
  /** Progression 0-100 pour la barre d'appui, ou `null`. */
  progress: number | null;
};

/** Une étape du dossier et ses pièces obligatoires. */
export type StageProgress = {
  /** Étape (code du référentiel). */
  stage: string;
  /** Étape, libellé français du domaine. */
  label: string;
  /** Pièces obligatoires attendues. */
  required: number;
  /** Pièces obligatoires déjà déposées. */
  provided: number;
};

/** Activité mensuelle du dossier. */
export type MonthlyActivity = {
  /** Clé `AAAA-MM`. */
  key: string;
  /** Libellé court français (« janv. 26 »). */
  label: string;
  count: number;
};

export type DashboardModel = {
  kpis: KpiCard[];
  /** Pièces par état, dans l'ordre de lecture de l'emprunteur. */
  documentStatus: { key: ChecklistStatus; value: number }[];
  stageProgress: StageProgress[];
  monthlyActivity: MonthlyActivity[];
  /** Avancement du dossier, en pourcentage (peut être absent). */
  completionPercent: number | null;
  /** Complétude des pièces, en pourcentage (peut être absente). */
  piecesCompletionPercent: number | null;
};

/** Ordre de lecture des états d'une pièce. */
const STATUS_ORDER: ChecklistStatus[] = [
  "verified",
  "uploaded",
  "in_review",
  "rejected",
  "missing",
];

/** Nombre maximal de mois affichés dans l'activité. */
const ACTIVITY_MONTHS = 12;

/**
 * Construit le modèle du tableau de bord à partir de l'espace citoyen.
 */
export function buildDashboardModel(input: DashboardInput): DashboardModel {
  const checklist = input.checklist;
  const provided = checklist.filter((item) => item.status !== "missing").length;
  const missing = checklist.length - provided;
  const requiredProvided = checklist.filter(
    (item) => item.required && item.status !== "missing",
  ).length;
  const requiredTotal = checklist.filter((item) => item.required).length;

  return {
    kpis: buildKpis(input, {
      total: checklist.length,
      provided,
      missing,
      requiredProvided,
      requiredTotal,
    }),
    documentStatus: buildDocumentStatus(checklist),
    stageProgress: buildStageProgress(checklist),
    monthlyActivity: buildMonthlyActivity(input.events),
    completionPercent: input.completionPercent,
    piecesCompletionPercent:
      checklist.length === 0 ? null : Math.round((provided / checklist.length) * 100),
  };
}

/** Les quatre indicateurs de tête. */
function buildKpis(
  input: DashboardInput,
  pieces: {
    total: number;
    provided: number;
    missing: number;
    requiredProvided: number;
    requiredTotal: number;
  },
): KpiCard[] {
  const { finance } = input;
  const cards: KpiCard[] = [];

  const completion = input.completionPercent;
  cards.push({
    id: "avancement",
    label: "Avancement du dossier",
    value: completion === null ? "—" : String(Math.round(completion)),
    unit: "%",
    note: completion === null ? "Progression non renseignée" : phaseLabel(input.currentPhase),
    progress: completion === null ? null : clampPercent(completion),
  });

  cards.push({
    id: "pieces",
    label: "Complétude des pièces",
    value: pieces.total === 0 ? "—" : `${pieces.provided} / ${pieces.total}`,
    unit: "pièces déposées",
    note:
      pieces.total === 0
        ? "Aucune pièce attendue pour l'instant"
        : pieces.missing === 0
          ? "Toutes les pièces attendues sont déposées"
          : `${pieces.missing} pièce(s) encore à fournir`,
    progress: pieces.total === 0 ? null : Math.round((pieces.provided / pieces.total) * 100),
  });

  const savings = finance.savingsCurrent;
  cards.push({
    id: "epargne",
    label: "Épargne constituée",
    value: savings === null ? "—" : formatAmount(savings),
    unit: "FCFA",
    note:
      savings === null
        ? "Épargne non renseignée"
        : finance.savingsTarget === null
          ? "Objectif d'épargne non renseigné"
          : `sur ${formatAmount(finance.savingsTarget)} FCFA visés`,
    progress:
      savings === null
        ? null
        : clampPercent(
            finance.savingsPercent ??
              (finance.savingsTarget && finance.savingsTarget > 0
                ? (savings / finance.savingsTarget) * 100
                : 0),
          ),
  });

  if (finance.monthlyPayment !== null) {
    cards.push({
      id: "echeance",
      label: "Échéance mensuelle",
      value: formatAmount(finance.monthlyPayment),
      unit: "FCFA",
      note: financingNote(finance),
      progress: null,
    });
  } else if (finance.loanAmount !== null) {
    cards.push({
      id: "pret",
      label: "Montant du prêt",
      value: formatAmount(finance.loanAmount),
      unit: "FCFA",
      note: financingNote(finance),
      progress: null,
    });
  } else {
    cards.push({
      id: "pret",
      label: "Montant du prêt",
      value: "—",
      unit: "FCFA",
      note: "Montant non renseigné",
      progress: null,
    });
  }

  return cards;
}

/** Conditions du prêt, en note de l'indicateur financier. */
function financingNote(finance: DashboardInput["finance"]): string {
  const duration =
    finance.durationYears === null
      ? null
      : `sur ${formatAmount(finance.durationYears)} an(s)`;
  const rate =
    finance.rate === null
      ? null
      : `à ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(finance.rate)} %`;

  if (duration && rate) return `${duration} ${rate}`;
  if (duration) return duration;
  if (rate) return rate;
  return "Conditions non renseignées";
}

/** Répartition des pièces par état. */
function buildDocumentStatus(
  checklist: ChecklistItem[],
): { key: ChecklistStatus; value: number }[] {
  const counts = new Map<ChecklistStatus, number>();
  for (const item of checklist) {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  }
  return STATUS_ORDER.map((key) => ({ key, value: counts.get(key) ?? 0 }));
}

/** Pièces obligatoires, par étape du dossier. */
function buildStageProgress(checklist: ChecklistItem[]): StageProgress[] {
  const byStage = new Map<string, StageProgress>();

  for (const item of checklist) {
    if (!item.required) continue;
    const entry = byStage.get(item.stage) ?? {
      stage: item.stage,
      label: stageLabel(item.stage),
      required: 0,
      provided: 0,
    };
    entry.required += 1;
    if (item.status !== "missing") entry.provided += 1;
    byStage.set(item.stage, entry);
  }

  return [...byStage.values()];
}

/** Événements du dossier, regroupés par mois (les plus anciens d'abord). */
function buildMonthlyActivity(events: DossierEvent[]): MonthlyActivity[] {
  const byMonth = new Map<string, MonthlyActivity>();

  const ordered = [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  for (const event of ordered) {
    const date = new Date(event.occurred_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const entry = byMonth.get(key) ?? {
      key,
      label: date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      count: 0,
    };
    entry.count += 1;
    byMonth.set(key, entry);
  }

  return [...byMonth.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-ACTIVITY_MONTHS);
}

/** Montant à la française, sans décimale. */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

/** Bornes 0-100 : un pourcentage hors bornes n'a pas de barre. */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}
