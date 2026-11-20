import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import { prepareNextBuild } from "./prepare-next-build.mjs";

const temporaryRoots = [];

async function projectFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "cfc-next-build-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("prepareNextBuild", () => {
  it("clears stale production webpack entries while keeping development cache intact", async () => {
    const root = await projectFixture();
    const webpackCache = path.join(root, ".next", "cache", "webpack");
    const staleBuildEntry = path.join(webpackCache, "server-production", "index.pack");
    const clientBuildEntry = path.join(webpackCache, "client-production", "index.pack");
    const devEntry = path.join(webpackCache, "server-development", "index.pack");
    await mkdir(path.dirname(staleBuildEntry), { recursive: true });
    await mkdir(path.dirname(clientBuildEntry), { recursive: true });
    await mkdir(path.dirname(devEntry), { recursive: true });
    await writeFile(staleBuildEntry, "./notaire-console.tsx");
    await writeFile(clientBuildEntry, "production cache");
    await writeFile(devEntry, "development cache");

    const removed = await prepareNextBuild(root);

    assert.deepEqual(removed.sort(), ["client-production", "server-production"]);
    await assert.rejects(readFile(staleBuildEntry));
    await assert.rejects(readFile(clientBuildEntry));
    assert.equal(await readFile(devEntry, "utf8"), "development cache");
  });

  it("is safe on a fresh checkout with no Next cache", async () => {
    const root = await projectFixture();
    assert.deepEqual(await prepareNextBuild(root), []);
  });
});
