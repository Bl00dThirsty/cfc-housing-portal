import "server-only";

import type { ClientDocument, ClientItem, ClientVisa, SavingsPassbook, SavingsTransaction } from "@/domain/entities/client";
import { referenceView } from "@/server/queries/reference";
import { createServerSupabaseClient } from "@/server/supabase/server";

type Row = Record<string, unknown>;

const DOSSIER_FIELDS = [
  "id", "duc_code", "name", "email", "phone", "region", "city", "agency", "agency_id", "owner_user_id", "is_diaspora",
  "advisor", "profession", "employer", "project_type", "project_cost", "service_code",
  "loan_amount", "savings_target", "savings_current", "savings_percent", "monthly_income",
  "monthly_payment", "debt_ratio", "land_title", "duration_years", "rate", "account_number",
  "notary_assigned", "bet_assigned", "officer", "current_phase", "status",
  "completion_percent", "updated_at",
].join(", ");

function record(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
}

function records(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function value(row: Row, key: string, fallback = ""): string {
  const item = row[key];
  return item === null || item === undefined || item === "" ? fallback : String(item);
}

function amount(input: unknown): number | null {
  if (input === null || input === undefined || input === "") return null;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(input: unknown, suffix = " FCFA"): string {
  const parsed = amount(input);
  return parsed === null ? "—" : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(parsed)}${suffix}`;
}

function formatDate(input: unknown): string {
  if (typeof input !== "string" || !input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  open: "Ouvert",
  under_review: "En instruction",
  approved: "Approuvé",
  rejected: "Rejeté",
  closed: "Clôturé",
  suspended: "Suspendu",
};

const DOCUMENT_STATUS: Record<string, string> = {
  awaiting_upload: "En attente",
  uploaded: "Téléversé",
  under_review: "En cours",
  validated: "Validé",
  rejected: "Rejeté",
  expired: "Expiré",
};

const SAVINGS_STATUS: Record<string, string> = {
  active: "Actif",
  objective_reached: "Objectif atteint",
  suspended: "Suspendu",
  closed: "Clôturé",
};

const TRANSACTION_TYPE: Record<string, string> = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  interest: "Intérêts",
  fee: "Frais",
  adjustment: "Ajustement",
};

const CHANNEL: Record<string, string> = {
  agency: "Guichet CFC",
  mobile_money_mtn: "Mobile Money MTN",
  mobile_money_orange: "Mobile Money Orange",
  bank_transfer: "Virement bancaire",
  systac: "SYSTAC",
  employer_debit: "Prélèvement employeur",
  swift_transfer: "Virement SWIFT",
  cash: "Espèces",
};

const EVENT_LABELS: Record<string, string> = {
  KYC_SUBMITTED: "KYC soumis",
  KYC_APPROVED: "KYC validé",
  KYC_REJECTED: "KYC rejeté",
  DOCUMENT_UPLOADED: "Pièce téléversée",
  DOCUMENT_REQUESTED: "Pièce demandée",
  DOSSIER_UPDATED: "Dossier mis à jour",
};

function mapDocument(row: Row): ClientDocument {
  const documentType = record(row.document_type);
  const documentNature = record(documentType.document_nature);
  return {
    id: value(row, "id"),
    name: value(row, "label", value(documentType, "label", value(row, "original_filename", value(row, "doc_type_code")))),
    category: value(row, "nature_label", value(documentNature, "label", "—")),
    status: DOCUMENT_STATUS[value(row, "status")] ?? value(row, "status", "—"),
    date: formatDate(row.uploaded_at),
    ref: value(row, "doc_type_code"),
    fileSize: formatBytes(amount(row.size_bytes)),
    fileName: value(row, "original_filename") || undefined,
    mimeType: value(row, "mime_type") || undefined,
  };
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

function mapVisa(row: Row): ClientVisa {
  const eventType = value(row, "event_type");
  const payload = record(row.payload);
  const decision = eventType.endsWith("APPROVED") ? "Favorable" : eventType.endsWith("REJECTED") ? "Réserves" : "En attente";
  return {
    stage: EVENT_LABELS[eventType] ?? eventType,
    actor: value(row, "actor_role", "—"),
    decision,
    date: formatDate(row.occurred_at),
    comment: value(payload, "note", value(payload, "reason", "—")),
  };
}

function mapTransaction(row: Row, reversalsByOriginal: Map<string, Row>, referenceById: Map<string, string>): SavingsTransaction {
  const state = value(row, "decision_state", row.validated_at ? "validated" : "pending");
  const reversalOfId = value(row, "reversal_of");
  const reversalOfReference = reversalOfId ? referenceById.get(reversalOfId) : undefined;
  const reversedBy = reversalsByOriginal.get(value(row, "id"));
  const reversedById = reversedBy ? value(reversedBy, "id") : undefined;
  return {
    id: value(row, "id"),
    date: formatDate(row.transaction_date),
    amount: amount(row.amount) ?? 0,
    type: TRANSACTION_TYPE[value(row, "transaction_type")] ?? value(row, "transaction_type"),
    status: state === "validated" || state === "rejected" ? state : "pending",
    statusNote: value(row, "decision_note") || undefined,
    description: value(row, "description", value(row, "reference", value(row, "receipt_ref", "—"))),
    channel: CHANNEL[value(row, "channel")] ?? value(row, "channel"),
    reference: value(row, "reference", "—"),
    debit: amount(row.debit),
    credit: amount(row.credit),
    balance: amount(row.balance_after) ?? 0,
    receiptRef: value(row, "receipt_ref") || undefined,
    validatedBy: value(row, "validated_by") || undefined,
    reversalOfId: reversalOfId || undefined,
    reversalOfReference,
    reversedById,
    reversedByReference: reversedBy ? value(reversedBy, "reference") : undefined,
  };
}

function mapPassbook(account: Row, transactions: Row[]): SavingsPassbook {
  const reversalsByOriginal = new Map<string, Row>();
  const referenceById = new Map<string, string>();
  for (const transaction of transactions) {
    referenceById.set(value(transaction, "id"), value(transaction, "reference"));
    const originalId = value(transaction, "reversal_of");
    if (originalId) reversalsByOriginal.set(originalId, transaction);
  }
  return {
    accountId: value(account, "id"),
    accountNumber: value(account, "account_number", "—"),
    openDate: formatDate(account.opening_date),
    savingsTarget: amount(account.target_amount),
    currentBalance: amount(account.balance) ?? 0,
    interestRate: amount(account.interest_rate) === null ? "—" : `${amount(account.interest_rate)}%`,
    status: SAVINGS_STATUS[value(account, "status")] ?? value(account, "status"),
    transactions: transactions.map((transaction) => mapTransaction(transaction, reversalsByOriginal, referenceById)),
  };
}

/** Convert only persisted dossier records and their visible related rows. */
export function mapStaffDossier(
  dossierInput: Row,
  phaseLabels: ReadonlyMap<string, string> = new Map(),
): ClientItem {
  const dossier = record(dossierInput);
  const accounts = records(dossier.savings_accounts);
  const primaryAccount = accounts[0];
  const accountBalance = primaryAccount ? amount(primaryAccount.balance) : null;
  const currentSavings = accountBalance ?? amount(dossier.savings_current);
  const targetSavings = amount(primaryAccount?.target_amount) ?? amount(dossier.savings_target);
  const events = records(dossier.dossier_events).sort((left, right) =>
    String(right.occurred_at ?? "").localeCompare(String(left.occurred_at ?? "")),
  );
  const transactions = primaryAccount ? records(primaryAccount.savings_transactions) : [];
  const phaseCode = value(dossier, "current_phase", "—");
  const statusCode = value(dossier, "status", "—");
  const region = value(dossier, "agency_region", value(dossier, "region", "—"));
  const city = value(dossier, "agency_city", value(dossier, "city", ""));

  return {
    id: value(dossier, "id"),
    ownerUserId: value(dossier, "owner_user_id") || null,
    isDiaspora: dossier.is_diaspora === true,
    ducId: value(dossier, "duc_code", "—"),
    name: value(dossier, "name", "—"),
    avatarTone: "bg-muted text-muted-foreground",
    email: value(dossier, "email", "—"),
    phone: value(dossier, "phone", "—"),
    region,
    agency: value(dossier, "agency", city ? `${city} · ${region}` : region),
    profession: value(dossier, "profession", "—"),
    employer: value(dossier, "employer", "—"),
    projectType: value(dossier, "project_type", value(dossier, "service_code", "—")),
    loanAmount: formatMoney(dossier.loan_amount),
    savingsTarget: formatMoney(targetSavings),
    savingsCurrent: formatMoney(currentSavings),
    savingsPercent: amount(dossier.savings_percent) ?? (
      currentSavings !== null && targetSavings ? Math.round((currentSavings / targetSavings) * 100) : 0
    ),
    monthlyIncome: formatMoney(dossier.monthly_income),
    monthlyPayment: formatMoney(dossier.monthly_payment, " FCFA / mois"),
    debtRatio: amount(dossier.debt_ratio) === null ? "—" : `${amount(dossier.debt_ratio)}%`,
    landTitle: value(dossier, "land_title", "—"),
    durationYears: amount(dossier.duration_years) ?? 0,
    rate: amount(dossier.rate) === null ? "—" : `${amount(dossier.rate)}%`,
    accountNumber: value(primaryAccount ?? dossier, "account_number", "—"),
    notaryAssigned: value(dossier, "notary_assigned", "—"),
    betAssigned: value(dossier, "bet_assigned", "—"),
    officer: value(dossier, "advisor", value(dossier, "officer", "—")),
    phaseCode: phaseCode === "—" ? null : phaseCode,
    phase: phaseLabels.get(phaseCode) ?? phaseCode,
    status: STATUS_LABELS[statusCode] ?? statusCode,
    lastActivity: formatDate(dossier.updated_at),
    completionPercent: amount(dossier.completion_percent) ?? 0,
    documents: records(dossier.dossier_documents).map(mapDocument),
    visas: events.map(mapVisa),
    savingsPassbook: primaryAccount ? mapPassbook(primaryAccount, transactions) : undefined,
  };
}

export type StaffDossiersResult = {
  ok: true;
  dossiers: ClientItem[];
} | {
  ok: false;
  error: string;
};

/** Read the current staff user's authorized dossier scope through RLS. */
export async function getStaffDossiers(dossierId?: string): Promise<StaffDossiersResult> {
  const supabase = await createServerSupabaseClient();
  let dossierQuery = supabase
    .from("dossiers")
    .select(DOSSIER_FIELDS, { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (dossierId) dossierQuery = dossierQuery.eq("id", dossierId);

  const { data, error, count } = await dossierQuery;
  if (error) {
    const accessError = error.code === "42501" || error.code === "PGRST301";
    return {
      ok: false,
      error: accessError
        ? "Vous n’avez pas l’autorisation de consulter ces dossiers."
        : "Le portefeuille ne peut pas être chargé pour le moment.",
    };
  }

  const dossierRows = (data ?? []) as unknown as Row[];
  if (count !== null && count > dossierRows.length) {
    return { ok: false, error: "Le portefeuille dépasse la limite de lecture. Affinez-le par agence ou demandez une pagination." };
  }
  if (dossierRows.length === 0) return { ok: true, dossiers: [] };

  const { data: phaseRows, error: phaseError } = await supabase
    .from(referenceView("process_phase"))
    .select("code, label");
  if (phaseError) return { ok: false, error: "Le catalogue des étapes du dossier est indisponible." };
  const phaseLabels = new Map(((phaseRows ?? []) as unknown as Row[]).map((row) => [
    String(row.code),
    String(row.label),
  ]));

  const dossierIds = dossierRows.map((row) => String(row.id));
  const [documentsResult, eventsResult, accountsResult] = await Promise.all([
    supabase.from("dossier_documents")
      .select("id, dossier_id, doc_type_code, original_filename, mime_type, status, storage_path, size_bytes, uploaded_at")
      .in("dossier_id", dossierIds)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false }),
    supabase.from("dossier_events")
      .select("id, dossier_id, event_type, actor_role, occurred_at, payload")
      .in("dossier_id", dossierIds)
      .order("occurred_at", { ascending: false }),
    supabase.from("savings_accounts")
      .select("id, dossier_id, account_number, opening_date, balance, target_amount, interest_rate, status")
      .in("dossier_id", dossierIds)
      .is("deleted_at", null)
      .order("opening_date", { ascending: true }),
  ]);
  const relatedError = documentsResult.error ?? eventsResult.error ?? accountsResult.error;
  if (relatedError) {
    return { ok: false, error: "Les documents, l’historique ou les comptes d’épargne sont indisponibles." };
  }

  const documentRows = (documentsResult.data ?? []) as unknown as Row[];
  const documentCodes = [...new Set(documentRows.map((row) => String(row.doc_type_code)).filter(Boolean))];
  let documentTypes = new Map<string, { label: string; natureCode: string }>();
  if (documentCodes.length > 0) {
    const { data: typeRows, error: typeError } = await supabase.schema("ref")
      .from("document_type")
      .select("code, label, nature_code")
      .in("code", documentCodes);
    if (typeError) return { ok: false, error: "Le catalogue documentaire est indisponible." };
    documentTypes = new Map(((typeRows ?? []) as unknown as Row[]).map((row) => [
      String(row.code), { label: String(row.label), natureCode: String(row.nature_code) },
    ]));
  }

  const natureCodes = [...new Set([...documentTypes.values()].map((item) => item.natureCode))];
  let natureLabels = new Map<string, string>();
  if (natureCodes.length > 0) {
    const { data: natureRows, error: natureError } = await supabase.schema("ref")
      .from("document_nature")
      .select("code, label")
      .in("code", natureCodes);
    if (natureError) return { ok: false, error: "Le catalogue des catégories documentaires est indisponible." };
    natureLabels = new Map(((natureRows ?? []) as unknown as Row[]).map((row) => [String(row.code), String(row.label)]));
  }

  const accountRows = (accountsResult.data ?? []) as unknown as Row[];
  const accountIds = accountRows.map((row) => String(row.id));
  let transactionRows: Row[] = [];
  if (accountIds.length > 0) {
    const { data: transactions, error: transactionsError } = await supabase.from("savings_transactions")
      .select("id, account_id, transaction_type, amount, debit, credit, balance_after, channel, reference, description, decision_state, decision_note, receipt_ref, transaction_date, validated_by, validated_at, reversal_of")
      .in("account_id", accountIds)
      .is("deleted_at", null)
      .order("transaction_date", { ascending: false });
    if (transactionsError) return { ok: false, error: "Les opérations du carnet d’épargne sont indisponibles." };
    transactionRows = (transactions ?? []) as unknown as Row[];
  }

  const documentsByDossier = groupBy(documentRows.map((row) => {
    const type = documentTypes.get(String(row.doc_type_code));
    return {
      ...row,
      label: type?.label,
      nature_label: type ? natureLabels.get(type.natureCode) : undefined,
    };
  }), "dossier_id");
  const eventsByDossier = groupBy((eventsResult.data ?? []) as unknown as Row[], "dossier_id");
  const transactionsByAccount = groupBy(transactionRows, "account_id");
  const accountsByDossier = groupBy(accountRows.map((account) => ({
    ...account,
    savings_transactions: transactionsByAccount.get(String(account.id)) ?? [],
  })), "dossier_id");

  return {
    ok: true,
    dossiers: dossierRows.map((row) => mapStaffDossier({
      ...row,
      dossier_documents: documentsByDossier.get(String(row.id)) ?? [],
      dossier_events: eventsByDossier.get(String(row.id)) ?? [],
      savings_accounts: accountsByDossier.get(String(row.id)) ?? [],
    }, phaseLabels)),
  };
}

function groupBy(rows: Row[], key: string): Map<string, Row[]> {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const groupKey = String(row[key] ?? "");
    const current = grouped.get(groupKey) ?? [];
    current.push(row);
    grouped.set(groupKey, current);
  }
  return grouped;
}
