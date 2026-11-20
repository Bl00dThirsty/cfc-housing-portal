import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  invite: vi.fn(),
  reset: vi.fn(),
  activate: vi.fn(),
  assign: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/server/actions/admin-users", () => ({
  inviteStaffUserAction: mocks.invite,
  resetStaffPasswordAction: mocks.reset,
  setStaffAccountActiveAction: mocks.activate,
  assignStaffRoleAction: mocks.assign,
  updateStaffProfileAction: mocks.update,
}));

import { StaffDirectory } from "./staff-directory";
import { mapAdminStaffAccount } from "@/domain/entities/admin-user";
import type { AdminStaffDirectory } from "@/domain/entities/admin-user";

function directory(): AdminStaffDirectory {
  const roleLabels = new Map([["GESTIONNAIRE", "Conseiller Clientèle"]]);
  const row = (id: string, fullName: string, email: string, agencyLabel: string) => mapAdminStaffAccount({
    id,
    email,
    full_name: fullName,
    role: "GESTIONNAIRE",
    pole: "G2",
    job_title: "Conseiller clientèle",
    department: "Portefeuille crédit",
    phone: null,
    initials: fullName.split(" ").map((part) => part[0]).join(""),
    agency_id: `agency-${id}`,
    agency_label: agencyLabel,
    scope: "OWN_PORTFOLIO",
    created_at: "2026-11-01T10:00:00.000Z",
    last_sign_in_at: "2026-11-18T10:00:00.000Z",
    active: true,
    email_confirmed: true,
    avatar_path: null,
  }, roleLabels);

  return {
    users: [
      row("staff-1", "Ewa Abena", "ewa@cfc.cm", "Agence Centre"),
      row("staff-2", "Manga Paul", "manga@cfc.cm", "Agence Littoral"),
    ],
    roles: [{ code: "GESTIONNAIRE", label: "Conseiller Clientèle", poleCode: "G2", scope: "OWN_PORTFOLIO" }],
    agencies: [{ id: "agency", code: "CFC-DLA", label: "Agence Douala", city: "Douala", region: "Littoral", isDiasporaDesk: false }],
    currentUserId: "staff-1",
  };
}

describe("répertoire du personnel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the search scope when switching between table and cards", async () => {
    const user = userEvent.setup();
    render(<StaffDirectory directory={directory()} />);

    await user.type(screen.getByRole("textbox", { name: "Rechercher le personnel" }), "littoral");
    expect(screen.getByText("Manga Paul")).toBeInTheDocument();
    expect(screen.queryByText("Ewa Abena")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vue en grille" }));
    expect(screen.getByText("Manga Paul")).toBeInTheDocument();
    expect(screen.queryByText("Ewa Abena")).not.toBeInTheDocument();
  });
});
