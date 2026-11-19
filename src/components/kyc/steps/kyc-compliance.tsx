"use client";

/**
 * Écran D — la conformité et la déclaration.
 *
 * C'est l'écran de la **déclaration** : la qualité de personne politiquement
 * exposée, l'objet de la relation d'affaires, la situation bancaire, les
 * personnes à charge, les crédits en cours, et l'attestation sur l'honneur.
 *
 * L'attestation est horodatée **par le serveur** : la date du navigateur
 * n'est pas une preuve. L'écran ne propose donc qu'un acceptation, et
 * l'horodatage part avec la soumission.
 */

import * as React from "react";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type KycCompliance } from "@/domain/entities/kyc";
import type { KycOption } from "@/domain/entities/kyc-options";
import {
  AFFILIATION_OPTIONS,
  type AffiliationStatus,
} from "@/domain/entities/onboarding";
import { cn } from "@/lib/utils";

export interface KycComplianceStepProps {
  compliance: KycCompliance;
  pepReasonOptions: readonly KycOption[];
  onChange: (values: Partial<KycCompliance>) => void;
  /** La situation bancaire — elle vient du compte. */
  affiliation: AffiliationStatus | null;
  onAffiliationChange: (value: AffiliationStatus) => void;
  /** Le refus, rattaché à son champ. */
  errors: Record<string, string>;
}

export function KycComplianceStep({
  compliance,
  pepReasonOptions,
  onChange,
  affiliation,
  onAffiliationChange,
  errors,
}: KycComplianceStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow-style mb-1 font-normal text-subtle">
          Personne politiquement exposée <span className="text-cfc-brown">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { value: false, label: "Non — je ne suis pas une PPE" },
            { value: true, label: "Oui — je suis une PPE" },
          ].map((option) => {
            const active = compliance.politicallyExposed === option.value;
            return (
              <button
                key={String(option.value)}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({
                    politicallyExposed: option.value,
                    pepReason: option.value ? compliance.pepReason : null,
                  })
                }
                className={cn(
                  "rounded-md border p-3 text-left text-sm transition-all duration-200 ease-power3-out",
                  "hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-cfc-brown bg-cfc-lightgold/50 text-foreground"
                    : "border-line-strong bg-background",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {compliance.politicallyExposed && (
          <Field
            label="Motif de l'exposition"
            htmlFor="kyc-pep-reason"
            className="mt-2"
            error={errors["compliance.pepReason"]}
          >
            <Select
              value={compliance.pepReason ?? ""}
              onValueChange={(value) =>
                onChange({ pepReason: value || null })
              }
            >
              <SelectTrigger id="kyc-pep-reason">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {pepReasonOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Objet de la relation d'affaires"
          htmlFor="kyc-business-relationship"
          hint="Pré-rempli — modifiez-le si votre demande change."
        >
          <Input
            id="kyc-business-relationship"
            value={compliance.businessRelationship ?? ""}
            onChange={(event) =>
              onChange({ businessRelationship: event.target.value || null })
            }
            placeholder="financement immobilier"
          />
        </Field>

        <Field label="Pays de résidence fiscale" htmlFor="kyc-tax-residence">
          <Input
            id="kyc-tax-residence"
            value={compliance.taxResidence ?? ""}
            onChange={(event) => onChange({ taxResidence: event.target.value || null })}
            placeholder="Cameroun"
          />
        </Field>

        <Field label="Personnes à charge" htmlFor="kyc-dependants">
          <Input
            id="kyc-dependants"
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={compliance.dependants ?? 0}
            onChange={(event) =>
              onChange({ dependants: Number.parseInt(event.target.value, 10) || 0 })
            }
          />
        </Field>

        <Field
          label="Crédits en cours"
          htmlFor="kyc-existing-loans"
          hint="Les crédits immobiliers ou de consommation que vous avez en cours."
        >
          <Input
            id="kyc-existing-loans"
            value={compliance.existingLoans ?? ""}
            onChange={(event) => onChange({ existingLoans: event.target.value || null })}
            placeholder="Aucun crédit en cours"
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow-style mb-1 font-normal text-subtle">
          Votre situation bancaire <span className="text-cfc-brown">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AFFILIATION_OPTIONS.map((option) => {
            const active = affiliation === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onAffiliationChange(option.value)}
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
                  <span className="caption-style mt-1 flex items-start gap-1.5 text-cfc-brown">
                    {option.consequence}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {errors.affiliation && (
          <p role="alert" className="text-xs text-destructive">
            {errors.affiliation}
          </p>
        )}
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={compliance.honourAttestation}
          onChange={(event) =>
            onChange({
              honourAttestation: event.target.checked,
              honourMention: event.target.checked ? "Lu et approuvé" : null,
            })
          }
          className="mt-0.5 size-3.5 shrink-0 accent-cfc-brown"
        />
        <span className="text-[11px] leading-relaxed text-muted-foreground">
          Je certifie l&apos;exactitude des informations déclarées, et j&apos;accepte
          que le Crédit Foncier du Cameroun les vérifie dans le cadre de ma
          demande de prêt. L&apos;attestation est horodatée à la soumission.
        </span>
      </label>
      {errors["compliance.honourAttestation"] && (
        <p role="alert" className="text-xs text-destructive">
          {errors["compliance.honourAttestation"]}
        </p>
      )}
    </div>
  );
}
