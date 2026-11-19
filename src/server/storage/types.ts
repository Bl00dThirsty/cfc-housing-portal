/**
 * Contrats partagés entre le serveur et le navigateur.
 *
 * Ce module ne contient que des **types** : il est importable par les deux
 * côtés, y compris par les composants clients, sans tirer le moindre code
 * serveur dans le paquet du navigateur.
 */

import type { Capability, Role } from "@/domain/policies/capabilities";

/** Motifs d'échec du dépôt, stables et sérialisables. */
export type StorageErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "invalid_input"
  | "checksum_mismatch"
  | "upload_failed"
  | "conflict"
  | "internal";

/** Réponse d'action serveur : succès ou échec typé. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: StorageErrorCode; message: string } };

/** Acteur authentifié, réduit à ce dont le pipeline a besoin. */
export interface UploadActor {
  /** Identifiant de l'acteur (`auth.uid()`). */
  id: string;
  /** Rôle effectif (métier ou citoyen). */
  role: Role;
  /** Current persisted grants; an empty list fails closed. */
  capabilities?: readonly Capability[];
  /** Agence de rattachement de l'acteur. */
  agencyId: string | null;
  /** L'acteur sert-il le guichet diaspora ? */
  isDiaspora: boolean;
}

/** Demande de dépôt, telle que reçue du navigateur. */
export interface RequestSignedUploadInput {
  /** Dossier cible. */
  dossierId: string;
  /** Type de document (`ref.document_type.code`). */
  docTypeCode: string;
  /** Chemise de destination (`C1`, `C2`, `C3`). */
  chemiseCode: string;
  /** Nom de fichier d'origine. */
  filename: string;
  /** Type MIME déclaré. */
  mimeType: string;
  /** Taille annoncée, en octets. */
  sizeBytes: number;
  /** Empreinte SHA-256 calculée par le navigateur. */
  checksumSha256: string;
}

/** Ticket de dépôt : de quoi poser les octets dans le coffre. */
export interface SignedUploadTicket {
  /** Identifiant de la pièce inscrite en base. */
  documentId: string;
  /** Chemin de l'objet dans le coffre. */
  storagePath: string;
  /** URL signée à laquelle envoyer les octets. */
  signedUrl: string;
  /** Jeton de l'URL signée. */
  token: string;
}

/** Confirmation de dépôt. */
export interface ConfirmUploadInput {
  /** Pièce confirmée. */
  documentId: string;
  /** Chemin de l'objet (doit correspondre à celui enregistré). */
  storagePath: string;
  /** Taille annoncée. */
  sizeBytes: number;
  /** Empreinte annoncée. */
  checksumSha256: string;
}

/** Résultat de la confirmation. */
export interface ConfirmedUpload {
  /** Pièce déposée. */
  documentId: string;
  /** Version atteinte (1 pour la première pièce du type). */
  version: number;
  /** Pièce supersédée (`null` s'il n'y en avait pas). */
  supersedesId: string | null;
  /** Chemin de l'objet. */
  storagePath: string;
  /** Empreinte enregistrée. */
  checksumSha256: string;
}

/** Type de document déclarable, pour les écrans de dépôt. */
export interface DocumentTypeOption {
  /** Code (`ref.document_type.code`). */
  code: string;
  /** Libellé métier. */
  label: string;
  /** Types MIME acceptés pour ce type de pièce. */
  acceptedMime: string[];
  /** Taille maximale acceptée, en octets. */
  maxSizeBytes: number;
}
