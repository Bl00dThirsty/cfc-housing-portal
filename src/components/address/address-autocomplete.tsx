"use client";

import * as React from "react";
import { Loader2, MapPin, Pencil, X } from "lucide-react";

import { searchAddressAction } from "@/server/actions/address";
import { cn } from "@/lib/utils";
import { addressKindLabel, type AddressSuggestion, type SelectedAddress } from "@/domain/entities/address";

type AddressAutocompleteProps = {
  id: string;
  label: string;
  value: SelectedAddress | null;
  onChange: (address: SelectedAddress | null) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  countryCodes?: string | null;
  className?: string;
};

const DEBOUNCE_MS = 350;

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder = "Quartier, rue, ville…",
  required = false,
  hint,
  countryCodes = "cm",
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [manual, setManual] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const listboxId = `${id}-listbox`;
  const requestId = React.useRef(0);

  React.useEffect(() => {
    if (!open || manual || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const current = ++requestId.current;
    setLoading(true);

    const timer = setTimeout(() => {
      void searchAddressAction(query, countryCodes).then((result) => {
        if (current !== requestId.current) return;
        setSuggestions(result.suggestions);
        setActiveIndex(result.suggestions.length > 0 ? 0 : -1);
        setLoading(false);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, open, manual, countryCodes]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const select = (suggestion: AddressSuggestion) => {
    onChange({ ...suggestion, source: suggestion.osmType === "catalogue" ? "catalogue" : "nominatim" });
    setQuery(suggestion.shortLabel);
    setOpen(false);
    setSuggestions([]);
  };

  const selectManual = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onChange({
      placeId: `manual-${Date.now()}`,
      label: trimmed,
      shortLabel: trimmed,
      kind: "other",
      lat: null,
      lon: null,
      osmType: "manual",
      osmId: "",
      postcode: null,
      countryCode: countryCodes === "cm" ? "cm" : null,
      source: "manual",
    });
    setOpen(false);
    setSuggestions([]);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        select(suggestions[activeIndex]);
      } else if (open && query.trim().length > 0) {
        event.preventDefault();
        selectManual();
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  if (value) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <span className="eyebrow-style font-normal text-subtle">{label}</span>
        <div className="flex items-center justify-between gap-2 rounded-md border border-line-strong bg-card px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-cfc-gold" aria-hidden />
            <span className="truncate text-sm text-foreground">{value.shortLabel}</span>
            <span className="caption-style shrink-0 text-soft">
              {addressKindLabel(value.kind)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors duration-200 ease-power3-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Effacer ${label}`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        {hint && <span className="caption-style text-soft">{hint}</span>}
      </div>
    );
  }

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)} ref={rootRef}>
      <label htmlFor={id} className="eyebrow-style font-normal text-subtle">
        {label}
        {required && <span className="ml-0.5 text-cfc-brown">*</span>}
      </label>

      <div className="relative">
        <MapPin
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
          }
          aria-required={required || undefined}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setManual(false);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-8 text-sm text-foreground outline-none transition-colors duration-200 ease-power3-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {loading && (
          <Loader2
            aria-hidden
            className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>

      {open && (suggestions.length > 0 || (query.trim().length > 0 && !loading)) && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-line-strong bg-popover p-1 shadow-overlay animate-in fade-in-0 zoom-in-95 duration-200 ease-power3-out"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.placeId}-${index}`}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                select(suggestion);
              }}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-1.5 transition-colors duration-150 ease-power3-out",
                index === activeIndex ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="truncate text-sm font-medium text-foreground">
                {suggestion.shortLabel}
              </span>
              <span className="truncate caption-style text-soft">{suggestion.label}</span>
            </li>
          ))}

          {query.trim().length > 0 && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(event) => {
                event.preventDefault();
                selectManual();
              }}
              className="mt-1 flex cursor-pointer items-center gap-2 rounded-sm border-t border-line-strong px-2 py-1.5 text-xs text-muted-foreground transition-colors duration-150 ease-power3-out hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3 shrink-0" aria-hidden />
              Saisir manuellement « {query.trim()} »
            </li>
          )}
        </ul>
      )}

      {hint && <span className="caption-style text-soft">{hint}</span>}
    </div>
  );
}
