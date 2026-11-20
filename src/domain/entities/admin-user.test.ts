import { describe, expect, it } from "vitest";

import { filterAdminStaffAccounts, mapAdminStaffAccount } from "./admin-user";

describe("mapAdminStaffAccount", () => {
  it("uses role labels supplied by the database catalogue and preserves account details", () => {
    expect(mapAdminStaffAccount({
      id: "staff-1",
      email: "staff@example.test",
      full_name: "Agent Exemple",
      role: "GESTIONNAIRE",
      pole: "G2",
      job_title: "Conseillère clientèle",
      department: "Portefeuille crédit",
      phone: "+237 600 000 001",
      initials: "AE",
      agency_id: "agency-1",
      agency_label: "Agence Centre",
      scope: "OWN_PORTFOLIO",
      created_at: "2026-11-01T10:00:00.000Z",
      last_sign_in_at: "2026-11-18T10:00:00.000Z",
      active: true,
      email_confirmed: true,
      avatar_path: "staff-1/avatar.webp",
    }, new Map([["GESTIONNAIRE", "Conseillère clientèle"]]), new Map([["staff-1", "/signed/avatar"]]))).toEqual({
      id: "staff-1",
      email: "staff@example.test",
      fullName: "Agent Exemple",
      roleCode: "GESTIONNAIRE",
      roleLabel: "Conseillère clientèle",
      pole: "G2",
      jobTitle: "Conseillère clientèle",
      department: "Portefeuille crédit",
      phone: "+237 600 000 001",
      initials: "AE",
      agencyId: "agency-1",
      agencyLabel: "Agence Centre",
      scope: "OWN_PORTFOLIO",
      createdAt: "2026-11-01T10:00:00.000Z",
      lastSignInAt: "2026-11-18T10:00:00.000Z",
      active: true,
      invitePending: false,
      avatarUrl: "/signed/avatar",
    });
  });

  it("does not invent a role label absent from the database catalogue", () => {
    const account = mapAdminStaffAccount({
      id: "staff-2",
      email: "unknown@example.test",
      full_name: null,
      role: "NEW_ROLE",
      pole: null,
      job_title: null,
      department: null,
      phone: null,
      initials: null,
      agency_id: null,
      agency_label: null,
      scope: null,
      created_at: null,
      last_sign_in_at: null,
      active: false,
      email_confirmed: false,
      avatar_path: null,
    }, new Map());

    expect(account.roleLabel).toBe("NEW_ROLE");
    expect(account.fullName).toBeNull();
    expect(account.lastSignInAt).toBeNull();
    expect(account.active).toBe(false);
    expect(account.invitePending).toBe(true);
    expect(account.avatarUrl).toBeNull();
  });

  it("filters by searchable staff details, role and lifecycle state", () => {
    const rows = [
      mapAdminStaffAccount({
        id: "1", email: "ewa@cfc.cm", full_name: "Ewa Abena", role: "GESTIONNAIRE",
        pole: "G2", job_title: null, department: null, phone: null, initials: "EA",
        agency_id: null, agency_label: "Agence Centre", scope: null, created_at: null,
        last_sign_in_at: null, active: true, email_confirmed: true, avatar_path: null,
      }, new Map()),
      mapAdminStaffAccount({
        id: "2", email: "manga@cfc.cm", full_name: "Manga Paul", role: "NOTAIRE",
        pole: "G8", job_title: "Notaire", department: null, phone: null, initials: "MP",
        agency_id: null, agency_label: "Agence Littoral", scope: null, created_at: null,
        last_sign_in_at: null, active: false, email_confirmed: false, avatar_path: null,
      }, new Map()),
    ];

    expect(filterAdminStaffAccounts(rows, { query: "littoral", role: "all", status: "all" })).toEqual([rows[1]]);
    expect(filterAdminStaffAccounts(rows, { query: "", role: "NOTAIRE", status: "invited" })).toEqual([rows[1]]);
    expect(filterAdminStaffAccounts(rows, { query: "", role: "all", status: "active" })).toEqual([rows[0]]);
  });
});
