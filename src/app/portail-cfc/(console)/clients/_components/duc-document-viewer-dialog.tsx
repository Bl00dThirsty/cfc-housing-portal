"use client";

import * as React from "react";
import { AlertCircle, Download, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientDocument, ClientItem } from "@/domain/entities/client";
import { getSignedDownloadUrlAction } from "@/server/storage/actions";

interface DucDocumentViewerDialogProps {
  file: ClientDocument | null;
  client: ClientItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DucDocumentViewerDialog({ file, client, open, onOpenChange }: DucDocumentViewerDialogProps) {
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    setSignedUrl(null);
    setError(null);
    setLoading(true);
    void getSignedDownloadUrlAction({ documentId: file.id }).then((result) => {
      if (cancelled) return;
      if (result.ok) setSignedUrl(result.data.url);
      else setError(result.error.message);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [file, open]);

  if (!file) return null;

  const filename = file.fileName || file.name;
  const isPdf = file.mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
  const isImage = file.mimeType?.startsWith("image/") ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <div className="flex shrink-0 flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <DialogHeader className="min-w-0 space-y-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{file.category}</Badge>
              <Badge variant="secondary" className="text-[10px]">{file.status}</Badge>
              <span className="text-[10px] text-muted-foreground">{file.date}</span>
            </div>
            <DialogTitle className="truncate text-sm">{file.name}</DialogTitle>
            <DialogDescription className="truncate text-xs">
              {client?.name ? `${client.name} · ` : ""}{filename}
            </DialogDescription>
          </DialogHeader>
          {signedUrl && (
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" /> Ouvrir
                </a>
              </Button>
              <Button type="button" size="sm" asChild>
                <a href={signedUrl} download={filename}>
                  <Download className="size-3.5" /> Télécharger
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/20">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Vérification de votre accès…</p>
          ) : error ? (
            <div role="alert" className="max-w-md px-6 text-center">
              <AlertCircle className="mx-auto mb-3 size-7 text-destructive" />
              <p className="text-sm font-medium">La pièce n’est pas accessible.</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
          ) : signedUrl && isPdf ? (
            <iframe src={signedUrl} title={file.name} className="size-full border-0 bg-background" />
          ) : signedUrl && isImage ? (
            // The source is a short-lived URL issued after the server checks the actor's dossier scope.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt={file.name} className="max-h-full max-w-full object-contain" />
          ) : signedUrl ? (
            <div className="px-6 text-center">
              <ShieldCheck className="mx-auto mb-3 size-7 text-primary" />
              <p className="text-sm font-medium">Téléchargement sécurisé disponible.</p>
              <p className="mt-1 text-xs text-muted-foreground">L’aperçu intégré n’est pas disponible pour ce format.</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
