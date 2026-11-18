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
const TABLE_ID = "portail-cfc-mortgage-release-archive";

const archiveKpis: ActorKpiItem[] = [
  {
    title: "Dossier Unique Client (DUC) Clôturés (Mois)",
    value: "24",
    change: "20.0%",
    isPositive: true,
    previous: "20 dossiers",
    period: "cycle de vie achevé",
  },
  {
    title: "Taux Numérisation Complète",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "GED intègre & scellée",
  },
  {
    title: "Volume d'Archives GED",
    value: "45 Go",
    change: "8.5%",
    isPositive: true,
    previous: "41.5 Go",
    period: "coffre numérique",
  },
  {
    title: "Audits de Clôture Validés",
    value: "100%",
    change: "0.0%",
    isPositive: true,
    previous: "100%",
    period: "conformité COBAC",
  },
  {
    title: "Prescription Légale OHADA",
    value: "30 ans",
    change: "0.0%",
    isPositive: true,
    previous: "30 ans",
    period: "durée d'archivage",
  },
];

export interface ArchivedDossierItem {
  id: string;
  ducId: string;
  client: string;
  profession: string;
  totalLoan: string;
  loanDuration: string;
  gedArchiveCode: string;
  status: string;
  closureDate: string;
}

const archiveRecords: ArchivedDossierItem[] = [
  {
    id: "arc1",
    ducId: "CFC-2026-DUC-03890",
    client: "KAMGA Pascal",
    profession: "Commerçant Import-Export",
    totalLoan: "15 000 000 FCFA",
    loanDuration: "15 ans (2011 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0812 / Rayon E-14",
    status: "Dossier Scellé & Archivé",
    closureDate: "02 Septembre 2026",
  },
  {
    id: "arc2",
    ducId: "CFC-2026-DUC-03912",
    client: "TCHATCHOUANG Hélène",
    profession: "Cadre Paramédical",
    totalLoan: "28 000 000 FCFA",
    loanDuration: "10 ans (2016 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0811 / Rayon B-08",
    status: "Dossier Scellé & Archivé",
    closureDate: "01 Septembre 2026",
  },
  {
    id: "arc3",
    ducId: "CFC-2026-DUC-03945",
    client: "MVONDO Albert",
    profession: "Enseignant Retraité",
    totalLoan: "12 000 000 FCFA",
    loanDuration: "20 ans (2006 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0810 / Rayon D-02",
    status: "En cours de numérisation finale",
    closureDate: "28 Août 2026",
  },
  {
    id: "arc4",
    ducId: "CFC-2026-DUC-03980",
    client: "FOUDA Bernadette",
    profession: "Fonctionnaire MINFI",
    totalLoan: "9 500 000 FCFA",
    loanDuration: "12 ans (2014 - 2026)",
    gedArchiveCode: "GED-ARCH-2026-0809 / Rayon A-19",
    status: "Visa Audit Final",
    closureDate: "26 Août 2026",
  },
  {
    id: "arc5",
    ducId: "CFC-2025-DUC-03410",
    client: "BASSOMGBEN Jean",
    profession: "Ingénieur Télécoms",
    totalLoan: "18 000 000 FCFA",
    loanDuration: "15 ans (2010 - 2025)",
    gedArchiveCode: "GED-ARCH-2025-0640 / Rayon C-11",
    status: "Dossier Scellé & Archivé",
    closureDate: "15 Août 2026",
  },
  {
    id: "arc6",
    ducId: "CFC-2025-DUC-03150",
    client: "NGUEMO Paul",
    profession: "Agriculteur Exploitant",
    totalLoan: "14 000 000 FCFA",
    loanDuration: "18 ans (2007 - 2025)",
    gedArchiveCode: "GED-ARCH-2025-0588 / Rayon F-05",
    status: "Dossier Scellé & Archivé",
    closureDate: "10 Août 2026",
  },
];

const archiveStatusStyles: Record<string, string> = {
  "Dossier Scellé & Archivé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Visa Audit Final": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En cours de numérisation finale": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

/**
 * Les colonnes du répertoire des clôtures archivées.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const ARCHIVE_COLUMNS: DataColumn<ArchivedDossierItem>[] = [
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
    key: "client",
    label: "Emprunteur",
    accessor: (row) => row.client,
    // La profession est affichée **sous le nom** : elle n'est pas une colonne,
    // mais elle reste trouvable par la recherche.
    searchValues: (row) => [row.profession],
    // Un emprunteur par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-slate-500/15 text-slate-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">{row.client}</span>
          <span className="text-[11px] text-muted-foreground truncate">{row.profession}</span>
        </div>
      </div>
    ),
  },
  {
    key: "totalLoan",
    label: "Montant Prêt Historique",
    // Le tri porte sur la **valeur** : « 15 000 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.totalLoan.replace(/\D/g, "")),
    render: (row) => row.totalLoan,
    align: "right",
  },
  {
    key: "loanDuration",
    label: "Cycle de Vie du Prêt",
    accessor: (row) => row.loanDuration,
  },
  {
    key: "gedArchiveCode",
    label: "Cote GED & Rayonnage",
    accessor: (row) => row.gedArchiveCode,
    // Une cote par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
  },
  {
    key: "status",
    label: "Statut Scellement",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${archiveStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "closureDate",
    label: "Date Clôture",
    // La date est écrite en long (« 02 Septembre 2026 ») : elle n'est pas
    // lisible par `parseCfcDate`, donc pas triable — elle s'affiche telle
    // quelle.
    accessor: (row) => row.closureDate,
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

export default function ReleaseArchivePage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: ARCHIVE_COLUMNS,
    rows: archiveRecords,
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
      row: ArchivedDossierItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
          {cell("totalLoan")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("loanDuration")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-mono text-foreground max-w-[200px]">
          <span className="truncate block">{cell("gedArchiveCode")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("closureDate")}
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
    downloadCsv("repertoire-closures.csv", [
      [
        "Identifiant DUC",
        "Emprunteur",
        "Profession",
        "Montant Prêt Historique",
        "Cycle de Vie du Prêt",
        "Cote GED & Rayonnage",
        "Statut Scellement",
        "Date Clôture",
      ],
      ...archiveRecords.map((item) => [
        item.ducId,
        item.client,
        item.profession,
        item.totalLoan,
        item.loanDuration,
        item.gedArchiveCode,
        item.status,
        item.closureDate,
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
              Groupe G4
            </Badge>
            <Badge variant="secondary" className="bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-transparent h-5 px-2 text-xs font-medium">
              Archivage Légal &amp; Audit
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Clôture Définitive &amp; Archivage DUC (GED)
          </h1>
          <p className="text-sm text-muted-foreground">
            Clôture comptable dans Carthago, scellement numérique du Dossier Unique Client (DUC) et archivage patrimonial sécurisé conforme aux normes OHADA.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={archiveKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Conservation patrimoniale trentenaire · Intégrité et traçabilité certifiées
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={ARCHIVE_COLUMNS}
          rows={archiveRecords}
          unitName="dossiers"
          searchPlaceholder="Rechercher par N° DUC, emprunteur, cote GED ou profession..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={ARCHIVE_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
