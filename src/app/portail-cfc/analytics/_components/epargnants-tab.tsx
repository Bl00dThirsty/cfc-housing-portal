"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ArrowRight, FileText, CreditCard, Download } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "@/lib/csv";
import { getInitials } from "@/lib/utils";

const epargnantsKpis: ActorKpiItem[] = [
  {
    title: "Total Épargnants Actifs",
    value: "4 820",
    change: "14.2%",
    isPositive: true,
    previous: "4 220",
    period: "ce mois",
  },
  {
    title: "Encours Épargne Mobilisé",
    value: "3,48 Mds FCFA",
    change: "19.5%",
    isPositive: true,
    previous: "2,91 Mds FCFA",
    period: "comptes Carthago",
  },
  {
    title: "Dépôt Moyen Mensuel",
    value: "142 500 FCFA",
    change: "6.8%",
    isPositive: true,
    previous: "133 400 FCFA",
    period: "par épargnant",
  },
  {
    title: "Taux d'Assiduité Versements",
    value: "86.4%",
    change: "3.2%",
    isPositive: true,
    previous: "83.2%",
    period: "versements réguliers",
  },
  {
    title: "Objectif Apport Atteint (Prêt)",
    value: "314",
    change: "21.0%",
    isPositive: true,
    previous: "259",
    period: "éligibles au crédit",
  },
];

interface SaverRecord {
  id: string;
  accountNumber: string;
  client: string;
  profession: string;
  segment: "Salarié Public" | "Salarié Privé" | "Indépendant" | "Diaspora" | "Collectif";
  agency: string;
  currentBalance: string;
  targetBalance: string;
  progressPercent: number;
  regularity: "Très régulier" | "Régulier" | "Irrégulier";
  lastDepositDate: string;
  contact: string;
  monthlyDeposit: string;
  joinedDate: string;
}

const saversList: SaverRecord[] = [
  {
    id: "sav1",
    accountNumber: "CPT-EH-2024-00481",
    client: "ABANDA Eric",
    profession: "Cadre Bancaire (Secteur Privé)",
    segment: "Salarié Privé",
    agency: "Agence Yaoundé Centre",
    currentBalance: "4 800 000 FCFA",
    targetBalance: "4 800 000 FCFA",
    progressPercent: 100,
    regularity: "Très régulier",
    lastDepositDate: "Aujourd'hui, 09:15",
    contact: "+237 699 45 12 80 · e.abanda@bicec.cm",
    monthlyDeposit: "250 000 FCFA / mois",
    joinedDate: "14 Mars 2024",
  },
  {
    id: "sav2",
    accountNumber: "CPT-EH-2024-00522",
    client: "EBALE Marthe",
    profession: "Enseignante Titulaire (MINESEC)",
    segment: "Salarié Public",
    agency: "Agence Bafoussam",
    currentBalance: "3 200 000 FCFA",
    targetBalance: "4 000 000 FCFA",
    progressPercent: 80,
    regularity: "Régulier",
    lastDepositDate: "Hier, 16:30",
    contact: "+237 677 82 34 11 · m.ebale@minesec.cm",
    monthlyDeposit: "120 000 FCFA / mois",
    joinedDate: "05 Juin 2024",
  },
  {
    id: "sav3",
    accountNumber: "CPT-EH-2025-00109",
    client: "TCHINDA Raoul",
    profession: "Ingénieur Télécom (France)",
    segment: "Diaspora",
    agency: "Guichet Diaspora / Siège",
    currentBalance: "6 000 000 FCFA",
    targetBalance: "6 000 000 FCFA",
    progressPercent: 100,
    regularity: "Très régulier",
    lastDepositDate: "02 Sept 2026",
    contact: "+33 6 45 78 92 10 · raoul.tchinda@orange.fr",
    monthlyDeposit: "500 000 FCFA / mois",
    joinedDate: "10 Janvier 2025",
  },
  {
    id: "sav4",
    accountNumber: "CPT-EH-2024-00390",
    client: "FOKAM Emmanuel",
    profession: "Commerçant Grossiste (Marché Central)",
    segment: "Indépendant",
    agency: "Agence Douala Bonanjo",
    currentBalance: "2 400 000 FCFA",
    targetBalance: "3 700 000 FCFA",
    progressPercent: 65,
    regularity: "Irrégulier",
    lastDepositDate: "30 Août 2026",
    contact: "+237 694 22 18 90 · fokam.grossiste@gmail.com",
    monthlyDeposit: "Versements libres (150k - 300k)",
    joinedDate: "22 Février 2024",
  },
  {
    id: "sav5",
    accountNumber: "CPT-EH-2025-00214",
    client: "NGONO Marie-Claire",
    profession: "Infirmière Diplômée d'État (Bruxelles)",
    segment: "Diaspora",
    agency: "Guichet Diaspora / Siège",
    currentBalance: "3 800 000 FCFA",
    targetBalance: "5 000 000 FCFA",
    progressPercent: 76,
    regularity: "Régulier",
    lastDepositDate: "28 Août 2026",
    contact: "+32 4 88 12 34 56 · mc.ngono@chu-bruxelles.be",
    monthlyDeposit: "200 000 FCFA / mois",
    joinedDate: "18 Avril 2025",
  },
  {
    id: "sav6",
    accountNumber: "CPT-EH-2023-00910",
    client: "GIC DES ENSEIGNANTS DE L'EXTRÊME-NORD",
    profession: "Groupement d'Épargne Solidaire",
    segment: "Collectif",
    agency: "Agence Maroua",
    currentBalance: "14 500 000 FCFA",
    targetBalance: "15 000 000 FCFA",
    progressPercent: 96,
    regularity: "Très régulier",
    lastDepositDate: "25 Août 2026",
    contact: "+237 671 90 22 45 · gic.habitat.maroua@yahoo.fr",
    monthlyDeposit: "850 000 FCFA / mois",
    joinedDate: "02 Novembre 2023",
  },
];

