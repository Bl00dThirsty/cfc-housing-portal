import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("local environment loading", () => {
  it("preserves environment values explicitly supplied by the caller", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        [
          'import assert from "node:assert/strict";',
          'import { loadLocalEnvironment } from "./scripts/lib/local-env-loading.mjs";',
          "loadLocalEnvironment(process.cwd());",
          'assert.equal(process.env.SUPABASE_URL, "https://provided.invalid");',
        ].join("\n"),
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, SUPABASE_URL: "https://provided.invalid" },
      },
    );

    assert.equal(result.status, 0, result.stderr);
  });
});
