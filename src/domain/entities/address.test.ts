import { describe, expect, it } from "vitest";

import {
  CAMEROON_PLACES,
  addressKindLabel,
  catalogueSuggestions,
  classifyAddress,
  toSuggestion,
  type NominatimResult,
} from "@/domain/entities/address";

const house: NominatimResult = {
  place_id: 1,
  osm_type: "node",
  osm_id: 11,
  lat: "3.8480",
  lon: "11.5021",
  display_name: "12, Rue de la Joie, Bastos, Yaoundé, Centre, Cameroun",
  class: "building",
  type: "house",
  address: {
    house_number: "12",
    road: "Rue de la Joie",
    suburb: "Bastos",
    city: "Yaoundé",
    state: "Centre",
    country: "Cameroun",
    country_code: "cm",
    postcode: "BP 1234",
  },
};

describe("classifyAddress", () => {
  it("detects a precise house address", () => {
    expect(classifyAddress(house)).toBe("house");
  });

  it("detects a road", () => {
    expect(
      classifyAddress({
        ...house,
        class: "highway",
        type: "residential",
        address: { ...house.address, house_number: undefined },
      }),
    ).toBe("road");
  });

  it("detects a neighbourhood", () => {
    expect(
      classifyAddress({
        ...house,
        class: "place",
        type: "neighbourhood",
        address: { quarter: "Bastos", city: "Yaoundé" },
      }),
    ).toBe("neighbourhood");
  });

  it("detects a city", () => {
    expect(
      classifyAddress({
        ...house,
        class: "place",
        type: "town",
        address: { town: "Dschang" },
      }),
    ).toBe("city");
  });

  it("falls back to other", () => {
    expect(classifyAddress({ ...house, class: "tourism", type: "attraction", address: {} })).toBe(
      "other",
    );
  });
});

describe("toSuggestion", () => {
  it("maps every field of a Nominatim result", () => {
    const suggestion = toSuggestion(house);

    expect(suggestion.placeId).toBe("1");
    expect(suggestion.osmType).toBe("node");
    expect(suggestion.osmId).toBe("11");
    expect(suggestion.lat).toBeCloseTo(3.848);
    expect(suggestion.lon).toBeCloseTo(11.5021);
    expect(suggestion.postcode).toBe("BP 1234");
    expect(suggestion.countryCode).toBe("cm");
    expect(suggestion.label).toContain("Rue de la Joie");
  });

  it("builds a short label with the street number and the locality", () => {
    expect(toSuggestion(house).shortLabel).toBe("12 Rue de la Joie, Bastos");
  });

  it("returns null coordinates when the payload is malformed", () => {
    const suggestion = toSuggestion({ ...house, lat: "not-a-number", lon: "" });
    expect(suggestion.lat).toBeNull();
    expect(suggestion.lon).toBeNull();
  });

  it("survives a result without an address block", () => {
    const suggestion = toSuggestion({
      place_id: 2,
      osm_type: "relation",
      osm_id: 22,
      lat: "0",
      lon: "0",
      display_name: "Yaoundé, Cameroun",
    });
    expect(suggestion.shortLabel).toBe("Yaoundé");
    expect(suggestion.kind).toBe("other");
  });
});

describe("catalogueSuggestions", () => {
  it("returns nothing for a query shorter than two characters", () => {
    expect(catalogueSuggestions("a")).toEqual([]);
  });

  it("finds a city case-insensitively", () => {
    const results = catalogueSuggestions("douala");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].shortLabel).toBe("Douala");
  });

  it("finds a neighbourhood", () => {
    const results = catalogueSuggestions("akwa");
    expect(results.some((item) => item.shortLabel === "Akwa, Douala")).toBe(true);
  });

  it("marks every catalogue entry as a Cameroon place", () => {
    for (const suggestion of catalogueSuggestions("cameroun")) {
      expect(suggestion.countryCode).toBe("cm");
    }
  });

  it("never exceeds the catalogue size", () => {
    expect(catalogueSuggestions("a").length).toBeLessThanOrEqual(CAMEROON_PLACES.length);
  });
});

describe("addressKindLabel", () => {
  it("gives a French label for each kind", () => {
    expect(addressKindLabel("house")).toBe("Adresse précise");
    expect(addressKindLabel("neighbourhood")).toBe("Quartier");
    expect(addressKindLabel("city")).toBe("Ville");
  });
});
