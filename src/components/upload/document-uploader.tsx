"use client";

/**
 * Zone de dépôt documentaire — dropzone, progression, états.
 *
 * Le parcours est le même pour l'agent et pour l'emprunteur :
 *
 * 1. **validation** — format, taille, cohérence de l'extension : un fichier
 *    refusé n'est **jamais** envoyé ;
 * 2. **empreinte** — SHA-256 calculée dans le navigateur, le serveur ne
 *    relaie jamais les octets ;
 * 3. **URL signée** — demandée au serveur, qui vérifie capacité et
 *    périmètre avant d'écrire ;
 * 4. **envoi direct** — les octets partent vers le coffre, la progression est
 *    réelle ;
 * 5. **confirmation** — le serveur vérifie l'objet, enchaîne la version et
 *    journalise l'événement.
 *
 * @see src/server/storage/actions.ts
 */

import * as React from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { UploadError, type UploadErrorPayload } from "./upload-error";
import {
  DEFAULT_UPLOAD_RULES,
  checksumBlob,
  confirmUploadAction,
  formatBytes,
  requestSignedUploadAction,
  validateUploadCandidate,
  type UploadRules,
} from "./storage";

/** Pièce déposée, telle que annoncée au parent. */
export interface UploadedDocument {
  /** Identifiant de la pièce en base. */
  documentId: string;
  /** Version atteinte. */
  version: number;
  /** Pièce supersédée (`null` s'il n'y en avait pas). */
  supersedesId: string | null;
  /** Chemin de l'objet dans le coffre. */
  storagePath: string;
  /** Empreinte SHA-256 de la pièce. */
  checksumSha256: string;
  /** Nom de fichier d'origine. */
  filename: string;
  /** Type MIME de la pièce déposée. */
  mimeType: string;
  /** Taille déposée, en octets. */
  sizeBytes: number;
}

export interface DocumentUploaderProps {
  /** Dossier cible. */
  dossierId: string;
  /** Type de document (`ref.document_type.code`). */
  docTypeCode: string;
  /** Chemise de destination (`C1`, `C2`, `C3`). */
  chemiseCode: string;
  /** Rappelée à chaque dépôt réussi. */
  onUploaded?: (document: UploadedDocument) => void;
  /** Règles de validation (types admis, taille maximale). */
  rules?: UploadRules;
  /** Intitulé de la zone. */
  label?: string;
  /** Précision affichée sous la zone. */
  hint?: string;
  /** Désactive le dépôt. */
  disabled?: boolean;
  /** Classe CSS additionnelle. */
  className?: string;
}

type UploadStatus = "pending" | "hashing" | "uploading" | "confirming" | "done" | "error";

interface UploadItem {
  /** Clé de rendu. */
  key: string;
  /** Nom de fichier. */
  name: string;
  /** Taille en octets. */
  sizeBytes: number;
  /** Progression de l'envoi, en pourcentage. */
  progress: number;
  /** État courant. */
  status: UploadStatus;
  /** Erreur éventuelle. */
  error?: UploadErrorPayload;
  /** Pièce déposée, une fois confirmée. */
  document?: UploadedDocument;
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  pending: "En attente",
  hashing: "Empreinte en cours",
  uploading: "Transfert en cours",
  confirming: "Vérification serveur",
  done: "Déposée",
  error: "Échec",
};

/**
 * Envoie les octets vers l'URL signée et suit la progression.
 *
 * `XMLHttpRequest` et non `fetch` : c'est le seul moyen d'obtenir la
 * progression d'un envoi dans tous les navigateurs.
 */
