import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, getServerProfileMock, revalidatePathMock, rpcMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  getServerProfileMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/server/auth/profile", () => ({ getServerProfile: getServerProfileMock }));
vi.mock("@/server/supabase/server", () => ({ createServerSupabaseClient: createServerSupabaseClientMock }));

import { recordSavingsTransactionAction, reverseSavingsTransactionAction } from "./savings";

const accountId = "3d41d6dd-f879-491a-8be0-09f41b388d25";
const transactionId = "7ab7c683-b9f0-41b9-980b-30877b1c18d8";
const idempotencyKey = "3451e645-a585-4244-8bf3-6fb0681e3f82";

describe("savings ledger actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerProfileMock.mockResolvedValue({ id: "staff-1", role: "GESTIONNAIRE" });
    rpcMock.mockResolvedValue({ data: transactionId, error: null });
    createServerSupabaseClientMock.mockResolvedValue({ rpc: rpcMock });
  });

  it("requires a stable idempotency key before recording an operation", async () => {
    const result = await recordSavingsTransactionAction({
      accountId,
      type: "deposit",
      amount: 1000,
      channel: "agency",
    });

    expect(result).toMatchObject({ ok: false });
    expect(getServerProfileMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("passes the request key through to the atomic recording RPC", async () => {
    const result = await recordSavingsTransactionAction({
      accountId,
      type: "deposit",
      amount: 1000,
      channel: "agency",
      idempotencyKey,
    });

    expect(result).toEqual({ ok: true, transactionId, status: "pending" });
    expect(rpcMock).toHaveBeenCalledWith("record_savings_transaction", expect.objectContaining({
      p_idempotency_key: idempotencyKey,
      p_account_id: accountId,
      p_transaction_type: "deposit",
    }));
  });

  it("explains an idempotency key reused with a different request", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "savings_idempotency_conflict" } });
    const result = await recordSavingsTransactionAction({
      accountId,
      type: "deposit",
      amount: 1000,
      channel: "agency",
      idempotencyKey,
    });

    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("nouvelle opération") });
  });

  it("does not offer the reversal capability to a teller", async () => {
    getServerProfileMock.mockResolvedValue({ id: "staff-1", role: "GUICHET" });
    const result = await reverseSavingsTransactionAction({
      transactionId,
      idempotencyKey,
      reason: "Erreur de saisie à corriger",
    });

    expect(result).toMatchObject({ ok: false });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("sends a reason and stable key to the reversal RPC", async () => {
    const result = await reverseSavingsTransactionAction({
      transactionId,
      idempotencyKey,
      reason: "Erreur de saisie à corriger",
    });

    expect(result).toEqual({ ok: true, reversalId: transactionId });
    expect(rpcMock).toHaveBeenCalledWith("reverse_savings_transaction", {
      p_transaction_id: transactionId,
      p_idempotency_key: idempotencyKey,
      p_reason: "Erreur de saisie à corriger",
    });
  });
});
