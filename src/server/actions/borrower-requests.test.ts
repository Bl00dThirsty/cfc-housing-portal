import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, getUserMock, rpcMock, fromMock, notifyMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/server/notifications/notify", () => ({
  notifyBusinessEvent: notifyMock,
}));

import {
  startBorrowRequestAction,
  saveServiceAction,
  setPriorClientCaseAction,
  submitServiceApplicationAction,
  withdrawBorrowRequestAction,
} from "./borrower-requests";

const dossierId = "dba4c4c0-c7ab-4a71-b39e-70d68065fa26";

function queryResult(data: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return query;
}

describe("borrower request actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "citizen-1", email: "awa@example.cm" } }, error: null });
    rpcMock.mockResolvedValue({ data: null, error: null });
    fromMock.mockImplementation((table: string) => {
      if (table === "actors") return queryResult({ actor_type: "citizen" });
      if (table === "dossiers") return queryResult({ id: dossierId, duc_code: "DUC-2026-00001" });
      return queryResult(null);
    });
    createServerSupabaseClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
      rpc: rpcMock,
      from: fromMock,
    });
  });

  it("creates or resumes a request from the authenticated citizen session", async () => {
    rpcMock.mockResolvedValue({
      data: [{ dossier_id: dossierId, duc_code: "DUC-2026-00002", reused: false }],
      error: null,
    });

    await expect(startBorrowRequestAction()).resolves.toEqual({
      ok: true,
      dossierId,
      dossierCode: "DUC-2026-00002",
      reused: false,
      message: "Votre nouvelle demande est ouverte.",
    });
    expect(rpcMock).toHaveBeenCalledWith("create_borrower_request");
  });

  it("passes the selected dossier ID when saving its service", async () => {
    await expect(saveServiceAction("HOME_LOAN", dossierId)).resolves.toMatchObject({
      ok: true,
      dossierCode: "DUC-2026-00001",
    });
    expect(rpcMock).toHaveBeenCalledWith("save_borrower_request_service", {
      p_dossier_id: dossierId,
      p_service_code: "HOME_LOAN",
    });
  });

  it("passes the selected dossier ID when recording the prior-client case", async () => {
    rpcMock.mockResolvedValue({ data: "documents", error: null });

    await expect(
      setPriorClientCaseAction({ priorClientCase: "deja_au_cfc", dossierId }),
    ).resolves.toMatchObject({ ok: true });
    expect(rpcMock).toHaveBeenCalledWith("set_prior_client_case", {
      p_dossier_id: dossierId,
      p_case: "deja_au_cfc",
    });
    expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "DOCUMENTS_READY",
      dossierId,
      recipientUserId: "citizen-1",
      payload: expect.objectContaining({ prior_client_case: "deja_au_cfc" }),
    }));
  });

  it("submits exactly the selected dossier and notifies its borrower", async () => {
    rpcMock.mockResolvedValue({ data: "Mme Manga", error: null });

    await expect(submitServiceApplicationAction(dossierId)).resolves.toMatchObject({
      ok: true,
      advisor: "Mme Manga",
    });
    expect(rpcMock).toHaveBeenCalledWith("submit_service_application", {
      p_dossier_id: dossierId,
    });
    expect(fromMock).toHaveBeenCalledWith("dossiers");
    expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({
      dossierId,
      recipientUserId: "citizen-1",
    }));
  });

  it("withdraws through the explicit request ID RPC", async () => {
    await expect(withdrawBorrowRequestAction(dossierId)).resolves.toMatchObject({ ok: true });
    expect(rpcMock).toHaveBeenCalledWith("withdraw_borrower_request", {
      p_dossier_id: dossierId,
    });
  });

  it("refuses operations without an authenticated citizen", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    await expect(startBorrowRequestAction()).resolves.toMatchObject({ ok: false });
    await expect(saveServiceAction("HOME_LOAN", dossierId)).resolves.toMatchObject({ ok: false });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
