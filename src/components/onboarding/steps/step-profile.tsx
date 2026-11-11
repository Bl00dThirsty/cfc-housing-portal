"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveProfileAction } from "@/server/actions/onboarding";
import {
  parseAmount,
  validateStep,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";

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
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    const validation = validateStep("profile", draft);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    setError(null);
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

      if (!result.ok) {
        setError(result.error);
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
        <h2 className="text-base font-semibold text-foreground">Votre dossier</h2>
        <p className="text-sm text-muted-foreground">
          Ces éléments alimentent le scoring du prêt et la décision du comité de
          crédit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="onboarding-fullname" className="eyebrow-style font-normal text-subtle">
            Nom complet <span className="text-cfc-brown">*</span>
          </label>
          <Input
            id="onboarding-fullname"
            value={draft.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            placeholder="ABANDA Eric"
            autoComplete="name"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-birthdate" className="eyebrow-style font-normal text-subtle">
            Date de naissance <span className="text-cfc-brown">*</span>
          </label>
          <Input
            id="onboarding-birthdate"
            type="date"
            value={draft.birthDate}
            onChange={(event) => onChange({ birthDate: event.target.value })}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-cni" className="eyebrow-style font-normal text-subtle">
            Numéro de CNI <span className="text-cfc-brown">*</span>
          </label>
          <Input
            id="onboarding-cni"
            value={draft.cniNumber}
            onChange={(event) => onChange({ cniNumber: event.target.value })}
            placeholder="AB123456"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <AddressAutocomplete
            id="onboarding-address"
            label="Adresse de résidence"
            required
            value={draft.address}
            onChange={(address) => onChange({ address: address })}
            hint="Commencez à saisir votre quartier ou votre rue. Vous pouvez aussi saisir l'adresse manuellement."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-profession" className="eyebrow-style font-normal text-subtle">
            Profession
          </label>
          <Input
            id="onboarding-profession"
            value={draft.profession}
            onChange={(event) => onChange({ profession: event.target.value })}
            placeholder="Ingénieur"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-employer" className="eyebrow-style font-normal text-subtle">
            Employeur
          </label>
          <Input
            id="onboarding-employer"
            value={draft.employer}
            onChange={(event) => onChange({ employer: event.target.value })}
            placeholder="SIC"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-income" className="eyebrow-style font-normal text-subtle">
            Revenu mensuel net <span className="text-cfc-brown">*</span>
          </label>
          <Input
            id="onboarding-income"
            inputMode="numeric"
            value={draft.monthlyIncome}
            onChange={(event) => onChange({ monthlyIncome: event.target.value })}
            placeholder="850 000"
            required
          />
          <span className="caption-style text-soft">En francs CFA (XAF).</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-dependants" className="eyebrow-style font-normal text-subtle">
            Personnes à charge
          </label>
          <Input
            id="onboarding-dependants"
            type="number"
            min={0}
            max={20}
            value={draft.dependants}
            onChange={(event) =>
              onChange({ dependants: Number.parseInt(event.target.value, 10) || 0 })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="onboarding-loans" className="eyebrow-style font-normal text-subtle">
            Crédits en cours
          </label>
          <Input
            id="onboarding-loans"
            value={draft.existingLoans}
            onChange={(event) => onChange({ existingLoans: event.target.value })}
            placeholder="Aucun crédit en cours"
          />
        </div>
      </div>

      <p className="caption-style text-soft">
        Capacité d&apos;endettement estimée sur la base de votre revenu :{" "}
        <span className="font-medium text-foreground">
          {parseAmount(draft.monthlyIncome) > 0
            ? `${(Math.round((parseAmount(draft.monthlyIncome) * 0.33) / 1000) * 1000).toLocaleString("fr-FR")} FCFA`
            : "—"}
        </span>{" "}
        (33 % du revenu net, seuil institutionnel — le montant définitif est
        arrêté par le comité de crédit).
      </p>

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
          Enregistrer et continuer
        </Button>
      </div>
    </div>
  );
}
