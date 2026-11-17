"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { TableCell, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { getInitials } from "@/lib/utils";

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-disbursements-schedules";

const scheduleKpis: ActorKpiItem[] = [
  {
    title: "Échéanciers Actifs",
    value: "1 840",
    change: "8.2%",
    isPositive: true,
    previous: "1 700 prêts",
    period: "en amortissement",
  },
  {
    title: "Mensualités Encaissées",
    value: "342 M FCFA",
    change: "9.6%",
    isPositive: true,
    previous: "312 M FCFA",
    period: "ce mois",
  },
  {
    title: "Prêts en Période Différé",
    value: "148",
    change: "10.4%",
    isPositive: true,
    previous: "134 dossiers",
    period: "différé travaux 12-24m",
  },
  {
    title: "Remboursements Anticipés",
    value: "14",
    change: "16.7%",
    isPositive: true,
    previous: "12 dossiers",
    period: "ce trimestre",
  },
  {
    title: "Taux Moyen Portefeuille",
    value: "5.85%",
    change: "0.15%",
    isPositive: true,
    previous: "6.00%",
    period: "mix bonifié / standard",
  },
];

export interface ScheduleRecordItem {
  id: string;
  ref: string;
  client: string;
  ducId: string;
  initialPrincipal: string;
  durationGrace: string;
  monthlyPayment: string;
  remainingBalance: string;
  status: string;
  nextDueDate: string;
}

const scheduleRecords: ScheduleRecordItem[] = [
  {
    id: "sch1",
    ref: "AMORT-2026-00912",
    client: "EBAH Rodrigue",
    ducId: "CFC-2026-DUC-04410",
    initialPrincipal: "18 000 000 FCFA",
    durationGrace: "20 ans · Différé 12m",
    monthlyPayment: "124 500 FCFA",
    remainingBalance: "18 000 000 FCFA",
    status: "En Période Différé",
    nextDueDate: "05 Octobre 2026",
  },
  {
    id: "sch2",
    ref: "AMORT-2026-00911",
    client: "NDAM Oumarou",
    ducId: "CFC-2026-DUC-04480",
    initialPrincipal: "15 000 000 FCFA",
    durationGrace: "15 ans · Sans différé",
    monthlyPayment: "130 800 FCFA",
    remainingBalance: "14 620 000 FCFA",
    status: "En Cours Normal",
    nextDueDate: "30 Septembre 2026",
  },
  {
    id: "sch3",
    ref: "AMORT-2025-00745",
    client: "BEKONO Suzanne",
    ducId: "CFC-2026-DUC-04515",
    initialPrincipal: "12 800 000 FCFA",
    durationGrace: "25 ans · Sans différé",
    monthlyPayment: "67 500 FCFA",
    remainingBalance: "12 140 000 FCFA",
    status: "En Cours Normal",
    nextDueDate: "05 Octobre 2026",
  },
  {
    id: "sch4",
    ref: "AMORT-2024-00412",
    client: "SONG Emmanuel",
    ducId: "CFC-2026-DUC-04530",
    initialPrincipal: "8 000 000 FCFA",
    durationGrace: "10 ans · Sans différé",
    monthlyPayment: "88 900 FCFA",
    remainingBalance: "6 250 000 FCFA",
    status: "En Cours Normal",
    nextDueDate: "25 Septembre 2026",
  },
  {
    id: "sch5",
    ref: "AMORT-2023-00210",
    client: "TCHOUPO Joseph",
    ducId: "CFC-2023-DUC-00980",
    initialPrincipal: "22 000 000 FCFA",
    durationGrace: "15 ans · Sans différé",
    monthlyPayment: "191 400 FCFA",
    remainingBalance: "0 FCFA",
    status: "Soldé par Anticipation",
    nextDueDate: "Prêt Clôturé",
  },
  {
    id: "sch6",
    ref: "AMORT-2025-00620",
    client: "ATANGANA Marcelle",
    ducId: "CFC-2025-DUC-03210",
    initialPrincipal: "25 000 000 FCFA",
    durationGrace: "20 ans · Différé 24m",
    monthlyPayment: "172 800 FCFA",
    remainingBalance: "25 000 000 FCFA",
    status: "En Période Différé",
    nextDueDate: "05 Novembre 2026",
  },
];

