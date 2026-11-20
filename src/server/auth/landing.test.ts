import { describe, expect, it, vi } from "vitest";

import { resolveRoleForUser } from "./landing";

function queryResult(data: unknown) {
  const query: Record<string, unknown> = {};
  for (const method of ["select", "eq", "is", "lte", "or", "order", "limit"]) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn(async () => ({ data, error: null }));
  return query;
}

function supabaseWithAssignments(assignment: unknown) {
  const assignmentQuery = queryResult(assignment);
  const actorQuery = queryResult({ actor_type: "staff" });
  return {
    client: {
      from: vi.fn((table: string) => table === "staff_assignments" ? assignmentQuery : actorQuery),
    } as never,
    assignmentQuery,
  };
}

describe("resolveRoleForUser assignment validity", () => {
  it("queries only assignments whose validity window includes the current time", async () => {
    const { client, assignmentQuery } = supabaseWithAssignments({ role: "ADMIN" });

    await expect(resolveRoleForUser(client, "staff-user")).resolves.toBe("ADMIN");

    expect(assignmentQuery.lte).toHaveBeenCalledWith("starts_at", expect.any(String));
    const currentTime = (assignmentQuery.lte as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(assignmentQuery.or).toHaveBeenCalledWith(`ends_at.is.null,ends_at.gt.${currentTime}`);
  });

  it("fails closed when the database returns no currently valid assignment", async () => {
    const { client } = supabaseWithAssignments(null);
    await expect(resolveRoleForUser(client, "expired-staff-user")).resolves.toBeNull();
  });
});
