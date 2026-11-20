import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, getServerProfileMock, rows } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  getServerProfileMock: vi.fn(),
  rows: {} as Record<string, unknown>,
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));
vi.mock("@/server/auth/profile", () => ({
  getServerProfile: getServerProfileMock,
}));
vi.mock("@/server/queries/reference", () => ({
  referenceView: (name: string) => `cfc_${name}`,
}));

import { getDossierDocumentDecisionOptionsAction } from "./dossiers";

function queryResult(table: string) {
  const result = { data: rows[table] ?? null, error: null };
  const query: Record<string, unknown> = {};
  const chain = () => query;
  query.select = chain;
  query.eq = chain;
  query.in = chain;
  query.lte = chain;
  query.or = chain;
  query.is = chain;
  query.maybeSingle = () => Promise.resolve(result);
  query.then = (resolve?: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

describe("getDossierDocumentDecisionOptionsAction", () => {
  beforeEach(() => {
    Object.keys(rows).forEach((key) => delete rows[key]);
    getServerProfileMock.mockResolvedValue({
      actorId: "staff-1",
      actorType: "staff",
      role: "RISQUES_BET",
      capabilities: ["document:validate"],
      agencyId: null,
    });
    createServerSupabaseClientMock.mockResolvedValue({
      from: (table: string) => queryResult(table),
    });
    rows.dossier_documents = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      dossier_id: "dossier-1",
      doc_type_code: "PLAN_ARCHI",
      chemise_code: "C2",
      status: "uploaded",
    };
    rows.dossiers = {
      service_code: "CREDIT_IMMOBILIER",
      current_phase: "TECHNIQUE",
      owner_user_id: "manager-1",
      agency_id: "agency-1",
      is_diaspora: false,
    };
    rows.cfc_document_stage_phase = [{ stage_code: "BET_REVIEW", phase_code: "TECHNIQUE" }];
    rows.cfc_document_type = { code: "PLAN_ARCHI", chemise_code: "C2" };
    rows.cfc_service_document_requirement = [{
      service_code: "CREDIT_IMMOBILIER",
      stage: "BET_REVIEW",
      doc_type_code: "PLAN_ARCHI",
      effective_from: "2026-01-01",
      effective_to: null,
      deleted_at: null,
    }];
    rows.cfc_document_stage_role_policy = [
      { stage_code: "BET_REVIEW", role_code: "RISQUES_BET", action: "validate", enabled: true, deleted_at: null },
      { stage_code: "BET_REVIEW", role_code: "RISQUES_BET", action: "reject", enabled: true, deleted_at: null },
    ];
  });

  it("returns only stage decisions backed by both a persisted grant and policy", async () => {
    const result = await getDossierDocumentDecisionOptionsAction(
      "550e8400-e29b-41d4-a716-446655440000",
    );

    expect(result).toEqual({
      ok: true,
      options: { canValidate: true, canReject: false },
    });
  });

  it("fails closed when the dossier phase has no configured document stage", async () => {
    rows.cfc_document_stage_phase = [];

    const result = await getDossierDocumentDecisionOptionsAction(
      "550e8400-e29b-41d4-a716-446655440000",
    );

    expect(result).toEqual({
      ok: true,
      options: { canValidate: false, canReject: false },
    });
  });
});
