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
      operation: "create", eventId: "evt-secret", canReadRegister: false,
    });
    expect(JSON.stringify(generic)).not.toContain("secret-id");
    expect(JSON.stringify(generic)).not.toContain("Promotion privée");
  });

  it("includes the label and a deep link for authorized roles", () => {
    const scoped = buildRegisterNotificationPayload({
      registerKey: "promoters", recordId: "r1", label: "Promotion Saint-Paul",
      operation: "create", eventId: "evt-1", canReadRegister: true,
    });
    expect(scoped.body).toContain("Promotion Saint-Paul");
    expect(scoped.actionUrl).toBe("/portail-cfc/registres/promoters/r1");
  });

  it("gives each write a unique dedupe key even when register data is identical", () => {
    const first = buildRegisterNotificationPayload({
      registerKey: "promoters", recordId: "r1", label: "Promotion Saint-Paul",
      operation: "update", eventId: "evt-a", canReadRegister: true,
    });
    const second = buildRegisterNotificationPayload({
      registerKey: "promoters", recordId: "r1", label: "Promotion Saint-Paul",
      operation: "update", eventId: "evt-b", canReadRegister: true,
    });
    expect(first.dedupeKey).not.toBe(second.dedupeKey);
  });
});
