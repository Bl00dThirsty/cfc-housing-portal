"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Info, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { reportAction, reportError } from "@/lib/action-feedback";
import { createAccountAction, saveAccountAction } from "@/server/actions/onboarding";
import {
  AFFILIATION_OPTIONS,
  validateStep,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

/**
 * Étape 1 — le compte.
 *
 * C'est ici que le compte est créé, et c'est aussi le seul endroit du parcours
 * qui parle à Supabase Auth directement. Le reste passe par les actions
 * serveur.
 *
 * Trois refus sont traités **séparément**, parce qu'ils ne se corrigent pas de
 * la même façon :
 *
 * - le compte **existe déjà** : le mot de passe ne va pas, l'emprunteur doit
 *   se connecter ;
 * - le compte est **créé mais l'e-mail doit être confirmé** : la session
 *   n'existe pas encore, il faut passer par la boîte de réception ;
 * - le **refus du serveur** : il est affiché tel quel.
 *
 * Aucun de ces refus ne ressemble à une absence : chacun dit ce qui s'est
 * passé et ce qu'il reste à faire.
 */

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
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [accountExists, setAccountExists] = React.useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAccountExists(false);
    setAwaitingConfirmation(false);

    const validation = validateStep("account", draft);
    setFieldErrors(validation.fields);

    if (!validation.valid) {
      reportError("Complétez les champs signalés.");
      return;
    }

    if (!signedIn && password.length < 8) {
      setFieldErrors({ password: "Choisissez un mot de passe d'au moins 8 caractères." });
      reportError("Choisissez un mot de passe d'au moins 8 caractères.");
      return;
    }

    setSaving(true);
    try {
      if (!signedIn) {
        // La création du compte est **côté serveur** : c'est lui qui pose la
        // session dans le cookie de la réponse. Une création faite dans le
        // navigateur laisserait la requête suivante — celle qui enregistre la
        // situation — sans session.
        const result = await createAccountAction({
          email: draft.email.trim(),
          password,
          phone: draft.phone,
          affiliation: draft.affiliation!,
        });

        if (!result.ok) {
          if (result.code === "ACCOUNT_EXISTS") {
            setAccountExists(true);
            setFieldErrors({ email: result.error });
          } else {
            setError(result.error);
          }
          reportError(result.error);
          return;
        }

        if (result.pendingConfirmation) {
          setAwaitingConfirmation(true);
          reportError(
            result.message ?? "Confirmez votre adresse e-mail pour continuer.",
          );
          return;
        }

        reportAction(result, result.message);
        onNext();
        return;
      }

      // Déjà connecté : seule la situation est à enregistrer.
      const result = await saveAccountAction({
        phone: draft.phone,
        affiliation: draft.affiliation!,
      });

      if (!reportAction(result, "Votre situation est enregistrée.")) {
        setError(result.ok ? null : result.error);
        return;
      }

      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">Qui êtes-vous ?</h2>
        <p className="text-sm text-muted-foreground">
          Ces informations identifient votre dossier unique client.
        </p>
      </div>

      {awaitingConfirmation && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-md border border-cfc-gold/40 bg-cfc-lightgold/60 p-3 text-xs text-foreground"
        >
          <p className="flex items-start gap-2 font-medium">
            <Info className="mt-0.5 size-3.5 shrink-0 text-cfc-brown" aria-hidden />
            Votre compte a été créé. Un message de confirmation vient d&apos;être
            envoyé à {draft.email.trim()}.
          </p>
          <p className="text-muted-foreground">
            Ouvrez ce message, puis{" "}
            <Link
              href="/login"
              className="font-medium text-cfc-brown underline underline-offset-2 hover:text-cfc-darkbrown"
            >
              connectez-vous
            </Link>{" "}
            pour reprendre votre dossier.
          </p>
        </div>
      )}

      {accountExists && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground"
        >
          <p className="font-medium text-destructive">
            Un compte existe déjà avec cette adresse e-mail.
          </p>
          <p className="text-muted-foreground">
            Connectez-vous pour reprendre votre dossier, ou utilisez une autre
            adresse pour créer un compte.
          </p>
          <Link
            href="/login"
            className="w-fit font-medium text-cfc-brown underline underline-offset-2 hover:text-cfc-darkbrown"
          >
            Se connecter
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Adresse e-mail"
          htmlFor="onboarding-email"
          required
          error={fieldErrors.email}
          hint={signedIn ? undefined : "Elle sert aussi à confirmer votre compte."}
        >
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="onboarding-email"
              type="email"
              autoComplete="email"
              value={draft.email}
              onChange={(event) => onChange({ email: event.target.value })}
              placeholder="nom.prenom@cfc.cm"
              required
              aria-invalid={fieldErrors.email ? true : undefined}
            />
          </div>
        </Field>

        <PhoneInput
          id="onboarding-phone"
          value={draft.phone}
          onChange={(phone) => onChange({ phone })}
          required
          error={fieldErrors.phone}
          hint="Format international — l'indicatif se choisit à gauche."
        />

        {!signedIn && (
          <Field
            label="Mot de passe"
            htmlFor="onboarding-password"
            required
            error={fieldErrors.password}
            hint="8 caractères minimum. Ce mot de passe protège vos accès au portail citoyen."
            className="sm:col-span-2"
          >
            <PasswordInput
              id="onboarding-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              aria-invalid={fieldErrors.password ? true : undefined}
            />
          </Field>
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
        {fieldErrors.affiliation && (
          <p role="alert" className="text-xs text-destructive">
            {fieldErrors.affiliation}
          </p>
        )}
      </fieldset>

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
          {signedIn ? "Continuer" : "Créer mon compte et continuer"}
        </Button>
      </div>
    </form>
  );
}
