"use server";

/**
 * Actions serveur du service de stockage documentaire.
 *
 * Chaque action est une **porte** : elle résout l'appelant, re-vérifie sa
 * capacité et son périmètre, puis n'accepte que les identifiants qu'il a le
 * droit de toucher. Un identifiant passé « en douce » — le dossier d'un
 * autre, une pièce qui n'est pas la sienne — est traité comme inexistant.
 *
 * Les politiques RLS restent le filet : les écritures passent par le client
 * authentifié de la requête, jamais par le rôle de service.
 */

import { isRole } from "@/domain/policies/capabilities";
import { getServerProfile } from "@/server/auth/profile";
import {
  StorageError,
  confirmUpload,
  deleteDocument,
  findCitizenDossier,
  findDossierByDucCode,
  getSignedDownloadUrl,
  listDocumentTypes,
  requestSignedUpload,
} from "./upload";
import type {
  ActionResult,
  ConfirmUploadInput,
  ConfirmedUpload,
  DocumentTypeOption,
  RequestSignedUploadInput,
  SignedUploadTicket,
  StorageErrorCode,
  UploadActor,
} from "./types";

/** Résout l'acteur de la requête courante. */
async function resolveActor(): Promise<UploadActor> {
  const profile = await getServerProfile();
  if (!profile) {
    throw new StorageError("unauthenticated", "Session expirée : reconnectez-vous.");
  }
  const role = isRole(profile.role) ? profile.role : "CITIZEN";
  return {
    id: profile.actorId,
    role,
    agencyId: profile.agencyId,
    isDiaspora: role === "DIASPORA",
  };
}

/** Traduit une exception en résultat sérialisable. */
function toFailure(error: unknown): { ok: false; error: { code: StorageErrorCode; message: string } } {
  if (error instanceof StorageError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }
  const message = error instanceof Error ? error.message : "Erreur inattendue.";
  return { ok: false, error: { code: "internal", message } };
}

/**
 * Demande une URL signée de dépôt.
 *
 * Le navigateur a déjà validé et hashé le fichier : le serveur revalide
 * tout de même (type, taille, empreinte) avant d'écrire quoi que ce soit.
 */
export async function requestSignedUploadAction(
  input: RequestSignedUploadInput,
): Promise<ActionResult<SignedUploadTicket>> {
  try {
    const actor = await resolveActor();
    const ticket = await requestSignedUpload(actor, input);
    return { ok: true, data: ticket };
  } catch (error) {
    return toFailure(error);
  }
}

/** Confirme le dépôt : l'objet est vérifié, la version enchaînée, l'événement écrit. */
export async function confirmUploadAction(
  input: ConfirmUploadInput,
): Promise<ActionResult<ConfirmedUpload>> {
  try {
    const actor = await resolveActor();
    const confirmed = await confirmUpload(actor, input);
    return { ok: true, data: confirmed };
  } catch (error) {
    return toFailure(error);
  }
}

/** Retire une pièce du dossier. */
export async function deleteDocumentAction(input: {
  documentId: string;
}): Promise<ActionResult<{ documentId: string }>> {
  try {
    const actor = await resolveActor();
    const deleted = await deleteDocument(actor, input.documentId);
    return { ok: true, data: { documentId: deleted.documentId } };
  } catch (error) {
    return toFailure(error);
  }
}

/** URL signée de consultation d'une pièce. */
export async function getSignedDownloadUrlAction(input: {
  documentId: string;
}): Promise<ActionResult<{ url: string; expiresIn: number }>> {
  try {
    const actor = await resolveActor();
    const signed = await getSignedDownloadUrl(actor, input.documentId);
    return { ok: true, data: signed };
  } catch (error) {
    return toFailure(error);
  }
}

/**
 * Dossier d'un code DUC.
 *
 * Utile aux écrans qui travaillent sur une référence (le DUC du back-office)
 * plutôt que sur un identifiant : la résolution passe par les mêmes règles
 * de périmètre qu'un dépôt.
 */
export async function resolveDossierIdAction(input: {
  ducCode: string;
}): Promise<ActionResult<{ dossierId: string }>> {
  try {
    const actor = await resolveActor();
    if (actor.role === "CITIZEN") {
      const own = await findCitizenDossier(actor);
      if (!own) {
        throw new StorageError("not_found", "Aucun dossier ne vous est rattaché.");
      }
      return { ok: true, data: { dossierId: own.id } };
    }
    const dossier = await findDossierByDucCode(input.ducCode);
    if (!dossier) {
      throw new StorageError("not_found", `Dossier ${input.ducCode} introuvable ou inaccessible.`);
    }
    return { ok: true, data: { dossierId: dossier.id } };
  } catch (error) {
    return toFailure(error);
  }
}

/** Dossier du citoyen connecté. */
export async function resolveCitizenDossierAction(): Promise<
  ActionResult<{ dossierId: string }>
> {
  try {
    const actor = await resolveActor();
    const dossier = await findCitizenDossier(actor);
    if (!dossier) {
      throw new StorageError("not_found", "Aucun dossier ne vous est rattaché.");
    }
    return { ok: true, data: { dossierId: dossier.id } };
  } catch (error) {
    return toFailure(error);
  }
}

/** Types de documents déclarables, pour les écrans de dépôt. */
export async function listDocumentTypesAction(): Promise<ActionResult<DocumentTypeOption[]>> {
  try {
    await resolveActor();
    return { ok: true, data: await listDocumentTypes() };
  } catch (error) {
    return toFailure(error);
  }
}
