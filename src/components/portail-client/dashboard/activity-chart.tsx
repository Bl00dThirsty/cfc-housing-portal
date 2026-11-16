"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useReducedMotion } from "@/components/portail-client/dashboard/use-reduced-motion";
import type { MonthlyActivity } from "@/components/portail-client/dashboard/dashboard-model";

/**
 * Activité du dossier — événements par mois.
 *
 * Le journal du dossier (`dossier_events`) est la seule source : on compte
 * ce qui s'est passé, mois par mois, pour montrer au client que son dossier
 * avance même entre deux dépôts de pièces.
 */

const ACTIVITY_CONFIG: ChartConfig = {
  count: { label: "Événements", color: "var(--chart-2)", unit: "événements" },
};

/** Nombre maximum de libellés d'axe affichés en même temps. */
const MAX_AXIS_LABELS = 6;

export function ActivityChart({ activity }: { activity: MonthlyActivity[] }) {
  const reduced = useReducedMotion();

  if (activity.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-[13px] font-medium">Activité du dossier</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Aucun événement enregistré pour l&apos;instant. Votre dossier est en
            cours d&apos;instruction : le guichet vous notifiera à chaque étape.
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = activity.reduce((sum, month) => sum + month.count, 0);
  const interval = Math.max(0, Math.ceil(activity.length / MAX_AXIS_LABELS) - 1);
  const summary = `Événements du dossier par mois : ${activity
    .map((month) => `${month.label}, ${month.count}`)
    .join(" ; ")}. Total : ${total} événement(s).`;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-[13px] font-medium">Activité du dossier</CardTitle>
          <p className="caption-style text-soft">
            Événements enregistrés par mois ({total} au total)
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="sr-only">{summary}</p>
        <div role="img" aria-label="Événements du dossier par mois">
          <ChartContainer config={ACTIVITY_CONFIG} height={196}>
            <BarChart
              data={activity}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              barCategoryGap="32%"
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="var(--border)"
              />
              <XAxis
                dataKey="label"
                interval={interval}
                axisLine={false}
                tickLine={false}
                tickMargin={6}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                axisLine={false}
                tickLine={false}
                tickMargin={4}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <Tooltip
                content={<ChartTooltipContent config={ACTIVITY_CONFIG} />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="count"
                fill="var(--chart-2)"
                radius={[3, 3, 0, 0]}
                barSize={22}
                isAnimationActive={!reduced}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
