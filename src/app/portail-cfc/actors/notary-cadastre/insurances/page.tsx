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

const insuranceKpis: ActorKpiItem[] = [
  {
    title: "Polices d'Assurance Actives",
    value: "1 120",
    change: "12.0%",
    isPositive: true,
    previous: "1 000 polices",
    period: "portefeuille DUC",
  },
  {
    title: "Taux de Couverture ADI",
    value: "98.8%",
    change: "0.6%",
    isPositive: true,
    previous: "98.2%",
    period: "Assurance Décès-Invalidité",
  },
  {
    title: "Capitaux Assurés Cumulés",
    value: "28,4 Mds FCFA",
    change: "16.4%",
    isPositive: true,
    previous: "24,4 Mds FCFA",
    period: "garanties sinistres",
  },
  {
    title: "Sinistres Déclarés (Mois)",
    value: "3",
    change: "0.0%",
    isPositive: true,
    previous: "3 dossiers",
    period: "indemnisation en cours",
  },
  {
    title: "Polices en Renouvellement",
    value: "24",
    change: "20.0%",
    isPositive: true,
    previous: "30",
    period: "primes annuelles",
  },
];

const insuranceRecords = [
  {
    id: "ins1",
    ref: "POL-AXA-2026-0489",
    client: "TCHOUNGUI Alain",
    ducId: "CFC-2026-DUC-04590",
    insurer: "AXA Assurances Cameroun",
    coverageType: "ADI (Décès-Invalidité) + Incendie",
    insuredCapital: "22 000 000 FCFA",
    annualPremium: "115 000 FCFA",
    status: "Attestation Validée",
    expiryDate: "30 Juin 2027",
  },
  {
    id: "ins2",
    ref: "POL-ACT-2026-0120",
    client: "ENOW George",
    ducId: "CFC-2026-DUC-04612",
    insurer: "Activa Assurances",
    coverageType: "Tous Risques Chantier (TRC)",
    insuredCapital: "18 000 000 FCFA",
    annualPremium: "140 000 FCFA",
    status: "Attestation Validée",
    expiryDate: "15 Mars 2027",
  },
  {
    id: "ins3",
    ref: "POL-CHA-2026-0834",
    client: "MANGA Estelle",
    ducId: "CFC-2026-DUC-04678",
    insurer: "Chanas Assurances",
    coverageType: "ADI (Décès-Invalidité)",
    insuredCapital: "14 500 000 FCFA",
    annualPremium: "82 000 FCFA",
    status: "Attestation Validée",
    expiryDate: "10 Sept 2027",
  },
  {
    id: "ins4",
    ref: "POL-SAA-2026-0312",
    client: "KOUAM Roger",
    ducId: "CFC-2026-DUC-04701",
    insurer: "Saar Assurances",
    coverageType: "Multirisque Habitation + Incendie",
    insuredCapital: "26 000 000 FCFA",
    annualPremium: "98 000 FCFA",
    status: "En attente prime",
    expiryDate: "30 Sept 2026",
  },
  {
    id: "ins5",
    ref: "POL-BOC-2026-0195",
    client: "EBODE Joseph",
    ducId: "CFC-2025-DUC-03912",
    insurer: "Beneficial Life Insurance",
    coverageType: "ADI (Décès-Invalidité)",
    insuredCapital: "12 000 000 FCFA",
    annualPremium: "65 000 FCFA",
    status: "Sinistre en Cours",
    expiryDate: "Instruction Recours",
  },
  {
    id: "ins6",
    ref: "POL-AXA-2025-0922",
    client: "TABI Robert",
    ducId: "CFC-2025-DUC-03844",
    insurer: "AXA Assurances Cameroun",
    coverageType: "Incendie & Éléments Naturels",
    insuredCapital: "15 000 000 FCFA",
    annualPremium: "75 000 FCFA",
    status: "Expirée (Relance)",
    expiryDate: "15 Août 2026",
  },
];

type InsuranceRecord = (typeof insuranceRecords)[number];