const scheduleStatusStyles: Record<string, string> = {
  "En Cours Normal": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En Période Différé": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Soldé par Anticipation": "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

/**
 * Les colonnes du tableau des échéanciers.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SCHEDULE_COLUMNS: DataColumn<ScheduleRecordItem>[] = [
  {
    key: "ref",
    label: "Réf. Échéancier",
    accessor: (row) => row.ref,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.ref}
      </Badge>
    ),
  },
  {
    key: "client",
    label: "Emprunteur",
    accessor: (row) => row.client,
    // Un emprunteur par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-teal-500/15 text-teal-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-xs text-foreground truncate">{row.client}</span>
      </div>
    ),
  },
  {
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
    render: (row) => (
      <span className="font-mono text-[11px] text-muted-foreground">{row.ducId}</span>
    ),
  },
  {
    key: "initialPrincipal",
    label: "Capital Prêté",
    // Le tri porte sur la **valeur** : « 18 000 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.initialPrincipal.replace(/\D/g, "")),
    render: (row) => row.initialPrincipal,
    align: "right",
  },
  {
    key: "durationGrace",
    label: "Durée & Différé",
    accessor: (row) => row.durationGrace,
    // Un amortissement par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
  },
  {
    key: "monthlyPayment",
    label: "Mensualité",
    accessor: (row) => Number(row.monthlyPayment.replace(/\D/g, "")),
    render: (row) => row.monthlyPayment,
    align: "right",
  },
  {
    key: "remainingBalance",
    label: "Capital Restant Dû",
    accessor: (row) => Number(row.remainingBalance.replace(/\D/g, "")),
    render: (row) => row.remainingBalance,
    align: "right",
  },
  {
    key: "status",
    label: "Statut Prêt",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${scheduleStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "nextDueDate",
    label: "Prochaine Échéance",
    // La source mêle des dates écrites et un état (« Prêt Clôturé ») : elle
    // n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.nextDueDate,
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

export default function SchedulesPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: SCHEDULE_COLUMNS,
    rows: scheduleRecords,
  });

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   *
   * Le moteur a appliqué la recherche, les facettes et le tri ; le tableau
   * reçoit donc ses lignes déjà ordonnées.
   */
  const visibleRecords = React.useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups],
  );

  /**
   * La ligne du tableau.
   *
   * L'écran garde la main sur sa mise en page ; le moteur lui fournit les
   * **valeurs** des cellules.
   */
  const renderRow = React.useCallback(
    ({
      cell,
    }: {
      row: ScheduleRecordItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-medium text-xs text-muted-foreground">
          {cell("initialPrincipal")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground">
          {cell("durationGrace")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
          {cell("monthlyPayment")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
          {cell("remainingBalance")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("nextDueDate")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Eye className="size-4" />
          </Button>
        </TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("echeanciers-actifs.csv", [
      [
        "Réf. Échéancier",
        "Emprunteur",
        "Identifiant DUC",
        "Capital Prêté",
        "Durée & Différé",
        "Mensualité",
        "Capital Restant Dû",
        "Statut Prêt",
        "Prochaine Échéance",
      ],
      ...scheduleRecords.map((item) => [
        item.ref,
        item.client,
        item.ducId,
        item.initialPrincipal,
        item.durationGrace,
        item.monthlyPayment,
        item.remainingBalance,
        item.status,
        item.nextDueDate,
      ]),
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G7
            </Badge>
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Gestion Actif-Passif
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tableaux d&apos;Amortissement &amp; Échéanciers
          </h1>
          <p className="text-sm text-muted-foreground">
            Calcul actuariel des échéanciers de prêt, suivi des différés d&apos;amortissement en phase travaux, ventilation capital/intérêts et gestion des remboursements anticipés.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={scheduleKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Amortissement constant &amp; annuités constantes · Core Banking Carthago
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={SCHEDULE_COLUMNS}
          rows={scheduleRecords}
          unitName="échéanciers"
          searchPlaceholder="Rechercher par référence échéancier, emprunteur ou N° DUC..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={SCHEDULE_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun échéancier ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
