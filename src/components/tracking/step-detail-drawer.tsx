"use client";

import * as React from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tag } from "@/components/ui/tag";
import { ErrorState } from "@/components/ui/error-state";
import { actorRoleLabel, eventLabel } from "@/domain/entities/processes";
import {
  eventsForStep,
  unassignedEvents,
  type IndexedStep,
} from "@/domain/workflows/tracking";
import type { DossierEvent } from "@/domain/entities/processes";

/**
 * Le panneau d'une étape du parcours.
 *
 * Il dit **qui** a fait **quoi**, **quand** — le journal du dossier étant la
 * chronologie qui fait foi. Un panneau vide n'est pas un panneau en erreur :
 * les deux états sont distincts, et l'échec porte un refus.
 *
 * « Qui » est un **rôle**, jamais un nom : un nom de personne n'a pas à
 * quitter la banque.
 */

export interface StepDetailDrawerProps {
  /** L'étape ouverte ; `null` ferme le panneau. */
  step: IndexedStep | null;
  /** Le journal du dossier. */
  events: DossierEvent[];
  /** Les étapes du parcours — elles servent à repérer les événements orphelins. */
  steps?: readonly IndexedStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Message d'erreur de la lecture, quand elle a échoué. */
  error?: string | null;
  onRetry?: () => void;
}

/** Une date lisible : « 12 nov. 2026 à 10:00 ». */
function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StepDetailDrawer({
  step,
  events,
  steps = [],
  open,
  onOpenChange,
  error = null,
  onRetry,
}: StepDetailDrawerProps) {
  const stepEvents = React.useMemo(
    () => (step ? eventsForStep(events, step.code) : []),
    [events, step],
  );

  // Un événement qui n'atteste aucune étape n'est **jamais perdu** : il est
  // montré à part, sous « Autres événements du dossier ».
  const others = React.useMemo(
    () => unassignedEvents(events, steps.map((candidate) => candidate.code)),
    [events, steps],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 p-5 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {step ? (
              <span className="font-mono text-[11px] font-medium text-soft">{step.code}</span>
            ) : null}
            {step ? step.label : ""}
          </SheetTitle>
          <SheetDescription>
            {step ? `${step.phaseLabel} · couloir ${step.lane}` : ""}
          </SheetDescription>
        </SheetHeader>

        {error ? (
          <ErrorState
            title="Historique indisponible"
            message={error}
            onRetry={onRetry}
            className="border-none bg-transparent py-6"
          />
        ) : stepEvents.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Aucun événement pour cette étape.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {stepEvents.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 rounded-lg border border-line-strong bg-card px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-foreground">
                    {eventLabel(event.event_type)}
                  </span>
                  <Tag tone="neutral" size="sm" className="text-[10.5px]">
                    {actorRoleLabel(event.actor_role)}
                  </Tag>
                </div>
                <span className="caption-style text-soft">{formatWhen(event.occurred_at)}</span>
              </li>
            ))}
          </ol>
        )}

        {others.length > 0 ? (
          <section className="flex flex-col gap-2 border-t border-line-strong pt-3">
            <h3 className="eyebrow-style font-normal text-subtle">
              Autres événements du dossier
            </h3>
            <ol className="flex flex-col gap-2">
              {others.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-dashed border-line-strong px-3 py-2"
                >
                  <span className="text-[11.5px] text-muted-foreground">
                    {eventLabel(event.event_type)}
                  </span>
                  <span className="caption-style text-soft">
                    {actorRoleLabel(event.actor_role)} · {formatWhen(event.occurred_at)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default StepDetailDrawer;
