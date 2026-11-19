"use client";

/**
 * Écran B — la résidence et le contact.
 *
 * La région vient de la **géographie du Cameroun** : elle est dérivée du
 * catalogue des lieux, et son chef-lieu est affiché. Hors Cameroun, la
 * région n'est pas demandée — un non-résident n'a pas de région
 * camerounaise.
 */

import * as React from "react";

import { CAMEROON_REGIONS } from "@/domain/entities/address";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type KycResidence } from "@/domain/entities/kyc";
import type { KycOption } from "@/domain/entities/kyc-options";

export interface KycResidenceStepProps {
  residence: KycResidence;
  occupationStatusOptions: readonly KycOption[];
  onChange: (values: Partial<KycResidence>) => void;
  /** Le téléphone de contact — il vit sur le profil du compte. */
  phone: string;
  onPhoneChange: (phone: string) => void;
  /** Le refus, rattaché à son champ. */
  errors: Record<string, string>;
}

/** Le pays par défaut : le CFC est camerounais. */
const DEFAULT_COUNTRY = "Cameroun";

export function KycResidenceStep({
  residence,
  occupationStatusOptions,
  onChange,
  phone,
  onPhoneChange,
  errors,
}: KycResidenceStepProps) {
  const isCameroon = (residence.country ?? DEFAULT_COUNTRY).trim() === DEFAULT_COUNTRY;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Pays de résidence" htmlFor="kyc-country" required>
        <Input
          id="kyc-country"
          value={residence.country ?? ""}
          onChange={(event) => onChange({ country: event.target.value || null })}
          placeholder={DEFAULT_COUNTRY}
        />
      </Field>

      <Field
        label="Région"
        htmlFor="kyc-region"
        hint={
          isCameroon
            ? `Chef-lieu : ${CAMEROON_REGIONS.find((r) => r.name === residence.region)?.chefLieu ?? "—"}`
            : "Facultative hors Cameroun."
        }
      >
        <Select
          value={residence.region ?? ""}
          disabled={!isCameroon}
          onValueChange={(value) => onChange({ region: value || null })}
        >
          <SelectTrigger id="kyc-region">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {CAMEROON_REGIONS.map((region) => (
              <SelectItem key={region.name} value={region.name}>
                {region.name} — {region.chefLieu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Ville" htmlFor="kyc-city">
        <Input
          id="kyc-city"
          value={residence.city ?? ""}
          onChange={(event) => onChange({ city: event.target.value || null })}
          placeholder="Douala"
        />
      </Field>

      <Field label="Quartier" htmlFor="kyc-neighbourhood">
        <Input
          id="kyc-neighbourhood"
          value={residence.neighbourhood ?? ""}
          onChange={(event) => onChange({ neighbourhood: event.target.value || null })}
          placeholder="Bonanjo"
        />
      </Field>

      <Field
        label="Lieu-dit"
        htmlFor="kyc-landmark"
        className="sm:col-span-2"
        hint="Ce qui aide à vous trouver : une pharmacie, un marché, une borne."
      >
        <Input
          id="kyc-landmark"
          value={residence.landmark ?? ""}
          onChange={(event) => onChange({ landmark: event.target.value || null })}
          placeholder="Face pharmacie du Port"
        />
      </Field>

      <Field label="Boîte postale" htmlFor="kyc-postal-box">
        <Input
          id="kyc-postal-box"
          value={residence.postalBox ?? ""}
          onChange={(event) => onChange({ postalBox: event.target.value || null })}
          placeholder="BP 1234"
          className="font-mono"
        />
      </Field>

      <Field
        label="Statut d'occupation du logement"
        htmlFor="kyc-occupation"
        error={errors["residence.occupationStatus"]}
      >
        <Select
          value={residence.occupationStatus ?? ""}
          onValueChange={(value) =>
            onChange({ occupationStatus: value || null })
          }
        >
          <SelectTrigger id="kyc-occupation">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {occupationStatusOptions.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <PhoneInput
          id="kyc-phone"
          label="Téléphone"
          value={phone}
          onChange={onPhoneChange}
          required
          error={errors.phone}
          hint="Le numéro qui vous joindra pendant l'instruction du dossier."
        />
      </div>

      <Field
        label="Contact d'urgence"
        htmlFor="kyc-emergency"
        className="sm:col-span-2"
        hint="Facultatif — une personne à prévenir en cas d'urgence."
      >
        <Input
          id="kyc-emergency"
          value={residence.emergencyContact ?? ""}
          onChange={(event) => onChange({ emergencyContact: event.target.value || null })}
          placeholder="M. Abanda — +237 6 99 00 00 01"
        />
      </Field>
    </div>
  );
}