function putToStorage(
  signedUrl: string,
  file: File,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", signedUrl, true);
    request.setRequestHeader("authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("content-type", file.type || "application/octet-stream");
    request.setRequestHeader("x-upsert", "false");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Le coffre a refusé le transfert (HTTP ${request.status}).`));
    };
    request.onerror = () => reject(new Error("Transfert interrompu : connexion perdue."));
    request.onabort = () => reject(new Error("Transfert interrompu."));

    request.send(file);
  });
}

export function DocumentUploader({
  dossierId,
  docTypeCode,
  chemiseCode,
  onUploaded,
  rules = DEFAULT_UPLOAD_RULES,
  label = "Déposer une pièce",
  hint = "PDF, JPEG ou PNG — 10 Mo maximum. Le fichier est chiffré et horodaté.",
  disabled = false,
  className,
}: DocumentUploaderProps) {
  const { session } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<UploadErrorPayload | null>(null);

  const patchItem = React.useCallback((key: string, patch: Partial<UploadItem>) => {
    setItems((previous) =>
      previous.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }, []);

  const uploadOne = React.useCallback(
    async (file: File, key: string) => {
      // 1. Validation — un fichier non conforme n'est jamais envoyé.
      const validation = validateUploadCandidate(
        { name: file.name, mimeType: file.type, sizeBytes: file.size },
        rules,
      );
      if (!validation.ok) {
        patchItem(key, { status: "error", error: validation.error });
        return;
      }

      // 2. Empreinte — calculée ici, jamais côté serveur.
      patchItem(key, { status: "hashing" });
      let checksumSha256: string;
      try {
        checksumSha256 = await checksumBlob(file);
      } catch {
        patchItem(key, {
          status: "error",
          error: {
            code: "internal",
            message: "Empreinte SHA-256 impossible à calculer sur ce fichier.",
          },
        });
        return;
      }

      const accessToken = session?.access_token;
      if (!accessToken) {
        patchItem(key, {
          status: "error",
          error: { code: "unauthenticated", message: "Session expirée : reconnectez-vous." },
        });
        return;
      }

      // 3. URL signée — le serveur est la porte.
      const ticket = await requestSignedUploadAction({
        dossierId,
        docTypeCode,
        chemiseCode,
        filename: validation.value.filename,
        mimeType: validation.value.mimeType,
        sizeBytes: validation.value.sizeBytes,
        checksumSha256,
      });

      if (!ticket.ok) {
        patchItem(key, { status: "error", error: ticket.error });
        return;
      }

      // 4. Envoi direct au coffre.
      patchItem(key, { status: "uploading", progress: 0 });
      try {
        await putToStorage(ticket.data.signedUrl, file, accessToken, (percent) =>
          patchItem(key, { progress: percent }),
        );
      } catch (error) {
        patchItem(key, {
          status: "error",
          error: {
            code: "upload_failed",
            message: error instanceof Error ? error.message : "Le transfert a échoué.",
          },
        });
        return;
      }

      // 5. Confirmation — vérification serveur, chaînage, journal.
      patchItem(key, { status: "confirming", progress: 100 });
      const confirmed = await confirmUploadAction({
        documentId: ticket.data.documentId,
        storagePath: ticket.data.storagePath,
        sizeBytes: validation.value.sizeBytes,
        checksumSha256,
      });

      if (!confirmed.ok) {
        patchItem(key, { status: "error", error: confirmed.error });
        return;
      }

      const document: UploadedDocument = {
        ...confirmed.data,
        filename: file.name,
        mimeType: validation.value.mimeType,
        sizeBytes: validation.value.sizeBytes,
      };
      patchItem(key, { status: "done", document });
      onUploaded?.(document);
    },
    [chemiseCode, docTypeCode, dossierId, onUploaded, patchItem, rules, session?.access_token],
  );

  const handleFiles = React.useCallback(
    (fileList: FileList | File[] | null) => {
      if (!fileList || disabled) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setGlobalError(null);
      const created = files.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        sizeBytes: file.size,
        progress: 0,
        status: "pending" as UploadStatus,
      }));
      setItems((previous) => [...previous, ...created]);

      void Promise.all(
        created.map((item, index) => uploadOne(files[index], item.key).catch(() => undefined)),
      );
    },
    [disabled, uploadOne],
  );

  const openPicker = React.useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPicker();
  };

  const removeItem = (key: string) => {
    setItems((previous) => previous.filter((item) => item.key !== key));
  };

  const accept = rules.allowedMimeTypes.join(",");

  return (
    <div className={["space-y-3", className ?? ""].filter(Boolean).join(" ")}>
      <div className="rounded-xl border border-border bg-card">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label={`${label}. Activation par Entrée ou Espace pour parcourir les fichiers.`}
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (disabled) return;
            handleFiles(event.dataTransfer.files);
          }}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl px-6 py-8 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            dragging ? "bg-primary/5" : "hover:bg-muted/40",
            disabled ? "cursor-not-allowed opacity-60" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <UploadCloud className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <span className="h3-style text-foreground">{label}</span>
          <span className="caption-style text-subtle">{hint}</span>
          <span className="caption-style text-faint">
            Formats acceptés : {rules.allowedMimeTypes.join(", ")} — {formatBytes(rules.maxSizeBytes)}{" "}
            maximum.
          </span>
        </div>
      </div>

      <UploadError error={globalError} onDismiss={() => setGlobalError(null)} />

      {items.length > 0 ? (
        <ul className="space-y-2" aria-live="polite">
          {items.map((item) => (
            <li
              key={item.key}
              className="rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0">
                  {item.status === "done" ? (
                    <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                  ) : item.status === "error" ? (
                    <XCircle className="size-4 text-danger" aria-hidden="true" />
                  ) : (
                    <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12px] font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-subtle">
                      {formatBytes(item.sizeBytes)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "uploading" ? (
                      <>
                        <div
                          role="progressbar"
                          aria-valuenow={item.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progression du dépôt de ${item.name}`}
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-subtle">
                          {item.progress} %
                        </span>
                      </>
                    ) : (
                      <span
                        className={[
                          "caption-style",
                          item.status === "done"
                            ? "text-success"
                            : item.status === "error"
                              ? "text-danger"
                              : "text-subtle",
                        ].join(" ")}
                      >
                        {STATUS_LABELS[item.status]}
                        {item.status === "done" && item.document
                          ? ` · version ${item.document.version}`
                          : ""}
                      </span>
                    )}
                  </div>

                  {item.status === "hashing" || item.status === "confirming" ? (
                    <Loader2
                      className="size-3.5 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : null}

                  {item.error ? (
                    <p className="caption-style text-danger">{item.error.message}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label={`Retirer ${item.name} de la liste`}
                  className="shrink-0 rounded-md p-1 text-subtle transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <XCircle className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default DocumentUploader;
