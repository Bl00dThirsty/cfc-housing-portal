import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseEnvValue(value) {
  const trimmed = value.trim().replace(/;\s*$/, "");
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/'\\''/g, "'");
  }
  return trimmed;
}

export function parseSupabaseStatusEnv(output) {
  const values = {};
  for (const line of String(output).split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) values[match[1]] = parseEnvValue(match[2]);
  }
  return values;
}

function requiredAlias(values, keys) {
  for (const key of keys) {
    const value = values[key]?.trim();
    if (value) return value;
  }
  throw new Error(`Supabase local status output is missing ${keys.join(" or ")}.`);
}

export function resolveLocalStackCredentials(statusOutput) {
  const values = parseSupabaseStatusEnv(statusOutput);
  const supabaseUrl = requiredAlias(values, ["API_URL", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error("The Supabase CLI returned an invalid local API URL.");
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname.toLowerCase())
  ) {
    throw new Error("The Supabase CLI API URL must use a loopback host for local setup.");
  }

  return {
    supabaseUrl,
    anonKey: requiredAlias(values, ["ANON_KEY", "SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY"]),
    serviceKey: requiredAlias(values, [
      "SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY",
    ]),
  };
}

export function mergeEnvFileValues(contents, values) {
  const keys = Object.keys(values);
  const keySet = new Set(keys);
  const lines = String(contents ?? "")
    .split(/\r?\n/)
    .filter((line) => {
      const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/);
      return !match || !keySet.has(match[1]);
    });

  while (lines.at(-1) === "") lines.pop();
  for (const key of keys) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      throw new Error("Cannot write an invalid environment variable name.");
    }
    lines.push(`${key}=${JSON.stringify(String(values[key]))}`);
  }
  return `${lines.join("\n")}\n`;
}

export async function persistLocalSupabaseEnvironment(envFilePath, credentials, devPassword) {
  const values = {
    SUPABASE_URL: credentials.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_URL: credentials.supabaseUrl,
    SUPABASE_ANON_KEY: credentials.anonKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: credentials.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: credentials.serviceKey,
    CFC_DEV_PASSWORD: devPassword,
  };
  let existing = "";
  try {
    existing = await readFile(envFilePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(envFilePath, mergeEnvFileValues(existing, values), {
    encoding: "utf8",
    mode: 0o600,
  });
  return values;
}

export async function ensureLocalDevPassword(env, envFilePath) {
  const configured = env.CFC_DEV_PASSWORD?.trim();
  if (configured) return configured;

  const password = randomBytes(32).toString("base64url");
  let existing = "";
  try {
    existing = await readFile(envFilePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(
    envFilePath,
    mergeEnvFileValues(existing, { CFC_DEV_PASSWORD: password }),
    { encoding: "utf8", mode: 0o600 },
  );
  return password;
}

export function localEnvironmentFilePath(projectRoot) {
  return path.join(projectRoot, ".env.local");
}
