import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";

describe("Supabase Auth template paths", () => {
  it("resolves the password-change notification template from the supabase directory", async () => {
    const config = await readFile("supabase/config.toml", "utf8");
    const section = config.match(
      /\[auth\.email\.notification\.password_changed\]([\s\S]*?)(?=\n\[|$)/,
    )?.[1];
    const contentPath = section?.match(/^content_path\s*=\s*"([^"]+)"/m)?.[1];

    assert.ok(contentPath, "password-change notification must define content_path");
    assert.equal(
      path.normalize(path.join("supabase", contentPath)),
      path.normalize(path.join("supabase", "templates", "password_changed.html")),
    );
    await assert.doesNotReject(
      readFile(path.join("supabase", contentPath), "utf8"),
    );
  });

  it("uses only configuration keys recognized by the pinned CLI for auth and storage", async () => {
    const config = await readFile("supabase/config.toml", "utf8");
    const emailSection = config.match(/\[auth\.email\]([\s\S]*?)(?=\n\[|$)/)?.[1];
    const storageSection = config.match(/\[storage\]([\s\S]*?)(?=\n\[|$)/)?.[1];

    assert.match(emailSection ?? "", /^enabled\s*=\s*true\s*$/m);
    assert.doesNotMatch(emailSection ?? "", /^enable_signup\s*=/m);
    assert.doesNotMatch(storageSection ?? "", /^image\s*=/m);
  });
});
