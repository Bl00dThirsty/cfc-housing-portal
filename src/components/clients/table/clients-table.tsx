"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { filterClients } from "@/lib/clients-filters";
import { cn } from "@/lib/utils";
import { useClientsStore } from "@/stores/clients-store";

import { ClientRow } from "./client-row";
import {
  CLIENT_TABLE_CELL_CLASS,
  CLIENT_TABLE_GRID_CLASS,
  CLIENT_TABLE_ROW_CLASS,
  clientColumnClass,
} from "./table-columns";
import type { ClientItem } from "@/domain/entities/client";

type ClientsTableProps = {
  clients: ClientItem[];
  selectedClientId: string;
  onSelectClient: (client: ClientItem) => void;
  onOpenKanban: (client: ClientItem) => void;
  onOpenDuc: (client: ClientItem) => void;
  onOpenEpargne: (client: ClientItem) => void;
};

export function ClientsTable({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: ClientsTableProps) {
  const sortBy = useClientsStore((state) => state.sortBy);
  const phase = useClientsStore((state) => state.phase);
  const agency = useClientsStore((state) => state.agency);
  const status = useClientsStore((state) => state.status);
  const search = useClientsStore((state) => state.search);
  const selectedIds = useClientsStore((state) => state.selectedIds);
  const toggleSelected = useClientsStore((state) => state.toggleSelected);
  const setSelected = useClientsStore((state) => state.setSelected);
  const openDetail = useClientsStore((state) => state.openDetail);

  const visible = React.useMemo(
    () => filterClients(clients, { sortBy, phase, agency, status, search }),
    [clients, sortBy, phase, agency, status, search],
  );

  const allSelected = visible.length > 0 && selectedIds.length === visible.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleOpen = (client: ClientItem) => {
    onSelectClient(client);
    openDetail(client.id);
  };

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card shadow-xs">
      <ScrollArea orientation="both" className="min-h-0 flex-1">
        <Table containerClassName="contents" className={CLIENT_TABLE_GRID_CLASS}>
          <TableHeader role="rowgroup" className="contents">
            <TableRow role="row" className={CLIENT_TABLE_ROW_CLASS}>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "gap-2",
                  clientColumnClass("name"),
                )}
              >
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) =>
                    setSelected(checked === true ? visible.map((c) => c.id) : [])
                  }
                  aria-label="Tout sélectionner"
                  className="shrink-0"
                />
                <span className="eyebrow-style font-normal text-subtle">Emprunteur</span>
              </TableHead>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "eyebrow-style font-normal text-subtle",
                  clientColumnClass("agency"),
                )}
              >
                Agence
              </TableHead>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "eyebrow-style font-normal text-subtle",
                  clientColumnClass("phase"),
                )}
              >
                Phase
              </TableHead>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "eyebrow-style font-normal text-subtle",
                  clientColumnClass("status"),
                )}
              >
                Statut
              </TableHead>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "eyebrow-style font-normal text-subtle",
                  clientColumnClass("loanAmount"),
                )}
              >
                Montant
              </TableHead>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "eyebrow-style font-normal text-subtle",
                  clientColumnClass("savingsCurrent"),
                )}
              >
                Épargne
              </TableHead>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "eyebrow-style font-normal text-subtle",
                  clientColumnClass("completionPercent"),
                )}
              >
                Avancement
              </TableHead>
              <TableHead
                role="columnheader"
                className={cn(
                  CLIENT_TABLE_CELL_CLASS,
                  "eyebrow-style font-normal text-subtle",
                  clientColumnClass("action"),
                )}
              >
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody role="rowgroup" className="contents">
            {visible.length === 0 ? (
              <TableRow role="row" className={CLIENT_TABLE_ROW_CLASS}>
                <TableCell
                  role="cell"
                  colSpan={8}
                  className="col-span-full flex h-[120px] items-center justify-center text-xs text-muted-foreground"
                >
                  Aucun emprunteur ne correspond aux filtres appliqués.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  selected={selectedIds.includes(client.id)}
                  active={client.id === selectedClientId}
                  onToggle={toggleSelected}
                  onOpen={handleOpen}
                  onOpenKanban={onOpenKanban}
                  onOpenDuc={onOpenDuc}
                  onOpenEpargne={onOpenEpargne}
                />
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
