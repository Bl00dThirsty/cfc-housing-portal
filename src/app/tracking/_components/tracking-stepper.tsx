"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Circle, CircleDot, ExternalLink, MessageSquare } from "lucide-react";

import { RupturePoint } from "@/components/tracking/rupture-points";
import { StepDetailDrawer } from "@/components/tracking/step-detail-drawer";
import { Progress } from "@/components/ui/progress";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import type { DossierEvent } from "@/domain/entities/processes";
import { PHASE_ORDER, type IndexedStep } from "@/domain/workflows/tracking";

/**
 * Suivi indexé du parcours de l'emprunteur.
 *
 * Les étapes ne sont pas décoratives : chacune porte le **code** de son
 * manuel de procédures (`CRD-01`…`CRD-13`, `GAR-01`), sa phase et son état —
 * franchie, en cours, à venir. Les phases sont présentées dans l'ordre
 * officiel du circuit (`PHASE_ORDER`), pas dans l'ordre du tableau.
 *
 * Chaque étape est **cliquable** : elle ouvre le journal de cette étape du
 * parcours — qui a fait quoi, quand.
 *
 * Composant de présentation : il ne lit rien, il ne reçoit que des
 * propriétés simples. Aucun identifiant personnel n'y transite.
 */

/** Qui porte l'étape : le couloir du diagramme en couloirs de la cartographie. */
const LANE_LABELS: Record<IndexedStep["lane"], string> = {
  client: "Emprunteur",
  agence: "Agence",
  siege: "Siège",
  partenaires: "Partenaires",
  support: "Support",
};

const STATUS_LABELS: Record<IndexedStep["status"], string> = {
  done: "Validée",
  current: "En cours",
  pending: "À venir",
};

const STATUS_TONES: Record<IndexedStep["status"], "green" | "amber" | "neutral"> = {
  done: "green",
  current: "amber",
  pending: "neutral",
};

export type TrackingStepperProps = {
  /** Étapes indexées du circuit, déjà ordonnées par le domaine. */
  steps: IndexedStep[];
  /** Avancement global, en pourcentage d'étapes franchies. */
  progress: number;
  /**
   * Le journal du dossier.
   *
   * Il alimente le panneau d'étape : sans lui, le panneau ne dirait que
   * l'étape est vide.
   */
  events?: DossierEvent[];
  /**
   * Page de discussion, où l'étape est ciblée.
   *
   * Discuter d'une étape, c'est rattacher la conversation **à cette étape du
   * parcours** : le conseiller voit exactement de quoi l'emprunteur parle.
   */
  discussionPath?: string;
};

export function TrackingStepper({
  steps,
  progress,
  events = [],
  discussionPath,
}: TrackingStepperProps) {
  const [openStep, setOpenStep] = React.useState<IndexedStep | null>(null);

  const groups = PHASE_ORDER.map((phase) => {
    const phaseSteps = steps.filter((step) => step.phase === phase);
    return {
      phase,
      label: phaseSteps[0]?.phaseLabel ?? phase,
      steps: phaseSteps,
    };
  }).filter((group) => group.steps.length > 0);

  const doneCount = steps.filter((step) => step.status === "done").length;

  return (
    <section
      aria-labelledby="parcours-titre"
      className="flex flex-col gap-4 rounded-xl border border-line-strong bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="parcours-titre" className="text-sm font-semibold text-foreground">
            Parcours du dossier
          </h2>
          <span className="caption-style text-soft">
            {doneCount} étape(s) franchie(s) sur {steps.length}
          </span>
        </div>
        <Tag tone="teal" size="sm" className="text-[11px]">
          {progress} % du parcours
        </Tag>
      </div>

      <Progress value={progress} aria-label={`Avancement du parcours : ${progress} %`} />

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section
            key={group.phase}
            aria-labelledby={`phase-${group.phase}`}
            className="flex flex-col gap-2"
          >
            <h3
              id={`phase-${group.phase}`}
              className="eyebrow-style break-words font-normal text-subtle"
            >
              {group.label}
            </h3>

            <ol className="flex flex-col gap-2">
              {group.steps.map((step) => (
                <li
                  key={step.code}
                  aria-current={step.status === "current" ? "step" : undefined}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                    step.status === "current" && "border-cfc-brown/40 bg-cfc-lightgold",
                    step.status === "done" && "border-line-strong bg-card",
                    step.status === "pending" && "border-dashed border-line-strong bg-muted/20",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      step.status === "done" && "border-success/40 bg-success/10 text-success",
                      step.status === "current" && "border-cfc-brown bg-cfc-brown text-white",
                      step.status === "pending" && "border-line-strong bg-background text-soft",
                    )}
                  >
                    {step.status === "done" ? (
                      <Check className="size-3" />
                    ) : step.status === "current" ? (
                      <CircleDot className="size-3" />
                    ) : (
                      <Circle className="size-2" />
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOpenStep(step)}
                      aria-expanded={openStep?.code === step.code}
                      className="flex w-fit max-w-full flex-col gap-1 text-left transition-colors hover:text-cfc-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="shrink-0 font-mono text-[11px] font-medium text-soft">
                          {step.code}
                        </span>
                        <span
                          className={cn(
                            "text-[13px] leading-snug break-words",
                            step.status === "pending"
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {step.label}
                        </span>
                      </span>
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag tone={STATUS_TONES[step.status]} size="sm" className="text-[11px]">
                        {STATUS_LABELS[step.status]}
                      </Tag>
                      {step.external && (
                        <Tag tone="neutral" size="sm" className="text-[11px]">
                          <ExternalLink className="size-3" aria-hidden />
                          Partenaire externe
                        </Tag>
                      )}
                      <span className="caption-style text-soft">{LANE_LABELS[step.lane]}</span>
                      {discussionPath ? (
                        <Link
                          href={`${discussionPath}?etape=${step.code}`}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-cfc-brown underline-offset-2 transition-colors hover:bg-muted hover:underline"
                          aria-label={`Discuter au sujet de l'étape ${step.code}`}
                        >
                          <MessageSquare className="size-3" aria-hidden />
                          Discuter
                        </Link>
                      ) : null}
                    </div>

                    <RupturePoint stepCode={step.code} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <StepDetailDrawer
        step={openStep}
        events={events}
        steps={steps}
        open={openStep !== null}
        onOpenChange={(open) => {
          if (!open) setOpenStep(null);
        }}
      />
    </section>
  );
}

export default TrackingStepper;
