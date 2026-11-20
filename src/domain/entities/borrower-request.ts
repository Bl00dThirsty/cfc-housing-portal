export type BorrowerRequestState =
  | "kyc"
  | "service"
  | "documents"
  | "suspension"
  | "en_examen"
  | "active"
  | "closed";

const STATE_LABELS: Readonly<Record<BorrowerRequestState, string>> = {
  kyc: "Informations à compléter",
  service: "Choix du service",
  documents: "Pièces à fournir",
  suspension: "En attente d’orientation",
  en_examen: "En cours d’examen",
  active: "Dossier actif",
  closed: "Demande clôturée",
};

export function canWithdrawBorrowerRequest(
  state: string | null,
  dossierStatus: string | null = null,
): boolean {
  if (dossierStatus === "closed") return false;
  return state === "kyc" || state === "service" || state === "documents";
}

export function borrowerRequestStatusLabel(
  state: string | null,
  dossierStatus: string | null = null,
): string {
  if (dossierStatus === "closed") return "Demande clôturée";
  if (!state) return "État indisponible";
  return state in STATE_LABELS
    ? STATE_LABELS[state as BorrowerRequestState]
    : state;
}

export type BorrowerAgencyOption = {
  id: string;
  code: string;
  region: string | null;
  isDiasporaDesk: boolean;
};

export function normalizeRoutingRegion(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  const normalized = value
    .split("(", 1)[0]
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/\s+/g, " ");

  return normalized || null;
}

export function selectAgencyForBorrower(input: {
  agencies: readonly BorrowerAgencyOption[];
  borrowerRegion: string | null;
  isDiaspora: boolean;
  routableRegions: readonly string[];
}): BorrowerAgencyOption | null {
  const routable = new Set(
    input.routableRegions
      .map(normalizeRoutingRegion)
      .filter((region): region is string => region !== null),
  );

  const borrowerRegion = normalizeRoutingRegion(input.borrowerRegion);
  const candidates = input.agencies.filter((agency) => {
    const region = normalizeRoutingRegion(agency.region);
    if (!region || !routable.has(region)) return false;
    if (input.isDiaspora) return agency.isDiasporaDesk;
    return !agency.isDiasporaDesk && region === borrowerRegion;
  });

  return [...candidates].sort((left, right) =>
    left.code.localeCompare(right.code, "fr", { sensitivity: "base" }),
  )[0] ?? null;
}

export type BorrowerRequestCardModel = {
  id: string;
  ducCode: string;
  serviceLabel: string | null;
  state: string | null;
  dossierStatus: string | null;
  statusLabel: string;
  completionPercent: number | null;
  createdAt: string;
  updatedAt: string;
  canWithdraw: boolean;
};

export type BorrowerRequestsResult =
  | { ok: true; requests: BorrowerRequestCardModel[] }
  | { ok: false; error: string };

export type BorrowerRequestRow = {
  id: string;
  duc_code: string;
  service_code: string | null;
  status: string | null;
  onboarding_state: string | null;
  completion_percent: number | null;
  created_at: string;
  updated_at: string;
};

export function borrowerRequestCardModel(input: {
  id: string;
  ducCode: string;
  serviceLabel: string | null;
  state: string | null;
  dossierStatus: string | null;
  completionPercent: number | null;
  createdAt: string;
  updatedAt: string;
}): BorrowerRequestCardModel {
  return {
    ...input,
    statusLabel: borrowerRequestStatusLabel(input.state, input.dossierStatus),
    canWithdraw: canWithdrawBorrowerRequest(input.state, input.dossierStatus),
  };
}

export function mapBorrowerRequestRows(
  rows: readonly BorrowerRequestRow[],
  serviceLabels: ReadonlyMap<string, string>,
): BorrowerRequestCardModel[] {
  return rows.map((row) =>
    borrowerRequestCardModel({
      id: row.id,
      ducCode: row.duc_code,
      serviceLabel: row.service_code ? serviceLabels.get(row.service_code) ?? null : null,
      state: row.onboarding_state,
      dossierStatus: row.status,
      completionPercent:
        row.completion_percent === null ? null : Number(row.completion_percent),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );
}
