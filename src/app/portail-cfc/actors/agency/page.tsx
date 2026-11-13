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
import { agencyLabel } from "@/domain/entities/agencies";
import { getInitials } from "@/lib/utils";

export interface AgencyDossierItem {
  id: string;
  ducId: string;
  client: string;
  profession: string;
  agency: string;
  savingsAmount: string;
  savingsProgress: string;
  status: string;
  date: string;
}

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-agency";

const agenceKpis: ActorKpiItem[] = [
  {
    title: "Dossiers Enrôlés (Mois)",
    value: "1 240",
    change: "14.8%",
    isPositive: true,
    previous: "1 080",
    period: "ce mois",
  },
  {
    title: "Collecte Épargne Habitat",
    value: "845,2 M FCFA",
    change: "18.4%",
    isPositive: true,
    previous: "713,8 M FCFA",
    period: "ce mois",
  },
  {
    title: "Comptes KYC Conformes",
    value: "842",
    change: "8.2%",
    isPositive: true,
    previous: "778",
    period: "ce mois",
  },
  {
    title: "Taux d'Apport Moyen",
    value: "21.8%",
    change: "1.5%",
    isPositive: true,
    previous: "20.3%",
    period: "ce mois",
  },
  {
    title: "Transmis BET / Risques",
    value: "314",
    change: "12.0%",
    isPositive: true,
    previous: "280",
    period: "ce mois",
  },
];

const agenceDossiers: AgencyDossierItem[] = [
  {
    id: "d1",
    ducId: "CFC-2026-DUC-04829",
    client: "ABANDA Eric",
    profession: "Cadre Bancaire (Salarié)",
    agency: "Agence Yaoundé Centre",
    savingsAmount: "4 800 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "Aujourd'hui, 14:30",
  },
  {
    id: "d2",
    ducId: "CFC-2026-DUC-04910",
    client: "FOKAM Emmanuel",
    profession: "Commerçant (Indépendant)",
    agency: "Agence Douala Bonanjo",
    savingsAmount: "2 400 000 FCFA",
    savingsProgress: "65%",
    status: "Épargne en cours",
    date: "Hier, 11:15",
  },
  {
    id: "d3",
    ducId: "CFC-2026-DUC-04922",
    client: "EBALE Marthe",
    profession: "Enseignante (Fonction Publique)",
    agency: "Agence Bafoussam",
    savingsAmount: "3 200 000 FCFA",
    savingsProgress: "80%",
    status: "Pièces KYC en validation",
    date: "01 Sept 2026",
  },
  {
    id: "d4",
    ducId: "CFC-2026-DUC-04935",
    client: "TCHINDA Raoul",
    profession: "Ingénieur Télécom (Diaspora)",
    agency: "Guichet Diaspora / Centre",
    savingsAmount: "6 000 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "31 Août 2026",
  },
  {
    id: "d5",
    ducId: "CFC-2026-DUC-04940",
    client: "NGO NSOA Marie",
    profession: "Médecin Généraliste",
    agency: "Agence Yaoundé Centre",
    savingsAmount: "2 880 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "30 Août 2026",
  },
  {
    id: "d6",
    ducId: "CFC-2026-DUC-04948",
    client: "TCHOUNGUI Alain",
    profession: "Pharmacien Titulaire",
    agency: "Agence Douala Bonanjo",
    savingsAmount: "4 200 000 FCFA",
    savingsProgress: "75%",
    status: "Épargne en cours",
    date: "29 Août 2026",
  },
  {
    id: "d7",
    ducId: "CFC-2026-DUC-04952",
    client: "EBAH Rodrigue",
    profession: "Architecte DPLG",
    agency: "Agence Yaoundé Centre",
    savingsAmount: "5 100 000 FCFA",
    savingsProgress: "80%",
    status: "Pièces KYC en validation",
    date: "28 Août 2026",
  },
  {
    id: "d8",
    ducId: "CFC-2026-DUC-04959",
    client: "NDONGO Valérie",
    profession: "Directrice Financière (Diaspora)",
    agency: "Guichet Diaspora / Centre",
    savingsAmount: "9 000 000 FCFA",
    savingsProgress: "100%",
    status: "Prêt pour BET",
    date: "27 Août 2026",
  },
];

/**
 * Les colonnes du tableau des dossiers de l'agence.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const AGENCY_COLUMNS: DataColumn<AgencyDossierItem>[] = [
  {
    key: "client",
    label: "Emprunteur",
    accessor: (row) => row.client,
    // La profession est affichée **dans la ligne**, sous le nom : elle n'est
    // pas une colonne, mais elle reste trouvable par la recherche.
    searchValues: (row) => [row.profession],
  },
  {
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
  },
  {
    key: "agency",
    label: "Agence de Rattachement",
    accessor: (row) => row.agency,
    filterable: true,
    groupable: true,
    // La donnée porte le nom complet ; la facette et l'en-tête de groupe
    // portent le nom court — comme avant la migration.
    groupLabel: (value) => agencyLabel(value),
    facetLabel: (value) => agencyLabel(value),
  },
  {
    key: "savingsAmount",
    label: "Épargne Constituée",
    // Le tri porte sur la **valeur** : « 4 800 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.savingsAmount.replace(/\D/g, "")),
    render: (row) => row.savingsAmount,
    align: "right",
  },
  {
    key: "status",
    label: "Statut Instruction",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={
          row.status === "Prêt pour BET"
            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
            : "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 h-5 px-2 text-xs font-medium"
        }
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "date",
    label: "Date MAJ",
    // La source mêle des dates relatives (« Aujourd'hui, 14:30 ») et des dates
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

export default function AgenceActorPage() {
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
      row: AgencyDossierItem;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openDossier = () =>
        router.push(`/portail-cfc/clients/${row.id.replace("d", "cl-")}`);

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
                <AvatarFallback className="rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-700">
                  {getInitials(row.client)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
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
                <span className="text-[11px] text-muted-foreground truncate">
                  {row.profession}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell className="px-3 py-2.5">
            <Badge
              variant="outline"
              className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
            >
              {cell("ducId")}
            </Badge>
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-foreground">
            {cell("agency")}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
            {cell("savingsAmount")}
          </TableCell>
          <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
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
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-transparent h-5 px-2 text-xs font-medium">
              Production des Crédits
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agence &amp; Réseau Commercial (CFC)
          </h1>
          <p className="text-sm text-muted-foreground">
            Enrôlement citoyen, suivi des versements Épargne Habitat (MoMo/SYSTAC) et complétude du Dossier Unique Client (DUC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Portefeuille
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={agenceKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={AGENCY_COLUMNS}
          rows={agenceDossiers}
          unitName="dossiers"
          searchPlaceholder="Rechercher par emprunteur, N° DUC ou agence..."
        />

        <DataTable
          tableId={TABLE_ID}
          columns={AGENCY_COLUMNS}
          rows={agenceDossiers}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier ne correspond aux filtres sélectionnés."
        />
      </div>
    </div>
  );
}
