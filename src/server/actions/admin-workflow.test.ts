import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerProfileMock, rpcMock, revalidatePathMock } = vi.hoisted(() => ({
  getServerProfileMock: vi.fn(), rpcMock: vi.fn(), revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/server/auth/profile", () => ({ getServerProfile: getServerProfileMock }));
vi.mock("@/server/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: rpcMock })) }));

import { saveWorkflowProcessAction, saveWorkflowStepAction, setDocumentStageRolePolicyAction, setWorkflowStepOrderAction } from "@/server/actions/admin-workflow";

describe("admin workflow actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerProfileMock.mockResolvedValue({ role: "ADMIN" });
    rpcMock.mockResolvedValue({ data: {}, error: null });
  });

  it("denies edits to staff without workflow management access", async () => {
    getServerProfileMock.mockResolvedValue({ role: "GUICHET" });
    const result = await saveWorkflowProcessAction({ code: "CRD", label: "Credit", family: "realisation", pilots: [], priority: "standard" });
    expect(result.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("validates and persists process definitions through the database RPC", async () => {
    const invalid = await saveWorkflowProcessAction({ code: "?", label: "x", family: "invalid", pilots: [], priority: "standard" });
    expect(invalid.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
    const valid = await saveWorkflowProcessAction({ code: "CRD", label: "Crédit habitat", family: "realisation", pilots: ["DCR", "DCM"], priority: "prioritaire" });
    expect(valid.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("cfc_save_process", expect.objectContaining({ p_code: "CRD", p_pilote: ["DCR", "DCM"] }));
  });

  it("routes step content and order changes through guarded database RPCs", async () => {
    const saved = await saveWorkflowStepAction({ code: "CRD-07", processCode: "CRD", label: "Décision agence", phase: "committees", lane: "agence", slaDays: 5, external: false });
    const ordered = await setWorkflowStepOrderAction({ code: "CRD-07", sortOrder: 700 });
    expect(saved.ok).toBe(true);
    expect(ordered.ok).toBe(true);
    expect(rpcMock).toHaveBeenNthCalledWith(1, "cfc_save_process_step", expect.objectContaining({ p_code: "CRD-07", p_phase: "committees" }));
    expect(rpcMock).toHaveBeenNthCalledWith(2, "cfc_set_process_step_order", { p_code: "CRD-07", p_sort_order: 700 });
  });

  it("persists stage-specific upload policy only through guarded workflow configuration", async () => {
    const denied = await setDocumentStageRolePolicyAction({
      stageCode: "CREDIT_FILE", roleCode: "ANALYSTE", action: "upload", enabled: true,
    });
    expect(denied.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("cfc_set_document_stage_role_policy", {
      p_stage_code: "CREDIT_FILE", p_role_code: "ANALYSTE", p_action: "upload", p_enabled: true,
    });
  });

  it("rejects malformed stage policy edits before reaching the database", async () => {
    const result = await setDocumentStageRolePolicyAction({
      stageCode: "???", roleCode: "UNKNOWN", action: "read", enabled: true,
    });
    expect(result.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
