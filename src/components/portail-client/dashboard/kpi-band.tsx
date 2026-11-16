import { Progress } from "@/components/ui/progress";
import type { KpiCard } from "@/components/portail-client/dashboard/dashboard-model";

/**
 * Bandeau d'indicateurs — la situation du dossier en quatre chiffres.
 *
 * Rendu côté serveur : ce sont des valeurs déjà lues, aucune interaction
 * n'est nécessaire.
 */
export function KpiBand({ kpis }: { kpis: KpiCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <li
          key={kpi.id}
          className="flex flex-col gap-2 rounded-xl border border-line-strong bg-card p-3.5"
        >
          <span className="eyebrow-style font-normal text-subtle">{kpi.label}</span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-[22px] leading-none font-semibold tabular-nums text-foreground">
              {kpi.value}
            </span>
            <span className="text-[11px] text-muted-foreground">{kpi.unit}</span>
          </span>
          {kpi.progress !== null && (
            <Progress
              value={kpi.progress}
              aria-label={`${kpi.label} : ${kpi.progress} %`}
              className="h-1.5"
            />
          )}
          {kpi.note && <span className="text-[11px] text-soft">{kpi.note}</span>}
        </li>
      ))}
    </ul>
  );
}
