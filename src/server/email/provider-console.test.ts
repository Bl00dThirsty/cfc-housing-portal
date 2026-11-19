import { describe, expect, it } from "vitest";
import { vi } from "vitest";
vi.mock("server-only", () => ({}));
import { safeEmailProviderSummary } from "@/server/email/provider-console";
import type { EmailEnv } from "@/server/env";

describe("safeEmailProviderSummary", () => {
  it("exposes SMTP connection status without returning credentials", () => {
    const env: EmailEnv = {
      provider: "smtp", resendApiKey: null, from: "CFC <mail@cfc.cm>",
      smtp: { host: "smtp.cfc.cm", port: 465, user: "robot", password: "sensitive-secret", secure: true },
      smtpRejectUnauthorized: true,
    };
    const summary = safeEmailProviderSummary(env);
    expect(summary).toMatchObject({ provider: "smtp", smtpHost: "smtp.cfc.cm", smtpPort: 465, smtpUsernameConfigured: true, smtpPasswordConfigured: true, smtpImplicitTls: true });
    expect(JSON.stringify(summary)).not.toContain("sensitive-secret");
    expect(JSON.stringify(summary)).not.toContain("robot");
  });

  it("marks an absent provider as unconfigured", () => {
    expect(safeEmailProviderSummary({ provider: "none", resendApiKey: null, from: "CFC <mail@cfc.cm>", smtp: null, smtpRejectUnauthorized: true }).configured).toBe(false);
  });
});
