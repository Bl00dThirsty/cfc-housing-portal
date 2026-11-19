import { describe, expect, it } from "vitest";
import { filterAdminGroups, type AdminGroup } from "@/domain/entities/admin-group";

const groups: AdminGroup[] = [
  { kind: "pole", id: null, code: "G1", label: "Guichet", description: "Accueil des clients", city: null, region: null, isDiasporaDesk: false, memberCount: 3, roleCount: 1, sortOrder: 1 },
  { kind: "agency", id: "agency-1", code: "YAOUNDE", label: "Agence Centre", description: null, city: "Yaoundé", region: "Centre", isDiasporaDesk: false, memberCount: 5, roleCount: 2, sortOrder: 0 },
];

describe("filterAdminGroups", () => {
  it("filters by group kind", () => {
    expect(filterAdminGroups(groups, { kind: "pole" }).map((group) => group.code)).toEqual(["G1"]);
  });

  it("searches code, description, and locality without case sensitivity", () => {
    expect(filterAdminGroups(groups, { query: "YAOUNDÉ" }).map((group) => group.code)).toEqual(["YAOUNDE"]);
    expect(filterAdminGroups(groups, { query: "accueil" }).map((group) => group.code)).toEqual(["G1"]);
  });
});
