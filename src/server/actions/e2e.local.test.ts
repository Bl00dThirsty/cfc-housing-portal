/**
 * Test de bout en bout du fil de support — **pile Supabase locale**.
 *
 * Ce test n'imite rien : il appelle les **vraies** actions serveur avec une
 * **vraie session**, dépose une pièce jointe dans le vrai coffre, puis relit
 * ce qui a été écrit et ce qui a été notifié.
 *
 * Il s'active avec `CFC_E2E=1` : il suppose un Supabase local démarré
 * (`supabase start`) et les comptes de développement provisionnés
 * (`npm run db:seed:users`).
 */

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyServerEnv,
  ensureE2eCitizen,
  serviceClient,
  signInWithCookie,
} from "@/server/testing/e2e-accounts";

import {
  listSupportMessagesAction,
  requestSupportUploadAction,
  sendSupportMessageAction,
} from "@/server/actions/support";


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

describe.skipIf(!process.env.CFC_E2E)("fil de support — bout en bout", () => {
  let dossierId: string;
  let citizenId: string;
  let agentId: string;

  beforeAll(async () => {
    applyServerEnv();

    admin = serviceClient();

    await ensureE2eCitizen(admin, "e2e.support@cfc.cm", "Emprunteur de test — fil de support");

    const citizen = await signIn("e2e.support@cfc.cm");
    citizenId = citizen.user.id;

    const agent = await signIn("admin@cfc.cm");
    agentId = agent.user.id;

    const { data: dossier, error } = await admin
      .from("dossiers")
      .insert({
        duc_code: `CFC-CHAT-${Date.now()}`,
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
  });

  afterAll(async () => {
    if (!dossierId) return;
    await admin.from("support_messages").delete().eq("dossier_id", dossierId);
    await admin.from("notifications").delete().eq("dossier_id", dossierId);
    await admin.from("dossiers").delete().eq("id", dossierId);
    await admin.storage.from("support-attachments").remove(
      (await admin.storage
        .from("support-attachments")
        .list(dossierId, { limit: 100 })).data?.map((object) => `${dossierId}/${object.name}`) ?? [],
    );
  });

  it("dépose une pièce jointe, l'attache au message et notifie l'interlocuteur", async () => {
    await signIn("e2e.support@cfc.cm");

    const ticket = await requestSupportUploadAction({
      dossierId,
      filename: "attestation.pdf",
      mimeType: "application/pdf",
      sizeBytes: 12,
    });

    expect(ticket.ok).toBe(true);
    if (!ticket.ok) return;

    const put = await fetch(ticket.data.signedUrl, {
      method: "PUT",
      headers: { "content-type": "application/pdf", "x-upsert": "false" },
      body: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    });
    expect(put.status).toBeLessThan(300);

    const sent = await sendSupportMessageAction({
      roomName: `dossier:${dossierId}`,
      dossierId,
      content: "Voici mon attestation de conformity.",
      stepCode: "CRD-01",
      attachment: {
        path: ticket.data.path,
        name: ticket.data.name,
        mime: "application/pdf",
        size: 12,
      },
    });

    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    // 1. La ligne porte la pièce jointe et l'ancrage dans le parcours.
    const { data: row } = await admin
      .from("support_messages")
      .select("content, attachment_path, attachment_name, attachment_mime, attachment_size, step_code, reply_to_id")
      .eq("id", sent.data.id)
      .single();

    expect(row?.attachment_path).toBe(ticket.data.path);
    expect(row?.attachment_name).toBe(ticket.data.name);
    expect(row?.attachment_mime).toBe("application/pdf");
    expect(Number(row?.attachment_size)).toBe(12);
    expect(row?.step_code).toBe("CRD-01");

    // 2. L'objet est bien dans le coffre, au bon chemin.
    const { data: stored } = await admin.storage
      .from("support-attachments")
      .list(dossierId);
    expect(stored?.some((object) => object.name.includes("attestation"))).toBe(true);

    // 3. Le conseiller est notifié.
    const { data: notifications } = await admin
      .from("notifications")
      .select("recipient_user_id, type, title")
      .eq("dossier_id", dossierId)
      .eq("type", "support.message");

    expect(notifications).toHaveLength(1);
    expect(notifications?.[0]?.recipient_user_id).toBe(agentId);
  });

  it("enregistre une réponse et la restitue dans le fil", async () => {    // L'agent répond.
    await signIn("admin@cfc.cm");

    const { data: first } = await admin
      .from("support_messages")
      .select("id")
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const reply = await sendSupportMessageAction({
      roomName: `dossier:${dossierId}`,
      dossierId,
      content: "Bien reçu, je vérifie ce document.",
      replyToId: first?.id ?? null,
      stepCode: "CRD-02",
    });

    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.data.reply_to_id).toBe(first?.id ?? null);

    // Le fil se relit avec la réponse.
    await signIn("e2e.support@cfc.cm");
    const thread = await listSupportMessagesAction({ roomName: `dossier:${dossierId}` });

    expect(thread.ok).toBe(true);
    if (!thread.ok) return;
    expect(thread.data).toHaveLength(2);
    expect(thread.data[1].reply_to_id).toBe(first?.id ?? null);
    expect(thread.data[0].attachment?.mime).toBe("application/pdf");
  });

  it("ancrer un message sur une pièce du dossier", async () => {
    await signIn("e2e.support@cfc.cm");

    // Une pièce du dossier : c'est elle qui a une identité, et donc une
    // conversation qui peut y être rattachée.
    const { data: document, error: documentError } = await admin
      .from("dossier_documents")
      .insert({
        dossier_id: dossierId,
        doc_type_code: "CNI_BIOMETRIQUE",
        chemise_code: "C1",
        storage_path: `${dossierId}/CNI_BIOMETRIQUE/ancrage.pdf`,
        original_filename: "cni-ancrage.pdf",
        mime_type: "application/pdf",
        size_bytes: 128,
        checksum_sha256: "a".repeat(64),
        status: "uploaded",
        uploaded_by: citizenId,
      })
      .select("id")
      .single();

    expect(documentError).toBeNull();
    expect(document?.id).toBeTruthy();
    if (!document) return;

    const anchored = await sendSupportMessageAction({
      roomName: `dossier:${dossierId}`,
      dossierId,
      content: "Une question sur cette pièce.",
      documentId: document.id,
    });

    expect(anchored.ok).toBe(true);
    if (!anchored.ok) return;
    expect(anchored.data.document_id).toBe(document.id);

    // L'ancrage est relu dans le fil.
    const thread = await listSupportMessagesAction({ roomName: `dossier:${dossierId}` });
    expect(thread.ok).toBe(true);
    if (!thread.ok) return;

    const found = thread.data.find((message) => message.id === anchored.data.id);
    expect(found?.document_id).toBe(document.id);
  });

  it("refuse une pièce jointe d'un type non admis", async () => {
    await signIn("e2e.support@cfc.cm");

    const ticket = await requestSupportUploadAction({
      dossierId,
      filename: "script.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 10,
    });

    expect(ticket.ok).toBe(false);
  });

  it("refuse un message sans texte ni pièce jointe", async () => {
    await signIn("e2e.support@cfc.cm");

    const empty = await sendSupportMessageAction({
      roomName: `dossier:${dossierId}`,
      dossierId,
      content: "   ",
    });

    expect(empty.ok).toBe(false);
  });

  it("refuse un ancrage sur une étape de parcours inconnue", async () => {
    await signIn("e2e.support@cfc.cm");

    const anchored = await sendSupportMessageAction({
      roomName: `dossier:${dossierId}`,
      dossierId,
      content: "Message ancré sur une étape qui n'existe pas.",
      stepCode: "XXX-99",
    });

    expect(anchored.ok).toBe(false);
  });
});
