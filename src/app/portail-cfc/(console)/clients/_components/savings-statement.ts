/**
 * Les sorties du carnet d'épargne — **export CSV** et **relevé imprimable**.
 *
 * Un seul endroit construit ces deux rendus : le tableau affiché, le fichier
 * exporté et la page imprimée racontent la **même** opération. Une divergence
 * entre l'écran et le fichier serait un défaut de traçabilité.
 *
 * Le format CSV est francophone : séparateur point-virgule, décimale virgule,
 * BOM UTF-8 — sans quoi Excel casse les accents et fusionne les colonnes.
 */

import type { SavingsTransaction } from "@/domain/entities/client";

/** Séparateur CSV francophone. */
const SEPARATOR = ";";

/** BOM UTF-8 : sans lui, Excel lit les accents comme des caractères fantômes. */
export const SAVINGS_CSV_BOM = "\uFEFF";

/** Colonnes du relevé, dans l'ordre. */
const HEADERS = [
  "Date",
  "Type",
  "Libellé",
  "Canal",
  "Référence",
  "Montant annoncé",
  "Débit",
  "Crédit",
  "État",
  "Solde",
] as const;

function statusLabel(status: SavingsTransaction["status"]): string {
  if (status === "validated") return "Validée";
  if (status === "rejected") return "Rejetée";
  return "En attente";
}

/** Échappe le texte destined au HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Une cellule CSV : guillemets doublés, séparateur et fin de ligne échappés. */
function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Construit le CSV des opérations.
 *
 * Les montants sont écrits en **nombres bruts** : la colonne reste exploitable
 * par un tableur, qui les recalcule au lieu de lire une chaîne.
 */
export function buildSavingsCsv(transactions: SavingsTransaction[]): string {
  const rows = transactions.map((transaction) =>
    [
      transaction.date,
      transaction.type,
      transaction.description,
      transaction.channel,
      transaction.reference,
      transaction.amount,
      transaction.debit,
      transaction.credit,
      statusLabel(transaction.status),
      transaction.balance,
    ]
      .map(csvCell)
      .join(SEPARATOR),
  );

  return [HEADERS.join(SEPARATOR), ...rows].join("\r\n");
}

/** Nom de fichier du relevé, propre au compte concerné. */
export function savingsStatementFilename(accountNumber: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `releve-epargne-${accountNumber}-${stamp}.csv`;
}

/** Ce que le relevé imprimé dit du compte. */
export interface SavingsStatementInput {
  /** Numéro de compte épargne. */
  accountNumber: string;
  /** Nom du titulaire. */
  clientName: string;
  /** Solde du compte. */
  balance: number;
  /** Opérations, de la plus récente à la plus ancienne. */
  transactions: SavingsTransaction[];
}

/**
 * Construit la page imprimable du relevé.
 *
 * Le document est **autonome** : il porte ses propres styles et n'emprunte
 * rien à l'interface de l'agent, pour que l'impression ne reproduise ni la
 * barre latérale ni la navigation.
 */
export function buildSavingsStatementHtml(input: SavingsStatementInput): string {
  const rows = input.transactions
    .map((transaction) => {
      const debit = transaction.debit === null ? "—" : transaction.debit.toLocaleString("fr-FR");
      const credit = transaction.credit === null ? "—" : transaction.credit.toLocaleString("fr-FR");

      return `<tr>
        <td>${escapeHtml(transaction.date)}</td>
        <td>${escapeHtml(transaction.type)}</td>
        <td>${escapeHtml(transaction.description)}</td>
        <td>${escapeHtml(transaction.channel)}</td>
        <td class="mono">${escapeHtml(transaction.reference)}</td>
        <td class="num">${transaction.amount.toLocaleString("fr-FR")}</td>
        <td class="num debit">${debit}</td>
        <td class="num credit">${credit}</td>
        <td>${statusLabel(transaction.status)}${transaction.statusNote ? ` · ${escapeHtml(transaction.statusNote)}` : ""}</td>
        <td class="num">${transaction.balance.toLocaleString("fr-FR")}</td>
      </tr>`;
    })
    .join("\n");

  const printedAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Relevé d'épargne — ${escapeHtml(input.accountNumber)}</title>
<style>
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #241a12; margin: 24px; }
  header { border-bottom: 3px solid #6b3f1d; padding-bottom: 12px; margin-bottom: 16px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #6b5a4a; }
  .meta { display: flex; gap: 32px; font-size: 12px; margin-bottom: 16px; }
  .meta strong { display: block; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th, td { border-bottom: 1px solid #e4ddd4; padding: 5px 6px; text-align: left; }
  th { background: #f6f1ea; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  .num { text-align: right; }
  .mono { font-family: ui-monospace, "Consolas", monospace; }
  .debit { color: #a12c2c; }
  .credit { color: #1f6b45; }
  footer { margin-top: 20px; font-size: 10.5px; color: #8a7a6a; border-top: 1px solid #e4ddd4; padding-top: 8px; }
  @page { margin: 14mm; }
</style>
</head>
<body>
  <header>
    <h1>Crédit Foncier du Cameroun — Carnet d'épargne logement</h1>
    <p class="sub">Relevé des opérations du compte ${escapeHtml(input.accountNumber)}</p>
  </header>
  <section class="meta">
    <div>Titulaire<strong>${escapeHtml(input.clientName)}</strong></div>
    <div>Compte<strong>${escapeHtml(input.accountNumber)}</strong></div>
    <div>Solde actuel<strong>${input.balance.toLocaleString("fr-FR")} FCFA</strong></div>
    <div>Édité le<strong>${escapeHtml(printedAt)}</strong></div>
  </section>
  <table>
    <thead>
      <tr>${HEADERS.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="10">Aucune opération enregistrée.</td></tr>`}
    </tbody>
  </table>
  <footer>Document généré par le portail du Crédit Foncier du Cameroun. Ce relevé n'a pas de valeur contractuelle.</footer>
</body>
</html>`;
}
