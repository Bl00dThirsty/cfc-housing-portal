"use client";

import * as React from "react";
import {
  Download,
  Eye,
  File,
  FileArchive,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Grid2X2,
  List,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { type ClientItem, clientsData } from "./data";
import { DucDocumentViewerDialog } from "./duc-document-viewer-dialog";
import { DucUploadDialog, type DucAuditLogEntry } from "./duc-upload-dialog";

export type DucFileKind = "document" | "spreadsheet" | "design" | "pdf" | "archive";

export interface DucFolder {
  id: string;
  name: string;
  fileCount: number;
  size: string;
  updatedAt: string;
}

export interface DucFile {
  id: string;
  name: string;
  kind: DucFileKind;
  size: string;
  folderId: string;
  owner: string;
  modifiedAt: string;
  starred: boolean;
  status: "Validé" | "En cours" | "Rejeté";
}

const ducFileIcons: Record<DucFileKind, typeof File> = {
  archive: FileArchive,
  design: FileImage,
  document: FileText,
  pdf: File,
  spreadsheet: FileSpreadsheet,
};

const ducFileLabels: Record<DucFileKind, string> = {
  archive: "Archive ZIP",
  design: "Plan Architectural",
  document: "Acte Juridique",
  pdf: "Pièce Numérisée",
  spreadsheet: "Devis Quantitatif",
};

export const defaultDucFolders: DucFolder[] = [
  { id: "c1-id", name: "C1 · Identification : KYC & Demande", fileCount: 2, size: "4.2 MB", updatedAt: "Il y a 10 min" },
  { id: "c2-instruction", name: "C2 · Instruction : Analyses & Décision", fileCount: 6, size: "32.7 MB", updatedAt: "Hier" },
  { id: "c3-garanties", name: "C3 · Garanties : Hypothèque & Assurances", fileCount: 4, size: "25.4 MB", updatedAt: "01 Sept" },
  { id: "c4-vie", name: "C4 · Vie du prêt : Déblocages & Quittances", fileCount: 0, size: "0 MB", updatedAt: "En cours" },
  { id: "c5-contentieux", name: "C5 · Contentieux : Actes & Recouvrement", fileCount: 0, size: "0 MB", updatedAt: "N/A" },
  { id: "c6-cloture", name: "C6 · Clôture : Solde & Mainlevée", fileCount: 0, size: "0 MB", updatedAt: "N/A" },
  { id: "07-enquetes", name: "C7 · Enquêtes & Audits (ANC/CFC)", fileCount: 4, size: "14.6 MB", updatedAt: "Audit Mai 2026" },
];

function generateClientFiles(client: ClientItem): DucFile[] {
  return [
    {
      id: `f-${client.id}-1`,
      name: `CNI_Certifiee_${client.ducId}.pdf`,
      kind: "pdf",
      size: "2.4 MB",
      folderId: "c1-id",
      owner: client.officer,
      modifiedAt: "12 Août 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-2`,
      name: "Acte_Mariage_Regime_Legal.pdf",
      kind: "document",
      size: "1.8 MB",
      folderId: "c1-id",
      owner: client.officer,
      modifiedAt: "14 Août 2026",
      starred: false,
      status: "Validé",
    },
    {
      id: `f-${client.id}-3`,
      name: "3_Derniers_Bulletins_Paie_Signes.pdf",
      kind: "pdf",
      size: "3.2 MB",
      folderId: "c2-instruction",
      owner: client.employer,
      modifiedAt: "16 Août 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-4`,
      name: `Attestation_Solde_Carthago_${client.accountNumber}.pdf`,
      kind: "pdf",
      size: "1.1 MB",
      folderId: "c2-instruction",
      owner: "Core Banking Carthago",
      modifiedAt: "20 Août 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-5`,
      name: `Certificat_Propriete_${client.landTitle.replace(/\s+/g, "_")}.pdf`,
      kind: "pdf",
      size: "8.5 MB",
      folderId: "c3-garanties",
      owner: "Conservation Foncière MINDCAF",
      modifiedAt: "18 Août 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-6`,
      name: "Plan_Bornage_Geometre_Assermente.dwg",
      kind: "design",
      size: "9.9 MB",
      folderId: "c3-garanties",
      owner: "Ordre des Géomètres",
      modifiedAt: "19 Août 2026",
      starred: false,
      status: "Validé",
    },
    {
      id: `f-${client.id}-7`,
      name: `Devis_Quantitatif_Estimatif_${client.betAssigned.replace(/\s+/g, "_")}.xlsx`,
      kind: "spreadsheet",
      size: "4.8 MB",
      folderId: "c2-instruction",
      owner: client.betAssigned,
      modifiedAt: "24 Août 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-8`,
      name: "Permis_de_Batir_Vise_CUY.pdf",
      kind: "pdf",
      size: "5.6 MB",
      folderId: "c2-instruction",
      owner: "Communauté Urbaine",
      modifiedAt: "26 Août 2026",
      starred: false,
      status: "Validé",
    },
    {
      id: `f-${client.id}-9`,
      name: "Plans_Architecturaux_R+1.pdf",
      kind: "design",
      size: "18.2 MB",
      folderId: "c2-instruction",
      owner: "Cabinet Architecte",
      modifiedAt: "25 Août 2026",
      starred: false,
      status: "Validé",
    },
    {
      id: `f-${client.id}-10`,
      name: "PV_Decision_Comite_Credit_CRC.pdf",
      kind: "pdf",
      size: "1.8 MB",
      folderId: "c2-instruction",
      owner: "Secrétariat CRC",
      modifiedAt: "02 Sept 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-11`,
      name: `Projet_Acte_Notarie_${client.notaryAssigned.replace(/\s+/g, "_")}.pdf`,
      kind: "document",
      size: "4.1 MB",
      folderId: "c3-garanties",
      owner: client.notaryAssigned,
      modifiedAt: "05 Sept 2026",
      starred: false,
      status: "En cours",
    },
    {
      id: `f-${client.id}-12`,
      name: "Police_Assurance_Incendie_AXA.pdf",
      kind: "pdf",
      size: "2.9 MB",
      folderId: "c3-garanties",
      owner: "Compagnie Assurance CIMA",
      modifiedAt: "06 Sept 2026",
      starred: false,
      status: "Validé",
    },
    {
      id: `f-${client.id}-13`,
      name: "Rapport_Enquete_Agence_Regionale_Centre_ANC_CFC.pdf",
      kind: "pdf",
      size: "3.8 MB",
      folderId: "07-enquetes",
      owner: "Archives Nationales (ANC)",
      modifiedAt: "26 Mai 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-14`,
      name: "Fiche_Anomalie_Documentaire_ANO-001_Fragmentation_DUC.pdf",
      kind: "document",
      size: "1.4 MB",
      folderId: "07-enquetes",
      owner: "Équipe 4 Audit ANC/CFC",
      modifiedAt: "18 Mai 2026",
      starred: true,
      status: "Validé",
    },
    {
      id: `f-${client.id}-15`,
      name: "Grille_Audit_Releve_Locaux_Conservation_Titres.pdf",
      kind: "document",
      size: "4.2 MB",
      folderId: "07-enquetes",
      owner: "Commission Sécurité ANC",
      modifiedAt: "22 Mai 2026",
      starred: false,
      status: "Validé",
    },
    {
      id: `f-${client.id}-16`,
      name: "Cartographie_Flux_Production_Credits_G1.pdf",
      kind: "pdf",
      size: "5.2 MB",
      folderId: "07-enquetes",
      owner: "Sous-Direction Crédits CFC",
      modifiedAt: "28 Mai 2026",
      starred: true,
      status: "Validé",
    },
  ];
}

const initialAuditLogs: DucAuditLogEntry[] = [
  {
    id: "log-1",
    date: "12/08/2026 10:14",
    docName: "CNI_Certifiee.pdf",
    folderId: "c1-id",
    action: "Visa Favorable",
    author: "M. Eko (Guichet)",
    role: "Chargé d'Accueil",
    version: "v1.0",
    status: "Validé",
  },
  {
    id: "log-2",
    date: "16/08/2026 14:30",
    docName: "3_Derniers_Bulletins_Paie_Signes.pdf",
    folderId: "c2-instruction",
    action: "Visa Favorable",
    author: "Mme Atangana (Risques)",
    role: "Analyste Risques / Crédit",
    version: "v1.0",
    status: "Validé",
  },
  {
    id: "log-3",
    date: "19/08/2026 11:22",
    docName: "Plan_Bornage_Geometre_Assermente.dwg",
    folderId: "c3-garanties",
    action: "Rejet Documentaire",
    author: "BET BTP Cameroun",
    role: "Expert Foncier / BET",
    version: "v0.9",
    comment: "Signature de l'Ordre des Géomètres manquante au verso.",
    status: "Rejeté",
  },
  {
    id: "log-4",
    date: "02/09/2026 16:45",
    docName: "PV_Decision_Comite_Credit_CRC.pdf",
    folderId: "c2-instruction",
    action: "Visa Favorable",
    author: "Comité CRC",
    role: "Direction Générale",
    version: "v1.0",
    status: "Validé",
  },
];

interface ClientDucManagerProps {
  client: ClientItem | null;
  onSelectClient?: (client: ClientItem) => void;
}

export function ClientDucManager({ client, onSelectClient }: ClientDucManagerProps) {
  const [activeView, setActiveView] = React.useState<"grid" | "list">("grid");
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | "all">("all");
  const [search, setSearch] = React.useState("");
  const [selectedKind, setSelectedKind] = React.useState<string>("all");
  const [previewFile, setPreviewFile] = React.useState<DucFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [customFiles, setCustomFiles] = React.useState<Record<string, DucFile[]>>({});
  const [auditLogs, setAuditLogs] = React.useState<DucAuditLogEntry[]>(initialAuditLogs);

  const baseFiles = React.useMemo(() => (client ? generateClientFiles(client) : []), [client]);
  const clientFiles = React.useMemo(() => {
    if (!client) return [];
    return [...(customFiles[client.id] || []), ...baseFiles];
  }, [client, customFiles, baseFiles]);

  const foldersWithCounts = React.useMemo(() => {
    return defaultDucFolders.map((f) => ({
      ...f,
      fileCount: clientFiles.filter((doc) => doc.folderId === f.id).length,
    }));
  }, [clientFiles]);

  const handleDocumentUploaded = (newFile: DucFile, auditEntry: DucAuditLogEntry) => {
    if (!client) return;
    setCustomFiles((prev) => ({
      ...prev,
      [client.id]: [newFile, ...(prev[client.id] || [])],
    }));
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card space-y-4 my-6">
        <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FolderOpen className="size-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-lg font-bold text-foreground">Aucun Dossier Unique Client (DUC) Sélectionné</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pour accéder à l&apos;arborescence des pièces scellées et aux justificatifs GED, veuillez d&apos;abord sélectionner un emprunteur dans le répertoire.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {clientsData.slice(0, 4).map((c) => (
            <Button
              key={c.id}
              variant="outline"
              size="sm"
              className="text-xs rounded-md gap-1.5"
              onClick={() => onSelectClient?.(c)}
            >
              {c.name} ({c.ducId})
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const filteredFiles = clientFiles.filter((file) => {
    const matchesSearch =
      !search ||
      file.name.toLowerCase().includes(search.toLowerCase()) ||
      file.owner.toLowerCase().includes(search.toLowerCase());

    const matchesFolder = selectedFolderId === "all" || file.folderId === selectedFolderId;
    const matchesKind = selectedKind === "all" || file.kind === selectedKind;

    return matchesSearch && matchesFolder && matchesKind;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 rounded-lg border bg-muted/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-background">
              {client.ducId}
            </Badge>
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Dossier Numérique DUC · GED Scellée de {client.name}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {client.projectType} · Foncier: <strong className="text-foreground">{client.landTitle}</strong> · Total: 12 pièces répertoriées
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-md text-xs"
            onClick={() => {
              const name = prompt("Nom de la nouvelle chemise / dossier :");
              if (name) alert(`Dossier "${name}" créé avec succès.`);
            }}
          >
            <FolderPlus className="size-3.5" />
            Nouveau dossier
          </Button>

          <Button
            size="sm"
            className="gap-1.5 rounded-md text-xs font-semibold"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="size-3.5" />
            Téléverser une pièce
          </Button>
        </div>
      </div>

      {/* 2. Folders Section (Official Regulatory DUC Folders CFC-09) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Chemises Réglementaires DUC (CFC-09)
            </h3>
            {selectedFolderId !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10.5px] px-1.5 text-primary"
                onClick={() => setSelectedFolderId("all")}
              >
                Afficher tous les dossiers
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">{foldersWithCounts.length} chemises</span>
        </div>

        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {foldersWithCounts.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(isSelected ? "all" : folder.id)}
                className={cn(
                  "flex flex-col justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer",
                  isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
                )}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className={cn(
                    "flex size-7 items-center justify-center rounded-md",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Folder className="size-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {folder.fileCount} docs
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-foreground block truncate leading-tight">
                    {folder.name.replace(/^\d+\s*-\s*/, "")}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    {folder.size}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Toolbar & View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between pt-1">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <InputGroup className="w-full">
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une pièce scellée..."
              className="h-8 text-xs"
            />
            <InputGroupAddon>
              <Search className="size-3.5" />
            </InputGroupAddon>
          </InputGroup>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-md">
                <SlidersHorizontal className="size-3.5" />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={selectedKind} onValueChange={setSelectedKind}>
                <DropdownMenuRadioItem value="all">Tous les types</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pdf">Pièces PDF</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="document">Actes &amp; Conventions</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="design">Plans d&apos;Architecture</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="spreadsheet">Devis &amp; DQE</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground font-mono">
            {filteredFiles.length} document(s)
          </span>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={activeView}
            onValueChange={(val) => val && setActiveView(val as "grid" | "list")}
            className="h-8"
          >
            <ToggleGroupItem value="grid" className="h-8 px-2">
              <Grid2X2 className="size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="h-8 px-2">
              <List className="size-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* 4. Files Explorer View (Grid / List) */}
      {activeView === "grid" ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const Icon = ducFileIcons[file.kind];
            return (
              <Card
                key={file.id}
                size="sm"
                className="group/file hover:border-primary/50 transition-all cursor-pointer hover:shadow-xs"
                onClick={() => setPreviewFile(file)}
              >
                <CardContent className="p-3">
                  <div className="relative flex h-28 items-center justify-center rounded-md bg-muted/40 border border-border/40">
                    <Icon className="size-10 text-muted-foreground/80 group-hover/file:text-primary transition-colors" />
                    <span className="absolute bottom-2 left-2 text-[10px] text-muted-foreground font-mono">
                      {ducFileLabels[file.kind]}
                    </span>
                    <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground font-mono">
                      {file.size}
                    </span>
                  </div>
                </CardContent>
                <CardHeader className="p-3 pt-0 space-y-1">
                  <CardTitle className="truncate text-xs font-semibold text-foreground group-hover/file:text-primary transition-colors">
                    {file.name}
                  </CardTitle>
                  <CardDescription className="truncate text-[10.5px]">
                    Modifié le {file.modifiedAt} · {file.owner}
                  </CardDescription>
                  <div className="flex items-center justify-between pt-1 gap-1">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px] rounded-md h-4 px-1.5 font-medium shrink-0">
                      <FileCheck className="size-2.5 mr-1" />
                      {file.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-1.5 text-[10.5px] gap-1 rounded-md text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile(file);
                        }}
                      >
                        <Eye className="size-3" />
                        Visualiser
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {filteredFiles.map((file) => {
            const Icon = ducFileIcons[file.kind];
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-xs cursor-pointer"
                onClick={() => setPreviewFile(file)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted text-primary shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-semibold text-foreground truncate block">{file.name}</span>
                    <span className="text-[11px] text-muted-foreground block font-mono">
                      {ducFileLabels[file.kind]} · {file.size} · Émis par {file.owner}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                    {file.modifiedAt}
                  </span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px] rounded-md h-4.5 px-1.5 font-medium">
                    {file.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 rounded-md text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                  >
                    <Eye className="size-3.5" />
                    Visualiser
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Journal d'Audit Documentaire du DUC (Conforme Workflow CFC-03) */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                Journal d&apos;Audit Documentaire du DUC (Workflow CFC-03)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Traçabilité certifiée des visas, conformités réglementaires et motifs obligatoires de rejet.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs w-fit">
            {auditLogs.length} événements scellés
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground font-medium text-[11px]">
                <th className="py-2 px-2 font-mono">Horodatage</th>
                <th className="py-2 px-2">Document</th>
                <th className="py-2 px-2">Chemise DUC</th>
                <th className="py-2 px-2">Action / Visa</th>
                <th className="py-2 px-2">Intervenant &amp; Rôle</th>
                <th className="py-2 px-2">Observations / Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {log.date}
                  </td>
                  <td className="py-2 px-2 font-semibold text-foreground max-w-[200px] truncate">
                    {log.docName}
                    {log.version && (
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">({log.version})</span>
                    )}
                  </td>
                  <td className="py-2 px-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {defaultDucFolders.find((f) => f.id === log.folderId)?.name.split(" : ")[0] || log.folderId}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    {log.action === "Visa Favorable" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 text-[10px] rounded-md font-medium border-emerald-200">
                        Visa Favorable
                      </Badge>
                    ) : log.action === "Rejet Documentaire" ? (
                      <Badge variant="destructive" className="text-[10px] rounded-md font-medium">
                        Rejet Documentaire
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] rounded-md font-medium">
                        {log.action}
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-semibold block text-foreground">{log.author}</span>
                    <span className="text-[10px] text-muted-foreground">{log.role}</span>
                  </td>
                  <td className="py-2 px-2 max-w-[260px]">
                    {log.comment ? (
                      <span className="text-destructive font-medium text-[11px] block italic leading-tight">
                        {log.comment}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">Conforme aux critères d&apos;éligibilité CFC</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Document Viewer Modal */}
      <DucDocumentViewerDialog
        file={previewFile}
        client={client}
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />

      {/* 7. Document Upload & Indexing Dialog (CFC-03) */}
      <DucUploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        client={client}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </div>
  );
}
