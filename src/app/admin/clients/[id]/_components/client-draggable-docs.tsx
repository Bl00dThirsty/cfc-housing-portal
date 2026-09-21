"use client";

import * as React from "react";
import { GripVertical, Trash2, Eye, Download, Plus, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ClientDocument } from "../../_components/data";

interface ClientDraggableDocsProps {
  initialDocuments: ClientDocument[];
  onDocumentsChange?: (docs: ClientDocument[]) => void;
}

export function ClientDraggableDocs({
  initialDocuments,
  onDocumentsChange,
}: ClientDraggableDocsProps) {
  const [docs, setDocs] = React.useState<ClientDocument[]>(initialDocuments);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [activeDocPreview, setActiveDocPreview] = React.useState<ClientDocument | null>(null);

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

  const handleAdd = () => {
    const newDoc: ClientDocument = {
      name: `Nouvelle pièce justificative #${docs.length + 1}`,
      category: "Identité",
      status: "En attente",
      date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      ref: `CFC-DOC-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    const updated = [...docs, newDoc];
    setDocs(updated);
    onDocumentsChange?.(updated);
  };

  const statusStyles: Record<string, string> = {
    "Validé": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    "En cours": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    "En attente": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    "Rejeté": "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
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
            Glissez-déposez les documents pour ordonner leur priorité d&apos;instruction dans la GED.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono w-fit">
          {docs.length} pièces indexées
        </Badge>
      </div>

      {/* Table-like column labels (Image 2 style) */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <span className="col-span-1 text-center">Ordre</span>
        <span className="col-span-5">Intitulé de la Pièce Justificative</span>
        <span className="col-span-2">Chemise DUC</span>
        <span className="col-span-2">Statut</span>
        <span className="col-span-2 text-right pr-2">Actions</span>
      </div>

      {/* Draggable items list */}
      <div className="space-y-2">
        {docs.map((doc, index) => (
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
                {doc.ref || "Réf. automatique"} · Enregistré le {doc.date}
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveDocPreview(doc)}
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Aperçu du document"
              >
                <Eye className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Télécharger"
              >
                <Download className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(index)}
                className="size-7 text-muted-foreground hover:text-rose-600"
                title="Supprimer"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Item Button (Image 2 style) */}
      <Button
        variant="outline"
        onClick={handleAdd}
        className="w-full h-10 border-dashed border-border/60 hover:border-primary/60 hover:bg-muted/30 text-xs font-medium gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="size-4" />
        Ajouter un Nouveau Document
      </Button>

      {/* Document Quick Preview Modal */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-border/40 bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {activeDocPreview.name}
                </h4>
                <span className="text-xs text-muted-foreground">
                  Catégorie : {activeDocPreview.category} · Réf : {activeDocPreview.ref}
                </span>
              </div>
              <Badge
                variant="secondary"
                className={statusStyles[activeDocPreview.status]}
              >
                {activeDocPreview.status}
              </Badge>
            </div>

            <div className="h-48 rounded-lg bg-muted/20 border border-border/30 flex flex-col items-center justify-center text-center p-4 text-xs text-muted-foreground space-y-2">
              <CheckCircle2 className="size-8 text-emerald-600" />
              <p className="font-medium text-foreground">
                Document certifié et scellé dans le coffre-fort CFC
              </p>
              <p className="text-[11px] text-muted-foreground">
                Empreinte numérique SHA-256 : <br />
                <span className="font-mono text-[10px]">
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDocPreview(null)}
                className="text-xs"
              >
                Fermer
              </Button>
              <Button
                size="sm"
                className="text-xs gap-1.5"
              >
                <Download className="size-3.5" />
                Télécharger Copie Conforme
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
