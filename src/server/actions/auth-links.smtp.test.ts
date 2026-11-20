import { describe, expect, it } from "vitest";

import { requestMagicLinkAction } from "./auth-links";

/**
 * La messagerie, verifiee **pour de vrai**.
 *
 * Le test est opt-in : il envoie un message et exige un vrai SMTP. Il ne
 * s'execute donc que sur demande :
 *
 * ```
 * CFC_SMTP_CHECK=1 CFC_SMTP_TO=support@livriko.fr npx vitest run src/server/actions/auth-links.smtp.test.ts
 * ```
 *
 * Il est **hors** de la suite ordinaire : un test qui envoie un courriel n'a
 * pas sa place dans une boucle de verification a chaque commit.
 */
describe.skipIf(!process.env.CFC_SMTP_CHECK)("messagerie — envoi reel", () => {
  it("envoie un lien de connexion et le journalise", async () => {
    const to = process.env.CFC_SMTP_TO ?? "support@livriko.fr";

    const result = await requestMagicLinkAction(to);

    expect(result.ok).toBe(true);

    // Le journal des envois porte la preuve : sans lui, un envoi « reel »
    // ne serait qu'une declaration.
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data } = await admin
      .from("email_deliveries")
      .select("template_code, status, recipient_email, error_message")
      .eq("recipient_email", to)
      .eq("template_code", "MAGIC_LINK")
      .order("created_at", { ascending: false })
      .limit(1);

    expect(data?.[0]?.status).toBe("sent");
  }, 30_000);
});
