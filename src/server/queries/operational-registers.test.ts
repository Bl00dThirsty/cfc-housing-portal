import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, fromMock, eqMock, orderMock, dossiersMock } = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.in = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.is = vi.fn(() => query);
  query.not = vi.fn(() => query);
  query.order = vi.fn();
  return {
    createServerSupabaseClientMock: vi.fn(),
    fromMock: vi.fn(() => query),
    eqMock: query.eq,
    orderMock: query.order,
    dossiersMock: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/server/supabase/server", () => ({ createServerSupabaseClient: createServerSupabaseClientMock }));
vi.mock("@/server/queries/operational-dossiers", () => ({ getOperationalDossiers: dossiersMock }));

import { getOperationalRegister } from "@/server/queries/operational-registers";

describe("operational register query contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerSupabaseClientMock.mockResolvedValue({ from: fromMock });
    orderMock.mockResolvedValue({ data: [], error: null });
    dossiersMock.mockResolvedValue({ ok: true, dossiers: [] });
  });

  it("limits the SYSTAC register to SYSTAC reconciliation runs", async () => {
    await getOperationalRegister("systac-runs");
    expect(fromMock).toHaveBeenCalledWith("reconciliation_runs");
    expect(eqMock).toHaveBeenCalledWith("channel", "systac");
  });
});
