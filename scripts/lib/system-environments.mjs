const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";

function required(env, key) {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${key}.`);
  }
  return value;
}

function requiredOneOf(env, keys) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  throw new Error(`Set one of these environment variables: ${keys.join(", ")}.`);
}

function parseUrl(value, variableName) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid URL.`);
  }
}

function resolveLocal(env) {
  const configuredUrls = [
    ["SUPABASE_URL", env.SUPABASE_URL],
    ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
  ].filter(([, value]) => value?.trim());

  for (const [variableName, value] of configuredUrls) {
    const url = parseUrl(value.trim(), variableName);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname.toLowerCase())) {
      throw new Error(`${variableName} must use a local loopback URL for the local system.`);
    }
  }

  if (
    configuredUrls.length === 2 &&
    configuredUrls[0][1].trim() !== configuredUrls[1][1].trim()
  ) {
    throw new Error("SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL must point to the same local project.");
  }

  const supabaseUrl = configuredUrls[0]?.[1].trim() ?? LOCAL_SUPABASE_URL;
  const parsedUrl = parseUrl(supabaseUrl, "SUPABASE_URL");
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("SUPABASE_URL must use http or https.");
  }

  return {
    name: "local",
    projectRef: null,
    supabaseUrl,
    appUrl: supabaseUrl,
    anonKey:
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      env.SUPABASE_ANON_KEY ??
      env.SUPABASE_PUBLISHABLE_KEY ??
      null,
    serviceKey: env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? null,
    dbPassword: null,
    accessToken: null,
    seedUsers: true,
  };
}

function resolveStaging(env) {
  const projectRef = required(env, "SUPABASE_STAGING_PROJECT_REF");
  const productionRef = required(env, "SUPABASE_PRODUCTION_PROJECT_REF");
  if (projectRef === productionRef) {
    throw new Error(
      "SUPABASE_STAGING_PROJECT_REF must differ from SUPABASE_PRODUCTION_PROJECT_REF.",
    );
  }

  const supabaseUrl = required(env, "SUPABASE_STAGING_URL");
  const url = parseUrl(supabaseUrl, "SUPABASE_STAGING_URL");
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== `${projectRef}.supabase.co`) {
    throw new Error(
      "SUPABASE_STAGING_URL must be the HTTPS URL for SUPABASE_STAGING_PROJECT_REF.",
    );
  }

  return {
    name: "staging",
    projectRef,
    supabaseUrl,
    appUrl: supabaseUrl,
    anonKey: requiredOneOf(env, [
      "SUPABASE_STAGING_ANON_KEY",
      "SUPABASE_STAGING_PUBLISHABLE_KEY",
    ]),
    serviceKey: requiredOneOf(env, [
      "SUPABASE_STAGING_SECRET_KEY",
      "SUPABASE_STAGING_SERVICE_ROLE_KEY",
    ]),
    dbPassword: required(env, "SUPABASE_STAGING_DB_PASSWORD"),
    accessToken: requiredOneOf(env, ["SUPABASE_STAGING_ACCESS_TOKEN", "SUPABASE_ACCESS_TOKEN"]),
    seedUsers: true,
  };
}

function resolveProduction(env) {
  const projectRef = required(env, "SUPABASE_PRODUCTION_PROJECT_REF");
  const supabaseUrl = required(env, "SUPABASE_PRODUCTION_URL");
  const url = parseUrl(supabaseUrl, "SUPABASE_PRODUCTION_URL");
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== `${projectRef}.supabase.co`) {
    throw new Error(
      "SUPABASE_PRODUCTION_URL must be the HTTPS URL for SUPABASE_PRODUCTION_PROJECT_REF.",
    );
  }

  return {
    name: "production",
    projectRef,
    supabaseUrl,
    appUrl: supabaseUrl,
    anonKey: requiredOneOf(env, [
      "SUPABASE_PRODUCTION_ANON_KEY",
      "SUPABASE_PRODUCTION_PUBLISHABLE_KEY",
    ]),
    serviceKey: null,
    dbPassword: required(env, "SUPABASE_PRODUCTION_DB_PASSWORD"),
    accessToken: requiredOneOf(env, [
      "SUPABASE_PRODUCTION_ACCESS_TOKEN",
      "SUPABASE_ACCESS_TOKEN",
    ]),
    seedUsers: false,
  };
}

/**
 * Resolve a complete target without logging any of the credentials it contains.
 * Cloud targets are intentionally named, explicit, and independently guarded.
 */
export function resolveSystemEnvironment(name, env = process.env) {
  if (name === "local") return resolveLocal(env);
  if (name === "staging") return resolveStaging(env);
  if (name === "production") return resolveProduction(env);
  throw new Error(`Unknown system environment: ${name}.`);
}
