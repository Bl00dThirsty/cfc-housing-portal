"use client";

import { ArrowDownRight, ArrowUpRight, Ellipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ActorKpiItem {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  previous: string;
  period: string;
}

interface ActorKpiStripProps {
  items: ActorKpiItem[];
}

export function ActorKpiStrip({ items }: ActorKpiStripProps) {
  const gridColsClass =
    items.length === 4
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      : items.length === 5
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-5"
      : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className={`grid ${gridColsClass} divide-y md:divide-y-0 md:divide-x divide-border`}>
        {items.map((item) => (
          <div key={item.title} className="flex flex-col justify-between p-5 gap-4">
            {/* Header: Title + Options (NO ICON on the card) */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal text-foreground">{item.title}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                aria-label={`Options pour ${item.title}`}
              >
                <Ellipsis className="size-4" />
              </button>
            </div>

            {/* Middle: Big Value + Trend Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {item.value}
              </span>
              <Badge
                variant="secondary"
                className={
                  item.isPositive
                    ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-medium text-xs px-2 py-0.5 border-transparent gap-1"
                    : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 font-medium text-xs px-2 py-0.5 border-transparent gap-1"
                }
              >
                {item.isPositive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {item.change}
              </Badge>
            </div>

            {/* Footer: Comparison subtitle */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                from <strong className="font-medium text-foreground">{item.previous}</strong>
              </span>
              <span>•</span>
              <span>{item.period}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
