"use client";

/**
 * Surface d'erreur du dépôt documentaire.
 *
 * Un seul endroit pour dire ce qui a échoué : format refusé, fichier trop
 * volumineux, transfert interrompu, empreinte incohérente… Le message vient
 * du serveur lorsqu'il y en a un ; les codes de validation, eux, sont
 * traduits ici pour que l'agent lise une cause métier et non un code.
 */

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";

/** Erreur affichée : un code stable et un message. */
export interface UploadErrorPayload {
  /** Motif stable (`unsupported_type`, `upload_failed`, …). */
  code: string;
  /** Message destiné à l'utilisateur. */
  message: string;
}

/** Libellé métier par code d'erreur. */
const ERROR_LABELS: Record<string, string> = {
  empty_file: "Fichier vide",
  unsupported_type: "Format non accepté",
  file_too_large: "Fichier trop volumineux",
  extension_mismatch: "Extension incohérente",
  invalid_filename: "Nom de fichier inexploitable",
  invalid_input: "Fichier non conforme",
  checksum_mismatch: "Empreinte SHA-256 incohérente",
  upload_failed: "Échec du dépôt",
  forbidden: "Dépôt non autorisé",
  not_found: "Dossier ou pièce introuvable",
  unauthenticated: "Session expirée",
  conflict: "Conflit de version",
  internal: "Erreur interne",
};

export interface UploadErrorProps {
  /** Erreur à afficher ; `null` n'affiche rien. */
  error: UploadErrorPayload | null;
  /** Permet de refermer le message. */
  onDismiss?: () => void;
  /** Classe CSS additionnelle. */
  className?: string;
}

/** Libellé métier d'un code d'erreur. */
export function uploadErrorLabel(code: string): string {
  return ERROR_LABELS[code] ?? "Dépôt refusé";
}

/**
 * Bandeau d'erreur du dépôt.
 *
 * `role="alert"` : le message est annoncé immédiatement par les lecteurs
 * d'écran, sans dépendre du focus.
 */
export function UploadError({ error, onDismiss, className }: UploadErrorProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={[
        "flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[12px] font-semibold leading-none text-danger">
          {uploadErrorLabel(error.code)}
        </p>
        <p className="caption-style text-danger/90">{error.message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Masquer le message d'erreur"
          className="shrink-0 rounded-md p-1 text-danger/70 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default UploadError;
