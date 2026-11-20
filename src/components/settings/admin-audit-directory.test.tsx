import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AdminAuditDashboard } from "@/domain/entities/admin-audit";
import { AdminAuditDirectory } from "./admin-audit-directory";

const dashboard: AdminAuditDashboard = {
  events: [
    {
      id: "event-1",
      actorId: "00000000-0000-4000-8000-000000000001",
      actorRole: "ADMIN",
      action: "update",
      entityType: "ref.role_capability",
      entityKey: "GUICHET:dossier:read",
      occurredAt: "2026-11-19T10:00:00.000Z",
    },
    {
      id: "event-2",
      actorId: null,
      actorRole: "PMO",
      action: "insert",
      entityType: "ref.process_step",
      entityKey: "KYC_CAPTURE",
      occurredAt: "2026-11-19T09:00:00.000Z",
    },
  ],
  readiness: {
    activeRoles: 12,
    activeCapabilities: 53,
    orphanedGrants: 0,
    activeProcesses: 6,
    activeWorkflowSteps: 24,
    emailProvider: "none",
    emailConfigured: false,
  },
};

describe("répertoire du journal d'administration", () => {
  it("keeps the same search result when switching between list and card views", () => {
    render(<AdminAuditDirectory dashboard={dashboard} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Rechercher dans le journal" }), {
      target: { value: "GUICHET:dossier:read" },
    });
    expect(screen.getByText("GUICHET:dossier:read")).toBeInTheDocument();
    expect(screen.queryByText("KYC_CAPTURE")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vue en grille" }));
    expect(screen.getByText("GUICHET:dossier:read")).toBeInTheDocument();
    expect(screen.queryByText("KYC_CAPTURE")).not.toBeInTheDocument();
  });

  it("shows the actual mail-provider setup state", () => {
    render(<AdminAuditDirectory dashboard={dashboard} />);
    expect(screen.getByText("À configurer")).toBeInTheDocument();
  });
});
