import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn();
vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "actor-1" } } })) },
    rpc,
    from,
  })),
}));
vi.mock("@/server/notifications/register-notifications", () => ({
  notifyRegisterEvent: vi.fn(async () => ({ notified: 1, emailed: 0 })),
}));

import { saveRegisterRecord } from "./registers";

describe("saveRegisterRecord", () => {
  beforeEach(() => { rpc.mockReset(); from.mockReset(); });

  it("rejects an invalid label before writing", async () => {
    const result = await saveRegisterRecord("promoters", { label: "A", status: "active", region: null });
    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it("writes with the session client and returns a success message", async () => {
    const chain = {
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => ({ data: { id: "r1" }, error: null })) })) })),
    };
    from.mockReturnValue(chain);
    const result = await saveRegisterRecord("promoters", {
      label: "Promotion Saint-Paul", status: "active", region: "Centre",
    });
    expect(result.ok).toBe(true);
    expect(from).toHaveBeenCalledWith("registers_promoters");
  });
});
