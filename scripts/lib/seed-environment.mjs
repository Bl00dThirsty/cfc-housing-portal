const DEFAULT_LOCAL_URL = "http://127.0.0.1:54321";

function required(env, key) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${key}.`);
  return value;
}

function requiredOneOf(env, keys) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  throw new Error(`Set one of these environment variables: ${keys.join(" or ")}.`);
}

function assertLoopback(urlValue) {
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("SUPABASE_URL must be a valid local Supabase URL.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname.toLowerCase())
  ) {
    throw new Error("SUPABASE_URL must use a loopback host when seeding local users.");
  }
}

function resolveLocalSeedConfig(env) {
  const supabaseUrl =
    env.SUPABASE_URL?.trim() ?? env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? DEFAULT_LOCAL_URL;
  assertLoopback(supabaseUrl);

  if (
    env.SUPABASE_URL?.trim() &&
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    env.SUPABASE_URL.trim() !== env.NEXT_PUBLIC_SUPABASE_URL.trim()
  ) {
    throw new Error("SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL must target the same local project.");
  }

  return {
    name: "local",
    supabaseUrl,
    serviceKey: requiredLocalKey(env),
    devPassword: required(env, "CFC_DEV_PASSWORD"),
  };
}

function requiredLocalKey(env) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local; system:local loads it automatically.",
    );
  }
  return key;
}

function resolveStagingSeedConfig(env) {
  const stagingRef = required(env, "SUPABASE_STAGING_PROJECT_REF");
  const productionRef = required(env, "SUPABASE_PRODUCTION_PROJECT_REF");
  if (stagingRef === productionRef) {
    throw new Error(
      "SUPABASE_STAGING_PROJECT_REF must differ from SUPABASE_PRODUCTION_PROJECT_REF.",
    );
  }

  const supabaseUrl = required(env, "SUPABASE_STAGING_URL");
  let url;
  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new Error("SUPABASE_STAGING_URL must be a valid URL for the configured staging ref.");
  }

  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== `${stagingRef}.supabase.co`) {
    throw new Error(
      "SUPABASE_STAGING_URL must be the HTTPS URL for SUPABASE_STAGING_PROJECT_REF.",
    );
  }

  return {
    name: "staging",
    supabaseUrl,
    serviceKey: requiredOneOf(env, [
      "SUPABASE_STAGING_SECRET_KEY",
      "SUPABASE_STAGING_SERVICE_ROLE_KEY",
    ]),
    devPassword: required(env, "CFC_STAGING_DEV_PASSWORD"),
  };
}

/** Resolve a demo-user seed target without providing a production seed path. */
export function resolveUserSeedConfig(env = process.env) {
  const target = env.CFC_SEED_TARGET?.trim() || "local";
  if (target === "local") return resolveLocalSeedConfig(env);
  if (target === "staging") return resolveStagingSeedConfig(env);
  if (target === "production") {
    throw new Error("Fixture seeding is disabled in production.");
  }
  throw new Error(`Unknown CFC_SEED_TARGET: ${target}. Use local or staging.`);
}
