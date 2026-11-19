import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerProfileMock, rpcMock, revalidatePathMock } = vi.hoisted(() => ({
  getServerProfileMock: vi.fn(),
  rpcMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/server/auth/profile", () => ({ getServerProfile: getServerProfileMock }));
vi.mock("@/server/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: rpcMock })) }));

import { saveAgencyAction, savePoleAction } from "@/server/actions/admin-groups";

describe("admin group actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerProfileMock.mockResolvedValue({ role: "ADMIN" });
    rpcMock.mockResolvedValue({ data: "saved", error: null });
  });

  it("rejects users without group-management capability", async () => {
    getServerProfileMock.mockResolvedValue({ role: "GUICHET" });
    await expect(savePoleAction({ code: "TEST", label: "Test pole", description: null, sortOrder: 10 })).resolves.toMatchObject({ ok: false });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("validates input before calling the protected pole RPC", async () => {
    const invalid = await savePoleAction({ code: "?", label: "x", description: null, sortOrder: -1 });
    expect(invalid.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
    const saved = await savePoleAction({ code: "TEST", label: "Pôle test", description: null, sortOrder: 10 });
    expect(saved.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("cfc_save_pole", expect.objectContaining({ p_code: "TEST" }));
  });

  it("persists agency fields through the protected agency RPC", async () => {
    rpcMock.mockResolvedValue({ data: "agency-id", error: null });
    const result = await saveAgencyAction({ id: null, code: "YAOUNDE", label: "Agence Centre", city: "Yaoundé", region: "Centre", isDiasporaDesk: false });
    expect(result.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("cfc_save_agency", expect.objectContaining({ p_agency_id: null, p_code: "YAOUNDE", p_city: "Yaoundé" }));
  });
});
