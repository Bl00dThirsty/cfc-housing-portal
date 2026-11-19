import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server/actions/admin-groups", () => ({ saveAgencyAction: vi.fn(), savePoleAction: vi.fn() }));

import { GroupDirectory } from "@/components/settings/group-directory";
import type { AdminGroup } from "@/domain/entities/admin-group";

const groups: AdminGroup[] = [
  { kind: "pole", id: null, code: "G1", label: "Guichet", description: "Accueil des clients", city: null, region: null, isDiasporaDesk: false, memberCount: 3, roleCount: 1, sortOrder: 1 },
  { kind: "agency", id: "agency-1", code: "YAOUNDE", label: "Agence Centre", description: null, city: "Yaoundé", region: "Centre", isDiasporaDesk: false, memberCount: 5, roleCount: 2, sortOrder: 0 },
];

describe("admin group directory", () => {
  it("preserves search results when switching between list and card view", async () => {
    const user = userEvent.setup();
    render(<GroupDirectory groups={groups} />);
    await user.type(screen.getByRole("textbox", { name: "Rechercher les groupes" }), "yaoundé");
    expect(screen.getByText("Agence Centre")).toBeInTheDocument();
    expect(screen.queryByText("Guichet")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vue en grille" }));
    expect(screen.getByText("Agence Centre")).toBeInTheDocument();
    expect(screen.queryByText("Guichet")).not.toBeInTheDocument();
  });
});
