"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { TableCell, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";

const geotechKpis: ActorKpiItem[] = [
  {
    title: "Parcelles Analysées (Mois)",
    value: "142",
    change: "16.4%",
    isPositive: true,
    previous: "122 parcelles",
    period: "ce mois",
  },
  {
    title: "Zones à Risque Écartées",
    value: "11",
    change: "15.4%",
    isPositive: true,
    previous: "13",
    period: "zones inondables/pentes",
  },
  {
    title: "Taux Conformité POS / PDU",
    value: "94.2%",
    change: "2.1%",
    isPositive: true,
    previous: "92.1%",
    period: "certificats d'urbanisme",
  },
  {
    title: "Études de Sol Exigées",
    value: "28",
    change: "7.7%",
    isPositive: false,
    previous: "26",
    period: "sols compressibles",
  },
  {
    title: "Délai Avis Géotechnique",
    value: "1.8 jour",
    change: "14.3%",
    isPositive: true,
    previous: "2.1 jours",
    period: "cible ≤ 2j",
  },
];

const geotechRecords = [
  {
    id: "geo1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    location: "Olembé (Yaoundé II)",
    soilType: "Latérite compacte",
    pduZoning: "Zone R1 (Habitat Individuel)",
    riskIndex: "Faible",
    recommendation: "Fondations standards (Semelles filantes)",
    date: "Aujourd'hui, 10:15",
  },
  {
    id: "geo2",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    location: "Bonapriso (Douala I)",
    soilType: "Sableux / Nappe phréatique haute",
    pduZoning: "Zone R3 (Immeubles Collectifs)",
    riskIndex: "Modéré",
    recommendation: "Radier généralisé étanche préconisé",
    date: "Hier, 16:30",
  },
  {
    id: "geo3",
    ducId: "CFC-2026-DUC-04840",
    client: "ATANGANA Thérèse",
    location: "Mbankolo (Yaoundé II)",
    soilType: "Versant collineux / Pente > 20%",
    pduZoning: "Zone R1 (Protection Pentes)",
    riskIndex: "Élevé",
    recommendation: "Étude géotechnique G2 obligatoire",
    date: "02 Sept 2026",
  },
  {
    id: "geo4",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    location: "Kribi Ville (Zone Portuaire)",
    soilType: "Arénacé limoneux",
    pduZoning: "Zone PDU Extension Urbaine",
    riskIndex: "Faible",
    recommendation: "Fondations superficielles admises",
    date: "01 Sept 2026",
  },
  {
    id: "geo5",
    ducId: "CFC-2026-DUC-04877",
    client: "ZRA Gabriel",
    location: "Maroua Djarengol",
    soilType: "Argile gonflante (Vertisol)",
    pduZoning: "Zone R1 Résidentielle",
    riskIndex: "Modéré",
    recommendation: "Longrines armées anti-dessiccation",
    date: "30 Août 2026",
  },
  {
    id: "geo6",
    ducId: "CFC-2026-DUC-04899",
    client: "EBOGO Laurent",
    location: "Biyem-Assi Bas-fonds",
    soilType: "Alluvions marécageuses",
    pduZoning: "Servitude naturelle non aedificandi",
    riskIndex: "Critique",
    recommendation: "Refus technique : Zone inconstructible",
    date: "28 Août 2026",
  },
];

type GeotechRecord = (typeof geotechRecords)[number];

const riskStyles: Record<string, string> = {
  "Faible": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Modéré": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Élevé": "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Critique": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-risk-engineering-geotech-urban";

/**
 * Les colonnes du scoring géotechnique.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const GEOTECH_COLUMNS: DataColumn<GeotechRecord>[] = [
  {
    key: "client",
    label: "Emprunteur / Parcelle",
    accessor: (row) => row.client,
    // La localisation est affichée **sous le nom** dans la ligne : elle n'est
    // pas une colonne, mais elle reste trouvable par la recherche.
    searchValues: (row) => [row.location],
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-xs text-foreground truncate">
          {row.client}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          {row.location}
        </span>
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
    key: "soilType",
    label: "Nature du Sol",
    accessor: (row) => row.soilType,
    filterable: true,
    groupable: true,
  },
  {
    key: "pduZoning",
    label: "Zonage POS / PDU",
    accessor: (row) => row.pduZoning,
    filterable: true,
    groupable: true,
  },
  {
    key: "riskIndex",
    label: "Niveau Risque",
    accessor: (row) => row.riskIndex,
    filterable: true,
    groupable: true,
    align: "center",
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${riskStyles[row.riskIndex] ?? ""} h-5 px-2 text-xs font-semibold border-transparent`}
      >
        {row.riskIndex}
      </Badge>
    ),
  },
  {
    key: "recommendation",
    label: "Recommandation BET",
    accessor: (row) => row.recommendation,
  },
  {
    key: "date",
    label: "Date Avis",
    // La source mêle des dates relatives (« Aujourd'hui, 10:15 ») et des dates
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

export default function GeotechUrbanPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: GEOTECH_COLUMNS,
    rows: geotechRecords,
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
      row: GeotechRecord;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
          {cell("soilType")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[160px]">
          <span className="truncate block">{cell("pduZoning")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-center">{cell("riskIndex")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[200px]">
          <span className="truncate block">{cell("recommendation")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("date")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("fiches-sols.csv", [
      [
        "Emprunteur",
        "Localisation",
        "Identifiant DUC",
        "Nature du Sol",
        "Zonage POS / PDU",
        "Niveau Risque",
        "Recommandation BET",
        "Date Avis",
      ],
      ...geotechRecords.map((record) => [
        record.client,
        record.location,
        record.ducId,
        record.soilType,
        record.pduZoning,
        record.riskIndex,
        record.recommendation,
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
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Sécurité Foncière &amp; Sols
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Scoring Géotechnique &amp; Conformité Urbaine
          </h1>
          <p className="text-sm text-muted-foreground">
            Évaluation des risques naturels (inondation, éboulement, glissement), portance du terrain et conformité au Plan d&apos;Occupation des Sols (POS/PDU).
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={geotechKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Plans d&apos;Urbanisme Directeurs (MINDDUH) &amp; Données Géologiques</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={GEOTECH_COLUMNS}
          rows={geotechRecords}
          unitName="parcelles"
          searchPlaceholder="Rechercher par emprunteur, N° DUC, localisation ou nature du sol..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={GEOTECH_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune parcelle ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
