import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadLocalEnvironment } from "./lib/local-env-loading.mjs";
import { resolveSystemEnvironment } from "./lib/system-environments.mjs";
import {
  ensureLocalDevPassword,
  localEnvironmentFilePath,
  persistLocalSupabaseEnvironment,
  resolveLocalStackCredentials,
} from "./lib/local-supabase-env.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IS_WINDOWS = process.platform === "win32";

export function buildSystemCommandPlan(name, environment) {
  if (name === "local") {
    return [
      { program: "supabase", args: ["start"] },
      { program: "supabase", args: ["status", "-o", "env"] },
      { program: "supabase", args: ["migration", "up", "--include-all"] },
      { program: "node", args: ["scripts/lib/local-reference-seed.mjs"] },
      {
        program: "npm",
        args: ["run", "db:seed:users"],
        env: { CFC_SEED_TARGET: "local" },
      },
      { program: "node", args: ["scripts/prepare-next-dev.mjs"] },
      { program: "npm", args: ["run", "dev"] },
    ];
  }

  if (name !== "staging" && name !== "production") {
    throw new Error(`Unknown system environment: ${name}. Use local, staging, or production.`);
  }

  if (
    environment?.name !== name ||
    typeof environment.projectRef !== "string" ||
    !/^[a-z0-9-]+$/i.test(environment.projectRef)
  ) {
    throw new Error(`A valid ${name} project ref must be resolved before creating its command plan.`);
  }

  const projectRef = environment.projectRef;
  const plan = [
    { program: "supabase", args: ["link", "--project-ref", projectRef] },
    {
      program: "supabase",
      args: ["db", "push", "--dry-run", "--include-all", `--remote=${projectRef}`],
    },
  ];

  if (name === "staging") {
    plan.push({
      program: "supabase",
      args: ["db", "push", "--include-all", "--include-seed", `--remote=${projectRef}`],
    });
    plan.push({
      program: "npm",
      args: ["run", "db:seed:users"],
      env: { CFC_SEED_TARGET: "staging" },
    });
    plan.push({ program: "node", args: ["scripts/prepare-next-dev.mjs"] });
    plan.push({ program: "npm", args: ["run", "dev"] });
  } else {
    plan.push({ program: "supabase", args: ["db", "push", "--include-all", `--remote=${projectRef}`] });
  }

  return plan;
}

export function redactSensitiveOutput(output) {
  return String(output)
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]")
    .replace(/(SUPABASE_[A-Z0-9_]*(?:KEY|TOKEN|PASSWORD)\s*=\s*)[^\s]+/gi, "$1[REDACTED]")
    .replace(/(["']?[A-Z0-9_]*(?:KEY|TOKEN|PASSWORD|SECRET)[A-Z0-9_]*["']?\s*:\s*)("[^"]*"|'[^']*'|[^,}\s]+)/gi, '$1"[REDACTED]"')
    .replace(/((?:anon|service_role|secret|db)\s+(?:key|password)\s*:\s*)[^\r\n]+/gi, "$1[REDACTED]")
    .replace(/(postgres(?:ql)?:\/\/[^:/\s]+:)[^@/\s]+(@)/gi, "$1[REDACTED]$2");
}

function executableFor(program) {
  if (program === "supabase") {
    const localCli = path.join(PROJECT_ROOT, "node_modules", "supabase", "dist", "supabase.js");
    if (!existsSync(localCli)) {
      throw new Error("The pinned local Supabase CLI is missing. Run npm install and retry.");
    }
    return { executable: process.execPath, prefixArgs: [localCli], shell: false };
  }

  if (program === "npm" && process.env.npm_execpath) {
    return {
      executable: process.execPath,
      prefixArgs: [process.env.npm_execpath],
      shell: false,
    };
  }

  if (program === "npm" && IS_WINDOWS) {
    return { executable: "npm.cmd", prefixArgs: [], shell: true };
  }

  return { executable: program, prefixArgs: [], shell: false };
}

