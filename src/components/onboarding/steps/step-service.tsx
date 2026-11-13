"use client";

import * as React from "react";
import { ArrowRight, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { reportAction, reportError } from "@/lib/action-feedback";
import { saveServiceAction } from "@/server/actions/onboarding";
import type { ServiceSummary } from "@/domain/entities/services";
import type { OnboardingDraft } from "@/domain/entities/onboarding";

/**
 * Étape 2 — le service.
 *
 * Le service détermine les pièces exigées et le circuit de validation : c'est
 * le choix qui engage le dossier. Le catalogue est une donnée ; s'il est vide,
 * l'écran le dit — il ne montre pas un formulaire sans choix.
 */

type StepServiceProps = {
  draft: OnboardingDraft;
  onChange: (values: Partial<OnboardingDraft>) => void;
  services: ServiceSummary[];
  onNext: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  onDossierCreated: (code: string | null) => void;
};

export function StepService({
  draft,
  onChange,
  services,
  onNext,
  saving,
  setSaving,
  onDossierCreated,
}: StepServiceProps) {
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!draft.serviceCode) {
      setError("Choisissez le service pour lequel vous sollicitez un prêt.");
      reportError("Choisissez le service pour lequel vous sollicitez un prêt.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveServiceAction(draft.serviceCode);

      if (!result.ok) {
        reportAction(result);
        setError(result.error);
        return;
      }

      reportAction(
        result,
        result.dossierCode ? `Dossier ${result.dossierCode} ouvert.` : "Dossier ouvert.",
      );

      onDossierCreated(result.dossierCode ?? null);
      onNext();
    } finally {
      setSaving(false);
    }
  };

  if (services.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Quel service ?</h2>
        <p className="text-sm text-muted-foreground">
          Le catalogue des produits n&apos;est pas encore publié. Revenez dans un
          instant ou contactez votre agence CFC.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">Quel service ?</h2>
        <p className="text-sm text-muted-foreground">
          Le service détermine les pièces que vous devrez fournir et le circuit
          de validation de votre dossier.
        </p>
      </div>

      <div className="grid gap-2" role="radiogroup" aria-label="Service demandé">
        {services.map((service) => {
          const active = draft.serviceCode === service.code;
          const required = service.documents.filter((doc) => doc.required).length;

          return (
            <button
              key={service.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ serviceCode: service.code })}
              className={cn(
                "flex flex-col gap-1.5 rounded-md border p-3 text-left transition-all duration-200 ease-power3-out",
                "hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-cfc-brown bg-cfc-lightgold/50"
                  : "border-line-strong bg-background",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{service.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full bg-cfc-brown animate-in zoom-in-75 duration-200"
                  />
                )}
              </div>
              {service.description && (
                <span className="caption-style text-muted-foreground">
                  {service.description}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Badge variant="secondary" className="h-4 gap-1 px-1.5 text-[10px]">
                  <FileText className="size-2.5" aria-hidden />
                  {required} pièce{required > 1 ? "s" : ""} requise{required > 1 ? "s" : ""}
                </Badge>
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="cfc"
          size="sm"
          disabled={saving}
          className="gap-1.5 text-xs"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-3.5" aria-hidden />
          )}
          Ouvrir mon dossier
        </Button>
      </div>
    </form>
  );
}
