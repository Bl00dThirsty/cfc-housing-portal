import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, getServerProfileMock, queryResponse } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  getServerProfileMock: vi.fn(),
  queryResponse: { data: null as unknown, error: null as unknown },
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));
vi.mock("@/server/auth/profile", () => ({
  getServerProfile: getServerProfileMock,
}));

import { getAssignedNameCorrectionRequests } from "./profile-corrections";

function createQuery() {
  const query: Record<string, unknown> = {};
  const chain = () => query;
  query.select = chain;
  query.eq = chain;
  query.is = chain;
  query.order = chain;
  query.then = (resolve?: (value: typeof queryResponse) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(queryResponse).then(resolve, reject);
  return query;
}

describe("getAssignedNameCorrectionRequests", () => {
  beforeEach(() => {
    queryResponse.data = [{
      id: "request-1",
      requested_full_name: "Aline M. Nguemo",
      reason: "Mon acte de naissance comporte mon nom complet.",
      created_at: "2026-11-20T08:00:00.000Z",
    }];
    queryResponse.error = null;
    getServerProfileMock.mockResolvedValue({
      actorId: "manager-1",
      actorType: "staff",
      role: "GESTIONNAIRE",
      capabilities: ["kyc:read"],
    });
    createServerSupabaseClientMock.mockResolvedValue({ from: () => createQuery() });
  });

  it("returns the assigned manager's pending request with decision permission from persisted grants", async () => {
    const result = await getAssignedNameCorrectionRequests("dossier-1");

    expect(result).toEqual({
      ok: true,
      canDecide: false,
      requests: [{
        id: "request-1",
        requestedFullName: "Aline M. Nguemo",
        reason: "Mon acte de naissance comporte mon nom complet.",
        createdAtLabel: "20 nov. 2026, 09:00",
      }],
    });
  });

  it("does not turn a query failure into an empty pending-request state", async () => {
    queryResponse.error = { message: "database unavailable" };

    const result = await getAssignedNameCorrectionRequests("dossier-1");

    expect(result).toEqual({
      ok: false,
      error: "La demande de correction ne peut pas être chargée.",
    });
  });
});
