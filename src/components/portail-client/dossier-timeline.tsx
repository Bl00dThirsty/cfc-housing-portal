"use client";

import * as React from "react";
import { CircleDot, FileCheck2, MessageSquare, Scale } from "lucide-react";

import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type AppRole } from "@/lib/auth-data";
import { dossierStatusLabel } from "@/domain/entities/dossier";
import {
  eventLabel,
  type DossierEvent,
} from "@/domain/entities/processes";

/** Icône d'un événement, selon sa nature. */
function eventIcon(eventType: string) {
  if (eventType.startsWith("document.")) return FileCheck2;
  if (eventType.startsWith("support.")) return MessageSquare;
  if (eventType.includes("decision") || eventType.includes("offer")) return Scale;
  return CircleDot;
}

/**
 * Chronologie du dossier — ce que l'emprunteur voit de son avancement.
 *
 * La source est `public.dossier_events` : la même trace que l'agent
 * consulte, lisible sans interprétation. Chaque ligne porte sa date, son
 * auteur et, quand elle existe, sa base légale.
 */
export function DossierTimeline({
  events,
  className,
}: {
  events: DossierEvent[];
  className?: string;
}) {
  if (events.length === 0) {
    return (
      <div className={cn("rounded-lg border border-line-strong bg-card p-6", className)}>
        <p className="text-sm text-muted-foreground">
          Aucun événement enregistré pour l&apos;instant. Votre dossier est en
          cours d&apos;instruction : le guichet vous notifiera à chaque étape.
        </p>
      </div>
    );
  }

  return (
    <ol className={cn("flex flex-col gap-0 rounded-lg border border-line-strong bg-card", className)}>
      {events.map((event, index) => {
        const Icon = eventIcon(event.event_type);
        const last = index === events.length - 1;

        return (
          <li key={event.id} className="flex gap-3 px-4 py-3">
            <div className="flex flex-col items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-muted/60">
                <Icon className="size-3.5 text-muted-foreground" aria-hidden />
              </span>
              {!last && <span aria-hidden className="mt-1 w-px flex-1 bg-line-strong" />}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium capitalize text-foreground">
                  {eventLabel(event.event_type)}
                </span>
                <span className="text-[10px] text-soft">
                  {new Date(event.occurred_at).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              {typeof event.payload?.motif === "string" && event.payload.motif.length > 0 && (
                <p className="text-xs text-muted-foreground">{event.payload.motif}</p>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {event.actor_role && (
                  <Tag tone="neutral" size="sm">
                    {ROLE_LABELS[event.actor_role as AppRole] ?? event.actor_role}
                  </Tag>
                )}
                {event.legal_basis && (
                  <span className="caption-style text-soft">{event.legal_basis}</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Bandeau d'avancement : la phase courante et le chemin qui y mène.
 */
export function DossierPhaseCard({
  currentPhaseLabel,
  completionPercent,
  status,
  serviceLabel,
}: {
  currentPhaseLabel: string | null;
  completionPercent: number | null;
  status: string | null;
  serviceLabel: string | null;
}) {
  const percent = completionPercent ?? 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line-strong bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="eyebrow-style font-normal text-subtle">Étape en cours</span>
          <span className="text-sm font-medium text-foreground">
            {currentPhaseLabel ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {serviceLabel && (
            <Tag tone="blue" size="sm">
              {serviceLabel}
            </Tag>
          )}
          {status && (
            <Tag tone="neutral" size="sm">
              {dossierStatusLabel(status)}
            </Tag>
          )}
          <Tag tone="teal" size="sm">
            {percent} %
          </Tag>
        </div>
      </div>

      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Avancement du dossier : ${percent} %`}
        className="h-2 w-full overflow-hidden rounded-full bg-track"
      >
        <div
          className="h-full rounded-full bg-cfc-brown transition-[width] duration-500 ease-power3-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
