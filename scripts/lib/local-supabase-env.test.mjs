import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import {
  ensureLocalDevPassword,
  mergeEnvFileValues,
  resolveLocalStackCredentials,
} from "./local-supabase-env.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true }),
  ));
});

describe("resolveLocalStackCredentials", () => {
  it("reads local credentials from Supabase CLI env output", () => {
    assert.deepEqual(
      resolveLocalStackCredentials([
        'export API_URL="http://127.0.0.1:54321"',
        'export ANON_KEY="local-anon-key"',
        'export SERVICE_ROLE_KEY="local-service-key"',
      ].join("\n")),
      {
        supabaseUrl: "http://127.0.0.1:54321",
        anonKey: "local-anon-key",
        serviceKey: "local-service-key",
      },
    );
  });

  it("accepts loopback IPv6 and Supabase-prefixed variable aliases", () => {
    assert.deepEqual(
      resolveLocalStackCredentials([
        'SUPABASE_URL="http://[::1]:54321"',
        'SUPABASE_ANON_KEY="local-anon-key"',
        'SUPABASE_SERVICE_ROLE_KEY="local-service-key"',
      ].join("\n")),
      {
        supabaseUrl: "http://[::1]:54321",
        anonKey: "local-anon-key",
        serviceKey: "local-service-key",
      },
    );
  });

  it("rejects hosted URLs without exposing CLI output secrets", () => {
    assert.throws(
      () => resolveLocalStackCredentials([
        'API_URL="https://production.supabase.co"',
        'ANON_KEY="sensitive-anon"',
        'SERVICE_ROLE_KEY="sensitive-service"',
      ].join("\n")),
      (error) => {
        assert.match(error.message, /loopback/i);
        assert.doesNotMatch(error.message, /sensitive-/);
        return true;
      },
    );
  });

  it("reports missing CLI fields without printing the values that were present", () => {
    assert.throws(
      () => resolveLocalStackCredentials([
        'API_URL="http://127.0.0.1:54321"',
        'ANON_KEY="local-anon-key"',
        'OTHER_VALUE="private-value"',
      ].join("\n")),
      (error) => {
        assert.match(error.message, /SERVICE_ROLE_KEY/);
        assert.doesNotMatch(error.message, /local-anon-key|private-value/);
        return true;
      },
    );
  });
});

describe("mergeEnvFileValues", () => {
  it("replaces selected assignments while preserving comments and unrelated values", () => {
    assert.equal(
      mergeEnvFileValues(
        "# retained\nNEXT_PUBLIC_SUPABASE_URL=old\nOTHER_SETTING=keep\nSUPABASE_SERVICE_ROLE_KEY=old-secret\n",
        {
          NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
          SUPABASE_SERVICE_ROLE_KEY: "new-secret",
        },
      ),
      "# retained\nOTHER_SETTING=keep\nNEXT_PUBLIC_SUPABASE_URL=\"http://127.0.0.1:54321\"\nSUPABASE_SERVICE_ROLE_KEY=\"new-secret\"\n",
    );
  });
});

describe("ensureLocalDevPassword", () => {
  it("generates and persists a private local password when none is configured", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cfc-seed-env-"));
    temporaryDirectories.push(directory);
    const envFile = path.join(directory, ".env.local");
    const password = await ensureLocalDevPassword({}, envFile);

    assert.ok(password.length >= 40);
    assert.match(await readFile(envFile, "utf8"), new RegExp(`^CFC_DEV_PASSWORD="${password}"$`, "m"));
  });

  it("keeps a configured local password stable and does not rewrite the file", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cfc-seed-env-"));
    temporaryDirectories.push(directory);
    const envFile = path.join(directory, ".env.local");
    const configured = "developer-supplied-password";

    assert.equal(await ensureLocalDevPassword({ CFC_DEV_PASSWORD: configured }, envFile), configured);
    await assert.rejects(readFile(envFile, "utf8"), { code: "ENOENT" });
  });
});
