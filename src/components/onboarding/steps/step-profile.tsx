"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { reportAction, reportError } from "@/lib/action-feedback";
import { saveProfileAction } from "@/server/actions/onboarding";
import {
  parseAmount,
  validateStep,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

/**
 * Étape 3 — le dossier.
 *
 * Ces éléments alimentent le scoring du prêt et la décision du comité de
 * crédit : ils sont donc vérifiés, et chaque champ dit ce qu'il lui manque.
 *
 * Deux saisies sont formatées à la frappe : le revenu, par groupes de trois
 * chiffres, et le numéro de CNI, qui se saisit en majuscules.
 */

/** Le montant, lisible : « 850 000 ». */
function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  return Number.parseInt(digits, 10).toLocaleString("fr-FR");
}

type StepProfileProps = {
  draft: OnboardingDraft;
  onChange: (values: Partial<OnboardingDraft>) => void;
  onNext: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

export function StepProfile({
  draft,
  onChange,
  onNext,
  saving,
  setSaving,
}: StepProfileProps) {
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = validateStep("profile", draft);
    setFieldErrors(validation.fields);

    if (!validation.valid) {
      reportError("Complétez les champs signalés.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveProfileAction({
        fullName: draft.fullName,
        birthDate: draft.birthDate,
        cniNumber: draft.cniNumber,
        address: draft.address,
        profession: draft.profession,
        employer: draft.employer,
        monthlyIncome: draft.monthlyIncome,
        dependants: draft.dependants,
        existingLoans: draft.existingLoans,
      });

      if (!reportAction(result, "Vos informations sont enregistrées.")) {
        setError(result.ok ? null : result.error);
        return;
      }

      onNext();
    } finally {
      setSaving(false);
    }
  };

  const capacity = parseAmount(draft.monthlyIncome);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">Votre dossier</h2>
        <p className="text-sm text-muted-foreground">
          Ces éléments alimentent le scoring du prêt et la décision du comité de
          crédit.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nom complet"
          htmlFor="onboarding-fullname"
          required
          error={fieldErrors.fullName}
          className="sm:col-span-2"
        >
          <Input
            id="onboarding-fullname"
            value={draft.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            placeholder="ABANDA Eric"
            autoComplete="name"
            required
            aria-invalid={fieldErrors.fullName ? true : undefined}
          />
        </Field>

        <Field
          label="Date de naissance"
          htmlFor="onboarding-birthdate"
          required
          error={fieldErrors.birthDate}
          hint="Vous devez être majeur pour solliciter un prêt."
        >
          <Input
            id="onboarding-birthdate"
            type="date"
            value={draft.birthDate}
            onChange={(event) => onChange({ birthDate: event.target.value })}
            max={new Date().toISOString().slice(0, 10)}
            required
            aria-invalid={fieldErrors.birthDate ? true : undefined}
          />
        </Field>

        <Field
          label="Numéro de CNI"
          htmlFor="onboarding-cni"
          required
          error={fieldErrors.cniNumber}
          hint="Le numéro de votre carte nationale d'identité."
        >
          <Input
            id="onboarding-cni"
            value={draft.cniNumber}
            onChange={(event) =>
              onChange({ cniNumber: event.target.value.toUpperCase().replace(/\s/g, "") })
            }
            placeholder="AB123456"
            autoComplete="off"
            required
            aria-invalid={fieldErrors.cniNumber ? true : undefined}
          />
        </Field>

        <div className="sm:col-span-2">
          <AddressAutocomplete
            id="onboarding-address"
            label="Adresse de résidence"
            required
            value={draft.address}
            onChange={(address) => onChange({ address: address })}
            hint="Commencez à saisir votre quartier ou votre rue. Vous pouvez aussi saisir l'adresse manuellement."
            error={fieldErrors.address}
          />
        </div>

        <Field label="Profession" htmlFor="onboarding-profession">
          <Input
            id="onboarding-profession"
            value={draft.profession}
            onChange={(event) => onChange({ profession: event.target.value })}
            placeholder="Ingénieur"
            autoComplete="organization-title"
          />
        </Field>

        <Field label="Employeur" htmlFor="onboarding-employer">
          <Input
            id="onboarding-employer"
            value={draft.employer}
            onChange={(event) => onChange({ employer: event.target.value })}
            placeholder="SIC"
            autoComplete="organization"
          />
        </Field>

        <Field
          label="Revenu mensuel net"
          htmlFor="onboarding-income"
          required
          error={fieldErrors.monthlyIncome}
          hint="En francs CFA (XAF)."
        >
          <Input
            id="onboarding-income"
            inputMode="numeric"
            value={draft.monthlyIncome}
            onChange={(event) => onChange({ monthlyIncome: formatAmountInput(event.target.value) })}
            placeholder="850 000"
            required
            aria-invalid={fieldErrors.monthlyIncome ? true : undefined}
          />
        </Field>

        <Field
          label="Personnes à charge"
          htmlFor="onboarding-dependants"
          hint="Enfants, conjoints et personnes à votre charge."
        >
          <Input
            id="onboarding-dependants"
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={draft.dependants}
            onChange={(event) =>
              onChange({ dependants: Number.parseInt(event.target.value, 10) || 0 })
            }
          />
        </Field>

        <Field
          label="Crédits en cours"
          htmlFor="onboarding-loans"
          className="sm:col-span-2"
          hint="Les crédits immobiliers ou de consommation que vous avez en cours. Laissez vide si vous n'en avez pas."
        >
          <Input
            id="onboarding-loans"
            value={draft.existingLoans}
            onChange={(event) => onChange({ existingLoans: event.target.value })}
            placeholder="Aucun crédit en cours"
          />
        </Field>
      </div>

      <p className="caption-style text-soft">
        Capacité d&apos;endettement estimée sur la base de votre revenu :{" "}
        <span className="font-medium text-foreground">
          {capacity > 0
            ? `${(Math.round((capacity * 0.33) / 1000) * 1000).toLocaleString("fr-FR")} FCFA`
            : "—"}
        </span>{" "}
        (33 % du revenu net, seuil institutionnel — le montant définitif est
        arrêté par le comité de crédit).
      </p>

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
          Enregistrer et continuer
        </Button>
      </div>
    </form>
  );
}
