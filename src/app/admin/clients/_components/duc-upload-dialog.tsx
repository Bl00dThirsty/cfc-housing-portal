"use client";

import * as React from "react";
import { Upload, Shield } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { type ClientItem } from "./data";
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

export function DucUploadDialog({
  open,
  onOpenChange,
  client,
  onDocumentUploaded,
}: DucUploadDialogProps) {
  const { currentUser } = useAuth();

  const [docName, setDocName] = React.useState("");
  const [folderId, setFolderId] = React.useState("c1-id");
  const [fileKind, setFileKind] = React.useState<DucFileKind>("pdf");
  const [fileSize, setFileSize] = React.useState("2.4 MB");
  const [version, setVersion] = React.useState("v1.0");
  const [issuer, setIssuer] = React.useState("Guichet Agence");
  const [decision, setDecision] = React.useState<"Validé" | "Rejeté" | "En cours">("Validé");
  const [rejectReason, setRejectReason] = React.useState("");

  if (!client) return null;

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      alert("Veuillez renseigner le nom de la pièce.");
      return;
    }

    if (decision === "Rejeté" && !rejectReason.trim()) {
      alert("En cas de rejet, le motif circonstancié est obligatoire (Règle CFC-03).");
      return;
    }

    const cleanName = docName.endsWith(".pdf") || docName.includes(".") ? docName : `${docName}.pdf`;
    const newFile: DucFile = {
      id: `f-${client.id}-${Date.now()}`,
      name: cleanName,
      kind: fileKind,
      size: fileSize,
      folderId,
      owner: issuer,
      modifiedAt: "Aujourd'hui",
      starred: false,
      status: decision === "Rejeté" ? "Rejeté" : "Validé",
    };

    const newAuditLog: DucAuditLogEntry = {
      id: `log-${Date.now()}`,
      docName: cleanName,
      folderId,
      action: decision === "Rejeté" ? "Rejet Documentaire" : "Visa Favorable",
      author: `${currentUser.name} (${currentUser.roleLabel})`,
      role: currentUser.role,
      date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      version,
      comment: decision === "Rejeté" ? rejectReason : "Pièce vérifiée conforme, lisible et scellée dans le DUC.",
      status: decision === "Rejeté" ? "Rejeté" : "Validé",
    };

    onDocumentUploaded(newFile, newAuditLog);
    setDocName("");
    setRejectReason("");
    setDecision("Validé");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Header */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-t-2xl space-y-1.5">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Workflow CFC-03 · Gestion Documentaire DUC
              </span>
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-300 font-mono">
                {client.ducId}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-white">
              Téléverser, Indexer &amp; Viser une Pièce GED
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300">
              Rattachement scellé au Dossier Unique de <strong>{client.name}</strong> avec traçabilité et visa métier.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Intitulé Officiel de la Pièce *
            </label>
            <Input
              required
              placeholder="Ex: CNI_Legalisee_Demandeur.pdf ou Attestation_Emploi_2026.pdf"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="text-xs h-8 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Chemise DUC de Destination (CFC-09)
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="c1-id">C1 · Identification (KYC, Demande)</option>
                <option value="c2-instruction">C2 · Instruction (Analyses, Avis, PV)</option>
                <option value="c3-garanties">C3 · Garanties (Contrat, Hypothèque, Assurance)</option>
                <option value="c4-vie">C4 · Vie du prêt (Déblocages, Quittances)</option>
                <option value="c5-contentieux">C5 · Contentieux (Actes si applicable)</option>
                <option value="c6-cloture">C6 · Clôture (Solde, Mainlevée)</option>
                <option value="07-enquetes">C7 · Enquêtes &amp; Audits Réglementaires</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nature du Fichier
              </label>
              <select
                value={fileKind}
                onChange={(e) => setFileKind(e.target.value as DucFileKind)}
                className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pdf">Pièce Numérisée (PDF)</option>
                <option value="document">Acte / Convention Notariée</option>
                <option value="spreadsheet">Devis Quantitatif Estimatif (Excel)</option>
                <option value="design">Plan d&apos;Architecte (DWG / Image)</option>
                <option value="archive">Archive ZIP / Dossier Technique</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Émetteur / Source
              </label>
              <Input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="text-xs h-8"
                placeholder="Client, Notaire, BET..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Version Documentaire
              </label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="text-xs h-8 font-mono"
                placeholder="v1.0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Taille Estimée
              </label>
              <Input
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                className="text-xs h-8 font-mono"
                placeholder="2.5 MB"
              />
            </div>
          </div>

          {/* Decision / Visa métier according to CFC-03 */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" />
                Contrôle de Recevabilité &amp; Visa Métier
              </label>
              <span className="text-[10.5px] text-muted-foreground font-mono">
                Par : {currentUser.name}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-emerald-700 dark:text-emerald-400">
                <input
                  type="radio"
                  name="decision"
                  value="Validé"
                  checked={decision === "Validé"}
                  onChange={() => setDecision("Validé")}
                  className="size-3.5 text-emerald-600 focus:ring-emerald-500"
                />
                Recevable &amp; Visé conforme
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-rose-700 dark:text-rose-400">
                <input
                  type="radio"
                  name="decision"
                  value="Rejeté"
                  checked={decision === "Rejeté"}
                  onChange={() => setDecision("Rejeté")}
                  className="size-3.5 text-rose-600 focus:ring-rose-500"
                />
                Rejeter avec motif
              </label>
            </div>

            {decision === "Rejeté" && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">
                  Motif formel du rejet (exigé pour notification et journal) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Document non signé, absence du cachet du géomètre assermenté ou pièce floue..."
                  className="w-full rounded-md border border-rose-300 bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Upload className="size-3.5" />
              Indexer &amp; Enregistrer au DUC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
