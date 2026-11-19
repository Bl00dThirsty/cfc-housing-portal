import { lstat, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Remove Next's generated output before a dev-server launch.
 *
 * Branch changes can leave client/server Webpack manifests and HMR chunks out
 * of sync. `.next` is generated output, so rebuilding it is safer than asking
 * developers to diagnose a stale module graph by hand.
 */
export async function prepareNextDev(projectRoot = process.cwd()) {
  const root = await realpath(path.resolve(projectRoot));
  const nextOutput = path.join(root, ".next");
  const relativeOutput = path.relative(root, nextOutput);

  if (
    relativeOutput !== ".next" ||
    path.isAbsolute(relativeOutput) ||
    relativeOutput.startsWith(`..${path.sep}`)
  ) {
    throw new Error("Refusing to clean Next output outside the project root.");
  }

  let outputInfo;
  try {
    outputInfo = await lstat(nextOutput);
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }

  if (outputInfo.isSymbolicLink()) {
    throw new Error("Refusing to clean a symbolic link used as the Next output directory.");
  }

  const resolvedOutput = await realpath(nextOutput);
  const resolvedRelativeOutput = path.relative(root, resolvedOutput);
  if (
    resolvedRelativeOutput !== ".next" ||
    path.isAbsolute(resolvedRelativeOutput)
  ) {
    throw new Error("Refusing to clean Next output outside the project root.");
  }

  await rm(resolvedOutput, { recursive: true, force: true });
  return true;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  const removed = await prepareNextDev();
  if (removed) process.stdout.write("Cleared stale Next development output.\n");
}