function runProcess(program, args, env, { redactOutput = false } = {}) {
  const { executable, prefixArgs, shell } = executableFor(program);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...prefixArgs, ...args], {
      cwd: PROJECT_ROOT,
      env,
      shell,
      stdio: redactOutput ? ["inherit", "pipe", "pipe"] : "inherit",
    });

    const forwardRedacted = (stream, destination) => {
      let pending = "";
      stream.setEncoding("utf8").on("data", (chunk) => {
        pending += chunk;
        const lines = pending.split(/(?<=\n)/);
        pending = lines.pop() ?? "";
        for (const line of lines) destination.write(redactSensitiveOutput(line));
      });
      stream.on("end", () => {
        if (pending) destination.write(redactSensitiveOutput(pending));
      });
    };

    if (redactOutput) {
      forwardRedacted(child.stdout, process.stdout);
      forwardRedacted(child.stderr, process.stderr);
    }

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${program} ${args.join(" ")} exited ${signal ? `from ${signal}` : `with code ${code}`}.`,
        ),
      );
    });
  });
}

function captureProcess(program, args, env) {
  const { executable, prefixArgs, shell } = executableFor(program);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...prefixArgs, ...args], {
      cwd: PROJECT_ROOT,
      env,
      shell,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.resume();
    child.once("error", () => {
      reject(new Error(`${program} could not start.`));
    });
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(
        new Error(
          `${program} ${args.join(" ")} exited ${signal ? `from ${signal}` : `with code ${code}`}.`,
        ),
      );
    });
  });
}

async function ensureDependencies() {
  const supabaseBin = path.join(
    PROJECT_ROOT,
    "node_modules",
    ".bin",
    IS_WINDOWS ? "supabase.cmd" : "supabase",
  );
  const nextBin = path.join(
    PROJECT_ROOT,
    "node_modules",
    ".bin",
    IS_WINDOWS ? "next.cmd" : "next",
  );

  const missingTools = [
    !existsSync(supabaseBin) ? "Supabase CLI" : null,
    !existsSync(nextBin) ? "Next.js" : null,
  ].filter(Boolean);

  if (missingTools.length > 0) {
    console.log(`Checking project tools: ${missingTools.join(" and ")} missing; installing the pinned npm dependencies…`);
    await runProcess("npm", ["install"], process.env);
  }

  if (!existsSync(supabaseBin) || !existsSync(nextBin)) {
    throw new Error("The project-pinned Supabase CLI or Next.js executable is still missing after npm install.");
  }

  const packageJson = JSON.parse(await readFile(path.join(PROJECT_ROOT, "package.json"), "utf8"));
  const expectedCliVersion = packageJson.devDependencies?.supabase;
  const installedCliVersion = (await captureProcess("supabase", ["--version"], {
    ...process.env,
    SUPABASE_TELEMETRY_DISABLED: process.env.SUPABASE_TELEMETRY_DISABLED ?? "1",
  })).trim();
  if (expectedCliVersion && !installedCliVersion.includes(expectedCliVersion)) {
    throw new Error(
      `The project Supabase CLI version does not match package.json (${expectedCliVersion}); reinstall the project dependencies.`,
    );
  }
  console.log(`Using the project-pinned Supabase CLI ${installedCliVersion}.`);
}

export function createSystemChildEnvironment(name, target, sourceEnv = process.env) {
  const env = { ...sourceEnv };
  env.SUPABASE_ENV = name === "local" ? "development" : name;
  env.SUPABASE_URL = target.supabaseUrl;
  env.NEXT_PUBLIC_SUPABASE_URL = target.appUrl;

  if (target.anonKey) {
    env.SUPABASE_ANON_KEY = target.anonKey;
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = target.anonKey;
  }

  if (name === "local") {
    env.CFC_SEED_TARGET = "local";
    delete env.SUPABASE_SECRET_KEY;
    if (target.serviceKey) env.SUPABASE_SERVICE_ROLE_KEY = target.serviceKey;
    if (target.anonKey) env.SUPABASE_ANON_KEY = target.anonKey;
    return env;
  }

  env.SUPABASE_ACCESS_TOKEN = target.accessToken;
  env.SUPABASE_DB_PASSWORD = target.dbPassword;
  delete env.SUPABASE_SECRET_KEY;
  delete env.SUPABASE_SERVICE_ROLE_KEY;

  if (name === "staging") {
    env.SUPABASE_STAGING_SECRET_KEY = target.serviceKey;
    for (const key of Object.keys(env)) {
      if (
        key.startsWith("SUPABASE_PRODUCTION_") &&
        key !== "SUPABASE_PRODUCTION_PROJECT_REF"
      ) {
        delete env[key];
      }
    }
  } else {
    delete env.CFC_SEED_TARGET;
    for (const key of Object.keys(env)) {
      if (
        key.startsWith("SUPABASE_STAGING_") ||
        key.startsWith("SUPABASE_PRODUCTION_") ||
        key === "CFC_STAGING_DEV_PASSWORD"
      ) {
        delete env[key];
      }
    }
  }

  return env;
}

export function createSystemCommandEnvironment(name, target, command, sourceEnv = process.env) {
  const env = { ...createSystemChildEnvironment(name, target, sourceEnv), ...command.env };

  if (command.program === "supabase") {
    if (env.SUPABASE_TELEMETRY_DISABLED === undefined) {
      env.SUPABASE_TELEMETRY_DISABLED = "1";
    }
    delete env.SUPABASE_SECRET_KEY;
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    delete env.SUPABASE_STAGING_SECRET_KEY;
    delete env.SUPABASE_STAGING_SERVICE_ROLE_KEY;
    return env;
  }

  if (name !== "local") {
    delete env.SUPABASE_DB_PASSWORD;
    delete env.SUPABASE_ACCESS_TOKEN;
  }

  if (name === "staging") {
    const isStagingSeed = command.program === "npm" && command.args.includes("db:seed:users");
    if (!isStagingSeed) {
      delete env.SUPABASE_STAGING_SECRET_KEY;
      delete env.SUPABASE_STAGING_SERVICE_ROLE_KEY;
      delete env.CFC_STAGING_DEV_PASSWORD;
      delete env.CFC_SEED_TARGET;
    }
  }

  return env;
}

export function assertUnambiguousLocalLink(targetRef, root = PROJECT_ROOT) {
  const linkFile = path.join(root, "supabase", ".temp", "project-ref");
  if (!existsSync(linkFile)) return;
  const linkedRef = readFileSync(linkFile, "utf8").trim();
  if (!linkedRef || linkedRef === targetRef) return;
  throw new Error(
    `The local Supabase CLI is linked to a different project (${linkedRef}); ` +
      `unlink it before targeting ${targetRef}.`,
  );
}

async function runSystem(name) {
  await ensureDependencies();

  loadLocalEnvironment(PROJECT_ROOT);

  let environment = resolveSystemEnvironment(name, process.env);
  if (name !== "local" && !environment.anonKey) {
    throw new Error(`The public Supabase key is required for ${name}; configure its anon or publishable key.`);
  }
  if (name !== "local") assertUnambiguousLocalLink(environment.projectRef);

  const plan = buildSystemCommandPlan(name, environment);
  console.log(`Preparing the ${name} system for project ${environment.projectRef ?? "local"}.`);

  for (const command of plan) {
    const commandEnv = createSystemCommandEnvironment(name, environment, command);
    if (name === "local" && command.program === "supabase" && command.args[0] === "status") {
      const statusOutput = await captureProcess(command.program, command.args, commandEnv);
      const credentials = resolveLocalStackCredentials(statusOutput);
      const envFilePath = localEnvironmentFilePath(PROJECT_ROOT);
      const devPassword = await ensureLocalDevPassword(process.env, envFilePath);
      const persisted = await persistLocalSupabaseEnvironment(envFilePath, credentials, devPassword);
      Object.assign(process.env, persisted, { CFC_SEED_TARGET: "local" });
      environment = {
        ...environment,
        supabaseUrl: credentials.supabaseUrl,
        appUrl: credentials.supabaseUrl,
        anonKey: credentials.anonKey,
        serviceKey: credentials.serviceKey,
      };
      console.log("Local Supabase credentials were saved to the ignored .env.local file.");
      continue;
    }

    await runProcess(command.program, command.args, commandEnv, {
      redactOutput: name === "local" && command.program === "supabase" && command.args[0] === "start",
    });
  }
}

const requestedEnvironment = process.argv[2];
if (requestedEnvironment) {
  runSystem(requestedEnvironment).catch((error) => {
    console.error(error instanceof Error ? error.message : "System setup failed.");
    process.exitCode = 1;
  });
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.error("Choose a system environment: local, staging, or production.");
  process.exitCode = 1;
}
