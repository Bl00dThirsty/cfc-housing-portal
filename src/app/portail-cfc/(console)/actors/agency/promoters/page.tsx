"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { Progress } from "@/components/ui/progress";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  promotersData as promoters,
  type PromoterItem,
} from "@/domain/entities/promoters";

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-agency-promoters";

/** Le taux de commercialisation d'un programme, en pourcentage. */
function occupancyPercent(row: PromoterItem): number {
  return Math.round(((row.total - row.available) / row.total) * 100);
}

const promotersKpis: ActorKpiItem[] = [
  {
    title: "Promoteurs Conventionnés",
    value: "24",
    change: "9.1%",
    isPositive: true,
    previous: "22",
    period: "ce trimestre",
  },
  {
    title: "Programmes Actifs",
    value: "38",
    change: "15.2%",
    isPositive: true,
    previous: "33",
    period: "ce trimestre",
  },
  {
    title: "Logements Disponibles",
    value: "1 240",
    change: "6.8%",
    isPositive: false,
    previous: "1 330",
    period: "ce trimestre",
  },
  {
    title: "Dossiers via Promoteurs (Mois)",
    value: "187",
    change: "24.0%",
    isPositive: true,
    previous: "151",
    period: "ce mois",
  },
  {
    title: "Taux de Réservation",
    value: "73.5%",
    change: "5.2%",
    isPositive: true,
    previous: "68.3%",
    period: "ce trimestre",
  },
];

/**
 * Les colonnes du tableau des programmes immobiliers.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const PROMOTER_COLUMNS: DataColumn<PromoterItem>[] = [
  {
    key: "name",
    label: "Promoteur / SIC",
    accessor: (row) => row.name,
  },
  {
    key: "programme",
    label: "Programme Immobilier",
    accessor: (row) => row.programme,
  },
  {
    key: "city",
    label: "Ville",
    accessor: (row) => row.city,
    filterable: true,
    groupable: true,
  },
  {
    key: "availability",
    label: "Disponibilité",
    // Le tri porte sur le **taux de commercialisation** : « 8 / 30 » ne se
    // compare pas, « 73 % » se compare.
    accessor: (row) => occupancyPercent(row),
    render: (row) => (
      <div className="flex flex-col gap-1 min-w-[100px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground">
            {row.available} / {row.total}
          </span>
          <span className="text-muted-foreground">{occupancyPercent(row)}%</span>
        </div>
        <Progress value={occupancyPercent(row)} className="h-1.5" />
      </div>
    ),
  },
  {
    key: "priceRange",
    label: "Fourchette Prix",
    accessor: (row) => row.priceRange,
    // Une fourchette ne se compare pas : « 18 – 35 M FCFA » contre
    // « 8 – 15 M FCFA » se rangerait par son premier chiffre.
    sortable: false,
  },
  {
    key: "status",
    label: "Statut",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={
          row.status === "Active"
            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium border-transparent"
            : "bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 h-5 px-2 text-xs font-medium border-transparent"
        }
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "updated",
    label: "MAJ",
    // La source mêle des dates relatives (« Aujourd'hui ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.updated,
    sortable: false,
  },
  {
    // La colonne d'actions ne porte pas de valeur : elle n'est ni triable ni
    // filtrable.
    key: "actions",
    label: "Actions",
    sortable: false,
  },
];

export default function PromotersPage() {
  const router = useRouter();

  /**
   * La ligne du tableau.
   *
   * L'écran garde la main sur sa mise en page ; le moteur lui fournit les
   * **valeurs** des cellules.
   */
  const renderRow = React.useCallback(
    ({
      row,
      cell,
    }: {
      row: PromoterItem;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openProgramme = () =>
        router.push(`/portail-cfc/actors/agency/promoters/${row.id}`);

      return (
        <TableRow
          onClick={openProgramme}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openProgramme();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Ouvrir le programme ${row.name}`}
          className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          <TableCell className="px-3 py-2.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openProgramme();
              }}
              aria-label={`Ouvrir le programme ${row.name}`}
              className="text-left font-medium hover:underline text-xs text-foreground"
            >
              {cell("name")}
            </button>
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[200px]">
            <span className="truncate block font-medium">{cell("programme")}</span>
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-foreground">
            {cell("city")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("availability")}</TableCell>
          <TableCell className="px-3 py-2.5 text-xs font-mono text-foreground whitespace-nowrap">
            {cell("priceRange")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
            {cell("updated")}
          </TableCell>
          <TableCell
            className="text-right pr-4 py-2.5"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={openProgramme}
              aria-label={`Ouvrir le programme ${row.name}`}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <Eye className="size-4" />
            </Button>
          </TableCell>
        </TableRow>
      );
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G1
            </Badge>
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Offre Immobilière
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Partenariats Promoteurs Immobiliers &amp; SIC
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion des conventions promoteurs, suivi des programmes immobiliers conventionnés et disponibilité des logements SIC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Catalogue
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <ActorKpiStrip items={promotersKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={PROMOTER_COLUMNS}
          rows={promoters}
          unitName="programmes"
          searchPlaceholder="Rechercher par promoteur, programme ou ville..."
        />

        <DataTable
          tableId={TABLE_ID}
          columns={PROMOTER_COLUMNS}
          rows={promoters}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun programme immobilier ne correspond aux critères sélectionnés."
        />
      </div>
    </div>
  );
}
