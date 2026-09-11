import { Users, PiggyBank, FolderKanban, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function KpiSummary() {
  const kpis = [
    {
      title: "Comptes Épargne Actifs",
      value: "1 420",
      change: "+14% ce mois",
      isPositive: true,
      icon: Users,
      badgeVariant: "secondary" as const,
      iconBg: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    },
    {
      title: "Volume Épargne Collecté",
      value: "845,2 M FCFA",
      change: "68% via Mobile Money",
      isPositive: true,
      icon: PiggyBank,
      badgeVariant: "secondary" as const,
      iconBg: "bg-amber-500/10 text-[#7B2E15] dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      title: "Dossiers en Instruction",
      value: "128",
      change: "18 prêts prêts pour comité",
      isPositive: true,
      icon: FolderKanban,
      badgeVariant: "secondary" as const,
      iconBg: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    },
    {
      title: "Taux de Conformité DUC",
      value: "96.4 %",
      change: "Zéro dossier orphelin",
      isPositive: true,
      icon: ShieldCheck,
      badgeVariant: "secondary" as const,
      iconBg: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card key={idx} className="p-4 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>{kpi.title}</span>
              <div className={`flex size-7 items-center justify-center rounded-lg border ${kpi.iconBg}`}>
                <Icon className="size-4" />
              </div>
            </div>
            
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {kpi.value}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <ArrowUpRight className="size-3.5 text-emerald-600" />
              <span>{kpi.change}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
