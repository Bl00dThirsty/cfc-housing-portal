"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ArrowRight, FileText, Download } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";
import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
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

const simulationsKpis: ActorKpiItem[] = [
  {
    title: "Simulations Réalisées (Mois)",
    value: "2 140",
    change: "28.5%",
    isPositive: true,
    previous: "1 665",
    period: "ce mois",
  },
  {
    title: "Montant Moyen Sollicité",
    value: "18,2 M FCFA",
    change: "7.4%",
    isPositive: true,
    previous: "16,9 M FCFA",
    period: "par simulation",
  },
  {
    title: "Apport Moyen Envisagé",
    value: "4,4 M FCFA",
    change: "11.2%",
    isPositive: true,
    previous: "3,9 M FCFA",
    period: "ratio 24.1%",
  },
  {
    title: "Durée Moyenne Souhaitée",
    value: "18,4 ans",
    change: "1.8%",
    isPositive: false,
    previous: "18,8 ans",
    period: "amortissement",
  },
  {
    title: "Taux de Transformation en DUC",
    value: "32.6%",
    change: "4.8%",
    isPositive: true,
    previous: "27.8%",
    period: "prospects qualifiés",
  },
];

interface SimulationItem {
  id: string;
  simRef: string;
  prospect: string;
  profession: string;
  projectType: "Autoconstruction" | "Acquisition SIC" | "Achat Terrain MAETUR" | "Rénovation / Extension";
  loanAmount: string;
  downPayment: string;
  monthlyIncome: string;
  monthlyPayment: string;
  debtRatio: string;
  recommendedProduct: string;
  date: string;
  contact: string;
  location: string;
}

const simulationsData: SimulationItem[] = [
  {
    id: "sim1",
    simRef: "SIM-CFC-2026-0812",
    prospect: "ABANDA Eric",
    profession: "Cadre Bancaire",
    projectType: "Autoconstruction",
    loanAmount: "18 500 000 FCFA",
    downPayment: "4 800 000 FCFA (26%)",
    monthlyIncome: "850 000 FCFA",
    monthlyPayment: "135 400 FCFA",
    debtRatio: "15.9%",
    recommendedProduct: "Prêt Bonifié Fonctionnaire / Cadre",
    date: "Aujourd'hui, 10:45",
    contact: "+237 699 45 12 80",
    location: "Olembé (Yaoundé)",
  },
  {
    id: "sim2",
    simRef: "SIM-CFC-2026-0811",
    prospect: "NKOULOU Sandrine",
    profession: "Comptable Entreprise",
    projectType: "Acquisition SIC",
    loanAmount: "14 000 000 FCFA",
    downPayment: "3 200 000 FCFA (23%)",
    monthlyIncome: "480 000 FCFA",
    monthlyPayment: "102 500 FCFA",
    debtRatio: "21.3%",
    recommendedProduct: "Crédit Acquéreur Logement Social SIC",
    date: "Hier, 15:20",
    contact: "+237 677 82 34 11",
    location: "Mbankolo (Yaoundé)",
  },
  {
    id: "sim3",
    simRef: "SIM-CFC-2026-0810",
    prospect: "TCHINDA Raoul",
    profession: "Ingénieur Télécom (France)",
    projectType: "Autoconstruction",
    loanAmount: "32 000 000 FCFA",
    downPayment: "8 000 000 FCFA (25%)",
    monthlyIncome: "2 600 000 FCFA",
    monthlyPayment: "235 000 FCFA",
    debtRatio: "9.0%",
    recommendedProduct: "Crédit Immobilier Diaspora CFC",
    date: "Hier, 11:15",
    contact: "+33 6 45 78 92 10",
    location: "Bastos (Yaoundé)",
  },
  {
    id: "sim4",
    simRef: "SIM-CFC-2026-0809",
    prospect: "FOKAM Emmanuel",
    profession: "Commerçant Indépendant",
    projectType: "Achat Terrain MAETUR",
    loanAmount: "8 500 000 FCFA",
    downPayment: "2 500 000 FCFA (29%)",
    monthlyIncome: "650 000 FCFA",
    monthlyPayment: "88 400 FCFA",
    debtRatio: "13.6%",
    recommendedProduct: "Prêt Foncier Lotissement MAETUR",
    date: "02 Sept 2026",
    contact: "+237 694 22 18 90",
    location: "Mendong Extension (Yaoundé)",
  },
  {
    id: "sim5",
    simRef: "SIM-CFC-2026-0808",
    prospect: "BEKONO Suzanne",
    profession: "Enseignante Primaire",
    projectType: "Rénovation / Extension",
    loanAmount: "6 000 000 FCFA",
    downPayment: "1 500 000 FCFA (25%)",
    monthlyIncome: "280 000 FCFA",
    monthlyPayment: "58 200 FCFA",
    debtRatio: "20.8%",
    recommendedProduct: "Prêt Amélioration de l'Habitat",
    date: "01 Sept 2026",
    contact: "+237 671 09 45 66",
    location: "Nkolbisson (Yaoundé)",
  },
];

