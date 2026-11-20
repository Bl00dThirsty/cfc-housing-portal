import { describe, expect, it, vi } from "vitest";

const adminFrom = vi.fn();
const notifyMock = vi.fn();
vi.mock("@/server/supabase/admin", () => ({
  getAdminClient: () => ({ from: adminFrom }),
}));
vi.mock("./notify", () => ({ notify: (input: unknown) => notifyMock(input) }));

import { buildRegisterNotificationPayload } from "./register-notifications";

describe("role-safe payload", () => {
  it("hides the record identifier from roles without register:read", () => {
    const generic = buildRegisterNotificationPayload({
      registerKey: "promoters", recordId: "secret-id", label: "Promotion privée",
      operation: "create", canReadRegister: false,
    });
    expect(JSON.stringify(generic)).not.toContain("secret-id");
    expect(JSON.stringify(generic)).not.toContain("Promotion privée");
  });

  it("includes the label and a deep link for authorized roles", () => {
    const scoped = buildRegisterNotificationPayload({
      registerKey: "promoters", recordId: "r1", label: "Promotion Saint-Paul",
      operation: "create", canReadRegister: true,
    });
    expect(scoped.body).toContain("Promotion Saint-Paul");
    expect(scoped.actionUrl).toBe("/portail-cfc/actors/agency/promoters/r1");
  });
});
