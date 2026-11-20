export type OperationalRegisterKey =
  | "mobile-money"
  | "committee-cgr"
  | "committee-crc"
  | "committee-board"
  | "committee-all"
  | "loan-offers"
  | "notary-instruments"
  | "release-deeds"
  | "notary-oppositions"
  | "notary-insurances"
  | "land-titles"
  | "archived-instruments"
  | "disbursements"
  | "disbursement-schedules"
  | "reconciliation-runs"
  | "systac-runs";

export type OperationalRegisterField = {
  label: string;
  value: string;
};

export type OperationalRegisterRecord = {
  id: string;
  dossierId: string | null;
  dossierCode: string | null;
  status: string;
  occurredAt: string | null;
  fields: OperationalRegisterField[];
};

export type OperationalRegisterResult =
  | { ok: true; records: OperationalRegisterRecord[] }
  | { ok: false; error: string };
