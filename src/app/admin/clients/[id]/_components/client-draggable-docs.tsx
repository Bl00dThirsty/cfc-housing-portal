"use client";

import * as React from "react";
import { GripVertical, Trash2, Eye, Download, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ClientDocument, getDocumentPdf } from "../../_components/data";
import { DucAddDocumentDialog } from "./duc-add-document-dialog";
import { DucPdfViewerModal } from "./duc-pdf-viewer-modal";

interface ClientDraggableDocsProps {
  initialDocuments: ClientDocument[];
  onDocumentsChange?: (docs: ClientDocument[]) => void;
  clientName?: string;
}

const statusStyles: Record<string, string> = {
  "Validé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "En cours": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En attente": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Rejeté": "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export function ClientDraggableDocs({
  initialDocuments,
  onDocumentsChange,
  clientName,
}: ClientDraggableDocsProps) {
  const [docs, setDocs] = React.useState<ClientDocument[]>(initialDocuments);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [activeDocPreview, setActiveDocPreview] = React.useState<ClientDocument | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Sync state if initialDocuments changes externally
  React.useEffect(() => {
    setDocs(initialDocuments);
  }, [initialDocuments]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updated = [...docs];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setDocs(updated);
    setDraggedIndex(null);
    onDocumentsChange?.(updated);
  };

  const handleDelete = (index: number) => {
    const updated = docs.filter((_, i) => i !== index);
    setDocs(updated);
    onDocumentsChange?.(updated);
  };

  const handleAddDocument = (newDoc: ClientDocument) => {
    const updated = [...docs, newDoc];
    setDocs(updated);
    onDocumentsChange?.(updated);
  };

  return (
    <div className="rounded-xl border border-border/30 bg-card/40 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/20">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Pièces Justificatives du Dossier Unique Client (DUC)
          </h3>
          <p className="text-xs text-muted-foreground">
            Glissez-déposez les documents pour ordonner leur priorité d&apos;instruction dans la GED. Cliquez sur l&apos;œil pour visualiser le document réel.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono w-fit">
          {docs.length} pièces indexées
        </Badge>
      </div>

      {/* Table-like column labels */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <span className="col-span-1 text-center">Ordre</span>
        <span className="col-span-5">Intitulé de la Pièce Justificative</span>
        <span className="col-span-2">Chemise DUC</span>
        <span className="col-span-2">Statut</span>
        <span className="col-span-2 text-right pr-2">Actions</span>
      </div>

      {/* Draggable items list */}
      <div className="space-y-2">
        {docs.map((doc, index) => {
          const pdfInfo = getDocumentPdf(doc);
          return (
            <div
              key={`${doc.name}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`grid grid-cols-12 items-center gap-2 rounded-lg border border-border/40 bg-background/80 px-3 py-2.5 shadow-2xs transition-all ${
                draggedIndex === index ? "opacity-40 border-dashed border-primary" : "hover:border-border"
              }`}
            >
              {/* Drag Grip Handle */}
              <div className="col-span-1 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical className="size-4" />
              </div>

              {/* Document Title */}
              <div className="col-span-5 min-w-0">
                <span className="text-xs font-semibold text-foreground truncate block">
                  {doc.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono block">
                  {doc.ref || "Réf. automatique"} · Enregistré le {doc.date} ({pdfInfo.size})
                </span>
              </div>

              {/* Category */}
              <div className="col-span-2">
                <span className="text-xs text-foreground bg-muted/40 px-2 py-0.5 rounded-md text-[11px]">
                  {doc.category}
                </span>
              </div>

              {/* Status Badge */}
              <div className="col-span-2">
                <Badge
                  variant="secondary"
                  className={`text-[10.5px] font-medium h-5 px-2 border-transparent ${
                    statusStyles[doc.status] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {doc.status}
                </Badge>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1">
                {/* Visualiser le vrai document PDF */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveDocPreview(doc)}
                  className="size-7 text-muted-foreground hover:text-foreground"
                  title="Visualiser le document PDF réel"
                >
                  <Eye className="size-3.5" />
                </Button>

                {/* Télécharger directement le PDF réel */}
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="size-7 text-muted-foreground hover:text-foreground"
                  title="Télécharger le fichier PDF original"
                >
                  <a
                    href={pdfInfo.url}
                    download={doc.name.endsWith(".pdf") ? doc.name : `${doc.name}.pdf`}
                  >
                    <Download className="size-3.5" />
                  </a>
                </Button>

                {/* Supprimer la pièce */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(index)}
                  className="size-7 text-muted-foreground hover:text-rose-600"
                  title="Supprimer la pièce"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Item Button (Triggers Drag & Drop Dialog) */}
      <Button
        variant="outline"
        onClick={() => setIsAddDialogOpen(true)}
        className="w-full h-10 border-dashed border-border/60 hover:border-primary/60 hover:bg-muted/30 text-xs font-medium gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Plus className="size-4" />
        Ajouter un Nouveau Document
      </Button>

      {/* Drag & Drop Add Document Dialog */}
      <DucAddDocumentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddDocument={handleAddDocument}
      />

      {/* Real PDF Document Viewer Modal */}
      <DucPdfViewerModal
        document={activeDocPreview}
        open={Boolean(activeDocPreview)}
        onOpenChange={(open) => {
          if (!open) setActiveDocPreview(null);
        }}
        clientName={clientName}
      />
    </div>
  );
}
