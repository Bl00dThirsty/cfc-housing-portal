import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClient, from, query } = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    lte: vi.fn(),
    or: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
  };
  return {
    query,
    from: vi.fn(() => query),
    createServerSupabaseClient: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/server/supabase/server", () => ({ createServerSupabaseClient }));

import { listKycOptions } from "./kyc-options";

describe("listKycOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const method of [query.select, query.lte, query.or, query.is]) {
      method.mockReturnValue(query);
    }
    from.mockReturnValue(query);
  });

  it("groups only effective, ordered options returned by Supabase", async () => {
    query.order.mockResolvedValue({
      data: [
        { category: "family_status", code: "marié(e)", label: "Marié(e)", sort_order: 20 },
        { category: "family_status", code: "célibataire", label: "Célibataire", sort_order: 10 },
        { category: "employment_status", code: "CDI", label: "CDI", sort_order: 10 },
        { category: "income_origin", code: "salaire", label: "Salaire", sort_order: 10 },
        { category: "income_band", code: "100 000 – 400 000", label: "100 000 – 400 000", sort_order: 10 },
        { category: "id_document_type", code: "CNI", label: "Carte nationale d’identité", sort_order: 10 },
        { category: "occupation_status", code: "locataire", label: "Locataire", sort_order: 10 },
        { category: "pep_reason", code: "autre exposition", label: "Autre exposition", sort_order: 10 },
      ],
      error: null,
    });
    createServerSupabaseClient.mockResolvedValue({ from });

    const result = await listKycOptions();

    expect(result).toEqual({
      ok: true,
      options: {
        family_status: [
          { code: "marié(e)", label: "Marié(e)", sortOrder: 20 },
          { code: "célibataire", label: "Célibataire", sortOrder: 10 },
        ],
        employment_status: [{ code: "CDI", label: "CDI", sortOrder: 10 }],
        income_origin: [{ code: "salaire", label: "Salaire", sortOrder: 10 }],
        income_band: [
          { code: "100 000 – 400 000", label: "100 000 – 400 000", sortOrder: 10 },
        ],
        id_document_type: [{ code: "CNI", label: "Carte nationale d’identité", sortOrder: 10 }],
        occupation_status: [{ code: "locataire", label: "Locataire", sortOrder: 10 }],
        pep_reason: [{ code: "autre exposition", label: "Autre exposition", sortOrder: 10 }],
      },
    });
    expect(from).toHaveBeenCalledWith("cfc_kyc_option");
    expect(query.select).toHaveBeenCalledWith("category, code, label, sort_order");
    expect(query.lte).toHaveBeenCalledWith("effective_from", expect.any(String));
    expect(query.or).toHaveBeenCalledWith(expect.stringMatching(/^effective_to\.is\.null,effective_to\.gte\./));
    expect(query.is).toHaveBeenCalledWith("deleted_at", null);
    expect(query.order).toHaveBeenCalledWith("sort_order", { ascending: true });
  });

  it("returns an explicit catalogue error instead of inventing choices", async () => {
    query.order.mockResolvedValue({ data: null, error: { message: "catalogue unavailable" } });
    createServerSupabaseClient.mockResolvedValue({ from });

    await expect(listKycOptions()).resolves.toEqual({
      ok: false,
      error: "Les options du formulaire KYC sont indisponibles.",
    });
  });
});
