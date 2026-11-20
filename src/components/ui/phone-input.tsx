"use client";

import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import frLocale from "react-phone-number-input/locale/fr.json";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DEFAULT_PHONE_ISO, formatNationalInput, toE164 } from "@/domain/entities/phone";

/**
 * Le champ téléphone — **un seul**, pour toute l'application.
 *
 * Les règles de numérotation sont celles de `libphonenumber-js` : ce
 * composant ne les invente pas, il les applique. Il fait trois choses en
 * plus :
 *
 * - il affiche l'**indicatif** du pays, et le laisse changer — un Hendrix
 *   diasporique tape un numéro français, pas un numéro camerounais ;
 * - il **recherche** le pays : la liste des plans de numérotation du monde
 *   est longue, un drapeau et un nom ne suffisent pas ;
 * - il ne sort **jamais** un format ambigu : la valeur remontée est toujours
 *   la forme internationale (`+237699000001`), celle que la base stocke.
 */

/** Les noms de pays, en français. */
const COUNTRY_LABELS = frLocale as unknown as Record<string, string>;

/** Le drapeau d'un pays, en emoji : deux points d'indicateur régional. */
function flagOf(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}

/** Les pays joignables, tels que la bibliothèque les décrit. */
const PHONE_COUNTRIES = getCountries().map((iso) => ({
  iso,
  label: COUNTRY_LABELS[iso] ?? iso,
  dialCode: getCountryCallingCode(iso),
  flag: flagOf(iso),
}));

/** L'exemple affiché quand le champ est vide. */
const PLACEHOLDERS: Record<string, string> = {
  CM: "6 99 00 00 01",
  FR: "0 6 12 34 56 78",
  CI: "07 07 07 07 07",
  NG: "0 803 123 4567",
  US: "202 555 0143",
};

export type PhoneInputProps = {
  id: string;
  /** Valeur canonique : l'indicatif puis les chiffres, sans séparateur. */
  value: string;
  /** La valeur canonique, à chaque frappe. */
  onChange: (value: string) => void;
  label?: string;
  /** Pays de départ ; par défaut le Cameroun. */
  countryIso?: CountryCode;
  /** Le pays a changé — utile pour adapter le reste du formulaire. */
  onCountryChange?: (iso: CountryCode) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

export function PhoneInput({
  id,
  value,
  onChange,
  label = "Téléphone",
  countryIso = DEFAULT_PHONE_ISO,
  onCountryChange,
  required = false,
  error,
  hint,
  disabled = false,
  className,
}: PhoneInputProps) {
  const [iso, setIso] = React.useState<CountryCode>(countryIso);
  const [text, setText] = React.useState(() => formatNationalInput(value, countryIso).display);
  const [open, setOpen] = React.useState(false);

  /** La dernière valeur émise : elle distingue notre frappe d'un changement externe. */
  const emitted = React.useRef(value);

  // Un changement qui vient d'ailleurs — un brouillon rechargé, une correction
  // du dossier — replace le champ sur la valeur reçue.
  React.useEffect(() => {
    if (value === emitted.current) return;

    const next = formatNationalInput(value, iso);
    setText(next.display);
    if (next.iso !== iso) setIso(next.iso);
    emitted.current = value;
    // `iso` décrit l'affichage, pas la valeur reçue : il ne doit pas
    // déclencher une synchronisation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const country =
    PHONE_COUNTRIES.find((item) => item.iso === iso) ?? PHONE_COUNTRIES[0];

  const selectCountry = (nextIso: CountryCode) => {
    setIso(nextIso);
    onCountryChange?.(nextIso);
    setOpen(false);

    // Les chiffres sont conservés : l'utilisateur a pu se tromper de pays,
    // pas de numéro.
    const digits = text.replace(/\D/g, "");
    if (digits.length === 0) return;

    const canonical = toE164(digits, nextIso);
    emitted.current = canonical;
    onChange(canonical);
  };

  const handleChange = (raw: string) => {
    const result = formatNationalInput(raw, iso);

    setText(result.display);
    if (result.iso !== iso) {
      setIso(result.iso);
      onCountryChange?.(result.iso);
    }

    const canonical = toE164(raw, result.iso);
    emitted.current = canonical;
    onChange(canonical);
  };

  const clear = () => {
    setText("");
    emitted.current = "";
    onChange("");
  };

  const errorId = `${id}-error`;

  return (
    <Field
      label={label}
      htmlFor={id}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={disabled}
            aria-label="Pays et indicatif du numéro"
            className="flex h-9 w-[150px] shrink-0 items-center justify-between gap-1.5 rounded-lg border border-line-strong bg-secondary px-3 text-[14px] outline-none transition-colors duration-150 ease-power3-out hover:bg-muted focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <span aria-hidden>{country.flag}</span>
              <span className="font-mono text-[13px]">+{country.dialCode}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-subtle" aria-hidden />
          </PopoverTrigger>

          <PopoverContent align="start" className="w-[320px] p-0">
            <Command>
              <CommandInput placeholder="Rechercher un pays…" />
              <CommandList>
                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                <CommandGroup>
                  {PHONE_COUNTRIES.map((item) => (
                    <CommandItem
                      key={item.iso}
                      value={`${item.label} ${item.iso} ${item.dialCode}`}
                      onSelect={() => selectCountry(item.iso)}
                      className="gap-2"
                    >
                      <span aria-hidden className="text-base leading-none">
                        {item.flag}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="font-mono text-[12px] text-subtle">
                        +{item.dialCode}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={text}
            onChange={(event) => handleChange(event.target.value)}
            placeholder={PLACEHOLDERS[country.iso] ?? "Numéro national"}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn("pr-9 font-mono")}
          />
          {text.length > 0 && !disabled && (
            <button
              type="button"
              onClick={clear}
              aria-label="Effacer le numéro"
              className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-subtle transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

export default PhoneInput;
