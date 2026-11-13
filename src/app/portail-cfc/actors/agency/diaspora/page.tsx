"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { TableCell, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/utils";

export interface DiasporaDossierItem {
  id: string;
  client: string;
  country: string;
  flag: string;
  ducId: string;
  savings: string;
  channel: string;
  kyc: string;
  date: string;
}

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-agency-diaspora";

const diasporaKpis: ActorKpiItem[] = [
  {
    title: "Dossiers Diaspora Actifs",
    value: "348",
    change: "18.4%",
    isPositive: true,
    previous: "294",
    period: "ce trimestre",
  },
  {
    title: "Nouveaux Enrôlements (Mois)",
    value: "42",
    change: "27.3%",
    isPositive: true,
    previous: "33",
    period: "ce mois",
  },
  {
    title: "Épargne Collectée Diaspora",
    value: "1,24 Md FCFA",
    change: "21.6%",
    isPositive: true,
    previous: "1,02 Md FCFA",
    period: "ce trimestre",
  },
  {
    title: "Pays d'Origine Top",
    value: "France",
    change: "38%",
    isPositive: true,
    previous: "du flux total",
    period: "ce trimestre",
  },
  {
    title: "Taux Complétude KYC",
    value: "82.1%",
    change: "5.4%",
    isPositive: true,
    previous: "76.7%",
    period: "ce mois",
  },
];

const diasporaDossiers: DiasporaDossierItem[] = [
  {
    id: "dd1",
    client: "TCHINDA Raoul",
    country: "France",
    flag: "🇫🇷",
    ducId: "CFC-2026-DUC-04935",
    savings: "6 000 000 FCFA",
    channel: "Portail Web",
    kyc: "Complet",
    date: "Aujourd'hui, 08:30",
  },
  {
    id: "dd2",
    client: "NGONO Marie-Claire",
    country: "Belgique",
    flag: "🇧🇪",
    ducId: "CFC-2026-DUC-04941",
    savings: "3 800 000 FCFA",
    channel: "Portail Web",
    kyc: "Complet",
    date: "Hier, 21:15",
  },
  {
    id: "dd3",
    client: "EYANGA Patrick",
    country: "Canada",
    flag: "🇨🇦",
    ducId: "CFC-2026-DUC-04945",
    savings: "8 200 000 FCFA",
    channel: "Portail Web",
    kyc: "Complet",
    date: "02 Sept 2026",
  },
  {
    id: "dd4",
    client: "BIYONG Alain",
    country: "Gabon",
    flag: "🇬🇦",
    ducId: "CFC-2026-DUC-04950",
    savings: "2 500 000 FCFA",
    channel: "Agence Partenaire",
    kyc: "En cours",
    date: "01 Sept 2026",
  },
  {
    id: "dd5",
    client: "ATEBA Carine",
    country: "Allemagne",
    flag: "🇩🇪",
    ducId: "CFC-2026-DUC-04953",
    savings: "4 100 000 FCFA",
    channel: "Portail Web",
    kyc: "Incomplet",
    date: "30 Août 2026",
  },
  {
    id: "dd6",
    client: "NDAM Michel",
    country: "États-Unis",
    flag: "🇺🇸",
    ducId: "CFC-2026-DUC-04958",
    savings: "12 500 000 FCFA",
    channel: "Portail Web",
    kyc: "Complet",
    date: "28 Août 2026",
  },
];

const kycStyles: Record<string, string> = {
  "Complet": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En cours": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Incomplet": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/**
 * Les colonnes du tableau des dossiers diaspora.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const DIASPORA_COLUMNS: DataColumn<DiasporaDossierItem>[] = [
  {
    key: "client",
    label: "Emprunteur",
    accessor: (row) => row.client,
  },
  {
    key: "country",
    label: "Pays de Résidence",
    accessor: (row) => row.country,
    filterable: true,
    groupable: true,
    // Le drapeau est une décoration : la valeur filtrable reste le pays.
    render: (row) => (
      <div className="flex items-center gap-1.5 text-xs text-foreground">
        <span>{row.flag}</span>
        <span>{row.country}</span>
      </div>
    ),
  },
  {
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
  },
  {
    key: "savings",
    label: "Épargne Constituée",
    // Le tri porte sur la **valeur** : « 6 000 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.savings.replace(/\D/g, "")),
    render: (row) => row.savings,
    align: "right",
  },
  {
    key: "channel",
    label: "Canal",
    accessor: (row) => row.channel,
    filterable: true,
    groupable: true,
  },
  {
    key: "kyc",
    label: "Statut KYC",
    accessor: (row) => row.kyc,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${kycStyles[row.kyc] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.kyc}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date Ouverture",
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
  },
];

export default function DiasporaPage() {
  const router = useRouter();

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
      row: DiasporaDossierItem;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openDossier = () => router.push("/portail-cfc/clients/cl-8");

      return (
        <TableRow
          onClick={openDossier}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDossier();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Ouvrir le dossier client de ${row.client}`}
          className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          <TableCell className="px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-700">
                  {getInitials(row.client)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openDossier();
                }}
                aria-label={`Ouvrir le dossier client de ${row.client}`}
                className="text-left font-medium hover:underline text-xs text-foreground truncate"
              >
                {cell("client")}
              </button>
            </div>
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("country")}</TableCell>
          <TableCell className="px-3 py-2.5">
            <Badge
              variant="outline"
              className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
            >
              {cell("ducId")}
            </Badge>
          </TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
            {cell("savings")}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-foreground">
            {cell("channel")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("kyc")}</TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
            {cell("date")}
          </TableCell>
          <TableCell
            className="text-right pr-4 py-2.5"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={openDossier}
              aria-label={`Ouvrir le dossier client de ${row.client}`}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <Eye className="size-4" />
            </Button>
          </TableCell>
        </TableRow>
      );
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G1
            </Badge>
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-transparent h-5 px-2 text-xs font-medium">
              Réseau International
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Guichet Diaspora &amp; Non-Résidents
          </h1>
          <p className="text-sm text-muted-foreground">
            Enrôlement et suivi du Dossier Unique Client (DUC) ouvert par la diaspora camerounaise (Europe, Amérique, Afrique) via le portail distant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Diaspora
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <ActorKpiStrip items={diasporaKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={DIASPORA_COLUMNS}
          rows={diasporaDossiers}
          unitName="dossiers"
          searchPlaceholder="Rechercher par emprunteur, N° DUC ou pays..."
        />

        <DataTable
          tableId={TABLE_ID}
          columns={DIASPORA_COLUMNS}
          rows={diasporaDossiers}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier diaspora ne correspond aux critères de recherche."
        />
      </div>
    </div>
  );
}
