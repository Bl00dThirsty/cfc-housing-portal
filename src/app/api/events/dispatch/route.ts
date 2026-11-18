import { NextResponse } from "next/server";

import { getAdminClient } from "@/server/supabase/admin";
import { referenceView } from "@/server/queries/reference";
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

/**
 * Lit la configuration du relais.
 *
 * La lecture passe par la **vue publique** : le schéma `ref` n'est pas exposé
 * à l'API de la plateforme. Le jeton, lui, ne sort pas de la base — il est
 * **comparé dedans** (migration 035).
 */
async function readSettings(): Promise<{
  isEnabled: boolean;
  dispatchUrl: string | null;
}> {
  try {
    const client = getAdminClient();
    const { data } = await client
      .from(referenceView("email_settings"))
      .select("id, dispatch_url, is_enabled")
      .eq("id", 1)
      .maybeSingle();

    return {
      isEnabled: Boolean(data?.is_enabled),
      dispatchUrl: (data?.dispatch_url as string | null) ?? null,
    };
  } catch {
    return { isEnabled: false, dispatchUrl: null };
  }
}

/**
 * Le jeton présenté est-il celui du relais ?
 *
 * La comparaison se fait **dans la base** : le jeton n'est jamais lu par
 * l'application, donc jamais exposé par elle.
 */
async function isValidToken(token: string): Promise<boolean> {
  try {
    const client = getAdminClient();
    const { data, error } = await client.rpc("cfc_dispatch_token_valid", {
      p_token: token,
    });

    if (error) {
      console.error("[dispatch] jeton illisible :", error.message);
      return false;
    }

    return data === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const settings = await readSettings();

  if (!settings.isEnabled) {
    return NextResponse.json(
      { ok: false, error: "Le relais d'événements est désactivé." },
      { status: 403 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!(await isValidToken(provided))) {
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
