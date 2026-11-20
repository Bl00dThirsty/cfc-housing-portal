"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { sendTemplatedEmail, type SendEmailResult } from "@/server/email/send";
import { getAdminClient } from "@/server/supabase/admin";

const testEmailSchema = z.object({ email: z.string().trim().toLowerCase().email().max(255) });

export type ProviderTestResult =
  | { ok: true; status: SendEmailResult["status"]; message: string }
  | { ok: false; error: string };

export async function sendEmailProviderTestAction(input: unknown): Promise<ProviderTestResult> {
  const parsed = testEmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Saisissez une adresse e-mail de test valide." };
  const profile = await getServerProfile();
  if (!profile || !hasCapability(profile.role, "email:manage", profile.capabilities) || !hasCapability(profile.role, "email:send", profile.capabilities)) {
    return { ok: false, error: "Vous n’êtes pas habilité à tester le relais de messagerie." };
  }

  const admin = getAdminClient();
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: recent, error: lookupError } = await admin
    .from("email_deliveries")
    .select("id")
    .eq("template_code", "SYSTEM_TEST")
    .eq("created_by", profile.actorId)
    .gte("created_at", cutoff)
    .limit(1)
    .maybeSingle();
  if (lookupError) return { ok: false, error: "Le test n’a pas pu être autorisé. Réessayez après vérification du journal." };
  if (recent) return { ok: false, error: "Un test a déjà été demandé dans la dernière minute. Attendez avant de relancer." };

  const result = await sendTemplatedEmail({
    templateCode: "SYSTEM_TEST",
    to: parsed.data.email,
    variables: {},
    idempotencyKey: `provider-test:${profile.actorId}:${randomUUID()}`,
    actorId: profile.actorId,
  });
  return {
    ok: true,
    status: result.status,
    message: result.status === "sent"
      ? "Le relais a accepté le message de test. Consultez le journal pour son statut."
      : `Le test a été journalisé avec le statut « ${result.status} ». Consultez le journal des envois pour le diagnostic.`,
  };
}
