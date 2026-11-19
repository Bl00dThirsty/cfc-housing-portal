import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerProfileMock,
  createServerSupabaseClientMock,
  getAdminClientMock,
  sendTemplatedEmailMock,
  revalidatePathMock,
  rpcMock,
  generateLinkMock,
} = vi.hoisted(() => ({
  getServerProfileMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
  getAdminClientMock: vi.fn(),
  sendTemplatedEmailMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  rpcMock: vi.fn(),
  generateLinkMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/server/auth/profile", () => ({ getServerProfile: getServerProfileMock }));
vi.mock("@/server/supabase/server", () => ({ createServerSupabaseClient: createServerSupabaseClientMock }));
vi.mock("@/server/supabase/admin", () => ({ getAdminClient: getAdminClientMock }));
vi.mock("@/server/email/send", () => ({ sendTemplatedEmail: sendTemplatedEmailMock }));

import { inviteStaffUserAction, resetStaffPasswordAction } from "./admin-users";

const adminProfile = {
  actorId: "admin-id",
  actorType: "staff",
  role: "ADMIN",
  roleLabel: "Administrateur Système",
  pole: "ADMIN",
  agencyId: null,
  agencyLabel: null,
  fullName: "Administrateur",
  email: "admin@cfc.cm",
  phone: null,
  avatarUrl: null,
  pendingEmail: null,
} as const;

describe("administrative staff account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerProfileMock.mockResolvedValue(adminProfile);
    rpcMock.mockResolvedValue({ data: "staff-id", error: null });
    createServerSupabaseClientMock.mockResolvedValue({ rpc: rpcMock });
    getAdminClientMock.mockReturnValue({
      auth: { admin: { generateLink: generateLinkMock.mockResolvedValue({
        data: { properties: { hashed_token: "one-time-hash" }, user: { id: "staff-id" } },
        error: null,
      }) } },
    });
    sendTemplatedEmailMock.mockResolvedValue({ status: "sent", error: null });
  });

  it("invites staff through an Auth link and a password-free database RPC", async () => {
    const result = await inviteStaffUserAction({
      email: "new.staff@cfc.cm",
      fullName: "Nouvel Agent",
      role: "GESTIONNAIRE",
      agencyId: "00000000-0000-4000-8000-000000000088",
      jobTitle: "Conseiller clientèle",
    });

    expect(result).toMatchObject({ ok: true, deliveryStatus: "sent" });
    const adminClient = getAdminClientMock.mock.results[0]?.value;
    expect(adminClient.auth.admin.generateLink).toHaveBeenCalledWith(expect.objectContaining({
      type: "invite",
      email: "new.staff@cfc.cm",
      options: { data: { actor_type: "staff", full_name: "Nouvel Agent" } },
    }));
    expect(rpcMock).toHaveBeenCalledWith("cfc_register_invited_staff", {
      p_user_id: "staff-id",
      p_full_name: "Nouvel Agent",
      p_role: "GESTIONNAIRE",
      p_agency: "00000000-0000-4000-8000-000000000088",
      p_job_title: "Conseiller clientèle",
    });
    expect(JSON.stringify(adminClient.auth.admin.generateLink.mock.calls[0])).not.toContain("password");
    expect(sendTemplatedEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      templateCode: "STAFF_INVITATION",
      recipientUserId: "staff-id",
      actorId: "admin-id",
    }));
  });

  it("refuses invitation and recovery operations without the required admin capability", async () => {
    getServerProfileMock.mockResolvedValue({ ...adminProfile, role: "GUICHET" });

    await expect(inviteStaffUserAction({ email: "new.staff@cfc.cm", fullName: "Nouvel Agent", role: "GESTIONNAIRE" }))
      .resolves.toMatchObject({ ok: false });
    await expect(resetStaffPasswordAction("00000000-0000-4000-8000-000000000001"))
      .resolves.toMatchObject({ ok: false });
    expect(getAdminClientMock).not.toHaveBeenCalled();
  });

  it("keeps the account but reports when the configured mail provider cannot deliver the invitation", async () => {
    sendTemplatedEmailMock.mockResolvedValue({ status: "skipped", error: "SMTP absent" });

    await expect(inviteStaffUserAction({
      email: "new.staff@cfc.cm",
      fullName: "Nouvel Agent",
      role: "GESTIONNAIRE",
      agencyId: null,
      jobTitle: null,
    })).resolves.toMatchObject({ ok: true, deliveryStatus: "skipped", warning: expect.any(String) });
  });

  it("sends a new recovery link for a confirmed account without returning its token", async () => {
    rpcMock.mockResolvedValue({ data: [{
      id: "00000000-0000-4000-8000-000000000001",
      email: "staff@cfc.cm",
      full_name: "Agent CFC",
      email_confirmed: true,
    }], error: null });

    const result = await resetStaffPasswordAction("00000000-0000-4000-8000-000000000001");

    expect(result).toMatchObject({ ok: true, deliveryStatus: "sent" });
    expect(generateLinkMock).toHaveBeenCalledWith({ type: "recovery", email: "staff@cfc.cm" });
    expect(sendTemplatedEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      templateCode: "RESET_PASSWORD",
      recipientUserId: "00000000-0000-4000-8000-000000000001",
    }));
    expect(JSON.stringify(result)).not.toContain("one-time-hash");
    expect(JSON.stringify(result)).not.toContain("password");
  });
});
