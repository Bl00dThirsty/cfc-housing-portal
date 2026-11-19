import { describe, expect, it } from "vitest";

import { mapAdminRolePermissionDirectory } from "./admin-role-permissions";

describe("admin role permission directory", () => {
  it("builds active, typed grants from the persisted reference views", () => {
    const result = mapAdminRolePermissionDirectory(
      [
        { code: "GUICHET", label: "Guichet", description: null, pole_code: "G1", scope: "OWN_AGENCY", sort_order: 1 },
        { code: "AUDIT", label: "Auditeur", description: null, pole_code: "SDA-AUDIT", scope: "ALL", sort_order: 2 },
        { code: "UNKNOWN", label: "Unknown", description: null, pole_code: null, scope: null, sort_order: 2 },
      ],
      [
        { code: "dossier:read", label: "Lire les dossiers", group_label: "Dossiers", description: null, sort_order: 1 },
        { code: "made:up", label: "Unknown", group_label: "Autre", description: null, sort_order: 2 },
      ],
      [
        { role_code: "GUICHET", capability: "dossier:read" },
        { role_code: "GUICHET", capability: "made:up" },
        { role_code: "AUDIT", capability: "admin:audit" },
      ],
    );

    expect(result.roles).toEqual([
      expect.objectContaining({ code: "GUICHET", capabilities: ["dossier:read"] }),
      expect.objectContaining({ code: "AUDIT", capabilities: ["admin:audit"] }),
    ]);
    expect(result.capabilities).toEqual([
      expect.objectContaining({ code: "dossier:read", groupLabel: "Dossiers" }),
    ]);
  });
});
