"use server";

import { searchAddresses } from "@/server/address/nominatim";
import type { AddressSuggestion } from "@/domain/entities/address";

export type AddressSearchResult = {
  suggestions: AddressSuggestion[];
  source: "nominatim" | "catalogue" | "empty";
};

export async function searchAddressAction(
  query: string,
  countryCodes: string | null = "cm",
): Promise<AddressSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { suggestions: [], source: "empty" };

  const suggestions = await searchAddresses(trimmed, { countryCodes });
  const allCatalogue = suggestions.every((item) => item.osmType === "catalogue");

  return {
    suggestions,
    source: suggestions.length === 0 ? "empty" : allCatalogue ? "catalogue" : "nominatim",
  };
}