const projectTypeStyles: Record<string, string> = {
  "Autoconstruction": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  "Acquisition SIC": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Achat Terrain MAETUR": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Rénovation / Extension": "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "analytics-simulations";

/**
 * Les colonnes du tableau des simulations.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const SIMULATION_COLUMNS: DataColumn<SimulationItem>[] = [
  {
    key: "simRef",
    label: "Réf. Simulation",
    accessor: (row) => row.simRef,
    render: (row) => (
      <Badge
        variant="outline"
        className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2"
      >
        {row.simRef}
      </Badge>
    ),
  },
  {
    key: "prospect",
    label: "Prospect / Demandeur",
    accessor: (row) => row.prospect,
    // La profession est affichée **sous le nom** dans la ligne, et la
    // localisation n'y est pas affichée : les deux restent trouvables par la
    // recherche.
    searchValues: (row) => [row.profession, row.location],
    render: (row) => (
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-xs text-foreground truncate">
          {row.prospect}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          {row.profession}
        </span>
      </div>
    ),
  },
  {
    key: "projectType",
    label: "Nature du Projet",
    accessor: (row) => row.projectType,
    // La facette remplace les anciens boutons « Tous / Autoconstruction / SIC ».
    filterable: true,
    groupable: true,
    render: (row) => (
      <Badge
        variant="secondary"
        className={`${projectTypeStyles[row.projectType] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
      >
        {row.projectType}
      </Badge>
    ),
  },
  {
    key: "loanAmount",
    label: "Montant Prêt",
    // Le tri porte sur la **valeur** : « 18 500 000 FCFA » se compare par son
    // montant, pas alphabétiquement.
    accessor: (row) => Number(row.loanAmount.replace(/\D/g, "")),
    render: (row) => row.loanAmount,
    align: "right",
  },
  {
    key: "downPayment",
    label: "Apport Prévu",
    // L'apport porte son pourcentage : « 4 800 000 FCFA (26%) » se compare par
    // son montant, pas par ses chiffres concaténés.
    accessor: (row) =>
      Number(row.downPayment.split(" FCFA")[0].replace(/\D/g, "")),
    render: (row) => row.downPayment,
  },
  {
    key: "monthlyPayment",
    label: "Mensualité Estimée",
    accessor: (row) => Number(row.monthlyPayment.replace(/\D/g, "")),
    render: (row) => row.monthlyPayment,
    align: "right",
  },
  {
    key: "debtRatio",
    label: "Endettement",
    // Le tri porte sur le **taux** : « 15.9% » se compare par sa valeur, pas
    // alphabétiquement.
    accessor: (row) => Number(row.debtRatio.replace("%", "")),
    render: (row) => row.debtRatio,
    align: "center",
  },
  {
    key: "date",
    label: "Date",
    // La source mêle des dates relatives (« Aujourd'hui, 10:45 ») et des dates
    // écrites : elle n'est pas triable, et s'affiche telle quelle.
    accessor: (row) => row.date,
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

export function SimulationsTab() {
  const router = useRouter();

  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: SIMULATION_COLUMNS,
    rows: simulationsData,
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
      row: SimulationItem;
      cell: (key: string) => React.ReactNode;
    }) => {
      const openSimulation = () =>
        router.push(`/portail-cfc/analytics/simulations/${row.id}`);

      return (
        <TableRow
          onClick={openSimulation}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openSimulation();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Ouvrir la simulation de ${row.prospect}`}
          className="hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          <TableCell className="px-3 py-2.5">{cell("simRef")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("prospect")}</TableCell>
          <TableCell className="px-3 py-2.5">{cell("projectType")}</TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
            {cell("loanAmount")}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
            {cell("downPayment")}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
            {cell("monthlyPayment")}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
            {cell("debtRatio")}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
            {cell("date")}
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
                  Actions Simulation
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openSimulation}
                  className="cursor-pointer text-xs"
                >
                  <FileText className="size-3.5 mr-2 text-muted-foreground" />
                  Consulter la fiche détaillée
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/portail-cfc/actors/agency")}
                  className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  <ArrowRight className="size-3.5 mr-2" />
                  Convertir en Dossier Unique Client (DUC)
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-xs">
                  <Download className="size-3.5 mr-2 text-muted-foreground" />
                  Télécharger la fiche de calcul (PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    },
    [router],
  );

  const handleExport = () => {
    downloadCsv("simulations-cfc.csv", [
      [
        "Référence",
        "Prospect",
        "Profession",
        "Nature du Projet",
        "Montant Prêt",
        "Apport Prévu",
        "Mensualité Estimée",
        "Endettement",
        "Date",
      ],
      ...simulationsData.map((row) => [
        row.simRef,
        row.prospect,
        row.profession,
        row.projectType,
        row.loanAmount,
        row.downPayment,
        row.monthlyPayment,
        row.debtRatio,
        row.date,
      ]),
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 5 KPIs Strip without icons */}
      <ActorKpiStrip items={simulationsKpis} />

      {/* Project Typology Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Autoconstruction Individuelle", count: "1 024", share: "48%", color: "bg-purple-500" },
          { label: "Acquisitions Logements SIC", count: "556", share: "26%", color: "bg-blue-500" },
          { label: "Terrains Lotis MAETUR", count: "342", share: "16%", color: "bg-amber-500" },
          { label: "Rénovation & Extension", count: "218", share: "10%", color: "bg-teal-500" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-3 flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-foreground">{item.count}</span>
              <span className="text-xs font-mono font-medium text-muted-foreground">{item.share}</span>
            </div>
            <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden mt-1">
              <div className={`h-full ${item.color}`} style={{ width: item.share }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <DataTableToolbar
          tableId={TABLE_ID}
          columns={SIMULATION_COLUMNS}
          rows={simulationsData}
          unitName="simulations"
          searchPlaceholder="Rechercher par référence, demandeur ou localisation..."
          onExport={handleExport}
        />

        <DataTable
          tableId={TABLE_ID}
          columns={SIMULATION_COLUMNS}
          rows={visible}
          getRowId={(row) => row.id}
          renderRow={renderRow}
          emptyLabel="Aucune simulation ne correspond aux filtres appliqués."
          headClassName="bg-muted/40"
        />
      </div>
    </div>
  );
}