const insuranceStatusStyles: Record<string, string> = {
  "Attestation Validée": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En attente prime": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Sinistre en Cours": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Expirée (Relance)": "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "portail-cfc-notary-cadastre-insurances";

/**
 * Les colonnes du portefeuille d'assurances.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const INSURANCE_COLUMNS: DataColumn<InsuranceRecord>[] = [
  {
    key: "ref",
    label: "Réf. Police",
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
    label: "Emprunteur Assuré",
    accessor: (row) => row.client,
    filterable: false,
    groupable: false,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
            {getInitials(row.client)}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-xs text-foreground truncate">
          {row.client}
        </span>
      </div>
    ),
  },
  {
    key: "ducId",
    label: "Identifiant DUC",
    accessor: (row) => row.ducId,
    render: (row) => (
      <span className="font-mono text-[11px] text-muted-foreground">
        {row.ducId}
      </span>
    ),
  },
  {
    key: "insurer",
    label: "Compagnie d'Assurance",
    accessor: (row) => row.insurer,
    filterable: true,
    groupable: true,
  },
  {
    key: "coverageType",
    label: "Type de Couverture",
    accessor: (row) => row.coverageType,
    filterable: true,
    groupable: true,
  },
  {
    key: "insuredCapital",
    label: "Capital Garanti",
    // Le tri porte sur la **valeur** : « 22 000 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.insuredCapital.replace(/\D/g, "")),
    render: (row) => row.insuredCapital,
    align: "right",
  },
  {
    key: "status",
    label: "Statut Adhésion",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${insuranceStatusStyles[row.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.status}
      </Badge>
    ),
  },
  {
    key: "expiryDate",
    label: "Échéance",
    // La source mêle des dates écrites (« 30 Juin 2027 ») et un état métier
    // (« Instruction Recours ») : elle n'est pas triable, et s'affiche telle
    // quelle.
    accessor: (row) => row.expiryDate,
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

export default function InsurancesPage() {
  /** Les lignes que le moteur laisse passer, dans leur ordre d'affichage. */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: INSURANCE_COLUMNS,
    rows: insuranceRecords,
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
      row: InsuranceRecord;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="px-3 py-2.5">{cell("ref")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("client")}</TableCell>
        <TableCell className="px-3 py-2.5">{cell("ducId")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-foreground">
          {cell("insurer")}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
          <span className="truncate block">{cell("coverageType")}</span>
        </TableCell>
        <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
          {cell("insuredCapital")}
        </TableCell>
        <TableCell className="px-3 py-2.5">{cell("status")}</TableCell>
        <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
          {cell("expiryDate")}
        </TableCell>
        <TableCell className="text-right pr-4 py-2.5">{cell("actions")}</TableCell>
      </TableRow>
    ),
    [],
  );

  const handleExport = () => {
    downloadCsv("portefeuille-assurances.csv", [
      [
        "Réf. Police",
        "Emprunteur Assuré",
        "Identifiant DUC",
        "Compagnie d'Assurance",
        "Type de Couverture",
        "Capital Garanti",
        "Prime Annuelle",
        "Statut Adhésion",
        "Échéance",
      ],
      ...insuranceRecords.map((record) => [
        record.ref,
        record.client,
        record.ducId,
        record.insurer,
        record.coverageType,
        record.insuredCapital,
        record.annualPremium,
        record.status,
        record.expiryDate,
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
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Couverture Risques Sinistres
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Assurances Emprunteurs — Décès, Incendie &amp; TRC
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des polices d&apos;assurance déléguées au profit du CFC : Assurance Décès-Invalidité (ADI), Incendie Bâtiment et Tous Risques Chantier (TRC).
          </p>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={insuranceKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span>Délégation d&apos;indemnité subrogatoire en faveur du Crédit Foncier du Cameroun</span>
        </div>

        <DataTableToolbar
          tableId={TABLE_ID}
          columns={INSURANCE_COLUMNS}
          rows={insuranceRecords}
          unitName="polices"
          searchPlaceholder="Rechercher par police, emprunteur, N° DUC ou compagnie..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={INSURANCE_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune police ne correspond aux filtres appliqués."
        />
      </div>
    </div>
  );
}
