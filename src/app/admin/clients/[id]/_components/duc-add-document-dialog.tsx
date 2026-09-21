"use client";

import * as React from "react";
import { FileText, Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type ClientDocument, getDocumentPdf } from "../../_components/data";

interface DucAddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDocument: (newDoc: ClientDocument) => void;
}

export function DucAddDocumentDialog({
  open,
  onOpenChange,
  onAddDocument,
}: DucAddDocumentDialogProps) {
  const [docName, setDocName] = React.useState("");
  const [category, setCategory] = React.useState<ClientDocument["category"]>("Identité");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setDocName("");
    setCategory("Identité");
    setSelectedFile(null);
    setIsDragging(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    if (!docName.trim()) {
      // Remove extension for the document title
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setDocName(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    setIsSubmitting(true);

    // Resolve file URL: if user selected a real file in browser, create an object URL,
    // otherwise map to the corresponding real pre-loaded PDF for that category
    let fileUrl: string | undefined;
    let fileSize: string | undefined;

    if (selectedFile) {
      fileUrl = URL.createObjectURL(selectedFile);
      const sizeKb = Math.round(selectedFile.size / 1024);
      fileSize = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} Mo` : `${sizeKb} Ko`;
    } else {
      const resolved = getDocumentPdf({ name: docName, category });
      fileUrl = resolved.url;
      fileSize = resolved.size;
    }

    const newDocument: ClientDocument = {
      name: docName.trim(),
      category,
      status: "Validé",
      date: new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      ref: `CFC-DUC-${Math.floor(1000 + Math.random() * 9000)}`,
      fileUrl,
      fileSize,
    };

    onAddDocument(newDocument);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-lg bg-background text-foreground border border-border/40 p-6 rounded-xl shadow-lg space-y-4">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-base font-semibold text-foreground">
            Ajouter un document au Dossier Unique Client (DUC)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Numérisation certifiée et scellement dans la GED sécurisée du CFC.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone matching the user capture */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Document physique ou numérique
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              className={`border border-dashed rounded-xl py-9 px-6 text-center flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/80 bg-background/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleInputChange}
                className="hidden"
              />

              <FileText className="size-8 text-muted-foreground/60 mb-2.5" />
              <p className="text-xs text-muted-foreground select-none">
                Drop your documents here, or select
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline mt-0.5 select-none focus:outline-hidden"
              >
                click to browse
              </button>
            </div>

            {/* Selected File Card */}
            {selectedFile && (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/20 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-foreground truncate block">
                    {selectedFile.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                    {selectedFile.size > 1024 * 1024
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo`
                      : `${Math.round(selectedFile.size / 1024)} Ko`}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-rose-600 p-1 rounded-md"
                  title="Retirer la pièce"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Document Name input */}
          <div className="space-y-1.5">
            <label htmlFor="doc-title" className="text-xs font-medium text-foreground">
              Intitulé de la pièce justificative
            </label>
            <Input
              id="doc-title"
              placeholder="Ex: Certificat de Propriété Foncier, Attestation d'emploi..."
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="h-9 text-xs bg-background"
              required
            />
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label htmlFor="doc-category" className="text-xs font-medium text-foreground">
              Chemise DUC (Catégorie)
            </label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as ClientDocument["category"])}
            >
              <SelectTrigger id="doc-category" className="h-9 text-xs bg-background">
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Identité" className="text-xs">
                  Identité &amp; État Civil
                </SelectItem>
                <SelectItem value="Foncier" className="text-xs">
                  Foncier &amp; Propriété
                </SelectItem>
                <SelectItem value="Technique" className="text-xs">
                  Technique &amp; BET / Permis
                </SelectItem>
                <SelectItem value="Finances" className="text-xs">
                  Finances &amp; Revenus
                </SelectItem>
                <SelectItem value="Assurance" className="text-xs">
                  Assurance &amp; Hypothèque
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="text-xs h-9"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!docName.trim() || isSubmitting}
              className="text-xs h-9 font-medium gap-1.5"
            >
              <Upload className="size-3.5" />
              Indexer au DUC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
