/**
 * Test de bout en bout du dépôt documentaire — **pile Supabase locale**.
 *
 * Ce test n'imite rien : il appelle le vrai pipeline (`requestSignedUpload` →
 * `PUT` sur l'URL signée → `confirmUpload`) avec une **vraie session** et un
 * **vrai coffre**. Ce qu'il vérifie est exactement ce que vit le navigateur.
 *
 * Il s'active avec `CFC_E2E=1` : il suppose un Supabase local démarré
 * (`supabase start`) et les comptes de développement provisionnés
 * (`npm run db:seed:users`).
 */

import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ANON_KEY,
  applyServerEnv,
  ensureE2eCitizen,
  serviceClient,
  signInWithCookie,
  SUPABASE_URL,
} from "@/server/testing/e2e-accounts";

import { confirmUpload, requestSignedUpload } from "./upload";
import type { UploadActor } from "./types";


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

/** Corps de requête : un `ArrayBuffer` est accepté par `fetch` sans ambiguïté. */
function toBody(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe.skipIf(!process.env.CFC_E2E)("dépôt documentaire — bout en bout", () => {
  let dossierId: string;
  let citizenId: string;
  let accessToken: string;

  beforeAll(async () => {
    applyServerEnv();

    admin = serviceClient();

    await ensureE2eCitizen(admin, "e2e.storage@cfc.cm", "Emprunteur de test — dépôt");

    const { session, accessToken: token } = await signIn("e2e.storage@cfc.cm");
    citizenId = session.user.id;
    accessToken = token;

    const { data: dossier, error } = await admin
      .from("dossiers")
      .insert({
        duc_code: `CFC-E2E-${Date.now()}`,
        citizen_id: citizenId,
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
    await admin.from("dossier_documents").delete().eq("dossier_id", dossierId);
    await admin.from("dossiers").delete().eq("id", dossierId);
  });

  it("dépose la pièce, l'enregistre, enchaîne les versions et journalise l'événement", async () => {
    const actor: UploadActor = {
      id: citizenId,
      role: "CITIZEN",
      agencyId: null,
      isDiaspora: false,
    };

    const bytes = pdfBytes("piece 1");
    const checksum = sha256(bytes);

    const ticket = await requestSignedUpload(actor, {
      dossierId,
      docTypeCode: "CNI_BIOMETRIQUE",
      chemiseCode: "C1",
      filename: "cni-biometrique.pdf",
      mimeType: "application/pdf",
      sizeBytes: bytes.byteLength,
      checksumSha256: checksum,
    });

    expect(ticket.storagePath).toContain(dossierId);
    expect(ticket.documentId).toBeTruthy();

    // Le dépôt réel : les octets partent par l'URL signée, comme au navigateur.
    // Le navigateur porte le **JWT de l'emprunteur** dans l'en-tête
    // `authorization` : c'est lui qui permet à la RLS de statuer.
    const put = await fetch(ticket.signedUrl, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
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
    expect(confirmed.supersedesId).toBeNull();
    expect(confirmed.checksumSha256).toBe(checksum);

    // La pièce est bien enregistrée, avec son empreinte et son état.
    const { data: row } = await admin
      .from("dossier_documents")
      .select("status, checksum_sha256, version, size_bytes")
      .eq("id", ticket.documentId)
      .single();

    expect(row?.status).toBe("uploaded");
    expect(row?.checksum_sha256).toBe(checksum);
    expect(row?.version).toBe(1);
    expect(Number(row?.size_bytes)).toBe(bytes.byteLength);

    // L'événement est journalisé : la preuve du dépôt existe.
    const { data: events } = await admin
      .from("dossier_events")
      .select("event_type, payload")
      .eq("dossier_id", dossierId);

    const uploadEvent = (events ?? []).find(
      (event) => event.event_type === "document.uploaded",
    );
    expect(uploadEvent).toBeTruthy();
    expect(uploadEvent?.payload).toMatchObject({
      doc_type_code: "CNI_BIOMETRIQUE",
      chemise_code: "C1",
      version: 1,
    });

    // L'avancement du dossier est **tenu par la base** : il suit l'état
    // réel des pièces, sans qu'aucune action applicative l'écrive.
    const { data: dossier } = await admin
      .from("dossiers")
      .select("completion_percent")
      .eq("id", dossierId)
      .single();

    expect(Number(dossier?.completion_percent)).toBeGreaterThan(0);
  });

  it("enchaîne la version : un second dépôt du même type supersède le premier", async () => {
    const actor: UploadActor = {
      id: citizenId,
      role: "CITIZEN",
      agencyId: null,
      isDiaspora: false,
    };

    const { data: existing } = await admin
      .from("dossier_documents")
      .select("id")
      .eq("dossier_id", dossierId)
      .eq("doc_type_code", "CNI_BIOMETRIQUE")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    const bytes = pdfBytes("piece 2");
    const checksum = sha256(bytes);

    const ticket = await requestSignedUpload(actor, {
      dossierId,
      docTypeCode: "CNI_BIOMETRIQUE",
      chemiseCode: "C1",
      filename: "cni-biometrique-v2.pdf",
      mimeType: "application/pdf",
      sizeBytes: bytes.byteLength,
      checksumSha256: checksum,
    });

    const put = await fetch(ticket.signedUrl, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
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

    expect(confirmed.version).toBe(2);
    expect(confirmed.supersedesId).toBe(existing?.id ?? null);
  });

  it("refuse un dépôt dont les octets reçus ne correspondent pas à l'empreinte annoncée", async () => {
    const actor: UploadActor = {
      id: citizenId,
      role: "CITIZEN",
      agencyId: null,
      isDiaspora: false,
    };

    // L'empreinte annoncée est celle de « piece 3 »…
    const announced = pdfBytes("piece 3");
    const announcedChecksum = sha256(announced);

    const ticket = await requestSignedUpload(actor, {
      dossierId,
      docTypeCode: "CNI_BIOMETRIQUE",
      chemiseCode: "C1",
      filename: "cni-biometrique-v3.pdf",
      mimeType: "application/pdf",
      sizeBytes: announced.byteLength,
      checksumSha256: announcedChecksum,
    });

    // …mais ce sont d'autres octets, de **même taille**, qui arrivent.
    const tampered = pdfBytes("piece X");
    expect(tampered.byteLength).toBe(announced.byteLength);

    const put = await fetch(ticket.signedUrl, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/pdf",
        "x-upsert": "false",
      },
      body: toBody(tampered),
    });
    expect(put.status).toBeLessThan(300);

    // Le serveur recalcule l'empreinte sur ce qu'il a reçu : la substitution
    // est refusée.
    await expect(
      confirmUpload(actor, {
        documentId: ticket.documentId,
        storagePath: ticket.storagePath,
        sizeBytes: announced.byteLength,
        checksumSha256: announcedChecksum,
      }),
    ).rejects.toThrow(/empreinte/i);
  });

  it("refuse un type de fichier ou une taille non admis", async () => {
    const actor: UploadActor = {
      id: citizenId,
      role: "CITIZEN",
      agencyId: null,
      isDiaspora: false,
    };

    const bytes = pdfBytes("piece 4");

    await expect(
      requestSignedUpload(actor, {
        dossierId,
        docTypeCode: "CNI_BIOMETRIQUE",
        chemiseCode: "C1",
        filename: "cni.exe",
        mimeType: "application/x-msdownload",
        sizeBytes: bytes.byteLength,
        checksumSha256: sha256(bytes),
      }),
    ).rejects.toThrow();
  });

  it("refuse à un citoyen d'écrire dans le dossier d'un autre", async () => {
    // Un second dossier, appartenant à un **autre** emprunteur.
    //
    // Cet emprunteur est un compte **de test** et non un compte de
    // démonstration : une suite qui échoue en cours de route ne doit pas
    // laisser un dossier parasite dans les données de démonstration.
    await ensureE2eCitizen(admin, "e2e.cloisonnement@cfc.cm", "Emprunteur de test — cloisonnement");

    const otherSession = await signIn("e2e.cloisonnement@cfc.cm");

    const { data: other } = await admin
      .from("dossiers")
      .insert({
        duc_code: `CFC-E2E-OTHER-${Date.now()}`,
        citizen_id: otherSession.user.id,
        service_code: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
        current_phase: "kyc_savings",
        status: "open",
      })
      .select("id")
      .single();

    if (!other) throw new Error("dossier témoin non créé");

    try {
      const { session } = await signIn("e2e.storage@cfc.cm");
      const client = createClient(SUPABASE_URL, ANON_KEY, {
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error } = await client.storage
        .from("dossier-docs")
        .upload(
          `${other.id}/CNI_BIOMETRIQUE/intrusion.pdf`,
          toBody(pdfBytes("intrusion")),
          { contentType: "application/pdf", upsert: false },
        );

      expect(error).toBeTruthy();
    } finally {
      // Le dossier témoin disparaît quoi qu'il arrive : une assertion en
      // échec ne doit pas laisser de dossier derrière elle.
      await admin.from("dossiers").delete().eq("id", other.id);
    }
  });
});
