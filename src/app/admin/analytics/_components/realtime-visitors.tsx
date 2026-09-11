"use client";

import { Ellipsis } from "lucide-react";
import { Bar, BarChart, type BarShapeProps, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const realtimeData = [
  { minute: 1, visitors: 0 },
  { minute: 2, visitors: 6 },
  { minute: 3, visitors: 12 },
  { minute: 4, visitors: 20 },
  { minute: 5, visitors: 12 },
  { minute: 6, visitors: 0 },
  { minute: 7, visitors: 6 },
  { minute: 8, visitors: 6 },
  { minute: 9, visitors: 0 },
  { minute: 10, visitors: 4 },
  { minute: 11, visitors: 0 },
  { minute: 12, visitors: 20 },
  { minute: 13, visitors: 15 },
  { minute: 14, visitors: 4 },
  { minute: 15, visitors: 6 },
  { minute: 16, visitors: 0 },
  { minute: 17, visitors: 4 },
  { minute: 18, visitors: 12 },
  { minute: 19, visitors: 20 },
  { minute: 20, visitors: 0 },
  { minute: 21, visitors: 4 },
  { minute: 22, visitors: 20 },
  { minute: 23, visitors: 12 },
  { minute: 24, visitors: 0 },
  { minute: 25, visitors: 6 },
  { minute: 26, visitors: 6 },
  { minute: 27, visitors: 0 },
  { minute: 28, visitors: 20 },
  { minute: 29, visitors: 0 },
  { minute: 30, visitors: 4 },
];

function RealtimeBarShape(props: BarShapeProps) {
  const { height, payload, width, x, y } = props;
  const barPayload = payload as (typeof realtimeData)[number] | undefined;
  const barHeightValue = Number(height);
  const barWidthValue = Number(width);
  const xValue = Number(x);
  const yValue = Number(y);
  const visitors = barPayload?.visitors ?? 0;
  const isHigh = visitors >= 18;
  const baselineFill = visitors === 0 ? "rgb(239, 68, 68)" : "#64748b";
  const baselineOpacity = visitors === 0 ? 0.9 : 0.4;
  const baselineY = yValue + barHeightValue - 2;
  const barGap = 3;
  const barHeight = Math.max(0, barHeightValue - barGap);

  return (
    <g>
      <rect
        x={xValue}
        y={baselineY}
        width={barWidthValue}
        height={2}
        rx={1}
        fill={baselineFill}
        fillOpacity={baselineOpacity}
      />
      {visitors > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={isHigh ? "#1e293b" : "#94a3b8"}
          fillOpacity={isHigh ? 0.95 : 0.65}
        />
      ) : null}
    </g>
  );
}

export function RealtimeVisitors() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-base">Realtime Visitors</CardTitle>
        <CardAction>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Options"
          >
            <Ellipsis className="size-4" />
          </button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums leading-none tracking-tight">24</span>
            <span className="text-muted-foreground text-xs">per minute</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Live</span>
          </div>
        </div>

        {/* Histogram Bar Chart */}
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={realtimeData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }} barCategoryGap={2}>
              <XAxis dataKey="minute" hide />
              <YAxis hide domain={[0, 22]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const visitors = payload[0].value;
                    return (
                      <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm">
                        <span className="font-semibold">{visitors}</span> visitors
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="visitors" shape={RealtimeBarShape} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Country Breakdown 2x2 Grid */}
        <div className="grid grid-cols-2 text-xs border-t pt-2">
          <div className="flex items-center gap-2.5 border-r border-b pb-3 pr-3">
            <span className="text-base leading-none">🇺🇸</span>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">United States</span>
            <span className="tabular-nums font-semibold text-muted-foreground">14</span>
          </div>
          <div className="flex items-center gap-2.5 border-b pb-3 pl-3">
            <span className="text-base leading-none">🇬🇧</span>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">United Kingdom</span>
            <span className="tabular-nums font-semibold text-muted-foreground">4</span>
          </div>
          <div className="flex items-center gap-2.5 border-r pt-3 pr-3">
            <span className="text-base leading-none">🇨🇦</span>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">Canada</span>
            <span className="tabular-nums font-semibold text-muted-foreground">3</span>
          </div>
          <div className="flex items-center gap-2.5 pt-3 pl-3">
            <span className="text-base leading-none">🇮🇳</span>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">India</span>
            <span className="tabular-nums font-semibold text-muted-foreground">3</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
