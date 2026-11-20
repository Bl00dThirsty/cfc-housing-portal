import "server-only";

import { createHash } from "node:crypto";

import {
  REGISTER_LABELS,
  type RegisterKey,
} from "@/domain/entities/registers";
import { getAdminClient } from "@/server/supabase/admin";
import { notify } from "./notify";

export interface RegisterEventInput {
  registerKey: RegisterKey;
  recordId: string;
  label: string;
  operation: "create" | "update" | "delete";
}

export interface RegisterNotificationPayload {
  title: string;
  body: string | null;
  actionUrl: string | null;
  dedupeKey: string;
}

/**
 * Clé d'idempotence opaque : elle garde l'unicité par fiche sans exposer
 * l'identifiant ni le libellé aux rôles dépourvus de `register:read`.
 */
function opaqueIdentity(input: RegisterEventInput): string {
  return createHash("sha256")
    .update(`${input.recordId}:${input.label}`)
    .digest("hex")
    .slice(0, 24);
}

export function buildRegisterNotificationPayload(
  input: RegisterEventInput & { canReadRegister: boolean },
): RegisterNotificationPayload {
  const title = `Registre — ${REGISTER_LABELS[input.registerKey].title}`;
  const verb = input.operation === "delete" ? "retirée" : input.operation === "update" ? "mise à jour" : "enregistrée";
  return {
    title,
    body: input.canReadRegister
      ? `Une fiche a été ${verb} : ${input.label || input.recordId}.`
      : "Une fiche a été modifiée dans un registre CFC.",
    actionUrl: input.canReadRegister
      ? `/portail-cfc/actors/agency/${input.registerKey}/${input.recordId}`
      : null,
    dedupeKey: input.canReadRegister
      ? `register:${input.registerKey}:${input.recordId}:${input.operation}:${input.label}`
      : `register:${input.registerKey}:${input.operation}:${opaqueIdentity(input)}`,
  };
}

interface ActorRow {
  id: string;
  role: string | null;
  has_register_read: boolean | null;
}

/**
 * Notifie chaque actif. Le service-role est nécessaire : la RLS de
 * `notifications` ne doit pas décider du destinataire d'une notification
 * adressée à autrui. Les capacités sont lues dans le référentiel persistant,
 * jamais dans les métadonnées JWT.
 */
export async function notifyRegisterEvent(
  input: RegisterEventInput,
): Promise<{ notified: number; emailed: number }> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.rpc("cfc_active_notification_recipients");
    if (error || !data) {
      console.error("[registers] destinataires illisibles :", error?.message ?? "aucune donnée");
      return { notified: 0, emailed: 0 };
    }

    let notified = 0;
    let emailed = 0;
    for (const row of (data as ActorRow[])) {
      const payload = buildRegisterNotificationPayload({
        ...input,
        canReadRegister: Boolean(row.has_register_read),
      });
      const result = await notify({
        recipientUserId: row.id,
        type: "dossier.updated",
        title: payload.title,
        body: payload.body,
        actionUrl: payload.actionUrl,
        dedupeKey: `${payload.dedupeKey}:${row.id}`,
        email: null,
      });
      if (result.notified) notified += 1;
      if (result.emailed) emailed += 1;
    }
    return { notified, emailed };
  } catch (caught) {
    console.error("[registers] diffusion impossible :", caught);
    return { notified: 0, emailed: 0 };
  }
}
