import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerProfileMock, sendTemplatedEmailMock, fromMock, maybeSingleMock } = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.gte = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.maybeSingle = vi.fn();
  return { getServerProfileMock: vi.fn(), sendTemplatedEmailMock: vi.fn(), fromMock: vi.fn(() => query), maybeSingleMock: query.maybeSingle };
});

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/profile", () => ({ getServerProfile: getServerProfileMock }));
vi.mock("@/server/email/send", () => ({ sendTemplatedEmail: sendTemplatedEmailMock }));
vi.mock("@/server/supabase/admin", () => ({ getAdminClient: () => ({ from: fromMock }) }));

import { sendEmailProviderTestAction } from "@/server/actions/admin-email-provider";

describe("sendEmailProviderTestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerProfileMock.mockResolvedValue({ role: "ADMIN", actorId: "actor-admin" });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    sendTemplatedEmailMock.mockResolvedValue({ status: "sent" });
  });

  it("validates the destination and requires mail-management permission", async () => {
    await expect(sendEmailProviderTestAction({ email: "bad" })).resolves.toMatchObject({ ok: false });
    getServerProfileMock.mockResolvedValue({ role: "GUICHET", actorId: "agent" });
    await expect(sendEmailProviderTestAction({ email: "ops@cfc.cm" })).resolves.toMatchObject({ ok: false });
    expect(sendTemplatedEmailMock).not.toHaveBeenCalled();
  });

  it("rate limits each operator and logs an authorized test through the common mail pipeline", async () => {
    const result = await sendEmailProviderTestAction({ email: "ops@cfc.cm" });
    expect(result).toMatchObject({ ok: true, status: "sent" });
    expect(sendTemplatedEmailMock).toHaveBeenCalledWith(expect.objectContaining({ templateCode: "SYSTEM_TEST", to: "ops@cfc.cm", actorId: "actor-admin" }));
    maybeSingleMock.mockResolvedValue({ data: { id: "recent" }, error: null });
    await expect(sendEmailProviderTestAction({ email: "ops@cfc.cm" })).resolves.toMatchObject({ ok: false, error: expect.stringContaining("dernière minute") });
    expect(sendTemplatedEmailMock).toHaveBeenCalledTimes(1);
  });
});
