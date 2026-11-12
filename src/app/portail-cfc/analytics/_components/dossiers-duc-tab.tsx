"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Download, MoreHorizontal, CheckCircle2, Clock, FileText, ArrowRight } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

const ducKpis: ActorKpiItem[] = [
  {
    title: "Dossier Unique Client (DUC) en Pipeline",
    value: "1 240",
    change: "15.8%",
    isPositive: true,
    previous: "1 071",
    period: "ce mois",
  },
  {
    title: "Complétude Moyenne Pièces",
    value: "84.2%",
    change: "6.4%",
    isPositive: true,
    previous: "77.8%",
    period: "GED numérique",
  },
  {
    title: "Délai Enrôlement → Décision",
    value: "14,5 jours",
    change: "18.5%",
    isPositive: true,
    previous: "17,8 jours",
    period: "cible ≤ 15j",
  },
  {
    title: "Taux Accord Comités CGR/CRC",
    value: "92.4%",
    change: "2.1%",
    isPositive: true,
    previous: "90.3%",
    period: "décisions favorables",
  },
  {
    title: "Financements Décaissés",
    value: "4,85 Mds FCFA",
    change: "24.0%",
    isPositive: true,
    previous: "3,91 Mds FCFA",
    period: "cumul exercice",
  },
];

interface DucDossier {
  id: string;
  ducId: string;
  client: string;
  project: string;
  currentPhase: "G1 · Enrôlement & Épargne" | "G3 · Risques & BET" | "G6 · Comités CGR/CRC" | "G8 · Notaires & Cadastre" | "G7 · Décaissements DFBC" | "G4 · Clôture";
  phaseCode: "G1" | "G3" | "G6" | "G8" | "G7" | "G4";
  completionPercent: number;
  loanAmount: string;
  landTitle: string;
  officer: string;
  lastUpdate: string;
  createdDate: string;
  riskStatus: "Faible" | "Modéré" | "Attention";
}

const ducList: DucDossier[] = [
  {
    id: "duc1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    project: "Construction Villa R+1 (Olembé)",
    currentPhase: "G3 · Risques & BET",
    phaseCode: "G3",
    completionPercent: 85,
    loanAmount: "18 500 000 FCFA",
    landTitle: "TF N° 4892/Mfoundi",
    officer: "Mme Belinga (Agence Centre)",
    lastUpdate: "Aujourd'hui, 11:10",
    createdDate: "12 Août 2026",
    riskStatus: "Faible",
  },
  {
    id: "duc2",
    ducId: "CFC-2026-DUC-04712",
    client: "FOTSO Michel",
    project: "Immeuble Locatif R+2 (Bonapriso)",
    currentPhase: "G6 · Comités CGR/CRC",
    phaseCode: "G6",
    completionPercent: 95,
    loanAmount: "25 000 000 FCFA",
    landTitle: "TF N° 12450/Wouri",
    officer: "M. Talla (Agence Bonanjo)",
    lastUpdate: "Hier, 16:45",
    createdDate: "05 Juillet 2026",
    riskStatus: "Modéré",
  },
  {
    id: "duc3",
    ducId: "CFC-2026-DUC-04655",
    client: "NGO NSOA Marie",
    project: "Acquisition Appartement SIC (Mbankolo)",
    currentPhase: "G8 · Notaires & Cadastre",
    phaseCode: "G8",
    completionPercent: 90,
    loanAmount: "14 400 000 FCFA",
    landTitle: "TF N° 3110/Mfoundi",
    officer: "M. Etoa (Guichet Siège)",
    lastUpdate: "02 Sept 2026",
    createdDate: "20 Juin 2026",
    riskStatus: "Faible",
  },
  {
    id: "duc4",
    ducId: "CFC-2026-DUC-04410",
    client: "EBAH Rodrigue",
    project: "Construction Pavillon (Yaoundé)",
    currentPhase: "G7 · Décaissements DFBC",
    phaseCode: "G7",
    completionPercent: 100,
    loanAmount: "18 000 000 FCFA",
    landTitle: "TF N° 7812/Mfoundi",
    officer: "DFBC Trésorerie",
    lastUpdate: "01 Sept 2026",
    createdDate: "15 Avril 2026",
    riskStatus: "Faible",
  },
  {
    id: "duc5",
    ducId: "CFC-2026-DUC-04880",
    client: "ATANGANA Thérèse",
    project: "Acquisition & Extension (Mbankolo)",
    currentPhase: "G1 · Enrôlement & Épargne",
    phaseCode: "G1",
    completionPercent: 60,
    loanAmount: "12 000 000 FCFA",
    landTitle: "TF N° 9042/Mfoundi",
    officer: "M. Onana (Agence Bastos)",
    lastUpdate: "30 Août 2026",
    createdDate: "24 Août 2026",
    riskStatus: "Attention",
  },
];

