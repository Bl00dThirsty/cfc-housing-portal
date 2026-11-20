import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

/** Load the repository's development env files without replacing caller overrides. */
export function loadLocalEnvironment(cwd = process.cwd()) {
  return loadEnvConfig(cwd, true);
}
