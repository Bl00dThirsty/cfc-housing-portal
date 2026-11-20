import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerProfileMock, rpcMock, revalidatePathMock } = vi.hoisted(() => ({
  getServerProfileMock: vi.fn(),
  rpcMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/server/auth/profile", () => ({ getServerProfile: getServerProfileMock }));
vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc: rpcMock })),
}));

import { saveRoleCapabilitiesAction } from "@/server/actions/admin-role-permissions";

describe("admin role permission action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerProfileMock.mockResolvedValue({ role: "ADMIN", capabilities: ["admin:roles"] });
    rpcMock.mockResolvedValue({ data: 2, error: null });
  });

  it("requires a live role-management grant", async () => {
    getServerProfileMock.mockResolvedValue({ role: "ADMIN", capabilities: [] });
    const result = await saveRoleCapabilitiesAction({ roleCode: "GUICHET", capabilities: ["dossier:read"] });
    expect(result.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("protects the bootstrap administrator role", async () => {
    const result = await saveRoleCapabilitiesAction({ roleCode: "ADMIN", capabilities: ["dossier:read"] });
    expect(result.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("persists a validated grant set through the audited RPC", async () => {
    const result = await saveRoleCapabilitiesAction({
      roleCode: "GUICHET",
      capabilities: ["dossier:read", "workflow:manage", "dossier:read"],
    });
    expect(result).toEqual({ ok: true, grantCount: 2 });
    expect(rpcMock).toHaveBeenCalledWith("cfc_set_role_capabilities", {
      p_role: "GUICHET",
      p_caps: ["dossier:read", "workflow:manage"],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/portail-cfc/settings/roles");
  });
});
