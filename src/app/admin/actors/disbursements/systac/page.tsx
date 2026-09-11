"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

const systacRecords = [
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

export default function SystacPage() {
  const [search, setSearch] = React.useState("");

  const filtered = systacRecords.filter(
    (s) =>
      s.beneficiary.toLowerCase().includes(search.toLowerCase()) ||
      s.ref.toLowerCase().includes(search.toLowerCase()) ||
      s.ducId.toLowerCase().includes(search.toLowerCase()) ||
      s.bank.toLowerCase().includes(search.toLowerCase()) ||
      s.flowType.toLowerCase().includes(search.toLowerCase())
  );

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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Journal SYSTAC
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={systacKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par référence, bénéficiaire, banque ou type de flux..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Règlement interbancaire en temps réel · Système National des Règlements (BEAC)</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Virement SYSTAC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Bénéficiaire des Fonds</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Banque Domiciliataire</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Nature du Règlement</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Virement</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut Télécompensation</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date &amp; Heure</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ref}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs font-semibold text-foreground">
                    {item.beneficiary}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground">
                    {item.bank}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px]">
                    <span className="truncate block">{item.flowType}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.amount}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${systacStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2.5">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                      <Eye className="size-4" />
                    </Button>
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
