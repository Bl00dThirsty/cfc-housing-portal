import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

/** Load the repository's development env files without replacing caller overrides. */
export function loadLocalEnvironment(cwd = process.cwd()) {
  return loadEnvConfig(cwd, true);
}
