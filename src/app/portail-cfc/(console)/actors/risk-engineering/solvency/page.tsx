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

const solvencyKpis: ActorKpiItem[] = [
  {
    title: "Consultations Fichier (Mois)",
    value: "312",
    change: "21.4%",
    isPositive: true,
    previous: "257",
    period: "ce mois",
  },
  {
    title: "Score Solvabilité Moyen",
    value: "748 / 1000",
    change: "2.5%",
    isPositive: true,
    previous: "730 pts",
    period: "seuil min. ≥ 650",
  },
  {
    title: "Taux d'Incidents Détectés",
    value: "4.8%",
    change: "1.2%",
    isPositive: true,
    previous: "6.0%",
    period: "incidents BEAC/COBAC",
  },
  {
    title: "Reste à Vivre Moyen",
    value: "340 000 FCFA",
    change: "5.6%",
    isPositive: true,
    previous: "322 000 FCFA",
    period: "norme CFC ≥ 150k",
  },
  {
    title: "Dossiers en Alerte Rouge",
    value: "9",
    change: "25.0%",
    isPositive: true,
    previous: "12",
    period: "interdictions bancaires",
  },
];

const solvencyRecords = [
  {
    id: "sr1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    profession: "Cadre Supérieur Privé",
    netIncome: "1 450 000 FCFA",
    existingDebts: "180 000 FCFA",
    solvencyScore: 820,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "Aujourd'hui, 08:30",
  },
  {
    id: "sr2",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    profession: "Commerçant Import/Export",
    netIncome: "2 800 000 FCFA",
    existingDebts: "620 000 FCFA",
    solvencyScore: 710,
    beacStatus: "Régularisé",
    opinion: "Vigilance",
    date: "Hier, 14:15",
  },
  {
    id: "sr3",
    ducId: "CFC-2026-DUC-04840",
    client: "ATANGANA Thérèse",
    profession: "Inspectrice des Impôts",
    netIncome: "950 000 FCFA",
    existingDebts: "110 000 FCFA",
    solvencyScore: 790,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "02 Sept 2026",
  },
  {
    id: "sr4",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    profession: "Ingénieur Port Autonome",
    netIncome: "1 200 000 FCFA",
    existingDebts: "250 000 FCFA",
    solvencyScore: 760,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "01 Sept 2026",
  },
  {
    id: "sr5",
    ducId: "CFC-2026-DUC-04890",
    client: "MVOGO Bernard",
    profession: "Prestataire Indépendant",
    netIncome: "480 000 FCFA",
    existingDebts: "210 000 FCFA",
    solvencyScore: 540,
    beacStatus: "Contentieux Actif",
    opinion: "Défavorable",
    date: "31 Août 2026",
  },
  {
    id: "sr6",
    ducId: "CFC-2026-DUC-04905",
    client: "BILOUNGA Esther",
    profession: "Médecin Généraliste",
    netIncome: "1 650 000 FCFA",
    existingDebts: "190 000 FCFA",
    solvencyScore: 845,
    beacStatus: "Néant (Vierge)",
    opinion: "Favorable",
    date: "29 Août 2026",
  },
];

type SolvencyRecord = (typeof solvencyRecords)[number];

const opinionStyles: Record<string, string> = {
  "Favorable": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Vigilance": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Défavorable": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

const beacStyles: Record<string, string> = {
  "Néant (Vierge)": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Régularisé": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Contentieux Actif": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-risk-engineering-solvency";

/**
 * Les colonnes du fichier prudentiel.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SOLVENCY_COLUMNS: DataColumn<SolvencyRecord>[] = [
  {
    key: "client",
    label: "Emprunteur",
    accessor: (row) => row.client,
    // La profession est affichée **sous le nom** dans la ligne : elle n'est
    // pas une colonne, mais elle reste trouvable par la recherche.
    searchValues: (row) => [row.profession],
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-700">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">
            {row.client}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {row.profession}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.ducId}
      </Badge>
    ),
  },
  {
    key: "netIncome",
    label: "Revenus Mensuels",
    // Le tri porte sur la **valeur** : « 1 450 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.netIncome.replace(/\D/g, "")),
    render: (row) => row.netIncome,
    align: "right",
  },
  {
    key: "existingDebts",
    label: "Charges Crédits",
    accessor: (row) => Number(row.existingDebts.replace(/\D/g, "")),
    render: (row) => row.existingDebts,
    align: "right",
  },
  {
    key: "solvencyScore",
    label: "Score BEAC",
    accessor: (row) => row.solvencyScore,
    render: (row) => `${row.solvencyScore} pts`,
    align: "center",
  },
  {
    key: "beacStatus",
    label: "Statut Fichier",
    accessor: (row) => row.beacStatus,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${beacStyles[row.beacStatus] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.beacStatus}
      </Badge>
    ),
  },
  {
    key: "opinion",
    label: "Avis Prudentiel",
    accessor: (row) => row.opinion,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${opinionStyles[row.opinion] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.opinion}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date MAJ",
    // La source mêle des dates relatives (« Aujourd'hui, 08:30 ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.date,
    sortable: false,
  },
  {
    // La colonne d'actions ne porte pas de valeur : elle n'est ni triable ni
    // filtrable.
    key: "actions",
    label: "Actions",
    sortable: false,
    render: () => (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
      >
        <Eye className="size-4" />
      </Button>
    ),
  },
];

export default function SolvencyPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: SOLVENCY_COLUMNS,
    rows: solvencyRecords,
  });

  const visible = React.useMemo(
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
      row: SolvencyRecord;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
          {cell("netIncome")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
          {cell("existingDebts")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-foreground">
          {cell("solvencyScore")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("beacStatus")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("opinion")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("date")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("fiche-prudentielle.csv", [
      [
        "Emprunteur",
        "Profession",
        "Identifiant DUC",
        "Revenus Mensuels",
        "Charges Crédits",
        "Score BEAC",
        "Statut Fichier",
        "Avis Prudentiel",
        "Date MAJ",
      ],
      ...solvencyRecords.map((record) => [
        record.client,
        record.profession,
        record.ducId,
        record.netIncome,
        record.existingDebts,
        record.solvencyScore,
        record.beacStatus,
        record.opinion,
        record.date,
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
              Groupe G3
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-transparent h-5 px-2 text-xs font-medium">
              Analyse Prudentielle
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Centrale des Risques &amp; Solvabilité Ménage
          </h1>
          <p className="text-sm text-muted-foreground">
            Interrogation du fichier national des incidents de paiement BEAC, centrale des risques bancaires et calcul de la capacité d&apos;endettement.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={solvencyKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Interrogation Centrale des Risques BEAC &amp; Fichier National des Incidents</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={SOLVENCY_COLUMNS}
          rows={solvencyRecords}
          unitName="fiches"
          searchPlaceholder="Rechercher par emprunteur, N° DUC ou profession..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={SOLVENCY_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune fiche ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
