const AUTH_LINK_TEMPLATES = new Set(["MAGIC_LINK", "RESET_PASSWORD", "STAFF_INVITATION", "BORROWER_INVITATION"]);
const ALWAYS_SENSITIVE_KEYS = /^(password|secret|token|token_hash|access_token|refresh_token)$/i;
const AUTH_LINK_KEYS = /^(lien|link|action_link|confirmation_url|recovery_url)$/i;

function redact(value: unknown, redactLinks: boolean): unknown {
  if (Array.isArray(value)) return value.map((item) => redact(item, redactLinks));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !ALWAYS_SENSITIVE_KEYS.test(key) && !(redactLinks && AUTH_LINK_KEYS.test(key)))
      .map(([key, item]) => [key, redact(item, redactLinks)]),
  );
}

/** Removes reusable credentials and one-time Auth links from delivery logs. */
export function safeEmailDeliveryPayload(
  templateCode: string,
  variables: Record<string, unknown>,
): Record<string, unknown> {
  const redacted = redact(variables, AUTH_LINK_TEMPLATES.has(templateCode.trim().toUpperCase()));
  return redacted as Record<string, unknown>;
}
