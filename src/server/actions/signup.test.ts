import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createServerSupabaseClientMock,
  signInWithPasswordMock,
  createUserMock,
  sendTemplatedEmailMock,
} = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  createUserMock: vi.fn(),
  sendTemplatedEmailMock: vi.fn(),
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/server/supabase/admin", () => ({
  getAdminClient: () => ({
    auth: { admin: { createUser: createUserMock } },
  }),
}));

vi.mock("@/server/email/send", () => ({
  sendTemplatedEmail: sendTemplatedEmailMock,
}));

vi.mock("@/server/env", () => ({
  getSiteUrl: () => "https://portal.example.cm",
}));

import { signupAction } from "./signup";

/** Une chaîne de requêtes qui se laisse enchaîner, et qui répond. */
function chainable(result: Record<string, unknown>) {
  const chain: Record<string, unknown> = {};

  for (const method of ["upsert", "insert", "update", "select", "eq", "is", "neq", "order", "limit"]) {
    chain[method] = vi.fn(() => chain);
  }

  chain.maybeSingle = vi.fn(async () => result);
  chain.then = vi.fn(async (resolve: (value: unknown) => void) => resolve(result));

  return chain;
}

describe("signupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    createUserMock.mockResolvedValue({
      data: { user: { id: "citizen-1" } },
      error: null,
    });

    signInWithPasswordMock.mockResolvedValue({
      data: { session: { access_token: "token" }, user: { id: "citizen-1" } },
      error: null,
    });

    sendTemplatedEmailMock.mockResolvedValue({
      status: "sent",
      templateCode: "WELCOME",
      deliveryId: "delivery-1",
      provider: "smtp",
      subject: "Bienvenue",
      error: null,
      missingVariables: [],
    });

    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        signInWithPassword: signInWithPasswordMock,
        getUser: vi.fn(async () => ({ data: { user: { id: "citizen-1" } }, error: null })),
      },
      from: vi.fn(() =>
        chainable({
          data: { id: "citizen-1", actor_type: "citizen", phone: "+237699000000" },
          error: null,
        }),
      ),
      rpc: vi.fn(async () => ({ data: "CFC-2026-0001", error: null })),
    });
  });

  it("ouvre le compte par la plateforme et ouvre la session aussitôt", async () => {
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

    expect(result).toMatchObject({ ok: true, redirectTo: "/onboarding?dossier=citizen-1" });

    // Le compte est ouvert par la plateforme, et son adresse confirmée
    // d'emblée : l'inscription ne dépend d'aucun courriel.
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "awa.njoya@example.cm",
        password: "motdepasse2026",
        email_confirm: true,
      }),
    );

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "awa.njoya@example.cm",
      password: "motdepasse2026",
    });
  });

  it("envoie le message de bienvenue, une seule fois par compte", async () => {
    await signupAction({
      accountType: "particulier",
      fullName: "Awa Njoya",
      email: "AWA.NJOYA@example.cm",
      phone: "+237 6 99 00 00 00",
      cniNumber: "AB123456",
      password: "motdepasse2026",
      passwordConfirm: "motdepasse2026",
      consent: true,
    });

    expect(sendTemplatedEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateCode: "WELCOME",
        to: "awa.njoya@example.cm",
        idempotencyKey: "PROFILE_CREATED:citizen-1",
      }),
    );
  });

  it("refuse un e-mail déjà pris", async () => {
    createUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials" },
    });

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

    expect(result).toMatchObject({ ok: false, code: "ACCOUNT_EXISTS" });
  });
});
