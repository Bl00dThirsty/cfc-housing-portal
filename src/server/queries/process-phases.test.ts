import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClient, from, query } = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
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

import { getProcessPhases } from "./process-phases";

describe("getProcessPhases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.select.mockReturnValue(query);
    from.mockReturnValue(query);
  });

  it("returns ordered phase codes and labels from the public Supabase catalogue", async () => {
    query.order.mockResolvedValue({
      data: [
        { code: "kyc_savings", label: "Instruction et constitution de l’épargne", sort_order: 10 },
        { code: "risk_bet", label: "Évaluation technique", sort_order: 20 },
      ],
      error: null,
    });
    createServerSupabaseClient.mockResolvedValue({ from });

    await expect(getProcessPhases()).resolves.toEqual({
      ok: true,
      phases: [
        { code: "kyc_savings", label: "Instruction et constitution de l’épargne", sortOrder: 10 },
        { code: "risk_bet", label: "Évaluation technique", sortOrder: 20 },
      ],
    });
    expect(from).toHaveBeenCalledWith("cfc_process_phases");
    expect(query.select).toHaveBeenCalledWith("code, label, sort_order");
    expect(createServerSupabaseClient.mock.results.length).toBe(1);
    expect(query.order).toHaveBeenCalledWith("sort_order", { ascending: true });
  });

  it("returns an explicit error when the reference catalogue is unavailable", async () => {
    query.order.mockResolvedValue({ data: null, error: { message: "catalogue unavailable" } });
    createServerSupabaseClient.mockResolvedValue({ from });

    await expect(getProcessPhases()).resolves.toEqual({
      ok: false,
      error: "Le catalogue des étapes du dossier est indisponible.",
    });
  });
});
