"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  Circle,
  UserCheck,
  FileCheck,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TrackingStep } from "@/lib/tracking-data";

interface TrackingTimelineStepperProps {
  steps: TrackingStep[];
  currentPhaseIndex: number;
  globalProgress: number;
  slaStatus: "on_track" | "warning" | "exceeded";
}

export function TrackingTimelineStepper({
  steps,
  currentPhaseIndex,
  globalProgress,
  slaStatus,
}: TrackingTimelineStepperProps) {
  return (
    <div className="rounded-2xl border bg-card/95 backdrop-blur-sm p-5 md:p-7 shadow-xs space-y-6">
      {/* 1. Header with Overall Progress and SLA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileCheck className="size-4" />
            </span>
            <h3 className="text-base font-bold text-foreground">
              Progression du Circuit d&apos;Instruction
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Étape {currentPhaseIndex + 1} sur {steps.length} · Traçabilité horodatée de chaque visa réglementaire
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={slaStatus === "on_track" ? "secondary" : "destructive"}
            className="text-[11px] font-medium hidden sm:inline-flex"
          >
            {slaStatus === "on_track"
              ? "SLA Conforme"
              : slaStatus === "warning"
              ? "Action Requise"
              : "Délai Dépassé"}
          </Badge>
          <div className="text-right">
            <div className="text-xs font-semibold text-foreground">Avancement global</div>
            <div className="text-lg font-mono font-bold text-primary">{globalProgress}%</div>
          </div>
          <div className="w-24 sm:w-32">
            <Progress value={globalProgress} className="h-2 rounded-full" />
          </div>
        </div>
      </div>

      {/* 2. Stepper Horizontal Indicator (Desktop view) */}
      <div className="hidden lg:grid grid-cols-6 gap-2 pt-1 pb-2">
        {steps.map((step) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "in_progress";

          return (
            <div key={step.id} className="flex flex-col items-center text-center gap-1.5">
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                    isCompleted && "bg-emerald-600 text-white shadow-xs",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs animate-pulse",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground border border-border/80"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="size-4" /> : step.stepNumber}
                </div>
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold line-clamp-2 px-1",
                  isCompleted && "text-foreground",
                  isCurrent && "text-primary font-bold",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.title.split("&")[0]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isCompleted ? "Validé" : isCurrent ? "En cours" : "À venir"}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Detailed Steps Timeline (Vertical) */}
      <div className="relative pl-6 space-y-7 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
        {steps.map((step) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "in_progress";
          const isPending = step.status === "pending";

          return (
            <div key={step.id} className="relative group">
              {/* Bullet Icon */}
              <div
                className={cn(
                  "absolute -left-6 top-0 flex size-6.5 -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-card transition-all",
                  isCompleted && "bg-emerald-600 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-primary/20 animate-pulse",
                  isPending && "bg-muted text-muted-foreground border border-border"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-3.5" />
                ) : isCurrent ? (
                  <Clock className="size-3.5" />
                ) : (
                  <Circle className="size-3 text-muted-foreground/50" />
                )}
              </div>

              {/* Step Card */}
              <div
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  isCurrent && "border-primary/50 bg-primary/5 shadow-xs",
                  isCompleted && "border-border/70 bg-card/60 hover:bg-card",
                  isPending && "border-border/40 bg-muted/20 opacity-75"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        Phase 0{step.stepNumber}
                      </span>
                      <h4
                        className={cn(
                          "text-sm font-bold tracking-tight",
                          isCurrent ? "text-primary" : "text-foreground"
                        )}
                      >
                        {step.title}
                      </h4>
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] rounded-md font-semibold">
                          Complétée
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] rounded-md font-semibold">
                          En cours d&apos;instruction
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.shortDesc}
                    </p>
                  </div>

                  {/* Date & Actor badges */}
                  <div className="flex sm:flex-col items-end gap-1.5 shrink-0 text-right">
                    {step.dateCompleted && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Calendar className="size-3" />
                        Validé le {step.dateCompleted}
                      </span>
                    )}
                    {step.startedAt && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                        <Clock className="size-3" />
                        En cours depuis le {step.startedAt}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                      <UserCheck className="size-3" />
                      <span>{step.actor}</span>
                    </div>
                  </div>
                </div>

                {/* Step Metadata / Notes */}
                {(step.notes || isCurrent) && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    {step.notes && (
                      <p className="text-foreground/85 italic bg-background/60 px-3 py-1.5 rounded-lg border border-border/60 text-[11.5px]">
                        « {step.notes} »
                      </p>
                    )}

                    {isCurrent && (
                      <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
                        <span className="text-muted-foreground">Délai étape :</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded font-semibold",
                            step.daysElapsed > step.slaDays
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                              : "bg-muted text-foreground"
                          )}
                        >
                          J+{step.daysElapsed} / {step.slaDays} jours max
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
