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
const TABLE_ID = "portail-cfc-mortgage-release";

const mainleveeKpis: ActorKpiItem[] = [
  {
    title: "Prêts Éteints à Solde Nul",
    value: "24",
    change: "20.0%",
    isPositive: true,
    previous: "20",
    period: "ce mois",
  },
  {
    title: "Actes de Mainlevée Signés",
    value: "18",
    change: "28.6%",
    isPositive: true,
    previous: "14",
    period: "par la Direction Générale",
  },
  {
    title: "Titres Fonciers Originaux Libérés",
    value: "16",
    change: "33.3%",
    isPositive: true,
    previous: "12",
    period: "restitués aux clients",
  },
  {
    title: "Encours Total Régularisé",
    value: "185 M FCFA",
    change: "15.6%",
    isPositive: true,
    previous: "160 M FCFA",
    period: "ce mois",
  },
  {
    title: "Dossiers Orphelins ou Bloqués",
    value: "0",
    change: "0.0%",
    isPositive: true,
    previous: "0",
    period: "zéro contentieux en suspens",
  },
];

export interface MainleveeDossierItem {
  id: string;
  ducId: string;
  client: string;
  landTitle: string;
  loanTerm: string;
  closingAmount: string;
  deedStatus: string;
  originalTitleStatus: string;
  date: string;
}

const mainleveeDossiers: MainleveeDossierItem[] = [
  {
    id: "m1",
    ducId: "CFC-2026-DUC-03890",
    client: "KAMGA Pascal",
    landTitle: "TF N° 6120/Mfoundi",
    loanTerm: "Terme échu (15 ans)",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Acte Mainlevée Signé & Enregistré",
    originalTitleStatus: "TF Restitué en Mains Propres",
    date: "Aujourd'hui, 11:00",
  },
  {
    id: "m2",
    ducId: "CFC-2026-DUC-03912",
    client: "TCHATCHOUANG Hélène",
    landTitle: "TF N° 9415/Wouri",
    loanTerm: "Remboursement Anticipé",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Radiation Hypothèque MINDCAF",
    originalTitleStatus: "En coffre-fort agence",
    date: "Hier, 15:20",
  },
  {
    id: "m3",
    ducId: "CFC-2026-DUC-03945",
    client: "MVONDO Albert",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    loanTerm: "Terme échu (20 ans)",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Projet d'Acte Notarié en Signature",
    originalTitleStatus: "En cours de désarchivage",
    date: "01 Sept 2026",
  },
  {
    id: "m4",
    ducId: "CFC-2026-DUC-03980",
    client: "FOUDA Bernadette",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    loanTerm: "Terme échu (12 ans)",
    closingAmount: "0 FCFA (Solde Nul)",
    deedStatus: "Décompte d'Extinction Validé DFBC",
    originalTitleStatus: "En cours de désarchivage",
    date: "29 Août 2026",
  },
];

/**
 * Les colonnes du tableau des mainlevées.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const MAINLEVEE_COLUMNS: DataColumn<MainleveeDossierItem>[] = [
  {
    key: "client",
    label: "Bénéficiaire / Motif",
    accessor: (row) => row.client,
    // Le motif est affiché **sous le nom** : il n'est pas une colonne, mais il
    // reste trouvable par la recherche.
    searchValues: (row) => [row.loanTerm],
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">{row.client}</span>
          <span className="text-[11px] text-muted-foreground truncate">{row.loanTerm}</span>
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
    key: "landTitle",
    label: "Titre Foncier (TF)",
    accessor: (row) => row.landTitle,
    render: (row) => (
      <Badge
        variant="secondary"
        className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200"
      >
        {row.landTitle}
      </Badge>
    ),
  },
  {
    key: "closingAmount",
    label: "Solde Extinction",
    // Le tri porte sur la **valeur** : « 0 FCFA (Solde Nul) » se compare par
    // son montant, pas alphabétiquement.
    accessor: (row) => Number(row.closingAmount.replace(/\D/g, "")),
    render: (row) => row.closingAmount,
    align: "right",
  },
  {
    key: "deedStatus",
    label: "Statut Acte Mainlevée",
    accessor: (row) => row.deedStatus,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
      >
        {row.deedStatus}
      </Badge>
    ),
  },
  {
    key: "originalTitleStatus",
    label: "Restitution TF Original",
    accessor: (row) => row.originalTitleStatus,
    filterable: true,
  },
  {
    // La colonne d'actions ne porte pas de valeur : elle n'est ni triable ni
    // filtrable.
    key: "actions",
    label: "Actions",
    sortable: false,
  },
];

export default function MainleveeClotureActorPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: MAINLEVEE_COLUMNS,
    rows: mainleveeDossiers,
  });

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   *
   * Le moteur a appliqué la recherche, les facettes et le tri ; le tableau
   * reçoit donc ses lignes déjà ordonnées.
   */
  const visibleDossiers = React.useMemo(
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
      row: MainleveeDossierItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("landTitle")}</TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-emerald-600">
          {cell("closingAmount")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("deedStatus")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground font-medium">
          {cell("originalTitleStatus")}
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
    downloadCsv("registre-mainlevees.csv", [
      [
        "Identifiant DUC",
        "Bénéficiaire",
        "Motif",
        "Titre Foncier",
        "Solde Extinction",
        "Statut Acte Mainlevée",
        "Restitution TF Original",
      ],
      ...mainleveeDossiers.map((item) => [
        item.ducId,
        item.client,
        item.loanTerm,
        item.landTitle,
        item.closingAmount,
        item.deedStatus,
        item.originalTitleStatus,
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
              Clôture, Mainlevée &amp; Conservation Foncière
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Conservation Foncière — Clôture &amp; Mainlevée
          </h1>
          <p className="text-sm text-muted-foreground">
            Décompte d&apos;extinction des prêts à solde nul, rédaction des actes de mainlevée d&apos;hypothèque, radiation au Cadastre MINDCAF et restitution sécurisée des Titres Fonciers originaux.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={mainleveeKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Phase 6 du Circuit CFC · Clôture Définitive &amp; Libération Titre Foncier
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={MAINLEVEE_COLUMNS}
          rows={mainleveeDossiers}
          unitName="dossiers"
          searchPlaceholder="Rechercher par emprunteur, N° DUC, Titre Foncier ou statut..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={MAINLEVEE_COLUMNS}
          rows={visibleDossiers}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
