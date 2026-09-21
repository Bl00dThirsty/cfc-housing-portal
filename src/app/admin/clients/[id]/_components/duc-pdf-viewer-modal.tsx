"use client";

import * as React from "react";
import { Download, ExternalLink, Printer, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { type ClientDocument, getDocumentPdf } from "../../_components/data";

interface DucPdfViewerModalProps {
  document: ClientDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
}

const statusStyles: Record<string, string> = {
  "Validé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En cours": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En attente": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Rejeté": "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export function DucPdfViewerModal({
  document,
  open,
  onOpenChange,
  clientName,
}: DucPdfViewerModalProps) {
  if (!document) return null;

  const pdfInfo = getDocumentPdf(document);

  const handlePrint = () => {
    // Open the PDF in a new window or trigger browser print
    const printWindow = window.open(pdfInfo.url, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl h-[92vh] flex flex-col p-0 gap-0 rounded-xl bg-background text-foreground border border-border/40 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-border/40 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dossier Unique Client (DUC)
              </span>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <Badge variant="outline" className="text-[10px] font-medium h-5">
                {document.category}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-[10px] font-medium h-5 border-transparent ${
                  statusStyles[document.status] || "bg-muted text-muted-foreground"
                }`}
              >
                {document.status}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {pdfInfo.size}
              </span>
            </div>
            <DialogTitle className="text-base font-semibold text-foreground truncate block">
              {document.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {clientName ? `Emprunteur : ${clientName} · ` : ""}Réf. {document.ref || "CFC-GED-NUM"} · Scellé le {document.date}
            </DialogDescription>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Imprimer</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 text-xs gap-1.5"
            >
              <a
                href={pdfInfo.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
                <span className="hidden sm:inline">Plein écran</span>
              </a>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-8 text-xs gap-1.5 font-medium"
            >
              <a
                href={pdfInfo.url}
                download={document.name.endsWith(".pdf") ? document.name : `${document.name}.pdf`}
              >
                <Download className="size-3.5" />
                Télécharger
              </a>
            </Button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-muted/20 relative min-h-0 w-full flex flex-col">
          <iframe
            src={`${pdfInfo.url}#toolbar=1&navpanes=0`}
            title={document.name}
            className="w-full h-full border-0 bg-background"
          />
        </div>

        {/* Footer info & seal */}
        <div className="p-3 sm:px-6 border-t border-border/40 bg-background/80 flex items-center justify-between gap-3 shrink-0 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">
              Document officiel certifié CFC · Intégrité vérifiée et scellée dans le coffre-fort numérique
            </span>
            <span className="sm:hidden">Document certifié CFC</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 text-xs"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
