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
const TABLE_ID = "portail-cfc-disbursements-subsidies";

const subsidiesKpis: ActorKpiItem[] = [
  {
    title: "Prêts Bonifiés Gérés",
    value: "580",
    change: "13.7%",
    isPositive: true,
    previous: "510 prêts",
    period: "fonctionnaires & modestes",
  },
  {
    title: "Subvention Reçue MINFI",
    value: "485 M FCFA",
    change: "18.3%",
    isPositive: true,
    previous: "410 M FCFA",
    period: "dotation budgétaire",
  },
  {
    title: "Bonification Moyenne",
    value: "2.5%",
    change: "0.0%",
    isPositive: true,
    previous: "2.5% l'an",
    period: "prise en charge État",
  },
  {
    title: "Économie par Emprunteur",
    value: "38 500 FCFA",
    change: "4.1%",
    isPositive: true,
    previous: "37 000 FCFA",
    period: "gain mensuel moyen",
  },
  {
    title: "Conformité Déclaratifs MINFI",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "audit budgétaire",
  },
];

export interface SubsidyRecordItem {
  id: string;
  ref: string;
  client: string;
  category: string;
  ducId: string;
  loanAmount: string;
  rateStructure: string;
  stateShareMonthly: string;
  status: string;
  startDate: string;
}

const subsidyRecords: SubsidyRecordItem[] = [
  {
    id: "sub1",
    ref: "BONIF-MINFI-2026-0182",
    client: "EBAH Rodrigue",
    category: "Enseignant Enseignement Supérieur (A2)",
    ducId: "CFC-2026-DUC-04410",
    loanAmount: "18 000 000 FCFA",
    rateStructure: "Nominal 7.0% → Client 4.5%",
    stateShareMonthly: "37 500 FCFA",
    status: "Bonification Validée",
    startDate: "01 Sept 2026",
  },
  {
    id: "sub2",
    ref: "BONIF-MINFI-2026-0181",
    client: "NDAM Oumarou",
    category: "Fonctionnaire Cadre B1 (Santé)",
    ducId: "CFC-2026-DUC-04480",
    loanAmount: "15 000 000 FCFA",
    rateStructure: "Nominal 6.8% → Client 4.3%",
    stateShareMonthly: "31 250 FCFA",
    status: "Bonification Validée",
    startDate: "15 Août 2026",
  },
  {
    id: "sub3",
    ref: "BONIF-MINFI-2026-0180",
    client: "BEKONO Suzanne",
    category: "Institutrice Enseignement Primaire",
    ducId: "CFC-2026-DUC-04515",
    loanAmount: "12 800 000 FCFA",
    rateStructure: "Nominal 6.5% → Client 4.0%",
    stateShareMonthly: "26 670 FCFA",
    status: "Bonification Validée",
    startDate: "01 Août 2026",
  },
  {
    id: "sub4",
    ref: "BONIF-MINFI-2026-0179",
    client: "SONG Emmanuel",
    category: "Agent Contractuel d'Administration",
    ducId: "CFC-2026-DUC-04530",
    loanAmount: "8 000 000 FCFA",
    rateStructure: "Nominal 7.0% → Client 4.5%",
    stateShareMonthly: "16 670 FCFA",
    status: "En attente dotation",
    startDate: "01 Octobre 2026",
  },
  {
    id: "sub5",
    ref: "BONIF-MINFI-2026-0178",
    client: "ASSOMO Claire",
    category: "Personnel Paramédical",
    ducId: "CFC-2026-DUC-04795",
    loanAmount: "6 200 000 FCFA",
    rateStructure: "Nominal 6.5% → Client 4.0%",
    stateShareMonthly: "12 920 FCFA",
    status: "Bonification Validée",
    startDate: "15 Juillet 2026",
  },
  {
    id: "sub6",
    ref: "BONIF-MINFI-2025-0142",
    client: "TCHOUPO Joseph",
    category: "Cadre Retraité Fonction Publique",
    ducId: "CFC-2023-DUC-00980",
    loanAmount: "22 000 000 FCFA",
    rateStructure: "Nominal 7.0% → Client 4.5%",
    stateShareMonthly: "0 FCFA",
    status: "Clôturé (Prêt Soldé)",
    startDate: "Prêt Terminé",
  },
];

const subsidyStatusStyles: Record<string, string> = {
  "Bonification Validée": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En attente dotation": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Clôturé (Prêt Soldé)": "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

/**
 * Les colonnes du tableau des bonifications MINFI.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SUBSIDY_COLUMNS: DataColumn<SubsidyRecordItem>[] = [
  {
    key: "ref",
    label: "Réf. Bonification",
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
    label: "Emprunteur / Corps de Métier",
    accessor: (row) => row.client,
    // Le corps de métier est affiché **sous le nom** : il n'est pas une
    // colonne, mais il reste trouvable par la recherche.
    searchValues: (row) => [row.category],
    // Un emprunteur par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">{row.client}</span>
          <span className="text-[11px] text-muted-foreground truncate">{row.category}</span>
        </div>
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
    key: "loanAmount",
    label: "Montant Prêt",
    // Le tri porte sur la **valeur** : « 18 000 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.loanAmount.replace(/\D/g, "")),
    render: (row) => row.loanAmount,
    align: "right",
  },
  {
    key: "rateStructure",
    label: "Structure Taux (Nominal → Client)",
    accessor: (row) => row.rateStructure,
  },
  {
    key: "stateShareMonthly",
    label: "Prise en Charge État",
    accessor: (row) => Number(row.stateShareMonthly.replace(/\D/g, "")),
    render: (row) => row.stateShareMonthly,
    align: "right",
  },
  {
    key: "status",
    label: "Statut MINFI",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${subsidyStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "startDate",
    label: "Date Effet",
    // La source mêle des dates écrites et un état (« Prêt Terminé ») : elle
    // n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.startDate,
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

export default function SubsidiesPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: SUBSIDY_COLUMNS,
    rows: subsidyRecords,
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
      row: SubsidyRecordItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
          {cell("loanAmount")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
          {cell("rateStructure")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          {cell("stateShareMonthly")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("startDate")}
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
    downloadCsv("declaratif-minfi.csv", [
      [
        "Réf. Bonification",
        "Emprunteur",
        "Corps de Métier",
        "Identifiant DUC",
        "Montant Prêt",
        "Structure Taux",
        "Prise en Charge État",
        "Statut MINFI",
        "Date Effet",
      ],
      ...subsidyRecords.map((item) => [
        item.ref,
        item.client,
        item.category,
        item.ducId,
        item.loanAmount,
        item.rateStructure,
        item.stateShareMonthly,
        item.status,
        item.startDate,
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
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Bonification État &amp; MINFI
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Comptabilité des Prêts Bonifiés &amp; Subventions État
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion des différentiels de taux pris en charge par le Ministère des Finances (MINFI) en faveur de l&apos;habitat social et reporting déclaratif trimestriel.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={subsidiesKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Subvention de l&apos;État du Cameroun au titre de l&apos;accès au logement décent
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={SUBSIDY_COLUMNS}
          rows={subsidyRecords}
          unitName="bonifications"
          searchPlaceholder="Rechercher par référence, bénéficiaire, corps ou N° DUC..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={SUBSIDY_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune bonification ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
