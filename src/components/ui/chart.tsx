"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";

/**
 * Chart — enveloppe minimale de graphiques (`recharts`).
 *
 * Deux responsibilities, pas plus :
 *
 * 1. `ChartContainer` publie les couleurs de la configuration dans des
 *    variables CSS (`--color-<clé>`) héritées par le SVG, et garantit une
 *    **hauteur explicite** — `ResponsiveContainer` n'a pas de taille à
 *    deviner, donc rien ne déborde ni ne s'effondre.
 * 2. `ChartTooltipContent` lit cette même configuration pour écrire le
 *    libellé lisible et l'unité de chaque série.
 *
 * Les couleurs vivent dans `globals.css` (`--chart-*`) : le thème clair et
 * le thème sombre ont chacune leurs valeurs.
 */

/** Une série : son libellé lisible, sa couleur et son unité. */
export type ChartSeries = {
  /** Libellé affiché dans l'infobulle et la légende. */
  label: string;
  /** Couleur de la série : variable CSS (`var(--chart-1)`). */
  color: string;
  /** Unité affichée après la valeur dans l'infobulle. */
  unit?: string;
};

/** Configuration d'un graphique : clé de série -> description. */
export type ChartConfig = Record<string, ChartSeries>;

const ChartConfigContext = React.createContext<ChartConfig>({});

/** Configuration courante, fournie par le `ChartContainer` englobant. */
export function useChartConfig(): ChartConfig {
  return React.useContext(ChartConfigContext);
}

export type ChartContainerProps = React.ComponentProps<"div"> & {
  /** Séries du graphique. */
  config: ChartConfig;
  /** Hauteur du graphique, en pixels. */
  height: number;
};

/**
 * Conteneur de graphique : publie la configuration et cadre le SVG.
 *
 * Les couleurs sont déposées dans des variables CSS pour que le SVG les
 * hérite — un `fill="var(--color-validée)"` suit ainsi le thème.
 */
export function ChartContainer({
  config,
  height,
  className,
  children,
  style,
  ...props
}: ChartContainerProps) {
  const seriesVars = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, series] of Object.entries(config)) {
      vars[`--color-${key}`] = series.color;
    }
    return vars;
  }, [config]);

  return (
    <ChartConfigContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn("w-full", className)}
        style={{ ...style, ...cssVars(seriesVars), height }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartConfigContext.Provider>
  );
}

/** Entrée d'infobulle telle que `recharts` la transmet. */
export type ChartTooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: unknown;
  color?: string;
};

export type ChartTooltipContentProps = {
  /** Configuration ; par défaut celle du `ChartContainer` englobant. */
  config?: ChartConfig;
  active?: boolean;
  payload?: ReadonlyArray<ChartTooltipEntry>;
  label?: React.ReactNode;
  /** Masque l'intitulé de l'infobulle (axe des catégories). */
  hideLabel?: boolean;
  /** Mise en forme de la valeur ; par défaut : nombre + unité. */
  valueFormatter?: (value: number, series: ChartSeries | undefined) => string;
};

/**
 * Infobulle d'un graphique : libellé et unité de la configuration.
 */
export function ChartTooltipContent({
  config: configProp,
  active = false,
  payload,
  label,
  hideLabel = false,
  valueFormatter,
}: ChartTooltipContentProps) {
  const contextConfig = useChartConfig();
  const config = configProp ?? contextConfig;

  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line-strong bg-popover p-2.5 text-xs text-popover-foreground shadow-md">
      {!hideLabel && label !== undefined && label !== null && (
        <p className="font-medium text-foreground">{label}</p>
      )}
      <ul className="flex flex-col gap-0.5">
        {payload.map((entry, index) => {
          const key = entry.dataKey === undefined ? "" : String(entry.dataKey);
          const nameKey = entry.name === undefined ? "" : String(entry.name);
          // La série est identifiée par sa clé de données ; à défaut — cas de
          // l'anneau, où toutes les parts partagent la même clé — par son
          // nom, qui porte alors la clé de configuration.
          const series = config[key] ?? config[nameKey];
          const name = series?.label ?? (nameKey || key);
          const numeric =
            typeof entry.value === "number" ? entry.value : Number(entry.value);
          const text = valueFormatter
            ? valueFormatter(Number.isFinite(numeric) ? numeric : 0, series)
            : formatValue(entry.value, series?.unit);

          return (
            <li
              key={`${key}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: series?.color ?? entry.color ?? "currentColor",
                  }}
                />
                {name}
              </span>
              <span className="font-medium tabular-nums text-foreground">{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Nombre mis en forme à la française, suivi de son unité. */
function formatValue(value: unknown, unit?: string): string {
  if (value === null || value === undefined) return "—";
  const text =
    typeof value === "number"
      ? new Intl.NumberFormat("fr-FR").format(value)
      : String(value);
  return unit ? `${text} ${unit}` : text;
}

/** Les variables CSS de série sont écrites dans l'attribut `style`. */
function cssVars(vars: Record<string, string>): React.CSSProperties {
  return vars as unknown as React.CSSProperties;
}