const segmentStyles: Record<string, string> = {
  "Salarié Public": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Salarié Privé": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  "Indépendant": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Diaspora": "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  "Collectif": "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "analytics-epargnants";

/**
 * Les colonnes du tableau des épargnants.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SAVER_COLUMNS: DataColumn<SaverRecord>[] = [
  {
    key: "client",
    label: "Épargnant",
    accessor: (row) => row.client,
    // La profession est affichée **sous le nom** dans la ligne : elle n'est
    // pas une colonne, mais elle reste trouvable par la recherche.
    searchValues: (row) => [row.profession],
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
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
    key: "accountNumber",
    label: "N° Compte Carthago",
    accessor: (row) => row.accountNumber,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.accountNumber}
      </Badge>
    ),
  },
  {
    key: "segment",
    label: "Segment",
    accessor: (row) => row.segment,
    // La facette remplace les anciens boutons « Tous / Diaspora / Public ».
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${segmentStyles[row.segment] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.segment}
      </Badge>
    ),
  },
  {
    key: "currentBalance",
    label: "Épargne Réalisée",
    // Le tri porte sur la **valeur** : « 4 800 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.currentBalance.replace(/\D/g, "")),
    render: (row) => row.currentBalance,
    align: "right",
  },
  {
    key: "targetBalance",
    label: "Objectif Apport",
    // La colonne porte l'objectif ; le taux d'avancement affiché à côté reste
    // trouvable par la recherche.
    accessor: (row) => Number(row.targetBalance.replace(/\D/g, "")),
    searchValues: (row) => [`${row.progressPercent}%`],
    render: (row) => (
      <div className="flex flex-col gap-1 min-w-[100px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-mono">
            {row.targetBalance}
          </span>
          <span className="font-semibold text-foreground">
            {row.progressPercent}%
          </span>
        </div>
        <Progress value={row.progressPercent} className="h-1.5" />
      </div>
    ),
  },
  {
    key: "agency",
    label: "Agence Rattachement",
    accessor: (row) => row.agency,
    filterable: true,
    groupable: true,
  },
  {
    key: "lastDepositDate",
    label: "Dernier Dépôt",
    // La source mêle des dates relatives (« Aujourd'hui, 09:15 ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.lastDepositDate,
    sortable: false,
  },
  {
    // La colonne d'actions porte un menu, pas une valeur : elle n'est ni
    // triable ni filtrable.
    key: "action",
    label: "Actions",
    sortable: false,
    align: "right",
  },
];

export function EpargnantsTab() {
  const router = useRouter();

  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: SAVER_COLUMNS,
    rows: saversList,
  });

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   */
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
      row,
      cell,
    }: {
      row: SaverRecord;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openSaver = () =>
        router.push(`/portail-cfc/analytics/savers/${row.id}`);

      return (
        <TableRow
          onClick={openSaver}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openSaver();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Ouvrir le dossier d'épargne de ${row.client}`}
          className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("accountNumber")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("segment")}</TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
            {cell("currentBalance")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("targetBalance")}</TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
            {cell("agency")}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
            {cell("lastDepositDate")}
          </TableCell>
          <TableCell
            className="text-right pr-4 py-2.5"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl">
                <DropdownMenuLabel className="text-xs font-semibold">
                  Actions Épargnant
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openSaver}
                  className="cursor-pointer text-xs"
                >
                  <FileText className="size-3.5 mr-2 text-muted-foreground" />
                  Consulter le dossier d&apos;épargne
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openSaver}
                  className="cursor-pointer text-xs"
                >
                  <CreditCard className="size-3.5 mr-2 text-muted-foreground" />
                  Extrait des versements (Carthago)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openSaver}
                  className="cursor-pointer text-xs"
                >
                  <Download className="size-3.5 mr-2 text-muted-foreground" />
                  Attestation de capacité d&apos;apport
                </DropdownMenuItem>
                {row.progressPercent >= 100 && (
                  <DropdownMenuItem
                    onClick={openSaver}
                    className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <ArrowRight className="size-3.5 mr-2" />
                    Initier le passage en crédit DUC
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    },
    [router],
  );

  const handleExport = () => {
    downloadCsv("epargnants-cfc.csv", [
      [
        "N° Compte",
        "Épargnant",
        "Profession",
        "Segment",
        "Agence",
        "Épargne Réalisée",
        "Objectif Apport",
        "Avancement",
        "Dernier Dépôt",
      ],
      ...saversList.map((row) => [
        row.accountNumber,
        row.client,
        row.profession,
        row.segment,
        row.agency,
        row.currentBalance,
        row.targetBalance,
        `${row.progressPercent}%`,
        row.lastDepositDate,
      ]),
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 5 KPIs Strip without icons */}
      <ActorKpiStrip items={epargnantsKpis} />

      {/* Segment Distribution summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Salariés Privé", count: "1 640", percent: "34%", color: "bg-purple-500" },
          { label: "Fonction Publique", count: "1 480", percent: "31%", color: "bg-blue-500" },
          { label: "Indépendants", count: "890", percent: "18%", color: "bg-amber-500" },
          { label: "Diaspora", count: "580", percent: "12%", color: "bg-indigo-500" },
          { label: "Collectifs & GIC", count: "230", percent: "5%", color: "bg-teal-500" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-3 flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-foreground">{item.count}</span>
              <span className="text-xs font-mono font-medium text-muted-foreground">{item.percent}</span>
            </div>
            <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden mt-1">
              <div className={`h-full ${item.color}`} style={{ width: item.percent }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={SAVER_COLUMNS}
          rows={saversList}
          unitName="épargnants"
          searchPlaceholder="Rechercher par épargnant, N° compte ou agence..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={SAVER_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun épargnant ne correspond aux filtres appliqués."
          headClassName="bg-muted/40"
        />
      </div>
    </div>
  );
}
