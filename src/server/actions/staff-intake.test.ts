import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerProfileMock,
  getAdminClientMock,
  createServerSupabaseClientMock,
  sendTemplatedEmailMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getServerProfileMock: vi.fn(),
  getAdminClientMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
  sendTemplatedEmailMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/server/auth/profile", () => ({ getServerProfile: getServerProfileMock }));
vi.mock("@/server/supabase/admin", () => ({ getAdminClient: getAdminClientMock }));
vi.mock("@/server/supabase/server", () => ({ createServerSupabaseClient: createServerSupabaseClientMock }));
vi.mock("@/server/email/send", () => ({ sendTemplatedEmail: sendTemplatedEmailMock }));
vi.mock("@/server/env", () => ({ getSiteUrl: () => "https://cfc.example.cm" }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { createStaffIntakeAction } from "./staff-intake";

const existingCitizenId = "f6c41cf8-b01a-4a72-a0c4-0f95f7313eac";
const newCitizenId = "49c833af-0d4e-4c87-9c23-8f17b59415fe";
const dossierId = "a82f8b7e-8851-4604-91ef-2c5c3278c54d";
const staffProfile = {
  actorId: "15a02c56-ed64-409c-9151-23922719b2a0",
  actorType: "staff",
  role: "GUICHET",
  roleLabel: "Guichet",
  pole: "G1",
  agencyId: "3b37f0d8-433f-43b0-a5e2-7ebddcd2c8d7",
  agencyLabel: "Agence Yaoundé Centre",
  fullName: "ABANDA Eric",
  email: "guichet@cfc.cm",
  phone: null,
  avatarUrl: null,
  pendingEmail: null,
  capabilities: ["dossier:create"],
};

const input = {
  fullName: "MENGUE Aline",
  email: "aline.mengue@example.cm",
  phone: "+237 690 000 111",
  cni: "123456789",
  city: "Yaoundé",
  region: "Centre (Yaoundé)",
  affiliationStatus: "first_time",
  isDiaspora: false,
};

function profileLookup(data: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return query;
}

function setup({
  existingProfile = null as Record<string, unknown> | null,
  rpcResult = null as Record<string, unknown> | null,
  rpcError = null as { message: string } | null,
} = {}) {
  const rpcMock = vi.fn().mockResolvedValue({ data: rpcResult, error: rpcError });
  const existingProfileQuery = profileLookup(existingProfile);
  const actorQuery = profileLookup(existingProfile ? { actor_type: "citizen" } : null);
  const insertProfileMock = vi.fn().mockResolvedValue({ error: null });
  const admin = {
    from: vi.fn((table: string) => {
      if (table === "citizen_profiles") {
        return { ...existingProfileQuery, insert: insertProfileMock };
      }
      if (table === "actors") return actorQuery;
      throw new Error(`Unexpected admin table: ${table}`);
    }),
    auth: {
      admin: {
        generateLink: vi.fn().mockResolvedValue({
          data: {
            user: { id: newCitizenId },
            properties: { hashed_token: "one-time-hash" },
          },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  };
  getServerProfileMock.mockResolvedValue(staffProfile);
  getAdminClientMock.mockReturnValue(admin);
  createServerSupabaseClientMock.mockResolvedValue({ rpc: rpcMock });
  sendTemplatedEmailMock.mockResolvedValue({ status: "sent" });
  return { admin, rpcMock, insertProfileMock };
}

describe("staff borrower intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an account invitation, profile, assigned DUC, and invitation email for a new borrower", async () => {
    const { admin, rpcMock, insertProfileMock } = setup({
      rpcResult: {
        dossier_id: dossierId,
        duc_code: "CFC-2026-01001",
        advisor: "Mme Mbezele",
        reused: false,
      },
    });

    await expect(createStaffIntakeAction(input)).resolves.toMatchObject({
      ok: true,
      dossierId,
      dossierCode: "CFC-2026-01001",
      advisor: "Mme Mbezele",
      invited: true,
      reused: false,
      deliveryStatus: "sent",
    });

    expect(admin.auth.admin.generateLink).toHaveBeenCalledWith(expect.objectContaining({
      type: "invite",
      email: input.email,
      options: { data: { actor_type: "citizen", full_name: input.fullName } },
    }));
    expect(insertProfileMock).toHaveBeenCalledWith(expect.objectContaining({
      id: newCitizenId,
      email: input.email,
      full_name: input.fullName,
      cni_raw: input.cni,
      region: input.region,
      kyc_state: "identity_capture",
    }));
    expect(rpcMock).toHaveBeenCalledWith("cfc_create_staff_intake", {
      p_borrower_id: newCitizenId,
    });
    expect(sendTemplatedEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      templateCode: "BORROWER_INVITATION",
      recipientUserId: newCitizenId,
      to: input.email,
    }));
    expect(revalidatePathMock).toHaveBeenCalledWith("/portail-cfc/clients");
  });

  it("creates a new request for an existing borrower without changing their profile or inviting them again", async () => {
    const existingProfile = {
      id: existingCitizenId,
      full_name: "Aline MENGUE",
      email: input.email,
      phone: "+237690000111",
      cni_raw: "123456789",
      city: "Yaoundé",
      region: "Centre (Yaoundé)",
      is_diaspora: false,
    };
    const { admin, rpcMock, insertProfileMock } = setup({
      existingProfile,
      rpcResult: {
        dossier_id: dossierId,
        duc_code: "CFC-2026-01002",
        advisor: "M. Tagne",
        reused: false,
      },
    });

    await expect(createStaffIntakeAction(input)).resolves.toMatchObject({
      ok: true,
      dossierId,
      dossierCode: "CFC-2026-01002",
      invited: false,
    });

    expect(admin.auth.admin.generateLink).not.toHaveBeenCalled();
    expect(insertProfileMock).not.toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith("cfc_create_staff_intake", {
      p_borrower_id: existingCitizenId,
    });
    expect(sendTemplatedEmailMock).not.toHaveBeenCalled();
  });

  it("stops when the existing email and entered identity number disagree", async () => {
    const { rpcMock } = setup({
      existingProfile: {
        id: existingCitizenId,
        full_name: "Aline MENGUE",
        email: input.email,
        phone: "+237690000111",
        cni_raw: "987654321",
        city: "Yaoundé",
        region: "Centre (Yaoundé)",
        is_diaspora: false,
      },
    });

    await expect(createStaffIntakeAction(input)).resolves.toMatchObject({ ok: false });
    expect(rpcMock).not.toHaveBeenCalled();
    expect(sendTemplatedEmailMock).not.toHaveBeenCalled();
  });

  it("removes only a newly invited auth user when dossier creation fails", async () => {
    const { admin } = setup({ rpcError: { message: "no_active_regional_manager" } });

    await expect(createStaffIntakeAction(input)).resolves.toMatchObject({ ok: false });
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith(newCitizenId);
    expect(sendTemplatedEmailMock).not.toHaveBeenCalled();
  });

  it("requires the create-dossier capability and validates intake fields before provisioning", async () => {
    getServerProfileMock.mockResolvedValue({ ...staffProfile, capabilities: [] });
    await expect(createStaffIntakeAction(input)).resolves.toMatchObject({ ok: false });
    expect(getAdminClientMock).not.toHaveBeenCalled();

    getServerProfileMock.mockResolvedValue(staffProfile);
    await expect(createStaffIntakeAction({ ...input, cni: "123" })).resolves.toMatchObject({ ok: false });
    expect(getAdminClientMock).not.toHaveBeenCalled();
  });
});
