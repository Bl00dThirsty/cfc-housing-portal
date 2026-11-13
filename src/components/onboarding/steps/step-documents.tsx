"use client";

import { ArrowRight, Check, FileText, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reportAction } from "@/lib/action-feedback";
import type { ServiceSummary } from "@/domain/entities/services";
import type { OnboardingDraft } from "@/domain/entities/onboarding";

/**
 * Étape 4 — les pièces.
 *
 * Le catalogue documentaire est **une donnée** : la Direction Générale le
 * fait évoluer, un dossier en cours ne perd jamais une pièce exigée. Cette
 * étape montre donc la liste, et elle dit où déposer les pièces.
 */

type StepDocumentsProps = {
  draft: OnboardingDraft;
  services: ServiceSummary[];
  dossierCode: string | null;
  onBack: () => void;
  onFinish: () => void;
};

const STAGE_LABELS: Record<string, string> = {
  ONBOARDING: "À l'inscription",
  SAVINGS: "Pendant l'épargne",
  CREDIT_FILE: "Au montage du dossier de crédit",
};

export function StepDocuments({
  draft,
  services,
  dossierCode,
  onBack,
  onFinish,
}: StepDocumentsProps) {
  const service = services.find((item) => item.code === draft.serviceCode);
  const documents = service?.documents ?? [];

  const grouped = documents.reduce<Record<string, typeof documents>>((accumulator, doc) => {
    (accumulator[doc.stage] ??= []).push(doc);
    return accumulator;
  }, {});

  const required = documents.filter((doc) => doc.required).length;

  const finish = () => {
    reportAction(
      { ok: true },
      dossierCode
        ? `Dossier ${dossierCode} ouvert — vous pouvez déposer vos pièces.`
        : "Votre dossier est ouvert.",
    );
    onFinish();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">Vos pièces</h2>
        <p className="text-sm text-muted-foreground">
          {service
            ? `Voici les pièces exigées pour le « ${service.label} ». Vous pourrez les déposer depuis votre portail, une par une, avec un agent du Guichet.`
            : "Sélectionnez un service pour voir les pièces exigées."}
        </p>
      </div>

      {dossierCode && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-cfc-gold/40 bg-cfc-lightgold/60 px-3 py-2">
          <span className="text-xs text-muted-foreground">Numéro de dossier</span>
          <span className="font-mono text-xs font-semibold text-cfc-brown">{dossierCode}</span>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune pièce n&apos;est encore déclarée pour ce service.
        </p>
      ) : (
        <>
          <p className="caption-style text-soft">
            {required} pièce{required > 1 ? "s" : ""} obligatoire{required > 1 ? "s" : ""} sur{" "}
            {documents.length}.
          </p>
          {Object.entries(grouped).map(([stage, stageDocuments]) => (
            <section key={stage} className="flex flex-col gap-2">
              <h3 className="eyebrow-style font-normal text-subtle">
                {STAGE_LABELS[stage] ?? stage}
              </h3>
              <ul className="flex flex-col divide-y divide-line-strong rounded-md border border-line-strong">
                {stageDocuments.map((doc) => (
                  <li
                    key={`${stage}-${doc.docTypeCode}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm text-foreground">{doc.label}</span>
                        <span className="truncate caption-style text-soft">
                          {doc.natureLabel}
                          {doc.issuingAuthority ? ` · ${doc.issuingAuthority}` : ""}
                        </span>
                      </div>
                    </div>
                    {doc.required ? (
                      <Badge variant="cfc" className="h-4 shrink-0 px-1.5 text-[10px]">
                        Obligatoire
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[10px]">
                        Facultatif
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      <div className="flex items-start gap-2 rounded-md border border-line-strong bg-muted/40 p-3">
        <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="caption-style text-muted-foreground">
          Toute modification de cette liste est faite par la Direction Générale
          via le catalogue documentaire : une pièce exigée ne peut pas être
          retirée du dossier d&apos;un emprunteur en cours.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
          Retour
        </Button>
        <Button
          variant="cfc"
          size="sm"
          onClick={finish}
          className="gap-1.5 text-xs"
          disabled={!dossierCode && !draft.serviceCode}
        >
          <Check className="size-3.5" aria-hidden />
          Ouvrir mon portail
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
