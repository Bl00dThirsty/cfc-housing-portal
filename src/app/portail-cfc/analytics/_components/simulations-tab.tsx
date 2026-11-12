"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Download, MoreHorizontal, ArrowRight, FileText } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function SimulationsTab() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("all");

  const filtered = simulationsData.filter((s) => {
    const matchesSearch =
      s.prospect.toLowerCase().includes(search.toLowerCase()) ||
      s.simRef.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || s.projectType === selectedType;
    return matchesSearch && matchesType;
  });

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, demandeur ou localisation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedType("all")}
              className={`h-7 text-xs px-2.5 ${selectedType === "all" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              Tous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedType("Autoconstruction")}
              className={`h-7 text-xs px-2.5 ${selectedType === "Autoconstruction" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              Autoconstruction
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedType("Acquisition SIC")}
              className={`h-7 text-xs px-2.5 ${selectedType === "Acquisition SIC" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              SIC
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium ml-2">
              <Download className="size-3.5" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Simulation</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Prospect / Demandeur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Nature du Projet</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Prêt</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Apport Prévu</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Mensualité Estimée</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-center px-3">Endettement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/analytics/simulations/${item.id}`)}
                >
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.simRef}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{item.prospect}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{item.profession}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${projectTypeStyles[item.projectType] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.projectType}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.loanAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                    {item.downPayment}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.monthlyPayment}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                    {item.debtRatio}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.date}
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl">
                        <DropdownMenuLabel className="text-xs font-semibold">Actions Simulation</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/simulations/${item.id}`)} className="cursor-pointer text-xs">
                          <FileText className="size-3.5 mr-2 text-muted-foreground" />
                          Consulter la fiche détaillée
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin/actors/agency")} className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400 font-medium">
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
