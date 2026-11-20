import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, test } from "node:test";
import {
  assertUnambiguousLocalLink,
  buildSystemCommandPlan,
  createSystemChildEnvironment,
  createSystemCommandEnvironment,
  redactSensitiveOutput,
} from "./system.mjs";

function commandNames(plan) {
  return plan.map(({ program, args }) => `${program} ${args.join(" ")}`);
}

describe("buildSystemCommandPlan", () => {
  it("starts the local stack and app without linking or resetting", () => {
    const commands = commandNames(
      buildSystemCommandPlan("local", { name: "local", seedUsers: true }),
    );

    assert.deepEqual(commands, [
      "supabase start",
      "supabase status -o env",
      "supabase migration up --include-all",
      "node scripts/lib/local-reference-seed.mjs",
      "npm run db:seed:users",
      "node scripts/prepare-next-dev.mjs",
      "npm run dev",
    ]);
    assert.equal(commands.some((command) => /\blink\b|\breset\b/.test(command)), false);
  });

  it("targets staging explicitly and seeds only after migrations", () => {
    const commands = commandNames(
      buildSystemCommandPlan("staging", {
        name: "staging",
        projectRef: "staging-ref",
        seedUsers: true,
      }),
    );

    assert.deepEqual(commands, [
      "supabase link --project-ref staging-ref",
      "supabase db push --dry-run --include-all --remote=staging-ref",
      "supabase db push --include-all --include-seed --remote=staging-ref",
      "npm run db:seed:users",
      "node scripts/prepare-next-dev.mjs",
      "npm run dev",
    ]);
    assert.equal(buildSystemCommandPlan("staging", {
      name: "staging",
      projectRef: "staging-ref",
      seedUsers: true,
    })[3].env.CFC_SEED_TARGET, "staging");
  });

  it("targets production explicitly without any fixture seed/reset path", () => {
    const commands = commandNames(
      buildSystemCommandPlan("production", {
        name: "production",
        projectRef: "production-ref",
        seedUsers: false,
      }),
    );

    assert.deepEqual(commands, [
      "supabase link --project-ref production-ref",
      "supabase db push --dry-run --include-all --remote=production-ref",
      "supabase db push --include-all --remote=production-ref",
    ]);
    assert.equal(commands.some((command) => /seed|reset|--yes|build/.test(command)), false);
  });
});

