export const CLIENT_TABLE_COLUMNS = [
  { key: "name", label: "Emprunteur", className: "justify-start" },
  { key: "agency", label: "Agence", className: "justify-start" },
  { key: "phase", label: "Phase", className: "justify-start" },
  { key: "status", label: "Statut", className: "justify-start" },
  { key: "loanAmount", label: "Montant", className: "justify-end tabular-nums" },
  { key: "savingsCurrent", label: "Épargne", className: "justify-end tabular-nums" },
  { key: "completionPercent", label: "Avancement", className: "justify-center" },
  { key: "action", label: "Action", className: "justify-center" },
] as const;

export type ClientTableColumnKey = (typeof CLIENT_TABLE_COLUMNS)[number]["key"];

export const CLIENT_TABLE_GRID_CLASS =
  "grid min-w-max grid-cols-[repeat(8,max-content)] justify-between";

export const CLIENT_TABLE_ROW_CLASS = "col-span-full grid grid-cols-subgrid";

export const CLIENT_TABLE_CELL_CLASS = "flex items-center";

export function clientColumnClass(key: ClientTableColumnKey): string {
  return CLIENT_TABLE_COLUMNS.find((column) => column.key === key)?.className ?? "";
}
