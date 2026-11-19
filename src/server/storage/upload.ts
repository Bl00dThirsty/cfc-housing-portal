/**
 * Chaîne de dépôt d'un document — **côté serveur**.
 *
 * Module **strictement serveur** : il lit les cookies de la requête
 * (`next/headers`) et joint le client `service_role`. Il n'est atteignable
 * que par `@/server/storage/actions.ts`, qui est une Server Action (« use
 * server ») : le paquet du navigateur n'en contient jamais le corps.
 *
 * Le serveur est la **porte** : il re-vérifie la capacité de l'appelant, son
 * périmètre sur le dossier, la chemise visée et la validité du fichier avant
 * d'écrire quoi que ce soit. Les politiques RLS restent le **filet** : les
 * écritures passent par le client authentifié de la requête, jamais par le
 * rôle de service.
 *
 * Déroulé d'un dépôt :
 *
 * 1. `requestSignedUpload` — autorise, valide, inscrit la pièce en attente
 *    (`awaiting_upload`) et délivre une **URL signée** de dépôt ;
 * 2. le navigateur envoie les octets **directement** au coffre (le serveur
 *    ne relaie jamais le corps du fichier) ;
 * 3. `confirmUpload` — vérifie que l'objet existe et que sa taille
 *    correspond, bascule la pièce en `uploaded`, enchaîne les versions et
 *    écrit l'événement de journal.
 */

import { CHEMISE_CODES, canWriteChemise, type ChemiseCode } from "@/domain/policies/chemise";
import { hasCapability } from "@/domain/policies/permissions";
import { isInScope, resolveScope } from "@/domain/policies/scope";
import { getAdminClient } from "@/server/supabase/admin";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { referenceView } from "@/server/queries/reference";
import { notify, notifyBusinessEvent } from "@/server/notifications/notify";
import { checksumBlob, isValidChecksum } from "./checksum";
import { buildStoragePath, STORAGE_BUCKET, storageFileName } from "./paths";
import type {
  ConfirmUploadInput,
  ConfirmedUpload,
  DocumentTypeOption,
  RequestSignedUploadInput,
  SignedUploadTicket,
  StorageErrorCode,
  UploadActor,
} from "./types";
import { type UploadRules, validateUploadCandidate } from "./validation";
import { planVersionChain, selectLiveDocument } from "./version-chain";

/** Motifs d'échec, stables et sérialisables. */
export type { StorageErrorCode };

/** Erreur métier du pipeline. */
export class StorageError extends Error {
  constructor(
    readonly code: StorageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/** Acteur authentifié, réduit à ce dont le pipeline a besoin. */
export type { UploadActor };

interface DossierRow {
  id: string;
  duc_code: string | null;
  citizen_id: string | null;
  owner_user_id: string | null;
  agency_id: string | null;
  is_diaspora: boolean | null;
}

interface DocumentRow {
  id: string;
  dossier_id: string;
  doc_type_code: string;
  chemise_code: string;
  version: number;
  supersedes_id: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256: string;
  status: string;
  uploaded_by: string | null;
  deleted_at: string | null;
}

interface DocumentTypeRow {
  code: string;
  label: string;
  accepted_mime: string[] | null;
  max_size_bytes: number | null;
}

/**
 * Autorise l'acteur sur le dossier.
 *
 * Le citoyen n'agit que sur **son** dossier ; l'agent n'agit que dans son
 * périmètre (`scope.ts`). Un dossier hors périmètre est traité comme
 * inexistant : la réponse ne divulgue pas son existence.
 */
async function authorizeDossier(actor: UploadActor, dossierId: string): Promise<DossierRow> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("dossiers")
    .select("id, duc_code, citizen_id, owner_user_id, agency_id, is_diaspora")
    .eq("id", dossierId)
    .maybeSingle();

  if (error) {
    throw new StorageError("internal", `Lecture du dossier impossible : ${error.message}`);
  }
  if (!data) {
    throw new StorageError("not_found", "Dossier introuvable ou inaccessible.");
  }

  const dossier = data as DossierRow;

  if (actor.role === "CITIZEN") {
    if (dossier.citizen_id !== actor.id) {
      throw new StorageError("not_found", "Dossier introuvable ou inaccessible.");
    }
    return dossier;
  }

  const inScope = isInScope(
    resolveScope(actor.role),
    { ownerUserId: actor.id, agencyId: actor.agencyId, isDiaspora: actor.isDiaspora },
    {
      owner_user_id: dossier.owner_user_id,
      agency_id: dossier.agency_id,
      is_diaspora: dossier.is_diaspora ?? false,
    },
  );

  if (!inScope) {
    throw new StorageError("not_found", "Dossier introuvable ou inaccessible.");
  }
  return dossier;
}

/** Règles de dépôt déduites du référentiel déclarable. */
async function loadDocumentType(docTypeCode: string): Promise<DocumentTypeRow> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from(referenceView("document_type"))
    .select("code, label, accepted_mime, max_size_bytes")
    .eq("code", docTypeCode)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new StorageError("internal", `Référentiel illisible : ${error.message}`);
  }
  if (!data) {
    throw new StorageError("not_found", `Type de document inconnu : ${docTypeCode}`);
  }
  return data as DocumentTypeRow;
}