const phaseStyles: Record<string, string> = {
  G1: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  G3: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  G6: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  G8: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  G7: "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  G4: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export function DossiersDucTab() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedPhase, setSelectedPhase] = React.useState<string>("all");

  const filtered = ducList.filter((d) => {
    const matchesSearch =
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.project.toLowerCase().includes(search.toLowerCase()) ||
      d.landTitle.toLowerCase().includes(search.toLowerCase());
    const matchesPhase = selectedPhase === "all" || d.phaseCode === selectedPhase;
    return matchesSearch && matchesPhase;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 5 KPIs Strip without icons */}
      <ActorKpiStrip items={ducKpis} />

      {/* Funnel Pipeline Visual */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {[
          { phase: "G1 · Enrôlement", count: "480", share: "100%", color: "bg-blue-500" },
          { phase: "G3 · Risques BET", count: "312", share: "65%", color: "bg-amber-500" },
          { phase: "G6 · Comités", count: "198", share: "41%", color: "bg-purple-500" },
          { phase: "G8 · Notariat", count: "142", share: "30%", color: "bg-indigo-500" },
          { phase: "G7 · Décaissements", count: "84", share: "18%", color: "bg-teal-500" },
          { phase: "G4 · Clôture", count: "24", share: "5%", color: "bg-emerald-500" },
        ].map((step) => (
          <div key={step.phase} className="rounded-xl border bg-card p-3 flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] text-muted-foreground truncate">{step.phase}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-foreground">{step.count}</span>
              <span className="text-xs font-mono font-medium text-muted-foreground">{step.share}</span>
            </div>
            <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden mt-1">
              <div className={`h-full ${step.color}`} style={{ width: step.share }} />
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
              placeholder="Rechercher par N° DUC, emprunteur, Titre Foncier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPhase("all")}
              className={`h-7 text-xs px-2.5 ${selectedPhase === "all" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              Tous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPhase("G3")}
              className={`h-7 text-xs px-2.5 ${selectedPhase === "G3" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              G3 Risques
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPhase("G6")}
              className={`h-7 text-xs px-2.5 ${selectedPhase === "G6" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              G6 Comités
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
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur / Projet</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Étape Actuelle (Acteur)</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Complétude GED</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Crédit</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Garantie Foncier</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Dernière MAJ</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/analytics/dossiers/${item.id}`)}
                >
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ducId}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.project}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${phaseStyles[item.phaseCode] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.currentPhase}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex flex-col gap-1 min-w-[90px]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">{item.completionPercent}%</span>
                      </div>
                      <Progress value={item.completionPercent} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.loanAmount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="secondary" className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200 border-transparent">
                      {item.landTitle}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.lastUpdate}
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-xl">
                        <DropdownMenuLabel className="text-xs font-semibold">Actions Dossier Unique Client (DUC)</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/dossiers/${item.id}`)} className="cursor-pointer text-xs">
                          <FileText className="size-3.5 mr-2 text-muted-foreground" />
                          Consulter la fiche DUC détaillée
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/dossiers/${item.id}`)} className="cursor-pointer text-xs">
                          <CheckCircle2 className="size-3.5 mr-2 text-muted-foreground" />
                          Contrôler la checklist des pièces
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/dossiers/${item.id}`)} className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 font-medium">
                          <ArrowRight className="size-3.5 mr-2" />
                          Transmettre au service suivant
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/dossiers/${item.id}`)} className="cursor-pointer text-xs text-amber-600 dark:text-amber-400">
                          <Clock className="size-3.5 mr-2" />
                          Relancer pièces manquantes (SMS)
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
