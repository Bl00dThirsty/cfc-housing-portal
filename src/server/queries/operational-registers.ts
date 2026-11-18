import "server-only";

import type {
  OperationalRegisterField,
  OperationalRegisterKey,
  OperationalRegisterRecord,
  OperationalRegisterResult,
} from "@/domain/entities/operational-register";
import { getOperationalDossiers } from "@/server/queries/operational-dossiers";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Row = Record<string, unknown>;

function displayValue(input: unknown): string {
  if (input === null || input === undefined || input === "") return "—";
  if (typeof input === "boolean") return input ? "Oui" : "Non";
  return String(input);
}

function formatDate(input: unknown): string {
  if (typeof input !== "string" || !input) return "—";
  const date = new Date(input);
  return Number.isNaN(date.getTime())
    ? input
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

function formatAmount(input: unknown): string {
  if (input === null || input === undefined || input === "") return "—";
  const amount = Number(input);
  return Number.isFinite(amount)
    ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`
    : String(input);
}

function field(label: string, value: unknown, formatter: (input: unknown) => string = displayValue): OperationalRegisterField {
  return { label, value: formatter(value) };
}

async function readRows(key: OperationalRegisterKey, supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  switch (key) {
    case "mobile-money":
      return supabase.from("savings_transactions")
        .select("id, dossier_id, transaction_type, amount, channel, reference, receipt_ref, decision_state, transaction_date")
        .in("channel", ["mobile_money_mtn", "mobile_money_orange"])
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false });
    case "committee-cgr":
      return supabase.from("committee_deliberations")
        .select("id, dossier_id, committee_code, session_date, status, quorum_met")
        .eq("committee_code", "CGR").is("deleted_at", null).order("session_date", { ascending: false });
    case "committee-crc":
      return supabase.from("committee_deliberations")
        .select("id, dossier_id, committee_code, session_date, status, quorum_met")
        .eq("committee_code", "CRC").is("deleted_at", null).order("session_date", { ascending: false });
    case "committee-board":
      return supabase.from("committee_deliberations")
        .select("id, dossier_id, committee_code, session_date, status, quorum_met")
        .eq("committee_code", "BOARD").is("deleted_at", null).order("session_date", { ascending: false });
    case "committee-all":
      return supabase.from("committee_deliberations")
        .select("id, dossier_id, committee_code, session_date, status, quorum_met")
        .is("deleted_at", null).order("session_date", { ascending: false });
    case "loan-offers":
      return supabase.from("loan_offers")
        .select("id, dossier_id, offer_amount, rate, duration_years, monthly_payment, valid_until, status")
        .is("deleted_at", null).order("created_at", { ascending: false });
    case "notary-instruments":
      return supabase.from("notary_instruments")
        .select("id, dossier_id, instrument_type, notary_number, registration_number, amount_guaranteed, status, deed_date, registration_date")
        .is("deleted_at", null).order("updated_at", { ascending: false });
    case "release-deeds":
      return supabase.from("notary_instruments")
        .select("id, dossier_id, instrument_type, notary_number, registration_number, amount_guaranteed, status, deed_date, registration_date")
        .eq("instrument_type", "release_deed").is("deleted_at", null).order("updated_at", { ascending: false });
    case "archived-instruments":
      return supabase.from("notary_instruments")
        .select("id, dossier_id, instrument_type, notary_number, registration_number, amount_guaranteed, status, deed_date, registration_date, archived_at")
        .not("archived_at", "is", null).is("deleted_at", null).order("archived_at", { ascending: false });
    case "notary-oppositions":
      return supabase.from("oppositions")
        .select("id, dossier_id, nature, amount, raised_at, status, released_at, legal_basis")
        .is("deleted_at", null).order("raised_at", { ascending: false });
    case "notary-insurances":
      return supabase.from("insurances")
        .select("id, dossier_id, policy_number, coverage_type, insured_amount, premium_amount, start_date, end_date, status")
        .is("deleted_at", null).order("end_date", { ascending: true });
    case "land-titles":
      return supabase.from("land_titles")
        .select("id, dossier_id, title_number, land_title_registry, land_title_type, issuing_authority, issue_date, registration_date, area_sqm, mortgage_rank, is_principal_title")
        .is("deleted_at", null).order("updated_at", { ascending: false });
    case "disbursements":
      return supabase.from("disbursements")
        .select("id, dossier_id, tranche_number, amount, release_date, value_available_date, method, payment_reference, status")
        .is("deleted_at", null).order("created_at", { ascending: false });
    case "disbursement-schedules":
      return supabase.from("disbursement_schedules")
        .select("id, dossier_id, due_date, amount, status, paid_at")
        .is("deleted_at", null).order("due_date", { ascending: true });
    case "reconciliation-runs": case "systac-runs":
      return supabase.from("reconciliation_runs")
        .select("id, run_date, channel, records_total, records_matched, records_mismatch, amount_total, discrepancy_amount, status")
        .is("deleted_at", null).order("run_date", { ascending: false });
    case "systac-runs":
      return supabase.from("reconciliation_runs")
        .select("id, run_date, channel, records_total, records_matched, records_mismatch, amount_total, discrepancy_amount, status")
        .eq("channel", "systac").is("deleted_at", null).order("run_date", { ascending: false });
  }
}

function mapRecord(key: OperationalRegisterKey, row: Row, dossierCode: string | null): OperationalRegisterRecord {
  const fields: OperationalRegisterField[] = [];
  const add = (label: string, keyName: string, formatter?: (input: unknown) => string) => {
    fields.push(field(label, row[keyName], formatter));
  };

  switch (key) {
    case "mobile-money":
      add("Opération", "transaction_type"); add("Canal", "channel"); add("Montant", "amount", formatAmount);
      add("Référence", "reference"); add("Quittance", "receipt_ref"); add("Décision", "decision_state");
      break;
    case "committee-cgr": case "committee-crc": case "committee-board": case "committee-all":
      add("Comité", "committee_code"); add("Séance", "session_date", formatDate); add("Quorum atteint", "quorum_met");
      break;
    case "loan-offers":
      add("Montant proposé", "offer_amount", formatAmount); add("Taux annuel", "rate"); add("Durée (ans)", "duration_years");
      add("Mensualité", "monthly_payment", formatAmount); add("Valide jusqu’au", "valid_until", formatDate);
      break;
    case "notary-instruments": case "release-deeds": case "archived-instruments":
      add("Type d’acte", "instrument_type"); add("Référence notariale", "notary_number"); add("Référence d’enregistrement", "registration_number");
      add("Montant garanti", "amount_guaranteed", formatAmount); add("Date de l’acte", "deed_date", formatDate); add("Enregistré le", "registration_date", formatDate);
      if (key === "archived-instruments") add("Archivé le", "archived_at", formatDate);
      break;
    case "notary-oppositions":
      add("Nature", "nature"); add("Montant", "amount", formatAmount); add("Déclarée le", "raised_at", formatDate);
      add("Libérée le", "released_at", formatDate); add("Fondement", "legal_basis");
      break;
    case "notary-insurances":
      add("Police", "policy_number"); add("Couverture", "coverage_type"); add("Capital assuré", "insured_amount", formatAmount);
      add("Prime", "premium_amount", formatAmount); add("Début", "start_date", formatDate); add("Fin", "end_date", formatDate);
      break;
    case "land-titles":
      add("Titre foncier", "title_number"); add("Registre", "land_title_registry"); add("Type", "land_title_type");
      add("Autorité", "issuing_authority"); add("Émis le", "issue_date", formatDate); add("Enregistré le", "registration_date", formatDate);
      add("Superficie (m²)", "area_sqm"); add("Rang hypothécaire", "mortgage_rank"); add("Titre principal", "is_principal_title");
      break;
    case "disbursements":
      add("Tranche", "tranche_number"); add("Montant", "amount", formatAmount); add("Méthode", "method");
      add("Référence de paiement", "payment_reference"); add("Date prévue", "release_date", formatDate); add("Valeur disponible le", "value_available_date", formatDate);
      break;
    case "disbursement-schedules":
      add("Échéance", "due_date", formatDate); add("Montant", "amount", formatAmount); add("Payée le", "paid_at", formatDate);
      break;
    case "reconciliation-runs":
      add("Canal", "channel"); add("Enregistrements", "records_total"); add("Rapprochés", "records_matched");
      add("Écarts", "records_mismatch"); add("Montant", "amount_total", formatAmount); add("Écart FCFA", "discrepancy_amount", formatAmount);
      break;
  }

  const dateValue = row.transaction_date ?? row.session_date ?? row.run_date ?? row.raised_at ?? row.due_date ?? row.end_date ?? row.deed_date ?? row.release_date ?? row.created_at;
  return {
    id: String(row.id ?? ""),
    dossierId: typeof row.dossier_id === "string" ? row.dossier_id : null,
    dossierCode,
    status: displayValue(row.status),
    occurredAt: typeof dateValue === "string" ? dateValue : null,
    fields: fields.filter((item) => item.value !== "—"),
  };
}

/** Read operational registers from their authoritative tables under Supabase RLS. */
export async function getOperationalRegister(key: OperationalRegisterKey): Promise<OperationalRegisterResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await readRows(key, supabase);
  if (error) return { ok: false, error: "Ce registre ne peut pas être chargé dans votre périmètre." };

  const rows = ((data ?? []) as unknown) as Row[];
  const dossierResult = await getOperationalDossiers();
  if (!dossierResult.ok) return { ok: false, error: dossierResult.error };
  const dossierCodes = new Map(dossierResult.dossiers.map((dossier) => [dossier.id, dossier.ducCode]));

  return {
    ok: true,
    records: rows.map((row) => mapRecord(
      key,
      row,
      typeof row.dossier_id === "string" ? dossierCodes.get(row.dossier_id) ?? null : null,
    )),
  };
}

export type SavingsTransactionDetail = {
  id: string;
  dossierId: string | null;
  dossierCode: string | null;
  transactionType: string;
  amount: number;
  debit: number | null;
  credit: number | null;
  balanceAfter: number;
  channel: string;
  reference: string | null;
  receiptReference: string | null;
  decisionState: string;
  decisionNote: string | null;
  transactionDate: string;
};

export type SavingsTransactionResult =
  | { ok: true; transaction: SavingsTransactionDetail }
  | { ok: false; error: string };

/** Read a persisted savings entry without loading the account holder's profile. */
export async function getSavingsTransactionDetail(id: string): Promise<SavingsTransactionResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("savings_transactions")
    .select("id, dossier_id, transaction_type, amount, debit, credit, balance_after, channel, reference, receipt_ref, decision_state, decision_note, transaction_date")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Cette opération n’est pas accessible dans votre périmètre." };

  const row = data as unknown as Row;
  const dossierId = typeof row.dossier_id === "string" ? row.dossier_id : null;
  let dossierCode: string | null = null;
  if (dossierId) {
    const dossierResult = await getOperationalDossiers({ dossierId });
    if (!dossierResult.ok) return { ok: false, error: dossierResult.error };
    dossierCode = dossierResult.dossiers[0]?.ducCode ?? null;
  }

  return {
    ok: true,
    transaction: {
      id: String(row.id),
      dossierId,
      dossierCode,
      transactionType: displayValue(row.transaction_type),
      amount: Number(row.amount ?? 0),
      debit: row.debit === null ? null : Number(row.debit),
      credit: row.credit === null ? null : Number(row.credit),
      balanceAfter: Number(row.balance_after ?? 0),
      channel: displayValue(row.channel),
      reference: typeof row.reference === "string" ? row.reference : null,
      receiptReference: typeof row.receipt_ref === "string" ? row.receipt_ref : null,
      decisionState: displayValue(row.decision_state),
      decisionNote: typeof row.decision_note === "string" ? row.decision_note : null,
      transactionDate: String(row.transaction_date ?? ""),
    },
  };
}
