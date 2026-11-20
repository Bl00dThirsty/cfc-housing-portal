import { describe, expect, it } from "vitest";

import { ROLE_POLES, STAFF_ROLES } from "@/domain/policies/capabilities";
import { kpisForPole } from "./kpi";

describe("indicateurs des rôles de staff", () => {
  it("provides database-measured indicators for every active staff pole", () => {
    for (const role of STAFF_ROLES) {
      expect(kpisForPole(ROLE_POLES[role]).length, role).toBeGreaterThan(0);
    }
  });
});
