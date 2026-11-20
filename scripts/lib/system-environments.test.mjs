import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSystemEnvironment } from "./system-environments.mjs";

describe("resolveSystemEnvironment", () => {
  it("defaults local Supabase to the loopback URL", () => {
    assert.deepEqual(
      resolveSystemEnvironment("local", {}),
      {
        name: "local",
        projectRef: null,
        supabaseUrl: "http://127.0.0.1:54321",
        appUrl: "http://127.0.0.1:54321",
        anonKey: null,
        serviceKey: null,
        dbPassword: null,
        accessToken: null,
        seedUsers: true,
      },
    );
  });

  it("rejects a hosted URL for local seeding", () => {
    assert.throws(
      () => resolveSystemEnvironment("local", {
        SUPABASE_URL: "https://live-project.supabase.co",
      }),
      /SUPABASE_URL.*loopback/i,
    );
  });

  it("accepts a staging target that matches the configured ref", () => {
    assert.deepEqual(
      resolveSystemEnvironment("staging", {
        SUPABASE_STAGING_PROJECT_REF: "staging-ref",
        SUPABASE_PRODUCTION_PROJECT_REF: "production-ref",
        SUPABASE_STAGING_URL: "https://staging-ref.supabase.co",
        SUPABASE_STAGING_ANON_KEY: "staging-anon-key",
        SUPABASE_STAGING_SERVICE_ROLE_KEY: "staging-service-key",
        SUPABASE_STAGING_DB_PASSWORD: "staging-db-password",
        SUPABASE_ACCESS_TOKEN: "access-token",
      }),
      {
        name: "staging",
        projectRef: "staging-ref",
        supabaseUrl: "https://staging-ref.supabase.co",
        appUrl: "https://staging-ref.supabase.co",
        anonKey: "staging-anon-key",
        serviceKey: "staging-service-key",
        dbPassword: "staging-db-password",
        accessToken: "access-token",
        seedUsers: true,
      },
    );
  });

  it("refuses to seed staging when its ref matches production", () => {
    assert.throws(
      () => resolveSystemEnvironment("staging", {
        SUPABASE_STAGING_PROJECT_REF: "same-ref",
        SUPABASE_PRODUCTION_PROJECT_REF: "same-ref",
        SUPABASE_STAGING_URL: "https://same-ref.supabase.co",
        SUPABASE_STAGING_ANON_KEY: "anon-key",
        SUPABASE_STAGING_SERVICE_ROLE_KEY: "secret-staging-key",
        SUPABASE_STAGING_DB_PASSWORD: "secret-db-password",
        SUPABASE_ACCESS_TOKEN: "secret-access-token",
      }),
      /SUPABASE_STAGING_PROJECT_REF.*differ.*SUPABASE_PRODUCTION_PROJECT_REF/i,
    );
  });

  it("refuses a staging URL that does not belong to the configured project ref", () => {
    assert.throws(
      () => resolveSystemEnvironment("staging", {
        SUPABASE_STAGING_PROJECT_REF: "staging-ref",
        SUPABASE_PRODUCTION_PROJECT_REF: "production-ref",
        SUPABASE_STAGING_URL: "https://production-ref.supabase.co",
        SUPABASE_STAGING_ANON_KEY: "anon-key",
        SUPABASE_STAGING_SERVICE_ROLE_KEY: "secret-staging-key",
        SUPABASE_STAGING_DB_PASSWORD: "secret-db-password",
        SUPABASE_ACCESS_TOKEN: "secret-access-token",
      }),
      /SUPABASE_STAGING_URL.*SUPABASE_STAGING_PROJECT_REF/i,
    );
  });

  it("reports missing production configuration without leaking secrets", () => {
    assert.throws(
      () => resolveSystemEnvironment("production", {
        SUPABASE_PRODUCTION_PROJECT_REF: "production-ref",
        SUPABASE_PRODUCTION_DB_PASSWORD: "do-not-print-this",
        SUPABASE_ACCESS_TOKEN: "do-not-print-this-either",
      }),
      (error) => {
        assert.match(error.message, /SUPABASE_PRODUCTION_URL/);
        assert.doesNotMatch(error.message, /do-not-print-this/);
        return true;
      },
    );
  });

  it("binds production credentials to its project ref and disables fixture seeding", () => {
    assert.deepEqual(
      resolveSystemEnvironment("production", {
        SUPABASE_PRODUCTION_PROJECT_REF: "production-ref",
        SUPABASE_PRODUCTION_URL: "https://production-ref.supabase.co",
        SUPABASE_PRODUCTION_ANON_KEY: "production-anon-key",
        SUPABASE_PRODUCTION_DB_PASSWORD: "production-db-password",
        SUPABASE_PRODUCTION_ACCESS_TOKEN: "production-access-token",
      }),
      {
        name: "production",
        projectRef: "production-ref",
        supabaseUrl: "https://production-ref.supabase.co",
        appUrl: "https://production-ref.supabase.co",
        anonKey: "production-anon-key",
        serviceKey: null,
        dbPassword: "production-db-password",
        accessToken: "production-access-token",
        seedUsers: false,
      },
    );
  });

  it("rejects a production URL that belongs to a different ref", () => {
    assert.throws(
      () => resolveSystemEnvironment("production", {
        SUPABASE_PRODUCTION_PROJECT_REF: "production-ref",
        SUPABASE_PRODUCTION_URL: "https://another-project.supabase.co",
        SUPABASE_PRODUCTION_ANON_KEY: "production-anon-key",
        SUPABASE_PRODUCTION_DB_PASSWORD: "production-db-password",
        SUPABASE_PRODUCTION_ACCESS_TOKEN: "production-access-token",
      }),
      /SUPABASE_PRODUCTION_URL.*SUPABASE_PRODUCTION_PROJECT_REF/i,
    );
  });
});
