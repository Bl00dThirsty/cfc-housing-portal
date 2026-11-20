import { NextRequest, NextResponse } from "next/server";

import { getSiteUrl } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";

const CONFIRMATION_ERROR_PATH = "/login?error=email_confirmation";

function isSafePath(value: string | null): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrl();
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL(CONFIRMATION_ERROR_PATH, siteUrl));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth] confirmation de l'adresse e-mail impossible :", error.message);
    return NextResponse.redirect(new URL(CONFIRMATION_ERROR_PATH, siteUrl));
  }

  const requestedPath = request.nextUrl.searchParams.get("next");
  const destination = isSafePath(requestedPath) ? requestedPath : "/onboarding";

  return NextResponse.redirect(new URL(destination, siteUrl));
}
