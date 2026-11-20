import { access, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PRODUCTION_WEBPACK_CACHES = ["server-production", "client-production"];

/** Remove only Next's production webpack caches; development caches stay live. */
export async function prepareNextBuild(projectRoot = process.cwd()) {
  const webpackCacheRoot = path.resolve(projectRoot, ".next", "cache", "webpack");
  const removed = [];

  for (const cacheName of PRODUCTION_WEBPACK_CACHES) {
    const cachePath = path.resolve(webpackCacheRoot, cacheName);
    const relativePath = path.relative(webpackCacheRoot, cachePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error("Refusing to clean a Next cache outside the project build directory.");
    }

    try {
      await access(cachePath);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }

    await rm(cachePath, { recursive: true, force: true });
    removed.push(cacheName);
  }

  return removed;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  const removed = await prepareNextBuild();
  if (removed.length > 0) {
    process.stdout.write(`Cleared stale Next production cache: ${removed.join(", ")}\n`);
  }
}
