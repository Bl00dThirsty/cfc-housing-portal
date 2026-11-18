import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminClientMock, notifyDomainEventMock, insertMock } = vi.hoisted(() => ({
  getAdminClientMock: vi.fn(),
  notifyDomainEventMock: vi.fn(),
  insertMock: vi.fn(),
}));

vi.mock("@/server/supabase/admin", () => ({
  getAdminClient: getAdminClientMock,
}));

vi.mock("@/server/email/events", () => ({
  DOMAIN_EVENT_TEMPLATES: { KYC_SUBMITTED: "KYC_SUBMITTED" },
  formatDate: vi.fn(),
  notifyDomainEvent: notifyDomainEventMock,
  splitName: vi.fn(),
}));

import { notify } from "./notify";

describe("notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminClientMock.mockReturnValue({
      from: () => ({ insert: insertMock }),
    });
    insertMock.mockResolvedValue({ error: null });
  });

  it("reports an email only when the email service confirms delivery", async () => {
    notifyDomainEventMock.mockResolvedValueOnce({
      status: "skipped",
      error: "Aucun fournisseur de courriel n'est configuré.",
    });

    await expect(
      notify({
        recipientUserId: "citizen-1",
        type: "dossier.updated",
        title: "Dossier transmis",
        email: { eventType: "KYC_SUBMITTED" },
      }),
    ).resolves.toEqual({ notified: true, emailed: false });

    notifyDomainEventMock.mockResolvedValueOnce({ status: "sent", error: null });

    await expect(
      notify({
        recipientUserId: "citizen-2",
        type: "dossier.updated",
        title: "Dossier transmis",
        email: { eventType: "KYC_SUBMITTED" },
      }),
    ).resolves.toEqual({ notified: true, emailed: true });
  });
});
