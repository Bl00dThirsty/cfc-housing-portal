"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCfcDate } from "@/domain/entities/dates";
import { cn } from "@/lib/utils";

import type { DataColumn } from "./types";
import { useDataTable } from "./use-data-table";

export interface DataTableProps<T> {
  /** Identifiant du tableau : il isole son état dans le store. */
  tableId: string;
  /**
   * Les colonnes.
   *
   * Le tableau **doit** avoir une identité stable : une constante de module
   * ou un `useMemo`. Écrit en ligne dans le JSX, il invalide toutes les
   * mémoïsations du moteur à chaque rendu.
   */
  columns: DataColumn<T>[];
  rows: T[];
  /** Identifiant stable d'une ligne — il est la clé React. */
  getRowId: (row: T) => string;
  /**
   * Rendu d'une ligne.
   *
   * Par défaut, une cellule par colonne. Un tableau qui a besoin d'une ligne
   * particulière — une case à cocher, une barre d'actions — fournit la sienne,
   * et reçoit la cellule de chaque colonne par `cell(key)`.
   *
   * ⚠️ La ligne fournie **possède sa mise en page** : les classes de colonne
   * (`align`, `cellClassName`) ne sont pas reprises automatiquement, et le
   * nombre de cellules rendues doit correspondre à `columns.length` — sinon
   * l'en-tête de groupe se désaligne.
   */
  renderRow?: (context: { row: T; cell: (key: string) => React.ReactNode }) => React.ReactNode;
  /** Message affiché quand aucune ligne ne correspond. */
  emptyLabel?: string;
  className?: string;
  /**
   * Classes de mise en page.
   *
   * Le répertoire des emprunteurs s'aligne par **sous-grille** CSS : ses
   * colonnes sont des `grid-cols-subgrid`. Un tableau qui utilise cette
   * disposition passe ses classes ici — le moteur ne connaît pas la mise en
   * page, il ne fait que la porter.
   */
  tableClassName?: string;
  rowClassName?: string;
  headClassName?: string;
  cellClassName?: string;
}

/**
 * Le tableau.
 *
 * Il ne connaît **aucune** règle : le tri, le filtre et le groupement
 * viennent du moteur (`useDataTable`). Ce composant rend, et rien d'autre.
 */
export function DataTable<T>({
  tableId,
  columns,
  rows,
  getRowId,
  renderRow,
  emptyLabel = "Aucune ligne ne correspond aux filtres appliqués.",
  className,
  tableClassName,
  rowClassName,
  headClassName,
  cellClassName,
}: DataTableProps<T>) {
  const { state, groups, filteredCount, toggleSort } = useDataTable({
    tableId,
    columns,
    rows,
  });

  const cell = React.useCallback(
    (row: T, column: DataColumn<T>): React.ReactNode => {
      if (column.render) return column.render(row);
      const value = column.accessor?.(row);
      if (value === null || value === undefined) return null;
      // Une date s'affiche **en français** : `String(date)` produirait
      // « Thu Jan 15 2026 01:00:00 GMT+0100 (West Africa Time) » — en
      // anglais, en heure locale, et parfois au jour précédent.
      if (value instanceof Date) return formatCfcDate(value);
      // Un booléen aussi : `String(true)` donnerait « true ».
      if (typeof value === "boolean") return value ? "Oui" : "Non";
      return String(value);
    },
    [],
  );

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card shadow-xs", className)}>
      {/* `Table` porte déjà son propre conteneur de défilement : un second
          `overflow-auto` produirait deux barres de défilement. */}
      <Table className={tableClassName} containerClassName="min-h-0 flex-1">
        <TableHeader>
          <TableRow className={rowClassName}>
            {columns.map((column) => {
              const rule = state.sorts.find((sort) => sort.key === column.key);
              const rank = state.sorts.findIndex((sort) => sort.key === column.key) + 1;
              const sortable = column.sortable !== false && Boolean(column.accessor);

              return (
                <TableHead
                  key={column.key}
                  scope="col"
                  // L'assistance technique doit entendre l'état du tri :
                  // sans `aria-sort`, la colonne triée est muette.
                  aria-sort={
                    !sortable
                      ? undefined
                      : rule?.dir === "asc"
                        ? "ascending"
                        : rule?.dir === "desc"
                          ? "descending"
                          : "none"
                  }
                  className={cn(
                    headClassName,
                    column.headerClassName,
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={(event) => toggleSort(column.key, event.shiftKey)}
                      // Le rang de priorité est annoncé : sans lui, un
                      // lecteur d'écran entend « 2 » sans savoir ce que ce
                      // chiffre désigne.
                      aria-label={
                        state.sorts.length > 1 && rule
                          ? `Trier par ${column.label} (priorité ${rank})`
                          : `Trier par ${column.label}`
                      }
                      className="inline-flex items-center gap-1 text-left hover:text-foreground"
                    >
                      {column.label}
                      {rule ? (
                        <>
                          {rule.dir === "asc" ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden />
                          )}
                          {state.sorts.length > 1 ? (
                            <span className="font-mono text-[9px]">{rank}</span>
                          ) : null}
                        </>
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredCount === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-[120px] text-center">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            groups.map((group) => (
              <React.Fragment key={group.key || "all"}>
                {state.groupBy ? (
                  <TableRow className={cn(rowClassName, "bg-muted/40")}>
                    <TableCell
                      colSpan={columns.length}
                      className="h-8 text-[11px] font-semibold text-foreground"
                    >
                      {group.label} · {group.rows.length}
                    </TableCell>
                  </TableRow>
                ) : null}

                {group.rows.map((row) =>
                  renderRow ? (
                    <React.Fragment key={getRowId(row)}>
                      {renderRow({
                        row,
                        cell: (key) => {
                          const column = columns.find((candidate) => candidate.key === key);
                          return column ? cell(row, column) : null;
                        },
                      })}
                    </React.Fragment>
                  ) : (
                    <TableRow key={getRowId(row)} className={rowClassName}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            cellClassName,
                            column.cellClassName,
                            column.align === "right" && "text-right",
                            column.align === "center" && "text-center",
                          )}
                        >
                          {cell(row, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ),
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export type { DataColumn };
export default DataTable;
