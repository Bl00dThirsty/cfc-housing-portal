/**
 * Test de bout en bout de la signalisation des événements métier.
 *
 * Ce test n'imite rien : il appelle les **vraies** actions serveur avec une
 * **vraie session** et une **vraie base**, puis relit ce que l'acteur
 * concerné reçoit dans sa boîte de notifications.
 *
 * Il vérifie deux événements importants :
 *
 * 1. une **décision KYC** approuvée par un agent notifie l'emprunteur ;
 * 2. le **dépôt d'une pièce** par l'emprunteur notifie le conseiller.
 *
 * Il s'active avec `CFC_E2E=1` : il suppose un Supabase local démarré
 * (`supabase start`) et les comptes de développement provisionnés
 * (`npm run db:seed:users`).
 */

import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyServerEnv,
  ensureE2eCitizen,
  serviceClient,
  signInWithCookie,
} from "@/server/testing/e2e-accounts";

import { advanceKycAction } from "@/server/actions/kyc";
import { confirmUpload, requestSignedUpload } from "@/server/storage/upload";
import type { UploadActor } from "@/server/storage/types";


const { cookieJar } = vi.hoisted(() => ({ cookieJar: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [...cookieJar.entries()].map(([name, value]) => ({ name, value })),
    get: (name: string) => ({ name, value: cookieJar.get(name) }),
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
  headers: async () => new Headers(),
}));

let admin: SupabaseClient;

/** Ouvre une session réelle et la dépose dans le faux `cookies()`. */
async function signIn(email: string) {
  const session = await signInWithCookie(email);

  cookieJar.clear();
  for (const cookie of session.cookies) cookieJar.set(cookie.name, cookie.value);

  return {
    user: { id: session.userId },
    session: { user: { id: session.userId }, access_token: session.accessToken },
    accessToken: session.accessToken,
  };
}

function pdfBytes(marker: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.4\n% ${marker}\n%%EOF\n`);
}

function toBody(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe.skipIf(!process.env.CFC_E2E)("signalisation des événements métier", () => {
  let dossierId: string;
  let citizenId: string;
  let agentId: string;

  beforeAll(async () => {
    applyServerEnv();

    admin = serviceClient();

    await ensureE2eCitizen(admin, "e2e.notifications@cfc.cm", "Emprunteur de test — notifications");

    const citizen = await signIn("e2e.notifications@cfc.cm");
    citizenId = citizen.user.id;

    const agent = await signIn("admin@cfc.cm");
    agentId = agent.user.id;

    // Le dossier est confié au conseiller : c'est lui qui doit être prévenu
    // d'une pièce déposée.
    const { data: dossier, error } = await admin
      .from("dossiers")
      .insert({
        duc_code: `CFC-NOTIF-${Date.now()}`,
        citizen_id: citizenId,
        owner_user_id: agentId,
        service_code: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
        current_phase: "kyc_savings",
        status: "open",
      })
      .select("id")
      .single();

    if (error) throw error;
    dossierId = dossier.id;

    // L'emprunteur part d'un état KYC allowing l'approbation.
    const { error: kycError } = await admin
      .from("citizen_profiles")
      .update({ kyc_state: "approval_pending" })
      .eq("id", citizenId);
    if (kycError) throw kycError;
  });

  afterAll(async () => {
    if (!dossierId) return;
    await admin.from("dossier_documents").delete().eq("dossier_id", dossierId);
    await admin.from("notifications").delete().eq("dossier_id", dossierId);
    await admin.from("dossier_events").delete().eq("dossier_id", dossierId);
    await admin.from("dossiers").delete().eq("id", dossierId);
    await admin
      .from("citizen_profiles")
      .update({ kyc_state: "identity_capture" })
      .eq("id", citizenId);
  });

  it("notifie l'emprunteur d'une décision KYC et la journalise", async () => {
    // L'agent décide : la session du cookie jar doit être la sienne.
    await signIn("admin@cfc.cm");

    const result = await advanceKycAction({
      citizenId,
      to: "approved",
      note: "Pièces conformes au dossier.",
      // Le dossier est nommé : la décision doit être journalisée **sur ce
      // dossier**, pas sur « celui de l'emprunteur » que le hasard désignerait.
      dossierId,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // La décision est tracée : le journal ne peut pas être absent en silence.
    expect(result.journaled).toBe(true);

    // 1. Le journal porte le fait métier, avec le vocabulaire du catalogue.
    const { data: events } = await admin
      .from("dossier_events")
      .select("event_type, payload, legal_basis")
      .eq("dossier_id", dossierId)
      .eq("event_type", "KYC_APPROVED");

    expect(events).toHaveLength(1);
    expect(events?.[0]?.payload).toMatchObject({ from: "approval_pending", to: "approved" });

    // 2. L'emprunteur reçoit la notification in-app.
    const { data: notifications } = await admin
      .from("notifications")
      .select("recipient_user_id, type, title, body, action_url, read_at")
      .eq("dossier_id", dossierId)
      .eq("recipient_user_id", citizenId);

    expect(notifications).toHaveLength(1);
    expect(notifications?.[0]?.type).toBe("kyc.decision");
    expect(notifications?.[0]?.read_at).toBeNull();
    expect(notifications?.[0]?.title).toMatch(/approuvé/i);
  });

  it("notifie le conseiller du dépôt d'une pièce", async () => {
    // L'emprunteur dépose : la session doit être la sienne.
    const citizen = await signIn("e2e.notifications@cfc.cm");

    const actor: UploadActor = {
      id: citizenId,
      role: "CITIZEN",
      agencyId: null,
      isDiaspora: false,
    };

    const bytes = pdfBytes("piece notifiee");
    const checksum = sha256(bytes);

    const ticket = await requestSignedUpload(actor, {
      dossierId,
      docTypeCode: "CNI_BIOMETRIQUE",
      chemiseCode: "C1",
      filename: "cni-notifiee.pdf",
      mimeType: "application/pdf",
      sizeBytes: bytes.byteLength,
      checksumSha256: checksum,
    });

    const put = await fetch(ticket.signedUrl, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${citizen.accessToken}`,
        "content-type": "application/pdf",
        "x-upsert": "false",
      },
      body: toBody(bytes),
    });
    expect(put.status).toBeLessThan(300);

    const confirmed = await confirmUpload(actor, {
      documentId: ticket.documentId,
      storagePath: ticket.storagePath,
      sizeBytes: bytes.byteLength,
      checksumSha256: checksum,
    });
    expect(confirmed.version).toBe(1);

    // Le conseiller — et lui seul — est prévenu.
    const { data: notifications } = await admin
      .from("notifications")
      .select("recipient_user_id, type, title, body, action_url")
      .eq("dossier_id", dossierId)
      .eq("type", "document.uploaded");

    expect(notifications).toHaveLength(1);
    expect(notifications?.[0]?.recipient_user_id).toBe(agentId);
    expect(notifications?.[0]?.body).toContain("cni-notifiee.pdf");
    expect(notifications?.[0]?.action_url).toBe("/portail-cfc/clients");
  });

  it("n'écrit aucune notification pour un événement hors catalogue", async () => {
    const before = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("dossier_id", dossierId);

    const { notifyBusinessEvent } = await import("@/server/notifications/notify");

    const written = await notifyBusinessEvent({
      eventType: "evenement.inconnu",
      dossierId,
      recipientUserId: citizenId,
    });
    expect(written).toBe(false);

    const after = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("dossier_id", dossierId);

    expect(after.count).toBe(before.count);
  });
});
