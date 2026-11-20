// scripts/check-migration-parity.mjs
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MIGRATIONS_DIR = path.join(PROJECT_ROOT, "supabase", "migrations");

export function parseMigrationVersions(filenames) {
  return filenames
    .filter((name) => name.endsWith(".sql"))
    .map((name) => name.slice(0, -4).match(/^(\d{14})_/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
}

export function findPendingMigrations(localVersions, appliedVersions) {
  const applied = new Set(appliedVersions);
  return localVersions.filter((version) => !applied.has(version));
}

export async function readLocalMigrationVersions(dir = MIGRATIONS_DIR) {
  return parseMigrationVersions(await readdir(dir));
}

export function formatParityReport(localVersions, appliedVersions) {
  const pending = findPendingMigrations(localVersions, appliedVersions);
  return [
    `Local migrations: ${localVersions.length}`,
    `Applied migrations: ${appliedVersions.length}`,
    `Pending: ${pending.length}`,
    ...pending.map((version) => `  - ${version}`),
  ].join("\n");
}

async function main() {
  const appliedPath = process.argv[2];
  if (!appliedPath) {
    console.error("Usage: node scripts/check-migration-parity.mjs <applied-versions.json>");
    process.exitCode = 1;
    return;
  }
  const { readFile } = await import("node:fs/promises");
  const applied = JSON.parse(await readFile(appliedPath, "utf8"));
  if (!Array.isArray(applied) || !applied.every((v) => typeof v === "string")) {
    throw new Error("applied-versions.json must be an array of version strings");
  }
  console.log(formatParityReport(await readLocalMigrationVersions(), applied));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Parity check failed.");
    process.exitCode = 1;
  });
}
