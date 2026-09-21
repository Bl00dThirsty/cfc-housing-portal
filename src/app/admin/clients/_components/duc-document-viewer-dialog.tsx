"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
  Fingerprint,
  Printer,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

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

import { type ClientItem, getDocumentPdf } from "./data";
import { INVESTIGATION_DOCUMENTS, type InvestigationDocumentData } from "./duc-investigation-data";

export interface DucViewerFile {
  id: string;
  name: string;
  kind: string;
  size: string;
  owner: string;
  modifiedAt: string;
  status: "Validé" | "En cours" | "Rejeté";
  folderId?: string;
}

interface DucDocumentViewerDialogProps {
  file: DucViewerFile | null;
  client: ClientItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DucDocumentViewerDialog({
  file,
  client,
  open,
  onOpenChange,
}: DucDocumentViewerDialogProps) {
  if (!file) return null;

  const isInvestigation = Boolean(INVESTIGATION_DOCUMENTS[file.name]);
  const invData: InvestigationDocumentData | undefined = INVESTIGATION_DOCUMENTS[file.name];
  const pdfInfo = getDocumentPdf({ name: file.name, category: file.kind });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl bg-background border border-border/50 shadow-lg">
        {/* Uniform White Header */}
        <div className="bg-background text-foreground p-5 border-b border-border/40 space-y-3">
          <DialogHeader className="text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {isInvestigation ? "Audit & Enquête Officielle" : "Dossier Unique Client (DUC) — GED Scellée"}
                  </span>
                  <Badge variant="outline" className="text-[9.5px] font-mono text-muted-foreground">
                    {invData?.docRef || `GED-${file.id.toUpperCase()}`}
                  </Badge>
                </div>
                <DialogTitle className="text-base font-semibold text-foreground leading-tight">
                  {invData?.title || file.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {invData?.subtitle || `Visualisation du document scellé ${file.name}`}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-7 text-xs gap-1 rounded-md"
                >
                  <Printer className="size-3" />
                  Imprimer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="h-7 text-xs gap-1 rounded-md font-medium"
                >
                  <a href={pdfInfo.url} download={file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`}>
                    <Download className="size-3" />
                    Télécharger
                  </a>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Sub-Header Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
            <div>
              <span className="text-muted-foreground/70 block text-[9.5px]">Émetteur / Auditeur</span>
              <span className="font-medium text-foreground truncate block">{invData?.organization || file.owner}</span>
            </div>
            <div>
              <span className="text-muted-foreground/70 block text-[9.5px]">Date d&apos;enregistrement</span>
              <span className="font-medium text-foreground block">{invData?.date || file.modifiedAt}</span>
            </div>
            <div>
              <span className="text-muted-foreground/70 block text-[9.5px]">Statut Réglementaire</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="size-3" />
                {invData?.status || file.status}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/70 block text-[9.5px]">Taille &amp; Scellement</span>
              <span className="font-mono text-foreground block">{file.size} · SHA-256</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 bg-background">
          {/* A. If It's an Investigation Document */}
          {invData ? (
            <div className="space-y-6">
              {/* Official Republic Header Box */}
              <div className="p-4 rounded-xl border bg-card text-center space-y-1 shadow-2xs">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {invData.officialHeader.country}
                </p>
                <p className="text-[10px] text-muted-foreground italic">
                  {invData.officialHeader.motto}
                </p>
                <p className="text-[11px] font-semibold text-primary">
                  {invData.officialHeader.ministry}
                </p>
                <p className="text-[10.5px] font-medium text-foreground">
                  {invData.officialHeader.subEntity}
                </p>
                <p className="text-[9.5px] text-muted-foreground font-mono">
                  {invData.officialHeader.contact}
                </p>
              </div>

              {/* Summary Alert Box */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Synthèse de l&apos;Acte d&apos;Enquête
                  </span>
                  <Badge variant="outline" className="text-[9px] ml-auto border-blue-300 text-blue-700 dark:text-blue-300">
                    Criticité : {invData.criticality}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {invData.summary}
                </p>
              </div>

              {/* Document Sections */}
              <div className="space-y-4">
                {invData.sections.map((section, idx) => (
                  <div key={idx} className="p-4 rounded-xl border bg-card space-y-2 shadow-2xs">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {section.title}
                    </h4>

                    {section.type === "table" && section.tableData ? (
                      <div className="overflow-x-auto rounded-lg border text-xs mt-2">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-muted/60 text-[10.5px] font-semibold text-muted-foreground">
                            <tr>
                              {section.tableData.headers.map((h, i) => (
                                <th key={i} className="p-2 border-b">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y text-[11px]">
                            {section.tableData.rows.map((row, ri) => (
                              <tr key={ri} className="hover:bg-muted/20">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="p-2 align-top text-foreground">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : section.type === "warning" ? (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-line">
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="size-3.5" />
                          Constats Critiques Relevés
                        </div>
                        {section.content}
                      </div>
                    ) : section.type === "quote" ? (
                      <blockquote className="border-l-2 border-primary pl-3 py-1 text-xs italic text-muted-foreground bg-muted/20 rounded-r-md">
                        {section.content}
                      </blockquote>
                    ) : section.type === "highlight" ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="size-3.5" />
                          Solution Guichet Unique Validée
                        </div>
                        {section.content}
                      </div>
                    ) : (
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Recommendations Box */}
              {invData.recommendations.length > 0 && (
                <div className="p-4 rounded-xl border bg-card space-y-2.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Recommandations Immédiates &amp; Plan d&apos;Action
                  </h4>
                  <ul className="space-y-1.5">
                    {invData.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-foreground/90 flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Signatories & Official Stamp Block */}
              <div className="p-4 rounded-xl border bg-card space-y-3">
                <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Visas &amp; Signatures Conjointes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {invData.signatories.map((sig, i) => (
                    <div key={i} className="p-2.5 rounded-lg border bg-muted/20 space-y-1 text-center">
                      <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                        <UserCheck className="size-4" />
                      </div>
                      <p className="text-xs font-bold text-foreground">{sig.name}</p>
                      <p className="text-[10px] text-muted-foreground">{sig.title}</p>
                      <Badge variant="outline" className="text-[8.5px] px-1 py-0 h-4 border-emerald-500/30 text-emerald-700">
                        {sig.entity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Proof Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border bg-muted/30 text-[10px] text-muted-foreground font-mono">
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="size-3.5 text-primary" />
                  <span>Empreinte SHA-256 :</span>
                  <span className="text-foreground font-bold truncate max-w-[280px]">
                    {invData.sha256Hash}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[9px] w-fit">
                  Registre National CFC #2026-ARCH
                </Badge>
              </div>
            </div>
          ) : (
            /* B. If It's a Standard Client DUC Piece */
            <div className="space-y-5">
              {/* Document Certificate Frame */}
              <div className="p-5 rounded-xl border bg-card space-y-4 shadow-xs text-center relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold text-muted-foreground tracking-widest uppercase">
                    Crédit Foncier du Cameroun · Dossier Unique Client (DUC)
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    Certificat de Conformité Documentaire
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pièce scellée pour l&apos;emprunteur <strong>{client?.name}</strong> ({client?.ducId})
                  </p>
                </div>

                <div className="py-4 border-y border-dashed my-3 space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <FileCheck className="size-8 text-emerald-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground font-mono">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Catégorie : {file.kind.toUpperCase()} · Déposé le {file.modifiedAt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Structured Mock Details based on File Type */}
                <div className="text-left text-xs space-y-2 bg-muted/30 p-3 rounded-lg border">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Identifiant Unique DUC :</span>
                    <span className="font-mono font-bold text-foreground">{client?.ducId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Projet Emprunt :</span>
                    <span className="font-semibold text-foreground">{client?.projectType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Montant du Prêt Sollicité :</span>
                    <span className="font-mono font-semibold text-foreground">{client?.loanAmount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Garantie Hypothécaire :</span>
                    <span className="font-mono font-semibold text-foreground">{client?.landTitle}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Gestionnaire &amp; Agence :</span>
                    <span className="font-semibold text-foreground">{client?.officer} ({client?.agency})</span>
                  </div>
                </div>

                {/* Real PDF Viewer Frame */}
                <div className="rounded-xl border border-border/40 overflow-hidden bg-background h-[480px]">
                  <iframe
                    src={`${pdfInfo.url}#toolbar=1&navpanes=0`}
                    title={file.name}
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Seal Stamp */}
                <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="size-4" />
                  Pièce intégrée et scellée au Dossier Unique Client (DUC) sans réserve
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-card flex sm:justify-between items-center">
          <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
            Système d&apos;Archivage &amp; Dossier Unique Client (DUC) · CFC
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-xs"
          >
            Fermer l&apos;Aperçu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
