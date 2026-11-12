"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Download, MoreHorizontal, ArrowRight, FileText, CreditCard } from "lucide-react";
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

export function EpargnantsTab() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedSegment, setSelectedSegment] = React.useState<string>("all");

  const filtered = saversList.filter((s) => {
    const matchesSearch =
      s.client.toLowerCase().includes(search.toLowerCase()) ||
      s.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.agency.toLowerCase().includes(search.toLowerCase());
    const matchesSegment = selectedSegment === "all" || s.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par épargnant, N° compte ou agence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSegment("all")}
              className={`h-7 text-xs px-2.5 ${selectedSegment === "all" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              Tous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSegment("Diaspora")}
              className={`h-7 text-xs px-2.5 ${selectedSegment === "Diaspora" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              Diaspora
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSegment("Salarié Public")}
              className={`h-7 text-xs px-2.5 ${selectedSegment === "Salarié Public" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              Public
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
                <TableHead className="text-xs font-medium text-foreground px-3">Épargnant</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">N° Compte Carthago</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Segment</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Épargne Réalisée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Objectif Apport</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Agence Rattachement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Dernier Dépôt</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/analytics/savers/${item.id}`)}
                >
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.profession}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.accountNumber}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${segmentStyles[item.segment] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.segment}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.currentBalance}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex flex-col gap-1 min-w-[100px]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-mono">{item.targetBalance}</span>
                        <span className="font-semibold text-foreground">{item.progressPercent}%</span>
                      </div>
                      <Progress value={item.progressPercent} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                    {item.agency}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.lastDepositDate}
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl">
                        <DropdownMenuLabel className="text-xs font-semibold">Actions Épargnant</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/savers/${item.id}`)} className="cursor-pointer text-xs">
                          <FileText className="size-3.5 mr-2 text-muted-foreground" />
                          Consulter le dossier d&apos;épargne
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/savers/${item.id}`)} className="cursor-pointer text-xs">
                          <CreditCard className="size-3.5 mr-2 text-muted-foreground" />
                          Extrait des versements (Carthago)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/analytics/savers/${item.id}`)} className="cursor-pointer text-xs">
                          <Download className="size-3.5 mr-2 text-muted-foreground" />
                          Attestation de capacité d&apos;apport
                        </DropdownMenuItem>
                        {item.progressPercent >= 100 && (
                          <DropdownMenuItem onClick={() => router.push(`/admin/analytics/savers/${item.id}`)} className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <ArrowRight className="size-3.5 mr-2" />
                            Initier le passage en crédit DUC
                          </DropdownMenuItem>
                        )}
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
