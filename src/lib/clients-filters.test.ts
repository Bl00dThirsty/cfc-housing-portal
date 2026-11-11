import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  distinctValues,
  filterClients,
  parseAmount,
} from "@/lib/clients-filters";
import { DEFAULT_CLIENT_FILTERS } from "@/stores/clients-store";

const clients = [
  {
    id: "cl-1",
    name: "ABANDA Eric",
    agency: "Yaoundé Centre",
    phase: "Épargne & KYC",
    status: "Conforme",
    loanAmount: "3 600 000",
    savingsCurrent: "1 200 000",
    completionPercent: 20,
  },
  {
    id: "cl-2",
    name: "TCHOUNGUI Alain",
    agency: "Douala Akwa",
    phase: "Comités CGR/CRC",
    status: "Accordé",
    loanAmount: "12 000 000",
    savingsCurrent: "4 500 000",
    completionPercent: 55,
  },
  {
    id: "cl-3",
    name: "NGO NSOA Marie",
    agency: "Yaoundé Centre",
    phase: "Épargne & KYC",
    status: "Pièces Manquantes",
    loanAmount: "8 250 000",
    savingsCurrent: "900 000",
    completionPercent: 12,
  },
];

describe("parseAmount", () => {
  it("reads a space-separated amount", () => {
    expect(parseAmount("3 600 000")).toBe(3600000);
  });

  it("reads an amount with a currency suffix", () => {
    expect(parseAmount("8 250 000 FCFA")).toBe(8250000);
  });

  it("returns 0 for an unparseable value", () => {
    expect(parseAmount("n/a")).toBe(0);
  });
});

describe("filterClients", () => {
  it("returns every client with the default filters", () => {
    expect(filterClients(clients, DEFAULT_CLIENT_FILTERS)).toHaveLength(3);
  });

  it("filters by phase", () => {
    const result = filterClients(clients, {
      ...DEFAULT_CLIENT_FILTERS,
      phase: "Épargne & KYC",
    });
    expect(result.map((client) => client.id)).toEqual(["cl-1", "cl-3"]);
  });

  it("filters by agency", () => {
    const result = filterClients(clients, {
      ...DEFAULT_CLIENT_FILTERS,
      agency: "Douala Akwa",
    });
    expect(result.map((client) => client.id)).toEqual(["cl-2"]);
  });

  it("searches the name case-insensitively", () => {
    const result = filterClients(clients, {
      ...DEFAULT_CLIENT_FILTERS,
      search: "abanda",
    });
    expect(result.map((client) => client.id)).toEqual(["cl-1"]);
  });

  it("sorts by name ascending", () => {
    const result = filterClients(clients, {
      ...DEFAULT_CLIENT_FILTERS,
      sortBy: "name",
    });
    expect(result.map((client) => client.name)).toEqual([
      "ABANDA Eric",
      "NGO NSOA Marie",
      "TCHOUNGUI Alain",
    ]);
  });

  it("sorts by loan amount descending", () => {
    const result = filterClients(clients, {
      ...DEFAULT_CLIENT_FILTERS,
      sortBy: "loanAmount",
    });
    expect(result.map((client) => client.id)).toEqual(["cl-2", "cl-3", "cl-1"]);
  });

  it("combines a phase filter with a search", () => {
    const result = filterClients(clients, {
      ...DEFAULT_CLIENT_FILTERS,
      phase: "Épargne & KYC",
      search: "marie",
    });
    expect(result.map((client) => client.id)).toEqual(["cl-3"]);
  });

  it("does not mutate the input array", () => {
    const input = [...clients];
    filterClients(input, { ...DEFAULT_CLIENT_FILTERS, sortBy: "loanAmount" });
    expect(input.map((client) => client.id)).toEqual(["cl-1", "cl-2", "cl-3"]);
  });
});

describe("activeFilterCount", () => {
  it("counts zero for the defaults", () => {
    expect(activeFilterCount(DEFAULT_CLIENT_FILTERS)).toBe(0);
  });

  it("counts each engaged facet", () => {
    expect(
      activeFilterCount({
        ...DEFAULT_CLIENT_FILTERS,
        phase: "Épargne & KYC",
        agency: "Douala Akwa",
      }),
    ).toBe(2);
  });

  it("ignores a blank search", () => {
    expect(
      activeFilterCount({ ...DEFAULT_CLIENT_FILTERS, search: "   " }),
    ).toBe(0);
  });
});

describe("distinctValues", () => {
  it("lists the distinct agencies in a stable order", () => {
    expect(distinctValues(clients, "agency")).toEqual([
      "Douala Akwa",
      "Yaoundé Centre",
    ]);
  });

  it("lists the distinct phases", () => {
    expect(distinctValues(clients, "phase")).toEqual([
      "Comités CGR/CRC",
      "Épargne & KYC",
    ]);
  });
});