/** Règles appliquées : celles du référentiel, bornées par la contrainte de la table. */
function rulesFor(documentType: DocumentTypeRow): UploadRules {
  return {
    allowedMimeTypes: documentType.accepted_mime?.length
      ? documentType.accepted_mime
      : ["application/pdf", "image/jpeg", "image/png"],
    maxSizeBytes: Math.min(documentType.max_size_bytes ?? 10 * 1024 * 1024, 20 * 1024 * 1024),
  };
}

/** Restreint une chemise reçue du navigateur aux trois chemises du modèle. */
function asChemiseCode(value: string): ChemiseCode {
  if (!CHEMISE_CODES.includes(value as ChemiseCode)) {
    throw new StorageError("invalid_input", `Chemise inconnue : ${value}`);
  }
  return value as ChemiseCode;
}

/**
 * Demande une URL signée de dépôt.
 *
 * La pièce est inscrite **avant** l'envoi : c'est ce qui permet à la
 * politique `storage.objects` de relier l'objet qui arrive à une pièce
 * autorisée du dossier.
 */
export async function requestSignedUpload(
  actor: UploadActor,
  input: RequestSignedUploadInput,
): Promise<SignedUploadTicket> {
  if (!isValidChecksum(input.checksumSha256)) {
    throw new StorageError("invalid_input", "Empreinte SHA-256 absente ou mal formée.");
  }
  const chemiseCode = asChemiseCode(input.chemiseCode);
  if (!hasCapability(actor.role, "document:upload", actor.capabilities)) {
    throw new StorageError("forbidden", "Dépôt de document non autorisé pour ce rôle.");
  }
  if (!canWriteChemise(actor.role, chemiseCode)) {
    throw new StorageError(
      "forbidden",
      `Dépôt refusé dans la chemise ${chemiseCode} pour ce rôle.`,
    );
  }

  await authorizeDossier(actor, input.dossierId);

  const documentType = await loadDocumentType(input.docTypeCode);
  const validation = validateUploadCandidate(
    {
      name: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    },
    rulesFor(documentType),
  );
  if (!validation.ok) {
    throw new StorageError("invalid_input", validation.error.message);
  }

  const storagePath = buildStoragePath({
    dossierId: input.dossierId,
    docTypeCode: input.docTypeCode,
    filename: validation.value.filename,
  });

  const supabase = await createServerSupabaseClient();
  const { data: inserted, error: insertError } = await supabase
    .from("dossier_documents")
    .insert({
      dossier_id: input.dossierId,
      doc_type_code: input.docTypeCode,
      chemise_code: chemiseCode,
      storage_path: storagePath,
      original_filename: validation.value.filename,
      mime_type: validation.value.mimeType,
      size_bytes: validation.value.sizeBytes,
      checksum_sha256: input.checksumSha256,
      status: "awaiting_upload",
      uploaded_by: actor.id,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new StorageError(
      "forbidden",
      `Dépôt refusé par les règles d'accès : ${insertError?.message ?? "pièce non enregistrée"}`,
    );
  }

  const documentId = (inserted as { id: string }).id;

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (signError || !signed) {
    // Aucun octet ne partira : la pièce provisoire est purgée.
    await supabase.from("dossier_documents").delete().eq("id", documentId);
    throw new StorageError(
      "upload_failed",
      `URL de dépôt non délivrée : ${signError?.message ?? "cause inconnue"}`,
    );
  }

  return {
    documentId,
    storagePath,
    signedUrl: signed.signedUrl,
    token: signed.token,
  };
}

/**
 * Vérifie que l'objet attendu est bien arrivé, à la bonne taille **et avec
 * la bonne empreinte**.
 *
 * L'empreinte annoncée par le navigateur n'est une preuve que si le serveur
 * ne l'a pas recalculée sur les octets **reçus** : un fichier de même taille
 * pourrait avoir été substitué. On la recalcule donc ici — l'objet est borné
 * (20 Mo par les règles de dépôt), la relecture l'est donc aussi.
 */
async function verifyStoredObject(
  storagePath: string,
  expectedSize: number,
  expectedChecksum: string,
): Promise<void> {
  const admin = getAdminClient();
  const folder = storagePath.split("/").slice(0, -1).join("/");
  const name = storageFileName(storagePath);

  const { data: objects, error } = await admin.storage.from(STORAGE_BUCKET).list(folder);
  if (error) {
    throw new StorageError("upload_failed", `Objet introuvable dans le coffre : ${error.message}`);
  }

  const stored = (objects ?? []).find((object) => object.name === name);
  if (!stored) {
    throw new StorageError("upload_failed", "Le fichier n'a pas été reçu par le coffre.");
  }

  const size = readObjectSize(stored);
  if (size !== null && size !== expectedSize) {
    throw new StorageError(
      "upload_failed",
      `Taille du fichier incohérente (${size} octets reçus, ${expectedSize} annoncés).`,
    );
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (downloadError || !blob) {
    throw new StorageError(
      "upload_failed",
      `Lecture de l'objet déposé impossible : ${downloadError?.message ?? "objet vide"}.`,
    );
  }

  const actualChecksum = await checksumBlob(blob);
  if (actualChecksum !== expectedChecksum) {
    throw new StorageError(
      "checksum_mismatch",
      "Empreinte du fichier reçu différente de l'empreinte annoncée : le dépôt est rejeté.",
    );
  }
}

/** Taille d'un objet listé par l'API Storage, selon les formes possibles. */
function readObjectSize(object: {
  size?: number | null;
  metadata?: Record<string, unknown> | null;
}): number | null {
  if (typeof object.size === "number") return object.size;

  const metadata = object.metadata ?? {};
  const direct = metadata.size;
  if (typeof direct === "number") return direct;
  if (typeof direct === "string" && direct.trim() !== "" && !Number.isNaN(Number(direct))) {
    return Number(direct);
  }

  const eic = metadata.eic as { size?: number | string } | undefined;
  if (eic && typeof eic.size === "number") return eic.size;
  if (eic && typeof eic.size === "string" && !Number.isNaN(Number(eic.size))) {
    return Number(eic.size);
  }

  return null;
}

/**
 * Prévient le conseiller du dossier qu'une pièce vient d'être déposée.
 *
 * Le dépôt ne lève jamais : la pièce est enregistrée et journalisée, un
 * échec de notification ne doit pas remettre en cause le dépôt.
 */
async function notifyDossierAgent(
  dossierId: string,
  documentId: string,
  filename: string,
  actorId: string,
): Promise<void> {
  try {
    const admin = getAdminClient();
    const { data: dossier } = await admin
      .from("dossiers")
      .select("owner_user_id")
      .eq("id", dossierId)
      .is("deleted_at", null)
      .maybeSingle();

    const agentId = (dossier as { owner_user_id: string | null } | null)?.owner_user_id ?? null;
    if (!agentId || agentId === actorId) return;

    await notify({
      recipientUserId: agentId,
      type: "document.uploaded",
      title: "Pièce déposée au dossier",
      body: filename,
      dossierId,
      actionUrl: "/portail-cfc/clients",
      dedupeKey: `DOCUMENT_UPLOADED:${documentId}:${agentId}`,
    });
  } catch (error) {
    console.warn("[storage] notification du conseiller impossible :", error);
  }
}

/**
 * Confirme le dépôt : la pièce passe en `uploaded`, la version est
 * enchaînée et l'événement est journalisé.
 */
export async function confirmUpload(
  actor: UploadActor,
  input: ConfirmUploadInput,
): Promise<ConfirmedUpload> {
  const supabase = await createServerSupabaseClient();

  const { data: found, error: readError } = await supabase
    .from("dossier_documents")
    .select(
      "id, dossier_id, doc_type_code, chemise_code, version, supersedes_id, storage_path, original_filename, mime_type, size_bytes, checksum_sha256, status, uploaded_by, deleted_at",
    )
    .eq("id", input.documentId)
    .maybeSingle();

  if (readError) {
    throw new StorageError("internal", `Lecture de la pièce impossible : ${readError.message}`);
  }
  if (!found) {
    throw new StorageError("not_found", "Pièce introuvable.");
  }

  const document = found as DocumentRow;

  if (document.deleted_at) {
    throw new StorageError("conflict", "Cette pièce a été retirée : le dépôt est sans objet.");
  }
  if (document.storage_path !== input.storagePath) {
    throw new StorageError("invalid_input", "Chemin de stockage incohérent.");
  }
  if (document.checksum_sha256 !== input.checksumSha256) {
    throw new StorageError(
      "checksum_mismatch",
      "Empreinte SHA-256 incohérente entre l'annonce et la confirmation.",
    );
  }
  if (document.uploaded_by !== actor.id && !hasCapability(actor.role, "document:upload", actor.capabilities)) {
    throw new StorageError("forbidden", "Confirmation réservée à l'auteur de la pièce.");
  }

  await authorizeDossier(actor, document.dossier_id);

  // L'objet est vérifié **avant** la bascule : une pièce ne passe pas en
  // « uploaded » si le coffre ne l'a pas reçue.
  await verifyStoredObject(
    document.storage_path,
    document.size_bytes,
    document.checksum_sha256,
  );

  if (document.status !== "uploaded") {
    const { error: updateError } = await supabase
      .from("dossier_documents")
      .update({ status: "uploaded" })
      .eq("id", document.id);

    if (updateError) {
      throw new StorageError(
        "forbidden",
        `Bascule en « uploaded » refusée : ${updateError.message}`,
      );
    }
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("dossier_documents")
    .select("id, dossier_id, doc_type_code, version, deleted_at")
    .eq("dossier_id", document.dossier_id)
    .eq("doc_type_code", document.doc_type_code)
    .is("deleted_at", null)
    .neq("id", document.id);

  if (siblingsError) {
    throw new StorageError("internal", `Chaîne de versions illisible : ${siblingsError.message}`);
  }

  const live = selectLiveDocument(
    (siblings ?? []).map((row) => ({
      id: (row as { id: string }).id,
      dossierId: (row as { dossier_id: string }).dossier_id,
      docTypeCode: (row as { doc_type_code: string }).doc_type_code,
      version: (row as { version: number }).version,
      deletedAt: (row as { deleted_at: string | null }).deleted_at,
    })),
    document.dossier_id,
    document.doc_type_code,
  );
  const plan = planVersionChain(live);

  const { data: applied, error: chainError } = await supabase.rpc("apply_document_version", {
    p_document_id: document.id,
    p_version: plan.version,
    p_supersedes_id: plan.supersedesId,
  });

  if (chainError) {
    throw new StorageError("conflict", `Chaîne de versions refusée : ${chainError.message}`);
  }

  // Une fonction renvoyant un jeu de lignes est exposée par PostgREST sous
  // forme de tableau : la première ligne porte le résultat.
  const appliedRow = (Array.isArray(applied) ? applied[0] : applied) as
    | { version?: number; supersedes_id?: string | null }
    | null;

  const version = Number(appliedRow?.version ?? plan.version);
  const supersedesId = appliedRow?.supersedes_id ?? plan.supersedesId;

  const eventPayload = {
    document_id: document.id,
    doc_type_code: document.doc_type_code,
    chemise_code: document.chemise_code,
    original_filename: document.original_filename,
    storage_path: document.storage_path,
    checksum_sha256: document.checksum_sha256,
    size_bytes: document.size_bytes,
    version,
    supersedes_id: supersedesId,
  };

  const { error: eventError } = await supabase.rpc("append_dossier_event", {
    p_dossier_id: document.dossier_id,
    p_event_type: "DOCUMENT_UPLOADED",
    p_payload: eventPayload,
  });

  if (eventError) {
    throw new StorageError("internal", `Journal de l'événement non écrit : ${eventError.message}`);
  }

  // Le conseiller du dossier est prévenu : une pièce attend sa vérification.
  // C'est l'agent qui doit agir, pas l'emprunteur qui vient de déposer.
  await notifyDossierAgent(document.dossier_id, document.id, document.original_filename, actor.id);

  // Le client reçoit aussi une confirmation de dépôt, même si le relais
  // d'e-mails Supabase est désactivé sur l'environnement.
  await notifyBusinessEvent({
    eventType: "DOCUMENT_UPLOADED",
    dossierId: document.dossier_id,
    payload: eventPayload,
  });

  return {
    documentId: document.id,
    version,
    supersedesId,
    storagePath: document.storage_path,
    checksumSha256: document.checksum_sha256,
  };
}

/** Retire une pièce (suppression logique) et son objet du coffre. */
export async function deleteDocument(
  actor: UploadActor,
  documentId: string,
): Promise<{ documentId: string; storagePath: string }> {
  const supabase = await createServerSupabaseClient();

  const { data: found, error: readError } = await supabase
    .from("dossier_documents")
    .select("id, dossier_id, storage_path, uploaded_by, deleted_at")
    .eq("id", documentId)
    .maybeSingle();

  if (readError) {
    throw new StorageError("internal", `Lecture de la pièce impossible : ${readError.message}`);
  }
  if (!found) {
    throw new StorageError("not_found", "Pièce introuvable.");
  }

  const document = found as {
    id: string;
    dossier_id: string;
    storage_path: string;
    uploaded_by: string | null;
    deleted_at: string | null;
  };

  if (document.deleted_at) {
    throw new StorageError("conflict", "Pièce déjà retirée.");
  }
  if (document.uploaded_by !== actor.id && !hasCapability(actor.role, "admin:roles", actor.capabilities)) {
    throw new StorageError("forbidden", "Retrait réservé à l'auteur de la pièce.");
  }

  await authorizeDossier(actor, document.dossier_id);

  const { error: deleteError } = await supabase
    .from("dossier_documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", document.id);

  if (deleteError) {
    throw new StorageError("forbidden", `Retrait refusé : ${deleteError.message}`);
  }

  const admin = getAdminClient();
  const { error: removeError } = await admin.storage
    .from(STORAGE_BUCKET)
    .remove([document.storage_path]);
  if (removeError) {
    // La pièce est déjà retirée de la base : l'objet orphelin est sans effet.
    console.warn(`[storage] objet non supprimé : ${removeError.message}`);
  }

  return { documentId: document.id, storagePath: document.storage_path };
}

/** URL signée de consultation, pour une pièce que l'acteur peut lire. */
export async function getSignedDownloadUrl(
  actor: UploadActor,
  documentId: string,
): Promise<{ url: string; expiresIn: number }> {
  const supabase = await createServerSupabaseClient();

  const { data: found, error: readError } = await supabase
    .from("dossier_documents")
    .select("id, dossier_id, storage_path, deleted_at")
    .eq("id", documentId)
    .maybeSingle();

  if (readError) {
    throw new StorageError("internal", `Lecture de la pièce impossible : ${readError.message}`);
  }
  if (!found) {
    throw new StorageError("not_found", "Pièce introuvable.");
  }

  const document = found as {
    id: string;
    dossier_id: string;
    storage_path: string;
    deleted_at: string | null;
  };

  if (document.deleted_at) {
    throw new StorageError("not_found", "Pièce introuvable.");
  }

  await authorizeDossier(actor, document.dossier_id);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(document.storage_path, 300);

  if (error || !data) {
    throw new StorageError("internal", `URL de consultation non délivrée : ${error?.message ?? "?"}`);
  }

  return { url: data.signedUrl, expiresIn: 300 };
}

/** Dossier d'un citoyen (le sien) — ou `null` s'il n'a pas de dossier. */
export async function findCitizenDossier(actor: UploadActor): Promise<{ id: string } | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("dossiers")
    .select("id")
    .eq("citizen_id", actor.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new StorageError("internal", `Dossier du citoyen introuvable : ${error.message}`);
  }
  return data ? ({ id: (data as { id: string }).id } as { id: string }) : null;
}

/** Dossier d'un code DUC — pour les écrans qui travaillent sur une référence. */
export async function findDossierByDucCode(ducCode: string): Promise<{ id: string } | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("dossiers")
    .select("id")
    .eq("duc_code", ducCode)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new StorageError("internal", `Dossier introuvable : ${error.message}`);
  }
  return data ? ({ id: (data as { id: string }).id } as { id: string }) : null;
}

/** Liste des types de documents déclarables (pour les écrans de dépôt). */
export async function listDocumentTypes(): Promise<DocumentTypeOption[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from(referenceView("document_type"))
    .select("code, label, accepted_mime, max_size_bytes")
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (error) {
    throw new StorageError("internal", `Référentiel illisible : ${error.message}`);
  }

  return ((data ?? []) as DocumentTypeRow[]).map((row) => ({
    code: row.code,
    label: row.label,
    acceptedMime: row.accepted_mime ?? [],
    maxSizeBytes: row.max_size_bytes ?? 10 * 1024 * 1024,
  }));
}
