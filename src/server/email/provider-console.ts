import "server-only";

import { hasCapability } from "@/domain/policies/permissions";
import type { SafeEmailProviderSummary } from "@/domain/entities/email-provider";
import { getServerProfile } from "@/server/auth/profile";
import { getEmailEnv, type EmailEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";

export function safeEmailProviderSummary(env: EmailEnv): SafeEmailProviderSummary {
  return {
    provider: env.provider,
    from: env.from,
    configured: env.provider !== "none",
    smtpHost: env.smtp?.host ?? null,
    smtpPort: env.smtp?.port ?? null,
    smtpUsernameConfigured: Boolean(env.smtp?.user),
    smtpPasswordConfigured: Boolean(env.smtp?.password),
    smtpImplicitTls: env.smtp?.secure ?? null,
    tlsCertificateVerification: env.smtpRejectUnauthorized,
    resendApiKeyConfigured: Boolean(env.resendApiKey),
  };
}

export type EmailProviderConsoleResult =
  | { ok: true; provider: SafeEmailProviderSummary; deliveries: { available: boolean; sentRecently: number; failedRecently: number; skippedRecently: number; latestSentAt: string | null; lastAttemptAt: string | null } }
  | { ok: false; error: string };

export async function getEmailProviderConsole(): Promise<EmailProviderConsoleResult> {
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "email:manage", profile.capabilities)) {
    return { ok: false, error: "La gestion de la messagerie est réservée aux personnes habilitées." };
  }

  const provider = safeEmailProviderSummary(getEmailEnv());
  const supabase = await createServerSupabaseClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("email_deliveries")
    .select("status, sent_at, created_at")
    .is("deleted_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = error ? [] : (data ?? []) as Array<{ status: string; sent_at: string | null; created_at: string }>;
  return {
    ok: true,
    provider,
    deliveries: {
      available: !error,
      sentRecently: rows.filter((row) => row.status === "sent").length,
      failedRecently: rows.filter((row) => row.status === "failed").length,
      skippedRecently: rows.filter((row) => row.status === "skipped").length,
      latestSentAt: rows.find((row) => row.status === "sent" && row.sent_at)?.sent_at ?? null,
      lastAttemptAt: rows[0]?.created_at ?? null,
    },
  };
}
