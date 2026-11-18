import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveLocalProjectId(configText) {
  const match = String(configText).match(/^\s*project_id\s*=\s*["']([a-z0-9-]+)["']\s*$/im);
  if (!match) throw new Error("supabase/config.toml must declare a valid project_id.");
  return match[1];
}

export function localSeedCommand(projectId) {
  if (!/^[a-z0-9-]+$/i.test(projectId)) throw new Error("The local Supabase project id is invalid.");
  return {
    program: "docker",
    args: [
      "exec", "-i", `supabase_db_${projectId}`,
      "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres",
    ],
  };
}

export async function seedLocalReferenceData(projectRoot) {
  const configPath = path.join(projectRoot, "supabase", "config.toml");
  const seedPath = path.join(projectRoot, "supabase", "seed.sql");
  const [config, seedSql] = await Promise.all([
    readFile(configPath, "utf8"),
    readFile(seedPath, "utf8"),
  ]);
  const { program, args } = localSeedCommand(resolveLocalProjectId(config));

  await new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd: projectRoot, stdio: ["pipe", "inherit", "inherit"] });
    child.once("error", () => reject(new Error("Docker could not run the local reference seed.")));
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`The local reference seed exited ${signal ? `from ${signal}` : `with code ${code}`}.`));
    });
    child.stdin.once("error", () => reject(new Error("Docker could not read the local reference seed.")));
    child.stdin.end(seedSql);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  seedLocalReferenceData(projectRoot).catch((error) => {
    console.error(error instanceof Error ? error.message : "The local reference seed failed.");
    process.exitCode = 1;
  });
}
