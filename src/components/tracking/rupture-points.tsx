import { TriangleAlert } from "lucide-react";

import { rupturesForStep } from "@/domain/entities/ruptures";
import { cn } from "@/lib/utils";

/**
 * Le point de rupture d'une étape — **un seul**, sous l'étape.
 *
 * Le demandeur a le droit de savoir **pourquoi** son dossier attend : un
 * délai vient du titre foncier, pas de l'instruction. La liste complète est
 * dans le panneau d'étape.
 */
export function RupturePoint({
  stepCode,
  className,
}: {
  stepCode: string;
  className?: string;
}) {
  const ruptures = rupturesForStep(stepCode);
  if (ruptures.length === 0) return null;

  return (
    <p className={cn("flex items-start gap-1.5 text-[11px] leading-relaxed text-subtle", className)}>
      <TriangleAlert className="mt-0.5 size-3 shrink-0 text-cfc-gold" aria-hidden />
      <span>
        Point de rupture possible :{" "}
        <span className="text-muted-foreground">{ruptures[0]}</span>
      </span>
    </p>
  );
}
