"use client";

import {
  Users,
  PiggyBank,
  TrendingUp,
  FileCheck2,
  Landmark,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Données mensuelles de la campagne Épargne Habitat (en Millions FCFA)
const MONTHLY_SAVINGS_DATA = [
  { month: "Mars", momo: 42, om: 38, systac: 25, total: 105 },
  { month: "Avr", momo: 55, om: 48, systac: 32, total: 135 },
  { month: "Mai", momo: 72, om: 65, systac: 40, total: 177 },
  { month: "Juin", momo: 88, om: 76, systac: 45, total: 209 },
  { month: "Juil", momo: 104, om: 89, systac: 52, total: 245 },
  { month: "Août", momo: 125, om: 102, systac: 60, total: 287 },
];

// Répartition par région
const REGIONAL_DATA = [
  { name: "Centre (Yaoundé)", value: 45, color: "#7B2E15" },
  { name: "Littoral (Douala)", value: 32, color: "#E59819" },
  { name: "Ouest (Bafoussam)", value: 10, color: "#0F172A" },
  { name: "Sud (Kribi/Ebolowa)", value: 8, color: "#64748B" },
  { name: "Diaspora", value: 5, color: "#10B981" },
];

const PAGES_PERFORMANCE = [
  { path: "/simulator (Simulateur Épargne)", views: "148.2k", avgTime: "4m 32s", bounce: "18%", conversion: "24.5%" },
  { path: "/onboarding (Création DUC)", views: "62.4k", avgTime: "3m 15s", bounce: "22%", conversion: "41.2%" },
  { path: "/portal (Guichet Unique - Dépôt)", views: "41.8k", avgTime: "6m 48s", bounce: "14%", conversion: "68.0%" },
  { path: "/offers/habitat-social (MAETUR/SIC)", views: "34.6k", avgTime: "2m 50s", bounce: "29%", conversion: "18.4%" },
  { path: "/portal/tracking (Suivi 6 Phases)", views: "28.9k", avgTime: "5m 12s", bounce: "16%", conversion: "85.2%" },
];

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      
      {/* 1. Header & Filtres */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 md:p-6 rounded-xl border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cfc" className="h-5 px-2 text-xs font-semibold">Supervision Backoffice CFC</Badge>
            <Badge variant="success" className="h-5 px-2 text-xs font-medium gap-1">
              <ShieldCheck className="size-3.5" />
              Core Banking Carthago Synchronisé
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Statistiques & Performance — Vitrine & Campagne Épargne Habitat
          </h2>
          <p className="text-sm text-muted-foreground">
            Suivi en temps réel de l&apos;acquisition citoyenne, de la collecte Mobile Money et de la conversion vers le Guichet Unique.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-7 text-xs px-2.5 bg-muted/40 gap-1.5 font-normal">
            <Calendar className="size-3.5 text-muted-foreground" />
            Campagne 2026 (En cours)
          </Badge>
        </div>
      </div>

      {/* 2. KPI Strip (5 Métriques majeures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1 : Visiteurs Vitrine */}
        <Card className="p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Visiteurs Vitrine</span>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-amber-500/10 text-[#7B2E15] dark:bg-amber-500/15 dark:text-amber-300">
              <Users className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">148.2k</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="size-3.5" />
            +18.4% ce mois
          </div>
        </Card>

        {/* KPI 2 : Simulations Réalisées */}
        <Card className="p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Simulations Réalisées</span>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">34 820</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="size-3.5" />
            Moy. apport 21.5%
          </div>
        </Card>

        {/* KPI 3 : Dossiers DUC Créés */}
        <Card className="p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Dossiers DUC Créés</span>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <FileCheck2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-emerald-600">4 120</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="size-3.5" />
            +14.8% enrôlements
          </div>
        </Card>

        {/* KPI 4 : Volume Épargne Collecté */}
        <Card className="p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Volume Épargne</span>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-amber-500/10 text-[#7B2E15] dark:bg-amber-500/15 dark:text-amber-300">
              <PiggyBank className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">845,2 M</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span>68% via Mobile Money</span>
          </div>
        </Card>

        {/* KPI 5 : Partenariats Promoteurs */}
        <Card className="p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Promoteurs & SIC</span>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300">
              <Landmark className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">18 Projets</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="size-3.5" />
            3 400 lots MAETUR
          </div>
        </Card>
      </div>

      {/* 3. Graphiques de Performance : Collecte Épargne & Répartition Régionale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graphique 1 : Collecte par canal de paiement (Bar Chart) */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Collecte Mensuelle Épargne Habitat par Canal (Millions FCFA)
              </CardTitle>
              <CardDescription className="text-xs">
                Réconciliation instantanée MTN MoMo, Orange Money et virements SYSTAC vers Carthago.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[#7B2E15] font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7B2E15]"></span> MTN MoMo
              </span>
              <span className="flex items-center gap-1 text-[#E59819] font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E59819]"></span> Orange Money
              </span>
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span> SYSTAC
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SAVINGS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(value) => `${value} M FCFA`}
                />
                <Bar dataKey="momo" fill="#7B2E15" radius={[4, 4, 0, 0]} name="MTN MoMo" />
                <Bar dataKey="om" fill="#E59819" radius={[4, 4, 0, 0]} name="Orange Money" />
                <Bar dataKey="systac" fill="#334155" radius={[4, 4, 0, 0]} name="Virements SYSTAC" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Graphique 2 : Répartition Géographique (Pie Chart) */}
        <Card className="lg:col-span-4 p-6 space-y-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Répartition Géographique des Épargnants
            </CardTitle>
            <CardDescription className="text-xs">
              Origine des demandes de crédit et souscriptions.
            </CardDescription>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REGIONAL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {REGIONAL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(value) => `${value} %`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {REGIONAL_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-slate-900">{item.value} %</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* 4. Tableau de Performance des Pages & Parcours Citoyens */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Performance des Modules de la Vitrine & du Guichet Unique
            </CardTitle>
            <CardDescription className="text-xs">
              Analyse d&apos;efficacité du parcours citoyen depuis la simulation jusqu&apos;au dépôt documentaire.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            Mise à jour en direct
          </Badge>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module / Page</TableHead>
                <TableHead className="text-right">Visites Uniques</TableHead>
                <TableHead className="text-right">Temps Moyen</TableHead>
                <TableHead className="text-right">Taux de Rebond</TableHead>
                <TableHead className="text-right">Taux de Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGES_PERFORMANCE.map((page, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-semibold text-slate-800">{page.path}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900">{page.views}</TableCell>
                  <TableCell className="text-right text-slate-500">{page.avgTime}</TableCell>
                  <TableCell className="text-right text-slate-500">{page.bounce}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success" className="font-bold">
                      {page.conversion}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
}
