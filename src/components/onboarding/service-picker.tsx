"use client";

/**
 * Le choix du service — et ses trois issues.
 *
 * La carte est lue du **catalogue de référence** : elle affiche le service
 * tel que la CFC l'a déclaré (public, audience, apport, durée, taux, pièces
 * attendues). Le catalogue est une donnée ; l'écran ne réinvente rien.
 *
 * La sélection ouvre une fenêtre à **trois choix**. La réponse n'est pas
 * décorative : elle décide de la suite du parcours.
 *
 * - **déjà servi au CFC** : le demandeur passe au dépôt des pièces ;
 * - **jamais servi, ou servi ailleurs** : il doit d'abord être client du
 *   CFC pendant six mois. Son cas part à un conseiller, et l'onboarding est
 *   **mis en pause** — l'espace citoyen devient un tableau de bord vide qui
 *   dit qui l'examine.
 */

import * as React from "react";
import { ArrowRight, Clock, FileText, Loader2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reportAction } from "@/lib/action-feedback";
import { cn } from "@/lib/utils";
import {
  saveServiceAction,
  setPriorClientCaseAction,
} from "@/server/actions/borrower-requests";
import {
  CFC_CLIENT_ANCENNETE_MOIS,
  PRIOR_CLIENT_CASES,
  type PriorClientCase,
} from "@/domain/entities/kyc-profile";
import type { ServiceSummary } from "@/domain/entities/services";

type ServicePickerProps = {
  services: ServiceSummary[];
  dossierId: string | null;
  onSuspended?: () => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

export function ServicePicker({
  services,
  dossierId,
  onSuspended,
  onNext,
  saving,
  setSaving,
}: ServicePickerProps) {
  const [selected, setSelected] = React.useState<ServiceSummary | null>(null);
  const [caseOpen, setCaseOpen] = React.useState(false);
  const [suspension, setSuspension] = React.useState<{ advisor: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  /** Le service choisi est **attaché** au dossier avant la question. */
  const openCaseWindow = async (service: ServiceSummary) => {
    if (!dossierId) {
      setError("Ouvrez une demande depuis votre espace avant de choisir un service.");
      return;
    }
    setSelected(service);
    setError(null);
    setSaving(true);

    try {
      const result = await saveServiceAction(service.code, dossierId);

      if (!result.ok) {
        reportAction(result);
        setError(result.error);
        return;
      }

      setCaseOpen(true);    } finally {
      setSaving(false);
    }
  };

  const choose = async (priorClientCase: PriorClientCase) => {
    if (!selected) return;
    if (!dossierId) {
      setError("Ouvrez une demande depuis votre espace avant de continuer.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const result = await setPriorClientCaseAction({ priorClientCase, dossierId });

      if (!result.ok) {
        reportAction(result);
        setError(result.error);
        return;
      }

      const priorCase = PRIOR_CLIENT_CASES.find((item) => item.value === priorClientCase);

      if (priorCase?.eligible) {
        setCaseOpen(false);
        reportAction(result, "Votre dossier passe au dépôt des pièces.");
        onNext();
        return;
      }

      // Le dossier est en pause : une seconde fenêtre explique l'attente et
      // nomme le conseiller. Un demandeur qui ne sait pas qui l'examine ne
      // sait pas quoi faire de son dossier.
      setCaseOpen(false);
      setSuspension({ advisor: result.advisor ?? "un conseiller CFC" });
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">Quel service ?</h2>
        <p className="text-sm text-muted-foreground">
          Le service détermine les pièces que vous devrez fournir et le circuit
          de validation de votre dossier.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-2" role="radiogroup" aria-label="Service demandé">
        {services.map((service) => {
          const product = service.products[0];
          const required = service.documents.filter((doc) => doc.required).length;

          return (
            <button
              key={service.code}
              type="button"
              role="radio"
              aria-checked={selected?.code === service.code}
              disabled={saving}
              onClick={() => void openCaseWindow(service)}
              className={cn(
                "flex flex-col gap-2 rounded-md border p-3 text-left transition-all duration-200 ease-power3-out",
                "hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-60",
                selected?.code === service.code
                  ? "border-cfc-brown bg-cfc-lightgold/50"
                  : "border-line-strong bg-background",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{service.label}</span>
                {service.audience && (
                  <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
                    <Users className="size-2.5" aria-hidden />
                    {service.audience}
                  </Badge>
                )}
              </div>

              {service.description && (
                <span className="caption-style text-muted-foreground">{service.description}</span>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {product?.indicativeRate !== null && product?.indicativeRate !== undefined && (
                  <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px]">
                    <Clock className="size-2.5" aria-hidden />
                    {product.indicativeRate} % / an
                  </Badge>
                )}
                {product?.minApportPercent !== null && product?.minApportPercent !== undefined && (
                  <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px]">
                    Apport {product.minApportPercent} %
                  </Badge>
                )}
                {product?.maxDurationYears !== null && product?.maxDurationYears !== undefined && (
                  <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px]">
                    Jusqu&apos;à {product.maxDurationYears} ans
                  </Badge>
                )}
                <Badge variant="secondary" className="h-4 gap-1 px-1.5 text-[10px]">
                  <FileText className="size-2.5" aria-hidden />
                  {required} pièce{required > 1 ? "s" : ""} requise{required > 1 ? "s" : ""}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      {/* La fenêtre à trois choix ------------------------------------- */}
      <Dialog open={caseOpen} onOpenChange={setCaseOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {selected?.label}
            </DialogTitle>
            <DialogDescription>
              Pour vous accompagner au mieux, nous devons savoir où vous en êtes
              avec ce service.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {PRIOR_CLIENT_CASES.map((priorCase) => (
              <button
                key={priorCase.value}
                type="button"
                disabled={saving}
                onClick={() => void choose(priorCase.value)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border p-3 text-left transition-all duration-200 ease-power3-out",
                  "hover:border-cfc-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-60",
                  "border-line-strong bg-background",
                )}
              >
                <span className="text-sm text-foreground">{priorCase.label}</span>
                <ArrowRight className="size-3.5 shrink-0 text-cfc-brown" aria-hidden />
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCaseOpen(false)}
              className="text-xs"
            >
              Revenir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* L'attente expliquée ------------------------------------------- */}
      <Dialog
        open={suspension !== null}
        onOpenChange={(open) => {
          if (!open) setSuspension(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Votre dossier est en cours d&apos;examen</DialogTitle>
            <DialogDescription>
              Pour souscrire ce service, il faut être client du Crédit Foncier
              du Cameroun depuis au moins {CFC_CLIENT_ANCENNETE_MOIS} mois — donc
              avoir tenu un carnet d&apos;épargne logement. Votre cas n&apos;est
              pas perdu : il est transmis à un conseiller, qui vous recontactera
              pour vous orienter.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-cfc-gold/40 bg-cfc-lightgold/50 p-3">
            <p className="text-xs font-semibold text-foreground">
              {suspension?.advisor}
            </p>
            <p className="caption-style mt-1 text-muted-foreground">
              Conseiller CFC — vous pouvez le joindre au guichet de votre agence.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="cfc"
              size="sm"
              onClick={() => {
                setSuspension(null);
                onSuspended?.();
              }}
              className="gap-1.5 text-xs"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              J&apos;ai compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
