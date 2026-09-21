"use client";

import * as React from "react";
import { Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { DiasporaDetailsSheet, type DiasporaItem } from "@/components/admin/diaspora-details-sheet";

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

const diasporaDossiers = [
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

export default function DiasporaPage() {
  const [search, setSearch] = React.useState("");
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([]);
  const [selectedKyc, setSelectedKyc] = React.useState<string[]>([]);
  const [selectedDossier, setSelectedDossier] = React.useState<DiasporaItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const countryOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    diasporaDossiers.forEach((d) => {
      counts[d.country] = (counts[d.country] || 0) + 1;
    });
    return Object.entries(counts).map(([country, count]) => ({
      label: country,
      value: country,
      count,
    }));
  }, []);

  const kycOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    diasporaDossiers.forEach((d) => {
      counts[d.kyc] = (counts[d.kyc] || 0) + 1;
    });
    return Object.entries(counts).map(([kyc, count]) => ({
      label: kyc,
      value: kyc,
      count,
    }));
  }, []);

  const filtered = diasporaDossiers.filter((d) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.client.toLowerCase().includes(q) ||
      d.ducId.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q);

    const matchesCountry =
      selectedCountries.length === 0 || selectedCountries.includes(d.country);
    const matchesKyc =
      selectedKyc.length === 0 || selectedKyc.includes(d.kyc);

    return matchesSearch && matchesCountry && matchesKyc;
  });

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
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par emprunteur, N° DUC ou pays..."
          totalCount={diasporaDossiers.length}
          filteredCount={filtered.length}
          unitName="dossiers"
          filters={[
            {
              id: "country",
              title: "Pays",
              options: countryOptions,
              selectedValues: selectedCountries,
              onSelect: setSelectedCountries,
            },
            {
              id: "kyc",
              title: "KYC",
              options: kycOptions,
              selectedValues: selectedKyc,
              onSelect: setSelectedKyc,
            },
          ]}
          onResetAll={() => {
            setSelectedCountries([]);
            setSelectedKyc([]);
          }}
        />

        <div className="rounded-lg border border-border/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Pays de Résidence</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Épargne Constituée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Canal</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut KYC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Ouverture</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-xs text-muted-foreground">
                    Aucun dossier diaspora ne correspond aux critères de recherche.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => {
                      setSelectedDossier(item);
                      setIsDetailsOpen(true);
                    }}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarFallback className="rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-700">
                            {getInitials(item.client)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-foreground">{item.client}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <span>{item.flag}</span>
                        <span>{item.country}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                        {item.ducId}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                      {item.savings}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">
                      {item.channel}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge
                        variant="secondary"
                        className={`${kycStyles[item.kyc] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                      >
                        {item.kyc}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{item.date}</TableCell>
                    <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDossier(item);
                          setIsDetailsOpen(true);
                        }}
                        className="size-8 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dedicated Diaspora Details Sheet */}
      <DiasporaDetailsSheet
        dossier={selectedDossier}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
