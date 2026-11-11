"use client";

import { Download, RotateCcw, Search } from "lucide-react";

import { FilterMenu } from "@/components/_common/filter-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activeFilterCount, distinctValues } from "@/lib/clients-filters";
import { downloadCsv } from "@/lib/csv";
import { useClientsStore } from "@/stores/clients-store";

import type { ClientItem } from "@/domain/entities/client";

const SORT_OPTIONS = [
  { value: "completionPercent", label: "Avancement" },
  { value: "name", label: "Nom" },
  { value: "phase", label: "Phase" },
  { value: "status", label: "Statut" },
  { value: "loanAmount", label: "Montant du prêt" },
  { value: "savingsCurrent", label: "Épargne" },
];

const ALL = { value: "", label: "Tous" };

type ClientsToolbarProps = {
  clients: ClientItem[];
};

export function ClientsToolbar({ clients }: ClientsToolbarProps) {
  const sortBy = useClientsStore((state) => state.sortBy);
  const phase = useClientsStore((state) => state.phase);
  const agency = useClientsStore((state) => state.agency);
  const status = useClientsStore((state) => state.status);
  const search = useClientsStore((state) => state.search);
  const setSortBy = useClientsStore((state) => state.setSortBy);
  const setPhase = useClientsStore((state) => state.setPhase);
  const setAgency = useClientsStore((state) => state.setAgency);
  const setStatus = useClientsStore((state) => state.setStatus);
  const setSearch = useClientsStore((state) => state.setSearch);
  const resetFilters = useClientsStore((state) => state.resetFilters);

  const activeCount = activeFilterCount({ sortBy, phase, agency, status, search });
  const phaseOptions = [ALL, ...distinctValues(clients, "phase").map((v) => ({ value: v, label: v }))];
  const agencyOptions = [ALL, ...distinctValues(clients, "agency").map((v) => ({ value: v, label: v }))];
  const statusOptions = [ALL, ...distinctValues(clients, "status").map((v) => ({ value: v, label: v }))];

  const handleExport = () => {
    const rows: (string | number)[][] = [
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
    ];
    downloadCsv("emprunteurs-cfc.csv", rows);
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 py-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="relative w-56">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="clients-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un emprunteur"
            aria-label="Rechercher un emprunteur"
            className="h-8 pl-7 text-xs"
          />
        </div>

        <FilterMenu
          label="Trier par"
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={(value) => setSortBy(value as typeof sortBy)}
        />
        <FilterMenu
          label="Phase"
          value={phase}
          options={phaseOptions}
          onChange={setPhase}
        />
        <FilterMenu
          label="Agence"
          value={agency}
          options={agencyOptions}
          onChange={setAgency}
        />
        <FilterMenu
          label="Statut"
          value={status}
          options={statusOptions}
          onChange={setStatus}
        />

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-[30px] gap-1.5 text-xs"
            onClick={resetFilters}
          >
            <RotateCcw className="size-3.5" />
            Réinitialiser
            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
              {activeCount}
            </span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleExport}
        >
          <Download className="size-3.5" />
          Exporter
        </Button>
      </div>
    </div>
  );
}
