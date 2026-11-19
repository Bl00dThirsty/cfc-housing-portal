import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import { prepareNextDev } from "./prepare-next-dev.mjs";

const temporaryRoots = [];

async function projectFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "cfc-next-dev-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("prepareNextDev", () => {
  it("removes only the generated Next output before a dev-server restart", async () => {
    const root = await projectFixture();
    const nextOutput = path.join(root, ".next");
    const staleDevChunk = path.join(nextOutput, "static", "webpack", "old.hot-update.json");
    const unrelatedTemporaryDirectory = path.join(root, ".tmp-build-check", "keep.txt");
    await mkdir(path.dirname(staleDevChunk), { recursive: true });
    await mkdir(path.dirname(unrelatedTemporaryDirectory), { recursive: true });
    await writeFile(staleDevChunk, "stale webpack update");
    await writeFile(unrelatedTemporaryDirectory, "unrelated content");

    assert.equal(await prepareNextDev(root), true);

    await assert.rejects(readFile(staleDevChunk));
    assert.equal(await readFile(unrelatedTemporaryDirectory, "utf8"), "unrelated content");
  });

  it("is safe on a fresh checkout with no generated Next output", async () => {
    const root = await projectFixture();
    assert.equal(await prepareNextDev(root), false);
  });
});
