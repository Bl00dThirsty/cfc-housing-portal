"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS,
  validateStep,
  type OnboardingDraft,
  type OnboardingStepId,
} from "@/domain/entities/onboarding";
import type { ServiceSummary } from "@/domain/entities/services";

import { StepAccount } from "./steps/step-account";
import { StepDocuments } from "./steps/step-documents";
import { StepProfile } from "./steps/step-profile";
import { StepService } from "./steps/step-service";

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
  const [step, setStep] = React.useState<OnboardingStepId>("account");
  const [draft, setDraft] = React.useState<OnboardingDraft>(initialDraft);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [dossierCode, setDossierCode] = React.useState<string | null>(null);

  const patch = React.useCallback((values: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...values }));
    setErrors([]);
  }, []);

  const stepIndex = ONBOARDING_STEPS.findIndex((item) => item.id === step);

  const goNext = React.useCallback(async () => {
    const validation = validateStep(step, draft);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);

    const next = ONBOARDING_STEPS[stepIndex + 1];
    if (next) {
      setStep(next.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [draft, step, stepIndex]);

  const goBack = React.useCallback(() => {
    const previous = ONBOARDING_STEPS[stepIndex - 1];
    if (!previous) return;
    setErrors([]);
    setStep(previous.id);
  }, [stepIndex]);

  const finish = React.useCallback(() => {
    router.push("/portal");
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-1.5">
        <span className="eyebrow-style font-normal text-cfc-gold">
          Guichet Unique · Dossier Unique Client
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Constituer votre dossier de prêt
        </h1>
        <p className="text-sm text-muted-foreground">
          Quatre étapes, et votre dossier est ouvert au CFC. Vous pouvez revenir
          dessus à tout moment depuis votre portail.
        </p>
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

      {errors.length > 0 && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 p-3 animate-in fade-in-0 slide-in-from-top-1 duration-300 ease-power3-out"
        >
          {errors.map((error) => (
            <p key={error} className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {error}
            </p>
          ))}
        </div>
      )}

      <section className="rounded-lg border border-line-strong bg-card p-5 shadow-xs">
        {step === "account" && (
          <StepAccount
            draft={draft}
            onChange={patch}
            signedIn={signedIn}
            onNext={goNext}
            saving={saving}
            setSaving={setSaving}
          />
        )}
        {step === "service" && (
          <StepService
            draft={draft}
            onChange={patch}
            services={services}
            onNext={goNext}
            saving={saving}
            setSaving={setSaving}
            onDossierCreated={setDossierCode}
          />
        )}
        {step === "profile" && (
          <StepProfile
            draft={draft}
            onChange={patch}
            onNext={goNext}
            saving={saving}
            setSaving={setSaving}
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
      </footer>
    </div>
  );
}
