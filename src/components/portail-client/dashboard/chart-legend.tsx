"use client";

export type ChartLegendItem = {
  key: string;
  label: string;
  color: string;
  /** Valeur affichée après le libellé (nombre de pièces, etc.). */
  value?: string | number;
};

/** Légende d'un graphique : pastille, libellé et valeur. */
export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
          {item.value !== undefined && (
            <span className="font-medium tabular-nums text-foreground">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
