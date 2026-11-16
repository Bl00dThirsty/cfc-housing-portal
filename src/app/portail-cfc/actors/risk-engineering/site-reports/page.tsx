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
import { Progress } from "@/components/ui/progress";
import { TableCell, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";

const siteReportsKpis: ActorKpiItem[] = [
  {
    title: "Visites Réalisées (Mois)",
    value: "118",
    change: "14.2%",
    isPositive: true,
    previous: "103",
    period: "ce mois",
  },
  {
    title: "Taux d'Avancement Moyen",
    value: "54.2%",
    change: "6.8%",
    isPositive: true,
    previous: "47.4%",
    period: "chantiers suivis",
  },
  {
    title: "PV avec Réserves",
    value: "19",
    change: "15.0%",
    isPositive: false,
    previous: "22",
    period: "taux 16.1%",
  },
  {
    title: "Délai Rédaction PV",
    value: "2.1 jours",
    change: "8.7%",
    isPositive: true,
    previous: "2.3 jours",
    period: "cible ≤ 3j",
  },
  {
    title: "Chantiers Suspendus",
    value: "4",
    change: "20.0%",
    isPositive: true,
    previous: "5",
    period: "anomalies majeures",
  },
];

const siteReports = [
  {
    id: "r1",
    ref: "RVC-2026-00382",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    project: "Construction Villa R+1 (Olembé)",
    inspector: "Ing. Lucien Fame (BET Epsilon)",
    stage: "Gros Œuvre R+1",
    progress: 65,
    status: "Favorable",
    date: "Aujourd'hui, 11:30",
  },
  {
    id: "r2",
    ref: "RVC-2026-00381",
    ducId: "CFC-2026-DUC-04812",
    client: "FOTSO Michel",
    project: "Immeuble Locatif R+2 (Bonapriso)",
    inspector: "Cabinet BET Ingénierie",
    stage: "Fondations & Radier",
    progress: 25,
    status: "Avec réserves",
    date: "Hier, 15:45",
  },
  {
    id: "r3",
    ref: "RVC-2026-00380",
    ducId: "CFC-2026-DUC-04865",
    client: "NDJOCK Samuel",
    project: "Logement Individuel (Kribi)",
    inspector: "BET Littoral Sud",
    stage: "Toiture & Charpente",
    progress: 80,
    status: "Favorable",
    date: "Hier, 10:15",
  },
  {
    id: "r4",
    ref: "RVC-2026-00379",
    ducId: "CFC-2026-DUC-04902",
    client: "BELINGA Sophie",
    project: "Extension Pavillon (Mvan)",
    inspector: "Direction Technique CFC",
    stage: "Second Œuvre & Finitions",
    progress: 92,
    status: "Favorable",
    date: "02 Sept 2026",
  },
  {
    id: "r5",
    ref: "RVC-2026-00378",
    ducId: "CFC-2026-DUC-04918",
    client: "KAMGA Roger",
    project: "Duplex Moderne (Bastos)",
    inspector: "Cabinet Polytech Sarl",
    stage: "Élévation Murs RDC",
    progress: 40,
    status: "Suspendu",
    date: "01 Sept 2026",
  },
  {
    id: "r6",
    ref: "RVC-2026-00377",
    ducId: "CFC-2026-DUC-04930",
    client: "ONANA David",
    project: "Villa Plain-Pied (Soa)",
    inspector: "Ing. Lucien Fame (BET Epsilon)",
    stage: "Coulage Dalle RDC",
    progress: 50,
    status: "Favorable",
    date: "31 Août 2026",
  },
];

type SiteReport = (typeof siteReports)[number];

const reportStatusStyles: Record<string, string> = {
  "Favorable": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Avec réserves": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Suspendu": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-risk-engineering-site-reports";

/**
 * Les colonnes des rapports de visite.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SITE_REPORT_COLUMNS: DataColumn<SiteReport>[] = [
  {
    key: "ref",
    label: "Réf. Rapport",
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
    label: "Emprunteur / Projet",
    accessor: (row) => row.client,
    // Le projet et le N° DUC sont affichés **dans la ligne**, sans être des
    // colonnes : ils restent trouvables par la recherche.
    searchValues: (row) => [row.project, row.ducId],
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-xs text-foreground truncate">
          {row.client}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          {row.project}
        </span>
      </div>
    ),
  },
  {
    key: "inspector",
    label: "Inspecteur / Cabinet BET",
    accessor: (row) => row.inspector,
    filterable: true,
    groupable: true,
  },
  {
    key: "stage",
    label: "Stade des Travaux",
    accessor: (row) => row.stage,
    filterable: true,
    groupable: true,
  },
  {
    key: "progress",
    label: "Avancement",
    // Le tri porte sur le **pourcentage** ; l'affichage garde sa barre.
    accessor: (row) => row.progress,
    render: (row) => (
      <div className="flex flex-col gap-1 min-w-[90px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground">{row.progress}%</span>
        </div>
        <Progress value={row.progress} className="h-1.5" />
      </div>
    ),
  },
  {
    key: "status",
    label: "Avis PV",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${reportStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date Visite",
    // La source mêle des dates relatives (« Aujourd'hui, 11:30 ») et des
    // dates écrites : elle n'est pas triable, et s'affiche telle quelle.
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

export default function SiteReportsPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: SITE_REPORT_COLUMNS,
    rows: siteReports,
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
      row: SiteReport;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[180px]">
          <span className="truncate block">{cell("inspector")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
          {cell("stage")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("progress")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("date")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("pv-visites.csv", [
      [
        "Réf. Rapport",
        "Emprunteur",
        "Projet",
        "Identifiant DUC",
        "Inspecteur / Cabinet BET",
        "Stade des Travaux",
        "Avancement",
        "Avis PV",
        "Date Visite",
      ],
      ...siteReports.map((report) => [
        report.ref,
        report.client,
        report.project,
        report.ducId,
        report.inspector,
        report.stage,
        `${report.progress}%`,
        report.status,
        report.date,
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
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent h-5 px-2 text-xs font-medium">
              Contrôle Terrain
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Rapports de Visite Chantier &amp; Inspections
          </h1>
          <p className="text-sm text-muted-foreground">
            Constats contradictoires sur site, taux d&apos;avancement des travaux, levée des réserves et conformité au devis approuvé.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={siteReportsKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Contrôle d&apos;avancement physique préalable aux déblocages de tranches</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={SITE_REPORT_COLUMNS}
          rows={siteReports}
          unitName="rapports"
          searchPlaceholder="Rechercher par référence, emprunteur, N° DUC ou inspecteur..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={SITE_REPORT_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun rapport ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
