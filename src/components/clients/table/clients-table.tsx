"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { downloadCsv } from "@/lib/csv";

import { ClientRow } from "./client-row";
import {
  CLIENT_COLUMNS,
  CLIENT_TABLE_CELL_CLASS,
  CLIENT_TABLE_GRID_CLASS,
  CLIENT_TABLE_ROW_CLASS,
} from "./table-columns";
import type { ClientItem } from "@/domain/entities/client";

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-clients";

type ClientsTableProps = {
  clients: ClientItem[];
  selectedClientId: string;
  onSelectClient: (client: ClientItem) => void;
  onOpenKanban: (client: ClientItem) => void;
  onOpenDuc: (client: ClientItem) => void;
  onOpenEpargne: (client: ClientItem) => void;
};

/**
 * Le répertoire des emprunteurs.
 *
 * La table, sa barre d'outils et son export partagent le **même** moteur : le
 * tri, la recherche et les facettes sont ceux du portail entier, pas ceux de
 * cet écran.
 */
export function ClientsTable({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: ClientsTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleExport = () => {
    downloadCsv(
      "emprunteurs-cfc.csv",
      [
        ["DUC", "Emprunteur", "Agence", "Phase", "Statut", "Montant", "Épargne", "Avancement %"],
        ...clients.map((client) => [
          client.ducId,
          client.name,
          client.agency,
          client.phase,
          client.status,
          client.loanAmount,
          client.savingsCurrent,
          client.completionPercent,
        ]),
      ],
    );
  };

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <DataTableToolbar
        tableId={TABLE_ID}
        columns={CLIENT_COLUMNS}
        rows={clients}
        unitName="emprunteurs"
        searchPlaceholder="Rechercher un emprunteur, un DUC ou une agence..."
        onExport={handleExport}
      />

      <DataTable
        tableId={TABLE_ID}
        columns={CLIENT_COLUMNS}
        rows={clients}
        getRowId={(client) => client.id}
        emptyLabel="Aucun emprunteur ne correspond aux filtres appliqués."
        tableClassName={CLIENT_TABLE_GRID_CLASS}
        rowClassName={CLIENT_TABLE_ROW_CLASS}
        cellClassName={CLIENT_TABLE_CELL_CLASS}
        renderRow={({ row, cell }) => (
          <ClientRow
            client={row}
            cell={cell}
            selected={selectedIds.includes(row.id)}
            active={row.id === selectedClientId}
            onToggle={(id) =>
              setSelectedIds((current) =>
                current.includes(id)
                  ? current.filter((selected) => selected !== id)
                  : [...current, id],
              )
            }
            onOpen={() => onSelectClient(row)}
            onOpenKanban={() => onOpenKanban(row)}
            onOpenDuc={() => onOpenDuc(row)}
            onOpenEpargne={() => onOpenEpargne(row)}
          />
        )}
      />
    </div>
  );
}
