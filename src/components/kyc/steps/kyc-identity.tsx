"use client";

/**
 * Écran A — l'identité.
 *
 * La pièce d'identité est **pré-remplie** depuis l'inscription : le
 * demandeur l'a déjà déclarée pour ouvrir son compte. Il la vérifie, il ne
 * la ressaisit pas — sauf si elle est fausse.
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
  FAMILY_STATUSES,
  ID_DOCUMENT_TYPES,
  type KycIdentity,
} from "@/domain/entities/kyc";

export interface KycIdentityStepProps {
  identity: KycIdentity;
  onChange: (values: Partial<KycIdentity>) => void;
  /** Le refus, rattaché à son champ. */
  errors: Record<string, string>;
}

export function KycIdentityStep({ identity, onChange, errors }: KycIdentityStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Date de naissance"
        htmlFor="kyc-birthdate"
        required
        error={errors["identity.birthDate"]}
        hint="Il faut être majeur pour demander un prêt."
      >
        <Input
          id="kyc-birthdate"
          type="date"
          value={identity.birthDate ?? ""}
          onChange={(event) => onChange({ birthDate: event.target.value || null })}
          max={new Date().toISOString().slice(0, 10)}
          aria-invalid={errors["identity.birthDate"] ? true : undefined}
        />
      </Field>

      <Field
        label="Nationalité"
        htmlFor="kyc-nationality"
        required
        error={errors["identity.nationality"]}
      >
        <Input
          id="kyc-nationality"
          value={identity.nationality ?? ""}
          onChange={(event) => onChange({ nationality: event.target.value || null })}
          placeholder="Cameroun"
          aria-invalid={errors["identity.nationality"] ? true : undefined}
        />
      </Field>

      <Field label="Ville de naissance" htmlFor="kyc-birthplace-city">
        <Input
          id="kyc-birthplace-city"
          value={identity.birthPlaceCity ?? ""}
          onChange={(event) => onChange({ birthPlaceCity: event.target.value || null })}
          placeholder="Douala"
        />
      </Field>

      <Field label="Pays de naissance" htmlFor="kyc-birthplace-country">
        <Input
          id="kyc-birthplace-country"
          value={identity.birthPlaceCountry ?? ""}
          onChange={(event) => onChange({ birthPlaceCountry: event.target.value || null })}
          placeholder="Cameroun"
        />
      </Field>

      <Field label="Situation familiale" htmlFor="kyc-family-status">
        <Select
          value={identity.familyStatus ?? ""}
          onValueChange={(value) =>
            onChange({ familyStatus: value as KycIdentity["familyStatus"] })
          }
        >
          <SelectTrigger id="kyc-family-status">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {FAMILY_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Type de pièce d'identité"
        htmlFor="kyc-id-type"
        required
        error={errors["identity.idDocumentType"]}
      >
        <Select
          value={identity.idDocumentType ?? ""}
          onValueChange={(value) =>
            onChange({ idDocumentType: value as KycIdentity["idDocumentType"] })
          }
        >
          <SelectTrigger id="kyc-id-type">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {ID_DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Numéro de la pièce d'identité"
        htmlFor="kyc-id-number"
        required
        error={errors["identity.idDocumentNumber"]}
        hint="Le numéro que vous avez saisi à l'inscription."
      >
        <Input
          id="kyc-id-number"
          value={identity.idDocumentNumber ?? ""}
          onChange={(event) =>
            onChange({ idDocumentNumber: event.target.value.toUpperCase().replace(/\s/g, "") })
          }
          placeholder="AB123456"
          className="font-mono uppercase"
          aria-invalid={errors["identity.idDocumentNumber"] ? true : undefined}
        />
      </Field>

      <Field
        label="Autorité de délivrance"
        htmlFor="kyc-id-issuer"
        hint="La délégation ou le service qui l'a délivrée."
      >
        <Input
          id="kyc-id-issuer"
          value={identity.idDocumentIssuer ?? ""}
          onChange={(event) => onChange({ idDocumentIssuer: event.target.value || null })}
          placeholder="Délégation départementale"
        />
      </Field>

      <Field label="Date de délivrance" htmlFor="kyc-id-issued">
        <Input
          id="kyc-id-issued"
          type="date"
          value={identity.idDocumentIssuedAt ?? ""}
          onChange={(event) => onChange({ idDocumentIssuedAt: event.target.value || null })}
        />
      </Field>

      <Field
        label="Date d'expiration"
        htmlFor="kyc-id-expires"
        required
        error={errors["identity.idDocumentExpiresAt"]}
        hint="Une pièce expirée n'est pas acceptée."
      >
        <Input
          id="kyc-id-expires"
          type="date"
          value={identity.idDocumentExpiresAt ?? ""}
          onChange={(event) => onChange({ idDocumentExpiresAt: event.target.value || null })}
          aria-invalid={errors["identity.idDocumentExpiresAt"] ? true : undefined}
        />
      </Field>

      <Field
        label="NIU"
        htmlFor="kyc-niu"
        hint="Le numéro d'identification fiscale unique."
      >
        <Input
          id="kyc-niu"
          value={identity.niu ?? ""}
          onChange={(event) => onChange({ niu: event.target.value || null })}
          placeholder="NIU-001"
          className="font-mono"
        />
      </Field>
    </div>
  );
}
