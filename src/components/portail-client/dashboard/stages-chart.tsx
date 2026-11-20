"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartLegend } from "@/components/portail-client/dashboard/chart-legend";
import { useReducedMotion } from "@/components/portail-client/dashboard/use-reduced-motion";
import type { StageProgress } from "@/components/portail-client/dashboard/dashboard-model";

/**
 * Pièces obligatoires par étape — où le dossier est encore bloqué.
 *
 * Deux barres par étape : ce qui est attendu, ce qui est déjà déposé.
 * L'emprunteur voit ainsi l'étape qui lui demande de l'effort.
 */

const STAGE_CONFIG: ChartConfig = {
  required: { label: "Pièces attendues", color: "var(--chart-1)", unit: "pièces" },
  provided: { label: "Pièces déposées", color: "var(--chart-2)", unit: "pièces" },
};

/** Largeur de l'axe des étapes : les libellés longs sont tronqués. */
const STAGE_AXIS_WIDTH = 96;
const STAGE_LABEL_MAX = 16;

export function StagesChart({ stages }: { stages: StageProgress[] }) {
  const reduced = useReducedMotion();

  if (stages.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-[13px] font-medium">Pièces par étape</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Aucune pièce obligatoire n&apos;est attendue pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  // L'axe des catégories empile du bas vers le haut : on inverse pour lire
  // le dossier dans l'ordre du parcours.
  const rows = [...stages].reverse();
  const max = Math.max(...rows.map((row) => row.required), 1);
  const summary = `Pièces obligatoires par étape : ${stages
    .map((stage) => `${stage.label}, ${stage.provided} déposée(s) sur ${stage.required}`)
    .join(" ; ")}.`;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-[13px] font-medium">Pièces par étape</CardTitle>
          <p className="caption-style text-soft">
            Pièces obligatoires attendues et déposées
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="sr-only">{summary}</p>
        <div role="img" aria-label="Pièces obligatoires par étape du dossier">
          <ChartContainer config={STAGE_CONFIG} height={Math.max(140, rows.length * 44)}>
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="var(--border)"
              />
              <XAxis
                type="number"
                domain={[0, max]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tickMargin={6}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={STAGE_AXIS_WIDTH}
                axisLine={false}
                tickLine={false}
                tickMargin={4}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(value: string) => truncate(value, STAGE_LABEL_MAX)}
              />
              <Tooltip
                content={<ChartTooltipContent config={STAGE_CONFIG} />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="required"
                fill="var(--chart-1)"
                radius={[0, 3, 3, 0]}
                barSize={7}
                isAnimationActive={!reduced}
              />
              <Bar
                dataKey="provided"
                fill="var(--chart-2)"
                radius={[0, 3, 3, 0]}
                barSize={7}
                isAnimationActive={!reduced}
              />
            </BarChart>
          </ChartContainer>
        </div>
        <ChartLegend
          items={[
            {
              key: "required",
              label: STAGE_CONFIG.required.label,
              color: STAGE_CONFIG.required.color,
            },
            {
              key: "provided",
              label: STAGE_CONFIG.provided.label,
              color: STAGE_CONFIG.provided.color,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/** Tronque un libellé d'étape sans couper un mot si possible. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 4 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
