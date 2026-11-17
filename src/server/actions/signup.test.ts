import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, signUpMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/server/env", () => ({
  getSiteUrl: () => "https://portal.example.cm",
}));

import { signupAction } from "./signup";

describe("signupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signUpMock.mockResolvedValue({
      data: { session: null, user: { id: "citizen-1" } },
      error: null,
    });
    createServerSupabaseClientMock.mockResolvedValue({
      auth: { signUp: signUpMock },
    });
  });

  it("sends confirmation emails back to the deployed onboarding callback", async () => {
    const result = await signupAction({
      accountType: "particulier",
      fullName: "Awa Njoya",
      email: "AWA.NJOYA@example.cm",
      phone: "+237 6 99 00 00 00",
      cniNumber: "AB123456",
      password: "motdepasse2026",
      passwordConfirm: "motdepasse2026",
      consent: true,
    });

    expect(result).toMatchObject({
      ok: true,
      pendingConfirmation: true,
      redirectTo: "/login",
    });
    expect(signUpMock).toHaveBeenCalledWith({
      email: "awa.njoya@example.cm",
      password: "motdepasse2026",
      options: {
        emailRedirectTo: "https://portal.example.cm/auth/callback?next=/onboarding",
      },
    });
  });
});
