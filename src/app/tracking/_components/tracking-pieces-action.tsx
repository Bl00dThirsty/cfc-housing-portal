"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  Clock,
  FileCheck2,
  Check,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrackingDocument } from "@/lib/tracking-data";

interface TrackingPiecesActionProps {
  documents: TrackingDocument[];
  ducId: string;
  onDocumentUploadSimulated?: (docId: string, fileName: string) => void;
}

export function TrackingPiecesAction({
  documents,
  ducId,
  onDocumentUploadSimulated,
}: TrackingPiecesActionProps) {
  const [docs, setDocs] = React.useState<TrackingDocument[]>(documents);
  const [uploadingDocId, setUploadingDocId] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDocs(documents);
  }, [documents]);

  const handleSimulatedUpload = (docId: string) => {
    setUploadingDocId(docId);
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: "pending_review",
                fileName: "document_actualise_signe.pdf",
                fileSize: "2.4 Mo",
                updatedAt: "À l'instant",
                actionReason: undefined,
              }
            : d
        )
      );
      setUploadingDocId(null);
      setSuccessMessage(
        "Votre document a été téléversé avec succès. Il a été transmis au gestionnaire du CFC pour visa."
      );
      onDocumentUploadSimulated?.(docId, "document_actualise_signe.pdf");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
    }, 1200);
  };

  const actionRequiredCount = docs.filter((d) => d.status === "action_required").length;

  return (
    <div className="rounded-2xl border bg-card/95 backdrop-blur-sm p-5 md:p-7 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileCheck2 className="size-4" />
            </span>
            <h3 className="text-base font-bold text-foreground">
              Pièces &amp; Justificatifs Réglementaires (DUC)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dossier Unique de Crédit N° <span className="font-mono font-semibold">{ducId}</span> · Archivage légal scellé
          </p>
        </div>

        {actionRequiredCount > 0 ? (
          <Badge variant="destructive" className="gap-1.5 py-1 px-3 rounded-full text-xs animate-pulse">
            <AlertTriangle className="size-3.5" />
            {actionRequiredCount} action requise de votre part
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5 py-1 px-3 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Check className="size-3.5" />
            Toutes les pièces sont conformes
          </Badge>
        )}
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Transmission confirmée : </span>
            {successMessage}
          </div>
        </div>
      )}

      {/* Document items list */}
      <div className="space-y-3">
        {docs.map((doc) => {
          const isValid = doc.status === "valid";
          const isAction = doc.status === "action_required";
          const isPending = doc.status === "pending_review";
          const isThisUploading = uploadingDocId === doc.id;

          return (
            <div
              key={doc.id}
              className={cn(
                "rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                isAction && "border-rose-300 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20 shadow-xs",
                isValid && "border-border/70 bg-card hover:bg-muted/20",
                isPending && "border-amber-300 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
              )}
            >
              {/* Left: Info */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    isValid && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
                    isAction && "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
                    isPending && "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                  )}
                >
                  {isValid ? (
                    <CheckCircle2 className="size-4.5" />
                  ) : isAction ? (
                    <AlertTriangle className="size-4.5" />
                  ) : (
                    <Clock className="size-4.5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {doc.title}
                    </h4>
                    {isValid && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md">
                        Validée &amp; Conforme
                      </Badge>
                    )}
                    {isAction && (
                      <Badge variant="destructive" className="text-[10px] rounded-md">
                        Document Requis / À Remplacer
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-md">
                        Examen en cours
                      </Badge>
                    )}
                  </div>

                  {isAction && doc.actionReason && (
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium bg-rose-100/70 dark:bg-rose-900/30 p-2 rounded-lg border border-rose-200 dark:border-rose-800/50">
                      ⚠️ {doc.actionReason}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                    {doc.fileName && <span>{doc.fileName}</span>}
                    {doc.fileSize && <span>({doc.fileSize})</span>}
                    <span>Mis à jour le {doc.updatedAt}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {isAction ? (
                  <Button
                    size="sm"
                    disabled={isThisUploading}
                    onClick={() => handleSimulatedUpload(doc.id)}
                    className="h-8.5 rounded-lg text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                  >
                    <Upload className="size-3.5" />
                    {isThisUploading ? "Téléversement..." : "Remplacer cette pièce"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs gap-1.5"
                    onClick={() => alert(`Visualisation sécurisée du document : ${doc.fileName || doc.title}`)}
                  >
                    <Download className="size-3.5" />
                    Consulter
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
