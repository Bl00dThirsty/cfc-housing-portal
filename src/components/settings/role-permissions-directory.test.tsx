import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { saveRoleCapabilitiesActionMock } = vi.hoisted(() => ({ saveRoleCapabilitiesActionMock: vi.fn() }));
vi.mock("@/server/actions/admin-role-permissions", () => ({ saveRoleCapabilitiesAction: saveRoleCapabilitiesActionMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { RolePermissionsDirectory } from "./role-permissions-directory";
import type { AdminRolePermissionDirectory } from "@/domain/entities/admin-role-permissions";

const directory: AdminRolePermissionDirectory = {
  roles: [
    { code: "GUICHET", label: "Guichet", description: "Accueil", poleCode: "G1", scope: "OWN_AGENCY", sortOrder: 1, capabilities: ["dossier:read"] },
    { code: "ADMIN", label: "Administration", description: "Direction", poleCode: "ADMIN", scope: "ALL", sortOrder: 99, capabilities: ["admin:roles"] },
  ],
  capabilities: [
    { code: "dossier:read", label: "Lire les dossiers", groupLabel: "Dossiers", description: null, sortOrder: 1 },
    { code: "workflow:manage", label: "Gérer le workflow", groupLabel: "Administration", description: null, sortOrder: 2 },
    { code: "admin:roles", label: "Gérer les habilitations", groupLabel: "Administration", description: "Attribuer des droits", sortOrder: 3 },
  ],
};

describe("RolePermissionsDirectory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveRoleCapabilitiesActionMock.mockResolvedValue({ ok: true, grantCount: 2 });
  });

  it("keeps the bootstrap ADMIN role visible and read-only", () => {
    render(<RolePermissionsDirectory directory={directory} />);
    expect(screen.getByRole("button", { name: /Administration.*protégé/i })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Gérer le workflow" })).toBeInTheDocument();
  });

  it("saves the selected role's edited grants through the server action", async () => {
    render(<RolePermissionsDirectory directory={directory} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Gérer le workflow" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer les habilitations" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Habilitations enregistrées.");
    expect(saveRoleCapabilitiesActionMock).toHaveBeenCalledWith({
      roleCode: "GUICHET",
      capabilities: ["dossier:read", "workflow:manage"],
    });
  });
});
