import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, getUserMock, rpcMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

import { updateOwnProfileAction } from "./profile";

describe("updateOwnProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "actor-1" } }, error: null });
    rpcMock.mockResolvedValue({ data: null, error: null });
    createServerSupabaseClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
      rpc: rpcMock,
    });
  });

  it("derives identity from the session and writes only name and contact phone", async () => {
    const result = await updateOwnProfileAction({
      fullName: " Awa Njoya ",
      phone: "6 99 00 00 01",
    });

    expect(result).toMatchObject({ ok: true });
    expect(rpcMock).toHaveBeenCalledWith("update_own_profile", {
      p_full_name: "Awa Njoya",
      p_phone: "+237699000001",
    });
  });

  it("refuses to run without a session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    await expect(updateOwnProfileAction({ fullName: "Awa Njoya", phone: "" })).resolves.toMatchObject({
      ok: false,
      error: "Votre session a expiré. Reconnectez-vous pour continuer.",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns field errors without writing invalid input", async () => {
    const result = await updateOwnProfileAction({ fullName: " ", phone: "123" });

    expect(result).toMatchObject({ ok: false, fieldErrors: { fullName: expect.any(String), phone: expect.any(String) } });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("explains when a submitted legal name needs manager review", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "profile_name_review_required" },
    });

    await expect(
      updateOwnProfileAction({ fullName: "Nouveau Nom", phone: "" }),
    ).resolves.toMatchObject({
      ok: false,
      fieldErrors: { fullName: "Après la soumission du KYC, demandez une correction à votre gestionnaire." },
    });
  });
});
