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

const oppositionKpis: ActorKpiItem[] = [
  {
    title: "Titres Fonciers Audités (Mois)",
    value: "108",
    change: "14.9%",
    isPositive: true,
    previous: "94 titres",
    period: "ce mois",
  },
  {
    title: "Taux Titres Sains & Francs",
    value: "92.6%",
    change: "1.8%",
    isPositive: true,
    previous: "90.8%",
    period: "sans charge ni litige",
  },
  {
    title: "Oppositions Bloquées",
    value: "8",
    change: "11.1%",
    isPositive: true,
    previous: "9 dossiers",
    period: "litiges / saisies",
  },
  {
    title: "Levées d'Opposition Obtenues",
    value: "5",
    change: "25.0%",
    isPositive: true,
    previous: "4 dossiers",
    period: "régularisations notariées",
  },
  {
    title: "Délai Moyen d'Audit Juridique",
    value: "2.4 jours",
    change: "20.0%",
    isPositive: true,
    previous: "3.0 jours",
    period: "cible ≤ 3j",
  },
];

const oppositionRecords = [
  {
    id: "opp1",
    ref: "AUD-FONC-2026-00318",
    landTitle: "TF N° 4892/Mfoundi",
    location: "Olembé (Yaoundé)",
    client: "TCHOUNGUI Alain",
    legalStatus: "Titre Libre & Franc",
    identifiedRisk: "Néant",
    legalOpinion: "Favorable",
    date: "Aujourd'hui, 08:45",
  },
  {
    id: "opp2",
    ref: "AUD-FONC-2026-00317",
    landTitle: "TF N° 12450/Wouri",
    location: "Bonapriso (Douala)",
    client: "ENOW George",
    legalStatus: "Hypothèque Antérieure en cours de radiation",
    identifiedRisk: "Condition suspensive de radiation",
    legalOpinion: "Favorable sous réserve",
    date: "Hier, 16:10",
  },
  {
    id: "opp3",
    ref: "AUD-FONC-2026-00316",
    landTitle: "TF N° 3120/Océan",
    location: "Kribi Urbain",
    client: "MANGA Estelle",
    legalStatus: "Titre Libre & Franc",
    identifiedRisk: "Néant",
    legalOpinion: "Favorable",
    date: "01 Sept 2026",
  },
  {
    id: "opp4",
    ref: "AUD-FONC-2026-00315",
    landTitle: "TF N° 7820/Nyong-et-Mfoumou",
    location: "Akonolinga",
    client: "ATANGANA Basile",
    legalStatus: "Opposition Successorale (Tribunal)",
    identifiedRisk: "Litige entre cohéritiers",
    legalOpinion: "Bloqué (Refus Juridique)",
    date: "31 Août 2026",
  },
  {
    id: "opp5",
    ref: "AUD-FONC-2026-00314",
    landTitle: "TF N° 9140/Mifi",
    location: "Bafoussam Centre",
    client: "FOTSO David",
    legalStatus: "Pré-notation Judiciaire conservatoire",
    identifiedRisk: "Créance tierce non purgée",
    legalOpinion: "Bloqué (Refus Juridique)",
    date: "29 Août 2026",
  },
  {
    id: "opp6",
    ref: "AUD-FONC-2026-00313",
    landTitle: "TF N° 6200/Fako",
    location: "Buea Town",
    client: "NDIP Samuel",
    legalStatus: "Servitude de Passage Public",
    identifiedRisk: "Servitude non restrictive sur emprise",
    legalOpinion: "Favorable",
    date: "28 Août 2026",
  },
];

type OppositionRecord = (typeof oppositionRecords)[number];

const legalOpinionStyles: Record<string, string> = {
  "Favorable": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Favorable sous réserve": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Bloqué (Refus Juridique)": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-notary-cadastre-oppositions";

/**
 * Les colonnes du registre des oppositions.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const OPPOSITION_COLUMNS: DataColumn<OppositionRecord>[] = [
  {
    key: "ref",
    label: "Réf. Audit",
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
    key: "location",
    label: "Localisation Parcelle",
    accessor: (row) => row.location,
    filterable: true,
    groupable: true,
  },
  {
    key: "client",
    label: "Emprunteur / Porteur",
    accessor: (row) => row.client,
    filterable: false,
    groupable: false,
  },
  {
    key: "legalStatus",
    label: "État Juridique du Titre",
    accessor: (row) => row.legalStatus,
    filterable: true,
    groupable: true,
  },
  {
    key: "identifiedRisk",
    label: "Risque Identifié",
    accessor: (row) => row.identifiedRisk,
    filterable: true,
  },
  {
    key: "legalOpinion",
    label: "Avis Juridique",
    accessor: (row) => row.legalOpinion,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${legalOpinionStyles[row.legalOpinion] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.legalOpinion}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date Audit",
    // La source mêle des dates relatives (« Aujourd'hui, 08:45 ») et des dates
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

export default function OppositionsPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: OPPOSITION_COLUMNS,
    rows: oppositionRecords,
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
      row: OppositionRecord;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
          {cell("location")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
          {cell("client")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[190px]">
          <span className="truncate block">{cell("legalStatus")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
          <span className="truncate block">{cell("identifiedRisk")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("legalOpinion")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("date")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("registre-oppositions.csv", [
      [
        "Réf. Audit",
        "Titre Foncier (TF)",
        "Localisation Parcelle",
        "Emprunteur / Porteur",
        "État Juridique du Titre",
        "Risque Identifié",
        "Avis Juridique",
        "Date Audit",
      ],
      ...oppositionRecords.map((record) => [
        record.ref,
        record.landTitle,
        record.location,
        record.client,
        record.legalStatus,
        record.identifiedRisk,
        record.legalOpinion,
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
              Groupe G8
            </Badge>
            <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-transparent h-5 px-2 text-xs font-medium">
              Contrôle Juridique &amp; Sûretés
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Contrôle des Pré-notations, Saisies &amp; Oppositions Foncières
          </h1>
          <p className="text-sm text-muted-foreground">
            Audit de conformité des titres fonciers proposés en garantie : vérification de l&apos;absence d&apos;oppositions judiciaires, litiges successoraux ou charges antérieures.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={oppositionKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Sécurisation de l&apos;hypothèque conventionnelle de 1er rang du Crédit Foncier</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={OPPOSITION_COLUMNS}
          rows={oppositionRecords}
          unitName="audits"
          searchPlaceholder="Rechercher par référence, Titre Foncier, emprunteur ou statut..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={OPPOSITION_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun audit ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
