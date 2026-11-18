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
const TABLE_ID = "portail-cfc-mortgage-release-deeds";

const deedsKpis: ActorKpiItem[] = [
  {
    title: "Actes Rédigés (Mois)",
    value: "28",
    change: "16.7%",
    isPositive: true,
    previous: "24 actes",
    period: "ce mois",
  },
  {
    title: "Signatures DG Obtenues",
    value: "22",
    change: "22.2%",
    isPositive: true,
    previous: "18 actes",
    period: "paraphes Direction Générale",
  },
  {
    title: "Délai Rédaction Acte",
    value: "3.1 jours",
    change: "16.2%",
    isPositive: true,
    previous: "3.7 jours",
    period: "cible ≤ 4j",
  },
  {
    title: "En Attente Signature Notaire",
    value: "6",
    change: "14.3%",
    isPositive: true,
    previous: "7 actes",
    period: "en étude notariale",
  },
  {
    title: "Actes Enregistrés Fisc",
    value: "19",
    change: "18.8%",
    isPositive: true,
    previous: "16 actes",
    period: "droits de mainlevée réglés",
  },
];

export interface DeedRecordItem {
  id: string;
  ref: string;
  client: string;
  ducId: string;
  landTitle: string;
  notaryOffice: string;
  initialLoan: string;
  status: string;
  signedDate: string;
}

const deedsRecords: DeedRecordItem[] = [
  {
    id: "mde1",
    ref: "MLV-2026-ACT-00128",
    client: "KAMGA Pascal",
    ducId: "CFC-2026-DUC-03890",
    landTitle: "TF N° 6120/Mfoundi",
    notaryOffice: "Étude Me Nkouendjin (Yaoundé)",
    initialLoan: "15 000 000 FCFA",
    status: "Signé DG & Notaire",
    signedDate: "02 Septembre 2026",
  },
  {
    id: "mde2",
    ref: "MLV-2026-ACT-00127",
    client: "TCHATCHOUANG Hélène",
    ducId: "CFC-2026-DUC-03912",
    landTitle: "TF N° 9415/Wouri",
    notaryOffice: "Étude Me Douala Manga (Douala)",
    initialLoan: "28 000 000 FCFA",
    status: "Transmis Enregistrement",
    signedDate: "01 Septembre 2026",
  },
  {
    id: "mde3",
    ref: "MLV-2026-ACT-00126",
    client: "MVONDO Albert",
    ducId: "CFC-2026-DUC-03945",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    notaryOffice: "Étude Me Bisseck (Kribi)",
    initialLoan: "12 000 000 FCFA",
    status: "En attente signature DG",
    signedDate: "Projet validé 03/09",
  },
  {
    id: "mde4",
    ref: "MLV-2026-ACT-00125",
    client: "FOUDA Bernadette",
    ducId: "CFC-2026-DUC-03980",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    notaryOffice: "Étude Me Kamdem (Bafoussam)",
    initialLoan: "9 500 000 FCFA",
    status: "En attente signature Notaire",
    signedDate: "Transmis le 28/08",
  },
  {
    id: "mde5",
    ref: "MLV-2026-ACT-00124",
    client: "BASSOMGBEN Jean",
    ducId: "CFC-2025-DUC-03410",
    landTitle: "TF N° 4118/Sanaga-Maritime",
    notaryOffice: "Étude Me Fotso (Edéa)",
    initialLoan: "18 000 000 FCFA",
    status: "Signé DG & Notaire",
    signedDate: "25 Août 2026",
  },
  {
    id: "mde6",
    ref: "MLV-2026-ACT-00123",
    client: "NGUEMO Paul",
    ducId: "CFC-2025-DUC-03150",
    landTitle: "TF N° 8210/Menoua",
    notaryOffice: "Étude Me Kamdem (Dschang)",
    initialLoan: "14 000 000 FCFA",
    status: "Transmis Enregistrement",
    signedDate: "22 Août 2026",
  },
];

const deedStatusStyles: Record<string, string> = {
  "Signé DG & Notaire": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Transmis Enregistrement": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En attente signature DG": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "En attente signature Notaire": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};

/**
 * Les colonnes du registre des actes de mainlevée.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const DEED_COLUMNS: DataColumn<DeedRecordItem>[] = [
  {
    key: "ref",
    label: "Réf. Mainlevée",
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
    label: "Bénéficiaire de la Mainlevée",
    accessor: (row) => row.client,
    // Un bénéficiaire par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
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
    key: "landTitle",
    label: "Titre Foncier (TF)",
    accessor: (row) => row.landTitle,
    render: (row) => (
      <Badge
        variant="secondary"
        className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200 border-transparent"
      >
        {row.landTitle}
      </Badge>
    ),
  },
  {
    key: "notaryOffice",
    label: "Étude Notariale",
    accessor: (row) => row.notaryOffice,
    // Une étude par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
  },
  {
    key: "initialLoan",
    label: "Prêt Garanti",
    // Le tri porte sur la **valeur** : « 15 000 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.initialLoan.replace(/\D/g, "")),
    render: (row) => row.initialLoan,
    align: "right",
  },
  {
    key: "status",
    label: "Statut de l'Acte",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${deedStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "signedDate",
    label: "Date Signature",
    // La source mêle des dates écrites et des étapes (« Transmis le 28/08 ») :
    // elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.signedDate,
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

export default function MortgageDeedsPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: DEED_COLUMNS,
    rows: deedsRecords,
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
      row: DeedRecordItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[180px]">
          <span className="truncate block">{cell("notaryOffice")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
          {cell("initialLoan")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("signedDate")}
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
    downloadCsv("registre-actes-mainlevee.csv", [
      [
        "Réf. Mainlevée",
        "Bénéficiaire de la Mainlevée",
        "Identifiant DUC",
        "Titre Foncier",
        "Étude Notariale",
        "Prêt Garanti",
        "Statut de l'Acte",
        "Date Signature",
      ],
      ...deedsRecords.map((item) => [
        item.ref,
        item.client,
        item.ducId,
        item.landTitle,
        item.notaryOffice,
        item.initialLoan,
        item.status,
        item.signedDate,
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
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Actes de Mainlevée Notariée
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Actes de Mainlevée d&apos;Hypothèque Notariée
          </h1>
          <p className="text-sm text-muted-foreground">
            Établissement des projets d&apos;actes authentiques de mainlevée totale d&apos;hypothèque, signature de la Direction Générale et transmission aux études notariales.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={deedsKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Mainlevée totale et définitive après constatation du solde nul par la DFBC
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={DEED_COLUMNS}
          rows={deedsRecords}
          unitName="actes"
          searchPlaceholder="Rechercher par acte, emprunteur, Titre Foncier ou notaire..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={DEED_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun acte ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
