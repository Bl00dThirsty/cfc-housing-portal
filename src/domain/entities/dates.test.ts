import { describe, expect, it } from "vitest";

import { formatCfcDate, parseCfcDate } from "@/domain/entities/dates";

describe("dates de la plateforme", () => {
  it("lit une date française", () => {
    const parsed = parseCfcDate("15/01/2026");
    expect(parsed?.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("refuse une date inexistante", () => {
    expect(parseCfcDate("31/02/2026")).toBeNull();
  });

  it("refuse une date illisible", () => {
    expect(parseCfcDate("hier")).toBeNull();
    expect(parseCfcDate("")).toBeNull();
    expect(parseCfcDate(null)).toBeNull();
  });

  it("écrit une date française", () => {
    expect(formatCfcDate(new Date("2026-01-15T00:00:00.000Z"))).toBe("15/01/2026");
  });

  it("fait l'aller-retour", () => {
    const parsed = parseCfcDate("03/09/2026");
    expect(parsed && formatCfcDate(parsed)).toBe("03/09/2026");
  });

  it("n'écrit pas une date invalide", () => {
    expect(formatCfcDate(new Date(""))).toBe("");
  });
});
