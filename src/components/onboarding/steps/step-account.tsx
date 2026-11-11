"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { getBrowserClient } from "@/lib/supabase/client";
import { saveAccountAction } from "@/server/actions/onboarding";
import {
  AFFILIATION_OPTIONS,
  isValidCameroonPhone,
  isValidEmail,
  normalisePhone,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

type StepAccountProps = {
  draft: OnboardingDraft;
  onChange: (values: Partial<OnboardingDraft>) => void;
  onNext: () => void;
  signedIn: boolean;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

export function StepAccount({
  draft,
  onChange,
  onNext,
  signedIn,
  saving,
  setSaving,
}: StepAccountProps) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);

    if (!isValidEmail(draft.email)) {
      setError("Renseignez une adresse e-mail valide.");
      return;
    }
    if (!isValidCameroonPhone(draft.phone)) {
      setError("Renseignez un numéro de téléphone camerounais valide.");
      return;
    }
    if (!draft.affiliation) {
      setError("Indiquez votre situation bancaire.");
      return;
    }

    setSaving(true);
    try {
      if (!signedIn) {
        if (password.length < 8) {
          setError("Choisissez un mot de passe d'au moins 8 caractères.");
          setSaving(false);
          return;
        }

        const supabase = getBrowserClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: draft.email.trim(),
          password,
        });

        if (signUpError) {
          if (/already registered|already exists/i.test(signUpError.message)) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: draft.email.trim(),
              password,
            });
            if (signInError) {
              setError(
                "Un compte existe déjà avec cette adresse. Connectez-vous avec votre mot de passe.",
              );
              setSaving(false);
              return;
            }
          } else {
            setError(signUpError.message);
            setSaving(false);
            return;
          }
        } else if (!data.session) {
          setError(
            "Votre compte a été créé. Confirmez votre adresse e-mail avant de continuer.",
          );
          setSaving(false);
          return;
        }
      }

      const result = await saveAccountAction({
        phone: normalisePhone(draft.phone),
        affiliation: draft.affiliation!,
      });

      if (!result.ok) {
        setError(result.error);
        setSaving(false);
        return;
      }

      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">Qui êtes-vous ?</h2>
        <p className="text-sm text-muted-foreground">
          Ces informations identifient votre dossier unique client.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-email" className="eyebrow-style font-normal text-subtle">
            Adresse e-mail <span className="text-cfc-brown">*</span>
          </label>
          <Input
            id="onboarding-email"
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(event) => onChange({ email: event.target.value })}
            placeholder="nom.prenom@cfc.cm"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-phone" className="eyebrow-style font-normal text-subtle">
            Téléphone <span className="text-cfc-brown">*</span>
          </label>
          <Input
            id="onboarding-phone"
            type="tel"
            autoComplete="tel"
            value={draft.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            placeholder="+237 6 99 00 00 00"
            required
          />
        </div>

        {!signedIn && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="onboarding-password" className="eyebrow-style font-normal text-subtle">
              Mot de passe <span className="text-cfc-brown">*</span>
            </label>
            <PasswordInput
              id="onboarding-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="8 caractères minimum"
            />
            <span className="caption-style text-soft">
              Ce mot de passe protège vos accès au portail citoyen.
            </span>
          </div>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow-style mb-1 font-normal text-subtle">
          Votre situation bancaire <span className="text-cfc-brown">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AFFILIATION_OPTIONS.map((option) => {
            const active = draft.affiliation === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ affiliation: option.value })}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-1 rounded-md border p-3 text-left transition-all duration-200 ease-power3-out",
                  "hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-cfc-brown bg-cfc-lightgold/50"
                    : "border-line-strong bg-background",
                )}
              >
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                <span className="caption-style text-muted-foreground">{option.description}</span>
                {active && (
                  <span className="caption-style mt-1 flex items-start gap-1.5 text-cfc-brown animate-in fade-in-0 duration-200">
                    {option.consequence}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          variant="cfc"
          size="sm"
          onClick={submit}
          disabled={saving}
          className="gap-1.5 text-xs"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-3.5" aria-hidden />
          )}
          {signedIn ? "Continuer" : "Créer mon compte et continuer"}
        </Button>
      </div>
    </div>
  );
}
