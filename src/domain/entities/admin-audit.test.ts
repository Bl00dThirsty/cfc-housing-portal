import { describe, expect, it } from "vitest";

import { mapAdminAuditEvents } from "./admin-audit";

describe("journal d'administration", () => {
  it("maps only safe event metadata and never forwards an unexpected payload", () => {
    const events = mapAdminAuditEvents([
      {
        id: 42,
        actor_id: "00000000-0000-4000-8000-000000000001",
        actor_role: "ADMIN",
        action: "UPDATE",
        entity_type: "ref.role_capability",
        entity_key: "GUICHET:dossier:read",
        occurred_at: "2026-11-19T10:00:00.000Z",
        payload: { email: "private@example.invalid" },
      },
      { id: 43, action: "truncate", entity_type: "public.dossiers", occurred_at: "2026-11-19T10:01:00.000Z" },
    ]);

    expect(events).toEqual([{
      id: "42",
      actorId: "00000000-0000-4000-8000-000000000001",
      actorRole: "ADMIN",
      action: "update",
      entityType: "ref.role_capability",
      entityKey: "GUICHET:dossier:read",
      occurredAt: "2026-11-19T10:00:00.000Z",
    }]);
    expect(events[0]).not.toHaveProperty("payload");
  });
});
