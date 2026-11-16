"use client";

/**
 * Écran C — la situation professionnelle.
 *
 * Ces éléments alimentent le scoring du prêt et la décision du comité de
 * crédit. Le revenu est **déclaré** : c'est la déclaration du demandeur, et
 * elle est conservée comme telle — le revenu évalué par la plateforme reste
 * la référence du dossier.
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
import {
  EMPLOYMENT_STATUSES,
  INCOME_BANDS,
  INCOME_ORIGINS,
  type KycEmployment,
} from "@/domain/entities/kyc";

export interface KycEmploymentStepProps {
  employment: KycEmployment;
  onChange: (values: Partial<KycEmployment>) => void;
  /** Le refus, rattaché à son champ. */
  errors: Record<string, string>;
}

export function KycEmploymentStep({
  employment,
  onChange,
  errors,
}: KycEmploymentStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Situation professionnelle"
        htmlFor="kyc-employment-status"
        required
        error={errors["employment.status"]}
      >
        <Select
          value={employment.status ?? ""}
          onValueChange={(value) =>
            onChange({ status: value as KycEmployment["status"] })
          }
        >
          <SelectTrigger id="kyc-employment-status">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Type de contrat" htmlFor="kyc-contract-type" required error={errors["employment.contractType"]}>
        <Input
          id="kyc-contract-type"
          value={employment.contractType ?? ""}
          onChange={(event) => onChange({ contractType: event.target.value || null })}
          placeholder="CDI"
        />
      </Field>

      <Field label="Profession" htmlFor="kyc-profession">
        <Input
          id="kyc-profession"
          value={employment.profession ?? ""}
          onChange={(event) => onChange({ profession: event.target.value || null })}
          placeholder="Ingénieur"
          autoComplete="organization-title"
        />
      </Field>

      <Field label="Employeur" htmlFor="kyc-employer">
        <Input
          id="kyc-employer"
          value={employment.employer ?? ""}
          onChange={(event) => onChange({ employer: event.target.value || null })}
          placeholder="SIC"
          autoComplete="organization"
        />
      </Field>

      <Field label="Secteur d'activité" htmlFor="kyc-sector">
        <Input
          id="kyc-sector"
          value={employment.sector ?? ""}
          onChange={(event) => onChange({ sector: event.target.value || null })}
          placeholder="Banque"
        />
      </Field>

      <Field
        label="Date d'embauche"
        htmlFor="kyc-hired-at"
        required
        error={errors["employment.hiredAt"]}
        hint="Une date future n'est pas acceptée."
      >
        <Input
          id="kyc-hired-at"
          type="date"
          value={employment.hiredAt ?? ""}
          onChange={(event) => onChange({ hiredAt: event.target.value || null })}
          max={new Date().toISOString().slice(0, 10)}
          aria-invalid={errors["employment.hiredAt"] ? true : undefined}
        />
      </Field>

      <Field
        label="Revenu mensuel net déclaré"
        htmlFor="kyc-income"
        hint="En francs CFA (XAF)."
      >
        <Input
          id="kyc-income"
          inputMode="numeric"
          value={
            employment.declaredIncome === null || employment.declaredIncome === undefined
              ? ""
              : employment.declaredIncome.toLocaleString("fr-FR")
          }
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            onChange({ declaredIncome: digits ? Number.parseInt(digits, 10) : null });
          }}
          placeholder="850 000"
          className="font-mono"
        />
      </Field>

      <Field label="Tranche de revenu" htmlFor="kyc-income-band">
        <Select
          value={employment.incomeBand ?? ""}
          onValueChange={(value) =>
            onChange({ incomeBand: value as KycEmployment["incomeBand"] })
          }
        >
          <SelectTrigger id="kyc-income-band">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {INCOME_BANDS.map((band) => (
              <SelectItem key={band} value={band}>
                {band}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Origine du revenu" htmlFor="kyc-income-origin">
        <Select
          value={employment.incomeOrigin ?? ""}
          onValueChange={(value) =>
            onChange({ incomeOrigin: value as KycEmployment["incomeOrigin"] })
          }
        >
          <SelectTrigger id="kyc-income-origin">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {INCOME_ORIGINS.map((origin) => (
              <SelectItem key={origin} value={origin}>
                {origin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
