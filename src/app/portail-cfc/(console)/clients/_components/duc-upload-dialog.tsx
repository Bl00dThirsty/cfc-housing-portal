"use client";

/**
 * Dépôt d'une pièce au DUC — **câblé sur le service de stockage**.
 *
 * L'agent choisit le type de document et la chemise de destination, dépose
 * le fichier ; la pièce est réellement écrite dans le coffre, empreinte,
 * versionnée et journalisée. L'agent n'a plus à declaring un nom de fichier :
 * c'est le fichier déposé qui fait foi.
 */

import * as React from "react";
import { Shield } from "lucide-react";

import { DocumentUploader, type UploadedDocument } from "@/components/upload/document-uploader";
import { UploadError, type UploadErrorPayload } from "@/components/upload/upload-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { type ClientItem } from "@/domain/entities/client";
import { getChemise } from "@/domain/policies/chemise";
import { listDossierDocumentTypesAction, resolveDossierIdAction } from "@/server/storage/actions";
import type { DocumentTypeOption } from "@/server/storage/types";
import { type DucFile, type DucFileKind } from "./client-duc-manager";

export interface DucAuditLogEntry {
  id: string;
  docName: string;
  folderId: string;
  action: "Création & Indexation" | "Visa Favorable" | "Rejet Documentaire" | "Actualisation Version";
  author: string;
  role: string;
  date: string;
  version: string;
  comment?: string;
  status: "Validé" | "Rejeté" | "En attente";
}

interface DucUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientItem | null;
  onDocumentUploaded: (file: DucFile, auditLog: DucAuditLogEntry) => void;
}

/** Nature d'affichage d'une pièce, déduite de son format. */
function fileKindFor(mimeType: string): DucFileKind {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "design";
  return "document";
}

/** Taille lisible, alignée sur l'affichage du DUC. */
function displaySize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function DucUploadDialog({
  open,
  onOpenChange,
  client,
  onDocumentUploaded,
}: DucUploadDialogProps) {
  const { currentUser } = useAuth();

  const [docTypeCode, setDocTypeCode] = React.useState("");
  const [dossierId, setDossierId] = React.useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = React.useState<DocumentTypeOption[]>([]);
  const [error, setError] = React.useState<UploadErrorPayload | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [uploaded, setUploaded] = React.useState<UploadedDocument | null>(null);

  // Le dossier réel est résolu à partir de la référence DUC : la référence
  // affichée par le back-office n'est pas un identifiant de dossier.
  React.useEffect(() => {
    if (!open || !client) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUploaded(null);

    void (async () => {
      const dossier = await resolveDossierIdAction({ ducCode: client.ducId });

      if (cancelled) return;

      if (!dossier.ok) {
        setLoading(false);
        setDossierId(null);
        setError(dossier.error);
        return;
      }

      setDossierId(dossier.data.dossierId);
      const types = await listDossierDocumentTypesAction(dossier.data.dossierId);
      if (cancelled) return;
      setLoading(false);
      if (types.ok) {
        setDocumentTypes(types.data);
        setDocTypeCode((current) => current || (types.data[0]?.code ?? ""));
      } else {
        setError(types.error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, open]);

  if (!client) return null;

  const selectedType = documentTypes.find((type) => type.code === docTypeCode);
  const folderId = selectedType?.chemiseCode ?? "C1";

  const handleUploaded = (document: UploadedDocument) => {
    setUploaded(document);

    const newFile: DucFile = {
      id: document.documentId,
      name: document.filename,
      kind: fileKindFor(document.mimeType),
      size: displaySize(document.sizeBytes),
      folderId,
      owner: currentUser.name,
      modifiedAt: "Aujourd'hui",
      starred: false,
      status: "En cours",
    };

    const newAuditLog: DucAuditLogEntry = {
      id: `log-${document.documentId}`,
      docName: document.filename,
      folderId,
      action: "Création & Indexation",
      author: `${currentUser.name} (${currentUser.roleLabel})`,
      role: currentUser.role,
      date:
        new Date().toLocaleDateString("fr-FR") +
        " à " +
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      version: `v${document.version}`,
      comment: "Pièce déposée au coffre, empreinte SHA-256 enregistrée, version indexée au DUC.",
      status: "En attente",
    };

    onDocumentUploaded(newFile, newAuditLog);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl bg-background border border-border/50 shadow-lg">
        {/* Uniform White Header */}
        <div className="bg-background text-foreground p-5 border-b border-border/40 space-y-1.5">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Workflow CFC-03 · Gestion Documentaire DUC
              </span>
              <Badge variant="outline" className="text-[9.5px] font-mono text-muted-foreground">
                {client.ducId}
              </Badge>
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Déposer une Pièce au DUC
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rattachement scellé au Dossier Unique de <strong className="text-foreground">{client.name}</strong> avec traçabilité et visa métier.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="duc-upload-doc-type" className="text-xs font-semibold text-foreground">
                Nature de la Pièce *
              </label>
              <select
                id="duc-upload-doc-type"
                value={docTypeCode}
                onChange={(e) => setDocTypeCode(e.target.value)}
                disabled={loading || documentTypes.length === 0}
                className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                {documentTypes.length === 0 ? (
                  <option value="">Référentiel indisponible</option>
                ) : (
                  documentTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-end gap-2 pb-1.5">
              {selectedType ? (
                <>
                  <Badge variant="outline" className="text-xs">
                    {selectedType.chemiseCode} · {getChemise(selectedType.chemiseCode).label}
                  </Badge>
                  <Badge variant={selectedType.required ? "secondary" : "outline"} className="text-xs">
                    {selectedType.required ? "Pièce requise" : "Pièce complémentaire"}
                  </Badge>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Aucune pièce n’est ouverte au dépôt pour votre rôle et l’étape en cours.
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-muted/20 space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <span
                id="duc-upload-visa-label"
                className="text-xs font-bold text-foreground flex items-center gap-1.5"
              >
                <Shield className="size-3.5 text-primary" />
                Dépôt, empreinte et indexation
              </span>
              <span className="text-[10.5px] text-muted-foreground font-mono">
                Par : {currentUser.name} ({currentUser.roleLabel})
              </span>
            </div>
            <p className="caption-style text-subtle">
              Le fichier est déposé directement dans le coffre privé du dossier, horodaté et
              empreint (SHA-256). Un second dépôt du même type archive la version précédente au lieu
              de la dupliquer.
            </p>
          </div>

          <UploadError error={error} onDismiss={() => setError(null)} />

          {dossierId ? (
            <DocumentUploader
              dossierId={dossierId}
              docTypeCode={docTypeCode}
              chemiseCode={selectedType?.chemiseCode ?? "C1"}
              onUploaded={handleUploaded}
              label="Déposer la pièce au dossier"
              hint={
                selectedType
                  ? `${selectedType.label} — ${selectedType.acceptedMime.join(", ")}`
                  : "PDF, JPEG ou PNG"
              }
            />
          ) : (
            <p className="caption-style text-subtle">
              {loading
                ? "Résolution du dossier…"
                : "Aucun dossier n'est rattaché à cette référence : le dépôt est impossible."}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Fermer
            </Button>
            <span className="caption-style text-subtle">
              {uploaded
                ? `Pièce depositada au coffre — version ${uploaded.version}.`
                : "La pièce est indexée dès la fin du dépôt."}
            </span>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
