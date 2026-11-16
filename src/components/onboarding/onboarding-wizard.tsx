"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS,
  resumeStepId,
  type OnboardingDraft,
  type OnboardingStepId,
} from "@/domain/entities/onboarding";
import type { ServiceSummary } from "@/domain/entities/services";

import { KycWizard } from "@/components/kyc/kyc-wizard";
import { ServicePicker } from "@/components/onboarding/service-picker";
import { StepDocuments } from "./steps/step-documents";

/**
 * Le parcours du dossier — trois étapes, un seul dossier.
 *
 * Le compte n'est plus une étape : il est ouvert par `/inscription`, la seule
 * porte qui en crée un. L'assistant suppose donc le demandeur **connecté**.
 *
 * Deux règles tiennent l'ensemble :
 *
 * - **la validation a un seul propriétaire** : chaque étape vérifie ses
 *   champs avant d'écrire, et le parcours ne revalide pas derrière elle ;
 * - **on reprend où l'on s'est arrêté** : un visiteur qui revient retrouve
 *   l'étape où son dossier s'est interrompu, pas la première.
 */

type OnboardingWizardProps = {
  services: ServiceSummary[];
  initialDraft: OnboardingDraft;
  signedIn: boolean;
};

export function OnboardingWizard({
  services,
  initialDraft,
  signedIn,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<OnboardingStepId>(() =>
    resumeStepId(initialDraft),
  );
  const [draft, setDraft] = React.useState<OnboardingDraft>(initialDraft);
  const [saving, setSaving] = React.useState(false);
  const [dossierCode, setDossierCode] = React.useState<string | null>(null);

  const patch = React.useCallback((values: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...values }));
  }, []);

  const stepIndex = ONBOARDING_STEPS.findIndex((item) => item.id === step);

  /** L'étape suivante : le parcours n'avance qu'après une écriture réussie. */
  const goNext = React.useCallback(() => {
    const next = ONBOARDING_STEPS[stepIndex + 1];
    if (!next) return;
    setStep(next.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  const goBack = React.useCallback(() => {
    const previous = ONBOARDING_STEPS[stepIndex - 1];
    if (!previous) return;
    setStep(previous.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  const finish = React.useCallback(() => {
    router.push("/portail-client");
  }, [router]);

  /** L'étape de reprise, pour le dire à l'utilisateur. */
  const resumed =
    draft.fullName.trim().length > 0 ||
    draft.serviceCode !== null ||
    Boolean(draft.profile.identity.birthDate) ||
    Boolean(draft.profile.residence.city);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {!signedIn && (
        <div className="mb-6 rounded-lg border border-line-strong bg-card p-5 shadow-xs">
          <h2 className="text-base font-semibold text-foreground">
            Ouvrez d&apos;abord votre compte
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre dossier est rattaché à votre compte : sans lui, nous ne pouvons
            pas l&apos;ouvrir ni le reprendre.
          </p>
          <Button asChild variant="cfc" size="sm" className="mt-3 gap-1.5 text-xs">
            <Link href="/inscription">
              Créer mon compte
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      )}

      <header className="mb-8 flex flex-col gap-1.5">
        <span className="eyebrow-style font-normal text-cfc-gold">
          Guichet Unique · Dossier Unique Client
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Constituer votre dossier de prêt
        </h1>
        <p className="text-sm text-muted-foreground">
          Trois étapes, et votre dossier est complet au CFC. Vous pouvez revenir
          dessus à tout moment depuis votre portail.
        </p>
        {resumed && (
          <p className="caption-style text-soft">
            Vous reprenez votre dossier là où vous l&apos;aviez laissé.
          </p>
        )}
      </header>

      <ol className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
        {ONBOARDING_STEPS.map((item, index) => {
          const state =
            index < stepIndex ? "done" : index === stepIndex ? "current" : "todo";
          return (
            <li key={item.id} className="flex flex-1 items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2">
              <button
                type="button"
                onClick={() => index <= stepIndex && setStep(item.id)}
                disabled={index > stepIndex}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 text-left transition-colors duration-200 ease-power3-out",
                  index <= stepIndex ? "cursor-pointer" : "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-200 ease-power3-out",
                    state === "done" && "border-cfc-gold bg-cfc-gold text-white",
                    state === "current" && "border-cfc-brown bg-cfc-brown text-white",
                    state === "todo" && "border-line-strong text-soft",
                  )}
                >
                  {state === "done" ? <Check className="size-3" aria-hidden /> : item.index}
                </span>
                <span className="flex flex-col">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      state === "todo" ? "text-soft" : "text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="caption-style text-soft">{item.caption}</span>
                </span>
              </button>
              {index < ONBOARDING_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden h-px flex-1 bg-line-strong sm:block"
                />
              )}
            </li>
          );
        })}
      </ol>

      <section className="rounded-lg border border-line-strong bg-card p-5 shadow-xs">
        {step === "kyc" && (
          <KycWizard
            profile={draft.profile}
            onProfileChange={(profile) => patch({ profile })}
            fullName={draft.fullName}
            phone={draft.phone}
            onPhoneChange={(phone) => patch({ phone })}
            affiliation={draft.affiliation}
            onAffiliationChange={(affiliation) => patch({ affiliation })}
            onNext={goNext}
          />
        )}
        {step === "service" && (
          <ServicePicker
            services={services}
            onNext={goNext}
            saving={saving}
            setSaving={setSaving}
            onDossierCreated={setDossierCode}
          />
        )}
        {step === "documents" && (
          <StepDocuments
            draft={draft}
            services={services}
            dossierCode={dossierCode}
            onBack={goBack}
            onFinish={finish}
          />
        )}
      </section>

      <footer className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          disabled={stepIndex === 0 || saving}
          className="gap-1.5 text-xs"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Précédent
        </Button>
        <span className="caption-style text-soft">
          Étape {stepIndex + 1} sur {ONBOARDING_STEPS.length}
        </span>
      </footer>
    </div>
  );
}
