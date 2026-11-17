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
const TABLE_ID = "portail-cfc-disbursements";

const dfbcKpis: ActorKpiItem[] = [
  {
    title: "Volume Décaissements (Mois)",
    value: "620 M FCFA",
    change: "16.5%",
    isPositive: true,
    previous: "532 M FCFA",
    period: "ce mois",
  },
  {
    title: "Tranches VD Débloquées",
    value: "38",
    change: "8.6%",
    isPositive: true,
    previous: "35",
    period: "après attachement BET",
  },
  {
    title: "Taux de Recouvrement Amortissement",
    value: "98.2%",
    change: "0.8%",
    isPositive: true,
    previous: "97.4%",
    period: "échéances échues",
  },
  {
    title: "Prélèvements SYSTAC Automatiques",
    value: "1 180",
    change: "14.0%",
    isPositive: true,
    previous: "1 035",
    period: "virements domiciliés",
  },
  {
    title: "Taux d'Impayés / Pré-contentieux",
    value: "1.8%",
    change: "0.4%",
    isPositive: true,
    previous: "2.2%",
    period: "seuil COBAC ≤ 5%",
  },
];

export interface DisbursementDossierItem {
  id: string;
  ducId: string;
  client: string;
  purpose: string;
  trancheNumber: string;
  trancheAmount: string;
  beneficiaryBank: string;
  vdStatus: string;
  date: string;
}

const dfbcDossiers: DisbursementDossierItem[] = [
  {
    id: "f1",
    ducId: "CFC-2026-DUC-04410",
    client: "EBAH Rodrigue",
    purpose: "Construction Villa (Yaoundé)",
    trancheNumber: "Tranche 2/3 (Gros Œuvre)",
    trancheAmount: "6 400 000 FCFA",
    beneficiaryBank: "UBA Cameroun (SYSTAC)",
    vdStatus: "Attachement BET 65% Validé",
    date: "Aujourd'hui, 08:30",
  },
  {
    id: "f2",
    ducId: "CFC-2026-DUC-04480",
    client: "NDAM Oumarou",
    purpose: "Immeuble R+1 (Foumban)",
    trancheNumber: "Tranche 1/3 (Fondations)",
    trancheAmount: "5 000 000 FCFA",
    beneficiaryBank: "Afriland First Bank",
    vdStatus: "Virement Exécuté Carthago",
    date: "Hier, 14:10",
  },
  {
    id: "f3",
    ducId: "CFC-2026-DUC-04515",
    client: "BEKONO Suzanne",
    purpose: "Habitat Social SIC",
    trancheNumber: "Tranche Unique (Acquisition)",
    trancheAmount: "12 800 000 FCFA",
    beneficiaryBank: "Compte Séquestre Notaire",
    vdStatus: "Déblocage Notarié Ordonnancé",
    date: "01 Sept 2026",
  },
  {
    id: "f4",
    ducId: "CFC-2026-DUC-04530",
    client: "SONG Emmanuel",
    purpose: "Travaux Second Œuvre (Douala)",
    trancheNumber: "Tranche 3/3 (Finitions)",
    trancheAmount: "4 200 000 FCFA",
    beneficiaryBank: "Société Générale Cameroun",
    vdStatus: "En Attente Visa Contrôle Financier",
    date: "30 Août 2026",
  },
];

/**
 * Les colonnes du tableau des décaissements.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const DISBURSEMENT_COLUMNS: DataColumn<DisbursementDossierItem>[] = [
  {
    key: "client",
    label: "Bénéficiaire / Projet",
    accessor: (row) => row.client,
    // Le projet est affiché **sous le nom** : il n'est pas une colonne, mais il
    // reste trouvable par la recherche.
    searchValues: (row) => [row.purpose],
    // Un bénéficiaire par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-teal-500/15 text-teal-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">{row.client}</span>
          <span className="text-[11px] text-muted-foreground truncate">{row.purpose}</span>
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
    key: "trancheNumber",
    label: "Tranche / Phase Travaux",
    accessor: (row) => row.trancheNumber,
    filterable: true,
    groupable: true,
  },
  {
    key: "trancheAmount",
    label: "Montant Tranche",
    // Le tri porte sur la **valeur** : « 6 400 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.trancheAmount.replace(/\D/g, "")),
    render: (row) => row.trancheAmount,
    align: "right",
  },
  {
    key: "beneficiaryBank",
    label: "Banque / Canal",
    accessor: (row) => row.beneficiaryBank,
    filterable: true,
  },
  {
    key: "vdStatus",
    label: "Statut Décaissement",
    accessor: (row) => row.vdStatus,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={
          row.vdStatus.includes("Exécuté") || row.vdStatus.includes("Validé")
            ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 h-5 px-2 text-xs font-medium"
            : "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 h-5 px-2 text-xs font-medium"
        }
      >
        {row.vdStatus}
      </Badge>
    ),
  },
  {
    // La colonne d'actions ne porte pas de valeur : elle n'est ni triable ni
    // filtrable.
    key: "actions",
    label: "Actions",
    sortable: false,
  },
];

export default function DfbcDecaissementsActorPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: DISBURSEMENT_COLUMNS,
    rows: dfbcDossiers,
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
      row: DisbursementDossierItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">
          {cell("trancheNumber")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
          {cell("trancheAmount")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
          {cell("beneficiaryBank")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("vdStatus")}</TableCell>
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
    downloadCsv("journal-reglements.csv", [
      [
        "Identifiant DUC",
        "Bénéficiaire",
        "Projet",
        "Tranche / Phase Travaux",
        "Montant Tranche",
        "Banque / Canal",
        "Statut Décaissement",
      ],
      ...dfbcDossiers.map((item) => [
        item.ducId,
        item.client,
        item.purpose,
        item.trancheNumber,
        item.trancheAmount,
        item.beneficiaryBank,
        item.vdStatus,
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
              Groupe G7
            </Badge>
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent h-5 px-2 text-xs font-medium">
              Finances, Budget &amp; Comptabilité (DFBC)
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            DFBC — Décaissements &amp; Vie des Prêts
          </h1>
          <p className="text-sm text-muted-foreground">
            Comptabilité clientèle, déblocages échelonnés par tranche selon la Valeur Disponible (VD), suivi des décomptes BET et recouvrement des échéances SYSTAC.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={dfbcKpis} />

      {/* Main Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Phase 5 du Circuit CFC · Déblocages Échelonnés &amp; Amortissement
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={DISBURSEMENT_COLUMNS}
          rows={dfbcDossiers}
          unitName="décaissements"
          searchPlaceholder="Rechercher par emprunteur, N° DUC, banque ou tranche..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={DISBURSEMENT_COLUMNS}
          rows={visibleDossiers}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun décaissement ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
