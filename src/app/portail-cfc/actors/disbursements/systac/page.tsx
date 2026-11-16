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

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-disbursements-systac";

const systacKpis: ActorKpiItem[] = [
  {
    title: "Virements Émis (Mois)",
    value: "1 420",
    change: "12.5%",
    isPositive: true,
    previous: "1 262 virements",
    period: "ce mois",
  },
  {
    title: "Volume Télécompensé",
    value: "1,85 Md FCFA",
    change: "14.2%",
    isPositive: true,
    previous: "1,62 Md FCFA",
    period: "flux SYSTAC BEAC",
  },
  {
    title: "Taux Réussite Directe",
    value: "99.1%",
    change: "0.3%",
    isPositive: true,
    previous: "98.8%",
    period: "règlement J+0",
  },
  {
    title: "Rejets / Anomalies RIB",
    value: "12",
    change: "25.0%",
    isPositive: true,
    previous: "16 rejets",
    period: "taux 0.8%",
  },
  {
    title: "Délai Moyen Règlement",
    value: "2.5 heures",
    change: "28.6%",
    isPositive: true,
    previous: "3.5 heures",
    period: "cible < 4h",
  },
];

export interface SystacTransferItem {
  id: string;
  ref: string;
  beneficiary: string;
  ducId: string;
  bank: string;
  amount: string;
  flowType: string;
  status: string;
  timestamp: string;
}

const systacRecords: SystacTransferItem[] = [
  {
    id: "sys1",
    ref: "SYS-2026-VIR-04812",
    beneficiary: "EBAH Rodrigue (Entreprise BTP)",
    ducId: "CFC-2026-DUC-04410",
    bank: "UBA Cameroun",
    amount: "6 400 000 FCFA",
    flowType: "Tranche VD Travaux (2/3)",
    status: "Exécuté SYSTAC",
    timestamp: "Aujourd'hui, 11:20",
  },
  {
    id: "sys2",
    ref: "SYS-2026-VIR-04811",
    beneficiary: "NDAM Oumarou",
    ducId: "CFC-2026-DUC-04480",
    bank: "Afriland First Bank",
    amount: "5 000 000 FCFA",
    flowType: "Tranche VD Travaux (1/3)",
    status: "Exécuté SYSTAC",
    timestamp: "Aujourd'hui, 09:45",
  },
  {
    id: "sys3",
    ref: "SYS-2026-VIR-04810",
    beneficiary: "Compte Séquestre Me Nkouendjin",
    ducId: "CFC-2026-DUC-04515",
    bank: "Société Générale Cameroun",
    amount: "12 800 000 FCFA",
    flowType: "Déblocage Acquisition Notariée",
    status: "En cours de compensation",
    timestamp: "Hier, 16:30",
  },
  {
    id: "sys4",
    ref: "SYS-2026-VIR-04809",
    beneficiary: "Cabinet BET Epsilon",
    ducId: "CFC-2026-DUC-04522",
    bank: "BICEC Cameroun",
    amount: "850 000 FCFA",
    flowType: "Honoraires Contre-Expertise",
    status: "Exécuté SYSTAC",
    timestamp: "Hier, 14:15",
  },
  {
    id: "sys5",
    ref: "SYS-2026-VIR-04808",
    beneficiary: "BEKONO Suzanne",
    ducId: "CFC-2026-DUC-04530",
    bank: "Ecobank Cameroun",
    amount: "4 200 000 FCFA",
    flowType: "Tranche VD Finitions (3/3)",
    status: "Rejeté (RIB non conforme)",
    timestamp: "02 Sept 2026",
  },
  {
    id: "sys6",
    ref: "SYS-2026-VIR-04807",
    beneficiary: "MAETUR Yaoundé",
    ducId: "CFC-2026-DUC-04545",
    bank: "SCB Cameroun",
    amount: "8 000 000 FCFA",
    flowType: "Règlement Parcelle Lotissement",
    status: "Exécuté SYSTAC",
    timestamp: "01 Sept 2026",
  },
];

const systacStatusStyles: Record<string, string> = {
  "Exécuté SYSTAC": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En cours de compensation": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Rejeté (RIB non conforme)": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/**
 * Les colonnes du journal des télécompensations SYSTAC.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SYSTAC_COLUMNS: DataColumn<SystacTransferItem>[] = [
  {
    key: "ref",
    label: "Réf. Virement SYSTAC",
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
    key: "beneficiary",
    label: "Bénéficiaire des Fonds",
    accessor: (row) => row.beneficiary,
    // Un bénéficiaire par ligne : ni facette, ni regroupement.
    filterable: false,
    groupable: false,
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
    key: "bank",
    label: "Banque Domiciliataire",
    accessor: (row) => row.bank,
    filterable: true,
  },
  {
    key: "flowType",
    label: "Nature du Règlement",
    accessor: (row) => row.flowType,
    filterable: true,
  },
  {
    key: "amount",
    label: "Montant Virement",
    // Le tri porte sur la **valeur** : « 6 400 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.amount.replace(/\D/g, "")),
    render: (row) => row.amount,
    align: "right",
  },
  {
    key: "status",
    label: "Statut Télécompensation",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${systacStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "timestamp",
    label: "Date & Heure",
    // La source mêle des dates relatives (« Aujourd'hui, 11:20 ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.timestamp,
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

export default function SystacPage() {
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: SYSTAC_COLUMNS,
    rows: systacRecords,
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
      row: SystacTransferItem;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
          {cell("beneficiary")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground">{cell("bank")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
          <span className="truncate block">{cell("flowType")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
          {cell("amount")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("timestamp")}
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
    downloadCsv("journal-systac.csv", [
      [
        "Réf. Virement SYSTAC",
        "Bénéficiaire des Fonds",
        "Identifiant DUC",
        "Banque Domiciliataire",
        "Nature du Règlement",
        "Montant Virement",
        "Statut Télécompensation",
        "Date & Heure",
      ],
      ...systacRecords.map((item) => [
        item.ref,
        item.beneficiary,
        item.ducId,
        item.bank,
        item.flowType,
        item.amount,
        item.status,
        item.timestamp,
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
              Télécompensation SYSTAC BEAC
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ordres de Virement &amp; Télécompensation SYSTAC
          </h1>
          <p className="text-sm text-muted-foreground">
            Émission des ordres de virement interbancaires, règlement des déblocages de tranches travaux et réconciliation automatique avec la plateforme SYSTAC.
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={systacKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground">
          Règlement interbancaire en temps réel · Système National des Règlements (BEAC)
        </p>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={SYSTAC_COLUMNS}
          rows={systacRecords}
          unitName="virements"
          searchPlaceholder="Rechercher par référence, bénéficiaire, banque ou type de flux..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={SYSTAC_COLUMNS}
          rows={visibleRecords}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucun virement ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
