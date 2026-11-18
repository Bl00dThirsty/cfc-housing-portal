import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getSiteUrl } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";

/**
 * La confirmation d'un lien d'authentification.
 *
 * Le lien envoyé par e-mail porte un **jeton**, pas une session : c'est ce
 * qui permet de l'envoyer par la messagerie du CFC plutôt que par celle de
 * la plateforme, dont le quota sature. La route vérifie le jeton **sur
 * place** et ouvre la session.
 *
 * Aucune URL de retour n'est déclarée sur la plateforme : le destinataire
 * est toujours cette route. C'est ce qui rend le parcours identique en
 * local et en production.
 */

const ERROR_PATH = "/login?error=email_confirmation";

/** Les types de jeton que la plateforme connaît. */
const OTP_TYPES: readonly EmailOtpType[] = ["magiclink", "signup", "recovery", "email"];

function isSafePath(value: string | null): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrl();
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const requestedType = request.nextUrl.searchParams.get("type");
  const type = OTP_TYPES.includes(requestedType as EmailOtpType)
    ? (requestedType as EmailOtpType)
    : "magiclink";

  if (!tokenHash) {
    return NextResponse.redirect(new URL(ERROR_PATH, siteUrl));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    console.error("[auth] jeton refusé :", error.message);
    return NextResponse.redirect(new URL(ERROR_PATH, siteUrl));
  }

  const requestedPath = request.nextUrl.searchParams.get("next");
  const destination = isSafePath(requestedPath) ? requestedPath : "/portail-client";

  return NextResponse.redirect(new URL(destination, siteUrl));
}
