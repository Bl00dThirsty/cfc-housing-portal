"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartLegend } from "@/components/portail-client/dashboard/chart-legend";
import { useReducedMotion } from "@/components/portail-client/dashboard/use-reduced-motion";
import type { ChecklistStatus } from "@/domain/entities/services";

/**
 * Pièces par état — anneau de progression documentaire.
 *
 * L'anneau dit où en est le dossier, le chiffre central dit où il va :
 * l'avancement global. La légende reprend chaque état avec son nombre.
 */

const STATUS_CONFIG: ChartConfig = {
  verified: { label: "Validées", color: "var(--chart-verified)", unit: "pièces" },
  uploaded: { label: "Déposées", color: "var(--chart-uploaded)", unit: "pièces" },
  in_review: { label: "En revue", color: "var(--chart-review)", unit: "pièces" },
  rejected: { label: "Rejetées", color: "var(--chart-rejected)", unit: "pièces" },
  missing: { label: "À fournir", color: "var(--chart-missing)", unit: "pièces" },
};

type StatusSlice = { key: ChecklistStatus; value: number };

export function DocumentsDonut({
  status,
  completionPercent,
  piecesCompletionPercent,
}: {
  status: StatusSlice[];
  completionPercent: number | null;
  piecesCompletionPercent: number | null;
}) {
  const reduced = useReducedMotion();
  const total = status.reduce((sum, slice) => sum + slice.value, 0);
  const legend = status.map((slice) => ({
    key: slice.key,
    label: STATUS_CONFIG[slice.key].label,
    color: STATUS_CONFIG[slice.key].color,
    value: slice.value,
  }));

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-[13px] font-medium">Pièces par état</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Aucune pièce n&apos;est attendue pour l&apos;instant : le catalogue
            documentaire de votre service n&apos;est pas encore publié.
          </p>
        </CardContent>
      </Card>
    );
  }

  const centre =
    completionPercent !== null
      ? { value: `${Math.round(completionPercent)} %`, caption: "du dossier" }
      : piecesCompletionPercent !== null
        ? { value: `${Math.round(piecesCompletionPercent)} %`, caption: "des pièces" }
        : { value: "—", caption: "du dossier" };

  const summary = `Répartition des pièces du dossier : ${legend
    .filter((item) => item.value !== 0)
    .map((item) => `${item.value} ${item.label.toLowerCase()}`)
    .join(", ")} sur ${total} pièce(s) attendues. Avancement du dossier : ${centre.value}.`;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-[13px] font-medium">Pièces par état</CardTitle>
          <p className="caption-style text-soft">
            Répartition des {total} pièce(s) attendues
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="sr-only">{summary}</p>
        <div role="img" aria-label="Répartition des pièces du dossier par état">
          <div className="relative">
            <ChartContainer config={STATUS_CONFIG} height={196}>
              <PieChart>
                <Pie
                  data={status}
                  dataKey="value"
                  nameKey="key"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive={!reduced}
                >
                  {status
                    .filter((slice) => slice.value > 0)
                    .map((slice) => (
                      <Cell
                        key={slice.key}
                        fill={STATUS_CONFIG[slice.key].color}
                      />
                    ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent config={STATUS_CONFIG} />} />
              </PieChart>
            </ChartContainer>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="text-[22px] leading-none font-semibold tabular-nums text-foreground">
                {centre.value}
              </span>
              <span className="mt-0.5 text-[11px] text-soft">{centre.caption}</span>
            </div>
          </div>
        </div>
        <ChartLegend items={legend} />
      </CardContent>
    </Card>
  );
}
