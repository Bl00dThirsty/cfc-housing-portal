"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import { downloadCsv } from "@/lib/csv";

import { ClientCard } from "./client-card";
import { ClientRow } from "./client-row";
import {
  CLIENT_COLUMNS,
  CLIENT_INITIAL_SORT,
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
  const [view, setView] = React.useState<ViewMode>("list");

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   *
   * La sélection multiple est un état du tableau, pas du moteur ; c'est le
   * moteur qui connaît les lignes affichées, et il l'expose ici.
   */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: CLIENT_COLUMNS,
    rows: clients,
    initialSort: CLIENT_INITIAL_SORT,
  });

  /**
   * Les lignes du tableau, dans leur ordre d'affichage.
   *
   * Le moteur a appliqué la recherche, les facettes et le tri — dont le
   * **tri d'ouverture**, tant qu'aucun tri n'a été choisi. Le tableau reçoit
   * donc ses lignes déjà ordonnées ; son propre moteur les réordonnera si
   * l'agent choisit un tri.
   */
  const visibleClients = React.useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups],
  );

  const visibleIds = React.useMemo(
    () => visibleClients.map((client) => client.id),
    [visibleClients],
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const handleExport = () => {
    downloadCsv(
      "emprunteurs-cfc.csv",
      [
        ["DUC", "Emprunteur", "Agence", "Phase", "Statut", "Montant", "Épargne", "Avancement %"],
        ...visibleClients.map((client) => [
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
      >
        <ViewModeToggle value={view} onValueChange={setView} />
        {/* L'action de sélection : la barre canonique n'a pas de case à
            cocher d'en-tête, elle accueille une action d'écran. */}
        <Button
          variant="outline"
          size="sm"
          disabled={visibleIds.length === 0}
          onClick={() => setSelectedIds(allVisibleSelected ? [] : visibleIds)}
          className="h-8 gap-1.5 text-[12px]"
        >
          {allVisibleSelected ? "Tout désélectionner" : "Tout sélectionner"}
        </Button>
      </DataTableToolbar>

      {view === "grid" ? (
        visibleClients.length > 0 ? (
          <ul
            role="list"
            aria-label="Emprunteurs en grille"
            className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {visibleClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                selected={selectedIds.includes(client.id)}
                active={client.id === selectedClientId}
                onToggle={(id) =>
                  setSelectedIds((current) =>
                    current.includes(id)
                      ? current.filter((selected) => selected !== id)
                      : [...current, id],
                  )
                }
                onOpen={() => onSelectClient(client)}
                onOpenKanban={() => onOpenKanban(client)}
                onOpenDuc={() => onOpenDuc(client)}
                onOpenEpargne={() => onOpenEpargne(client)}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun emprunteur ne correspond aux filtres appliqués.
          </div>
        )
      ) : (
        <DataTable
          tableId={TABLE_ID}
          columns={CLIENT_COLUMNS}
          rows={visibleClients}
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
      )}
    </div>
  );
}