describe("createSystemChildEnvironment", () => {
  it("keeps local service keys out of production builds and removes the staging seed target", () => {
    const env = createSystemChildEnvironment(
      "production",
      {
        name: "production",
        projectRef: "production-ref",
        supabaseUrl: "https://production-ref.supabase.co",
        appUrl: "https://production-ref.supabase.co",
        anonKey: "production-anon",
        serviceKey: null,
        dbPassword: "production-db-password",
        accessToken: "production-access-token",
        seedUsers: false,
      },
      {
        SUPABASE_SECRET_KEY: "local-secret",
        SUPABASE_SERVICE_ROLE_KEY: "local-service-role",
        SUPABASE_STAGING_SECRET_KEY: "staging-secret",
        CFC_SEED_TARGET: "staging",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      },
    );

    assert.equal(env.SUPABASE_URL, "https://production-ref.supabase.co");
    assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, "https://production-ref.supabase.co");
    assert.equal(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "production-anon");
    assert.equal(env.SUPABASE_DB_PASSWORD, "production-db-password");
    assert.equal(env.SUPABASE_SECRET_KEY, undefined);
    assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, undefined);
    assert.equal(env.SUPABASE_STAGING_SECRET_KEY, undefined);
    assert.equal(env.CFC_SEED_TARGET, undefined);
  });

  it("uses staging credentials without inheriting local service keys", () => {
    const env = createSystemChildEnvironment(
      "staging",
      {
        name: "staging",
        projectRef: "staging-ref",
        supabaseUrl: "https://staging-ref.supabase.co",
        appUrl: "https://staging-ref.supabase.co",
        anonKey: "staging-anon",
        serviceKey: "staging-secret",
        dbPassword: "staging-db-password",
        accessToken: "staging-access-token",
        seedUsers: true,
      },
      {
        SUPABASE_SECRET_KEY: "local-secret",
        SUPABASE_SERVICE_ROLE_KEY: "local-service-role",
        SUPABASE_STAGING_SECRET_KEY: "staging-secret",
        SUPABASE_URL: "http://127.0.0.1:54321",
      },
    );

    assert.equal(env.SUPABASE_STAGING_SECRET_KEY, "staging-secret");
    assert.equal(env.SUPABASE_SECRET_KEY, undefined);
    assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, undefined);
    assert.equal(env.CFC_SEED_TARGET, undefined);
  });

  it("uses credentials discovered from local Supabase for local app and seed processes", () => {
    const env = createSystemChildEnvironment(
      "local",
      {
        name: "local",
        projectRef: null,
        supabaseUrl: "http://127.0.0.1:54321",
        appUrl: "http://127.0.0.1:54321",
        anonKey: "generated-local-anon",
        serviceKey: "generated-local-service",
        dbPassword: null,
        accessToken: null,
        seedUsers: true,
      },
      { SUPABASE_SECRET_KEY: "stale-cloud-secret" },
    );

    assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, "http://127.0.0.1:54321");
    assert.equal(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "generated-local-anon");
    assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, "generated-local-service");
    assert.equal(env.SUPABASE_SECRET_KEY, undefined);
    assert.equal(env.CFC_SEED_TARGET, "local");
  });

  it("passes staging service credentials only to the staging seed step", () => {
    const target = {
      name: "staging",
      projectRef: "staging-ref",
      supabaseUrl: "https://staging-ref.supabase.co",
      appUrl: "https://staging-ref.supabase.co",
      anonKey: "staging-anon",
      serviceKey: "staging-secret",
      dbPassword: "staging-db-password",
      accessToken: "staging-access-token",
      seedUsers: true,
    };
    const source = {
      SUPABASE_SECRET_KEY: "local-secret",
      SUPABASE_SERVICE_ROLE_KEY: "local-service-role",
      SUPABASE_STAGING_SECRET_KEY: "staging-secret",
      SUPABASE_STAGING_DB_PASSWORD: "staging-db-password",
      SUPABASE_STAGING_ACCESS_TOKEN: "staging-access-token",
      CFC_STAGING_DEV_PASSWORD: "staging-dev-password",
    };
    const seedEnv = createSystemCommandEnvironment(
      "staging",
      target,
      { program: "npm", args: ["run", "db:seed:users"], env: { CFC_SEED_TARGET: "staging" } },
      source,
    );
    const appEnv = createSystemCommandEnvironment(
      "staging",
      target,
      { program: "npm", args: ["run", "dev"] },
      source,
    );

    assert.equal(seedEnv.SUPABASE_STAGING_SECRET_KEY, "staging-secret");
    assert.equal(seedEnv.CFC_STAGING_DEV_PASSWORD, "staging-dev-password");
    assert.equal(seedEnv.SUPABASE_DB_PASSWORD, undefined);
    assert.equal(seedEnv.SUPABASE_ACCESS_TOKEN, undefined);
    assert.equal(seedEnv.SUPABASE_SECRET_KEY, undefined);
    assert.equal(appEnv.SUPABASE_STAGING_SECRET_KEY, undefined);
    assert.equal(appEnv.CFC_STAGING_DEV_PASSWORD, undefined);
    assert.equal(appEnv.SUPABASE_DB_PASSWORD, undefined);
    assert.equal(appEnv.SUPABASE_ACCESS_TOKEN, undefined);
  });
});

describe("redactSensitiveOutput", () => {
  it("hides Supabase keys, JWTs, credentials in connection strings, and secret env assignments", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsb2NhbCJ9.signature_payload_123";
    const output = [
      `anon key: ${jwt}`,
      `service_role key: ${jwt}`,
      `DB URL: postgres://postgres:private-password@127.0.0.1:54322/postgres`,
      `SUPABASE_SERVICE_ROLE_KEY=${jwt}`,
      '{"SECRET_KEY":"sb_secret_local_very_private","S3_PROTOCOL_ACCESS_KEY_SECRET":"s3-secret-private"}',
    ].join("\n");
    const redacted = redactSensitiveOutput(output);

    assert.equal(redacted.includes(jwt), false);
    assert.equal(redacted.includes("private-password"), false);
    assert.equal(redacted.includes("sb_secret_local_very_private"), false);
    assert.equal(redacted.includes("s3-secret-private"), false);
    assert.match(redacted, /anon key: \[REDACTED\]/i);
    assert.match(redacted, /service_role key: \[REDACTED\]/i);
    assert.match(redacted, /SUPABASE_SERVICE_ROLE_KEY=\[REDACTED\]/);
  });
});

test("assertUnambiguousLocalLink rejects a different linked project ref", async () => {
  const root = await mkdtemp(join(tmpdir(), "cfc-link-"));
  await mkdir(join(root, "supabase", ".temp"), { recursive: true });
  await writeFile(join(root, "supabase", ".temp", "project-ref"), "production-ref\n");
  assert.throws(
    () => assertUnambiguousLocalLink("staging-ref", root),
    /linked to a different project/,
  );
  await rm(root, { recursive: true, force: true });
});

test("assertUnambiguousLocalLink accepts a matching ref or no link", async () => {
  const root = await mkdtemp(join(tmpdir(), "cfc-link-"));
  assert.doesNotThrow(() => assertUnambiguousLocalLink("staging-ref", root));
  await mkdir(join(root, "supabase", ".temp"), { recursive: true });
  await writeFile(join(root, "supabase", ".temp", "project-ref"), "staging-ref\n");
  assert.doesNotThrow(() => assertUnambiguousLocalLink("staging-ref", root));
  await rm(root, { recursive: true, force: true });
});
