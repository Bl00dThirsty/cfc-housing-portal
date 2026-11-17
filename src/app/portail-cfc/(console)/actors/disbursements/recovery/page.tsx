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
const TABLE_ID = "portail-cfc-disbursements-recovery";

const recoveryKpis: ActorKpiItem[] = [
  {
    title: "Taux PAR 30 (Impayés > 30j)",
    value: "2.4%",
    change: "0.3%",
    isPositive: true,
    previous: "2.7%",
    period: "seuil COBAC ≤ 5%",
  },
  {
    title: "Encours en Souffrance",
    value: "86 M FCFA",
    change: "12.2%",
    isPositive: true,
    previous: "98 M FCFA",
    period: "portefeuille total",
  },
  {
    title: "Promesses de Paiement Tenues",
    value: "82.5%",
    change: "5.0%",
    isPositive: true,
    previous: "77.5%",
    period: "relances amiables",
  },
  {
    title: "Dossiers Régularisés (Mois)",
    value: "41",
    change: "17.1%",
    isPositive: true,
    previous: "35 dossiers",
    period: "ce mois",
  },
  {
    title: "Transmis au Pré-Contentieux",
    value: "6",
    change: "25.0%",
    isPositive: true,
    previous: "8 dossiers",
    period: "impayés > 90 jours",
  },
];

export interface RecoveryRecordItem {
  id: string;
  ref: string;
  client: string;
  profession: string;
  ducId: string;
  agingCategory: string;
  overdueAmount: string;
  lastAction: string;
  status: string;
  dueDate: string;
}

const recoveryRecords: RecoveryRecordItem[] = [
  {
    id: "rec1",
    ref: "REC-2026-00145",
    client: "MVONDO Daniel",
    profession: "Commerçant Indépendant",
    ducId: "CFC-2024-DUC-01980",
    agingCategory: "PAR 30 (1 échéance)",
    overdueAmount: "185 000 FCFA",
    lastAction: "SMS de relance automatique",
    status: "Promesse au 15/09",
    dueDate: "Échue le 05 Août 2026",
  },
  {
    id: "rec2",
    ref: "REC-2026-00144",
    client: "FOTSING Pascal",
    profession: "Transporteur Urbain",
    ducId: "CFC-2025-DUC-03120",
    agingCategory: "PAR 60 (2 échéances)",
    overdueAmount: "412 000 FCFA",
    lastAction: "Entretien téléphonique gestionnaire",
    status: "Protocole en cours",
    dueDate: "Échue le 05 Juillet 2026",
  },
  {
    id: "rec3",
    ref: "REC-2026-00143",
    client: "BISSOHONG Christine",
    profession: "Employée Secteur Privé",
    ducId: "CFC-2024-DUC-02315",
    agingCategory: "PAR 90 (3 échéances)",
    overdueAmount: "645 000 FCFA",
    lastAction: "Mise en demeure avec AR",
    status: "Pré-contentieux",
    dueDate: "Échue le 05 Juin 2026",
  },
  {
    id: "rec4",
    ref: "REC-2026-00142",
    client: "EBOLO Vincent",
    profession: "Prestataire Événementiel",
    ducId: "CFC-2025-DUC-03890",
    agingCategory: "PAR 30 (1 échéance)",
    overdueAmount: "140 000 FCFA",
    lastAction: "Appel de courtoisie",
    status: "Promesse au 12/09",
    dueDate: "Échue le 05 Août 2026",
  },
  {
    id: "rec5",
    ref: "REC-2026-00141",
    client: "NGUIMBOUS Thomas",
    profession: "Entrepreneur BTP",
    ducId: "CFC-2023-DUC-01120",
    agingCategory: "PAR 90+ (Contentieux)",
    overdueAmount: "1 850 000 FCFA",
    lastAction: "Sommation de payer par Huissier",
    status: "Transmission CRC",
    dueDate: "Échue le 05 Avril 2026",
  },
  {
    id: "rec6",
    ref: "REC-2026-00140",
    client: "KENGNE Monique",
    profession: "Agent Commercial",
    ducId: "CFC-2025-DUC-03650",
    agingCategory: "Régularisé",
    overdueAmount: "0 FCFA",
    lastAction: "Règlement intégral constaté",
    status: "Régularisé",
    dueDate: "Apurement validé",
  },
];

const recoveryStatusStyles: Record<string, string> = {
  "Régularisé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Promesse au 15/09": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Promesse au 12/09": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Protocole en cours": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Pré-contentieux": "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Transmission CRC": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/**
 * Les colonnes du portefeuille des impayés.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const RECOVERY_COLUMNS: DataColumn<RecoveryRecordItem>[] = [
  {
    key: "ref",
    label: "Réf. Recouvrement",
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
    label: "Débiteur",
    accessor: (row) => row.client,
    // La profession est affichée **sous le nom** : elle n'est pas une colonne,
    // mais elle reste trouvable par la recherche.
    searchValues: (row) => [row.profession],
    // Un débiteur par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-800">
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
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
    render: (row) => (
      <span className="font-mono text-[11px] text-muted-foreground">{row.ducId}</span>
    ),
  },
  {
    key: "agingCategory",
    label: "Catégorie Retard",
    accessor: (row) => row.agingCategory,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge variant="outline" className="font-mono text-xs font-medium h-5 px-2 bg-muted/50">
        {row.agingCategory}
      </Badge>
    ),
  },
  {
    key: "overdueAmount",
    label: "Montant Impayé",
    // Le tri porte sur la **valeur** : « 185 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.overdueAmount.replace(/\D/g, "")),
    render: (row) => row.overdueAmount,
    align: "right",
  },
  {
    key: "lastAction",
    label: "Dernière Action Relance",
    accessor: (row) => row.lastAction,
    // Une action par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
  },
  {
    key: "status",
    label: "Statut Dossier",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${recoveryStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "dueDate",
    label: "Échéance",
    // La source mêle des dates écrites et un état (« Apurement validé ») : elle
    // n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.dueDate,
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

export default function RecoveryPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: RECOVERY_COLUMNS,
    rows: recoveryRecords,
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
      row: RecoveryRecordItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("agingCategory")}</TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
          {cell("overdueAmount")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[190px]">
          <span className="truncate block">{cell("lastAction")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("dueDate")}
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
    downloadCsv("portefeuille-impayes.csv", [
      [
        "Réf. Recouvrement",
        "Débiteur",
        "Profession",
        "Identifiant DUC",
        "Catégorie Retard",
        "Montant Impayé",
        "Dernière Action Relance",
        "Statut Dossier",
        "Échéance",
      ],
      ...recoveryRecords.map((item) => [
        item.ref,
        item.client,
        item.profession,
        item.ducId,
        item.agingCategory,
        item.overdueAmount,
        item.lastAction,
        item.status,
        item.dueDate,
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
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent h-5 px-2 text-xs font-medium">
              Recouvrement &amp; Contentieux
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Recouvrement Amiable &amp; Pré-Contentieux
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion graduée des impayés (PAR 30, 60, 90 jours), suivi des promesses de règlement, protocoles de rattrapage et déclenchement des procédures pré-contentieuses.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={recoveryKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Procédure graduée de recouvrement amiable préalable à la déchéance du terme
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={RECOVERY_COLUMNS}
          rows={recoveryRecords}
          unitName="dossiers"
          searchPlaceholder="Rechercher par référence, débiteur, N° DUC ou catégorie d'impayé..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={RECOVERY_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun dossier ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
