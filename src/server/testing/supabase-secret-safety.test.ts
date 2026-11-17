import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyServerEnv, serviceClient } from "./e2e-accounts";

const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalSecretKey = process.env.SUPABASE_SECRET_KEY;

function restoreEnvironmentVariable(
  name: string,
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("Supabase service key safety", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  afterEach(() => {
    restoreEnvironmentVariable(
      "SUPABASE_SERVICE_ROLE_KEY",
      originalServiceRoleKey,
    );
    restoreEnvironmentVariable("SUPABASE_SECRET_KEY", originalSecretKey);
  });

  it("requires an environment key before creating an E2E service client", () => {
    expect(() => serviceClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("requires an environment key before configuring E2E server variables", () => {
    expect(() => applyServerEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("stops the dev-user seeder when no service key is configured", () => {
    const env = { ...process.env };
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    delete env.SUPABASE_SECRET_KEY;
    env.SUPABASE_URL = "http://127.0.0.1:54321";

    const result = spawnSync(
      process.execPath,
      ["scripts/seed-dev-users.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env,
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("refuses to seed a hosted Supabase project", () => {
    const env = {
      ...process.env,
      SUPABASE_URL: "https://production-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
    };

    const result = spawnSync(
      process.execPath,
      ["scripts/seed-dev-users.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env,
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Refusing to seed a non-local Supabase URL");
  });
});
