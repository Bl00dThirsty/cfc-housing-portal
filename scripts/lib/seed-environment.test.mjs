import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveUserSeedConfig } from "./seed-environment.mjs";

describe("resolveUserSeedConfig", () => {
  it("uses the loopback URL and a local service key for local fixtures", () => {
    assert.deepEqual(
      resolveUserSeedConfig({ SUPABASE_SECRET_KEY: "local-secret", CFC_DEV_PASSWORD: "local-dev-password" }),
      {
        name: "local",
        supabaseUrl: "http://127.0.0.1:54321",
        serviceKey: "local-secret",
        devPassword: "local-dev-password",
      },
    );
  });

  it("prefers the local service-role key over an unrelated generic secret key", () => {
    const config = resolveUserSeedConfig({
      SUPABASE_SECRET_KEY: "cloud-secret-key",
      SUPABASE_SERVICE_ROLE_KEY: "local-service-role-key",
      CFC_DEV_PASSWORD: "local-dev-password",
    });

    assert.equal(config.serviceKey, "local-service-role-key");
  });

  it("loads no credentials from a remote URL in local mode", () => {
    assert.throws(
      () => resolveUserSeedConfig({
        SUPABASE_URL: "https://production-ref.supabase.co",
        SUPABASE_SECRET_KEY: "must-not-be-used",
      }),
      /SUPABASE_URL.*loopback/i,
    );
  });

  it("requires a local service key without echoing credentials", () => {
    assert.throws(
      () => resolveUserSeedConfig({}),
      (error) => {
        assert.match(error.message, /SUPABASE_(SERVICE_ROLE_KEY.*SECRET_KEY|SECRET_KEY.*SERVICE_ROLE_KEY)/);
        assert.doesNotMatch(error.message, /local-secret/);
        return true;
      },
    );
  });

  it("requires a generated or explicitly configured local demo password", () => {
    assert.throws(
      () => resolveUserSeedConfig({ SUPABASE_SECRET_KEY: "local-secret" }),
      /CFC_DEV_PASSWORD/,
    );
  });

  it("allows a separately configured staging target", () => {
    assert.deepEqual(
      resolveUserSeedConfig({
        CFC_SEED_TARGET: "staging",
        SUPABASE_STAGING_PROJECT_REF: "staging-ref",
        SUPABASE_PRODUCTION_PROJECT_REF: "production-ref",
        SUPABASE_STAGING_URL: "https://staging-ref.supabase.co",
        SUPABASE_STAGING_SECRET_KEY: "staging-secret",
        CFC_STAGING_DEV_PASSWORD: "staging-only-password",
      }),
      {
        name: "staging",
        supabaseUrl: "https://staging-ref.supabase.co",
        serviceKey: "staging-secret",
        devPassword: "staging-only-password",
      },
    );
  });

  it("refuses a staging ref that matches production", () => {
    assert.throws(
      () => resolveUserSeedConfig({
        CFC_SEED_TARGET: "staging",
        SUPABASE_STAGING_PROJECT_REF: "same-ref",
        SUPABASE_PRODUCTION_PROJECT_REF: "same-ref",
        SUPABASE_STAGING_URL: "https://same-ref.supabase.co",
        SUPABASE_STAGING_SECRET_KEY: "staging-secret",
        CFC_STAGING_DEV_PASSWORD: "staging-only-password",
      }),
      /SUPABASE_STAGING_PROJECT_REF.*differ.*SUPABASE_PRODUCTION_PROJECT_REF/i,
    );
  });

  it("refuses production fixture seeding", () => {
    assert.throws(
      () => resolveUserSeedConfig({ CFC_SEED_TARGET: "production" }),
      /fixture seeding is disabled in production/i,
    );
  });
});
