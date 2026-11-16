import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getAdminClient } from "@/server/supabase/admin";
import {
  handleBusinessEventEnvelope,
} from "@/server/notifications/notify";
import type { DomainEventEnvelope } from "@/server/email/events";

/**
 * Point d'entrée HTTP du relais des faits métier.
 *
 * La base de données constate un fait métier (création d'un profil citoyen,
 * écriture d'un événement de dossier) et le signale ici. L'application
 * décide alors du destinataire, puis produit **les deux** signaux de l'événement :
 * la notification in-app et le courriel.
 *
 * C'est le **seul** point d'entrée de ce genre : les actions serveur, qui
 * connaissent le destinataire, appellent directement le même dispatch
 * (`notifyBusinessEvent`). Les deux chemins partagent donc le même
 * catalogue, la même rédaction et les mêmes canaux.
 *
 * Le point d'entrée est protégé par un jeton partagé, lu dans
 * `ref.email_settings` (ligne unique `id = 1`). Si le relais est désactivé —
 * cas par défaut — le point d'entrée refuse toute requête : le métier n'est
 * jamais bloqué, mais personne ne peut déclencher un envoi à la légère.
 *
 * La route **ne lève jamais** : une erreur de signalisation ne doit pas se
 * propager en erreur HTTP fatale pour l'émetteur.
 */

export const dynamic = "force-dynamic";

/** Comparaison à temps constant de deux jetons. */
function tokensMatch(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Relit la configuration du relais. */
async function readSettings(): Promise<{
  isEnabled: boolean;
  token: string | null;
}> {
  try {
    const client = getAdminClient();
    const { data } = await client
      .schema("ref")
      .from("email_settings")
      .select("is_enabled, dispatch_token")
      .eq("id", 1)
      .maybeSingle();

    return {
      isEnabled: Boolean(data?.is_enabled),
      token: (data?.dispatch_token as string | null) ?? null,
    };
  } catch {
    return { isEnabled: false, token: null };
  }
}

export async function POST(request: Request) {
  const settings = await readSettings();

  if (!settings.isEnabled || !settings.token) {
    return NextResponse.json(
      { ok: false, error: "Le relais d'événements est désactivé." },
      { status: 403 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!tokensMatch(settings.token, provided)) {
    return NextResponse.json(
      { ok: false, error: "Jeton de relais invalide." },
      { status: 401 },
    );
  }

  let envelope: DomainEventEnvelope;
  try {
    envelope = (await request.json()) as DomainEventEnvelope;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corps de requête illisible." },
      { status: 400 },
    );
  }

  try {
    const result = await handleBusinessEventEnvelope(envelope ?? {});

    return NextResponse.json({
      ok: true,
      notified: result.notified,
      emailed: result.emailed,
    });
  } catch (caught) {
    // La signalisation ne doit jamais faire échouer l'opération métier : on
    // répond 200 avec l'erreur, le métier est déjà enregistré.
    return NextResponse.json({
      ok: false,
      error: caught instanceof Error ? caught.message : "Erreur du relais d'événements.",
    });
  }
}
