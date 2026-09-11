"use client";

import * as React from "react";
import {
  Download,
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
  { id: "01-kyc", name: "01 - Identité & KYC (DUC)", fileCount: 2, size: "4.5 MB", updatedAt: "Il y a 10 min" },
  { id: "02-revenus", name: "02 - Revenus & Solvabilité", fileCount: 3, size: "6.2 MB", updatedAt: "Hier" },
  { id: "03-foncier", name: "03 - Foncier & Titre Foncier (MINDCAF)", fileCount: 2, size: "18.4 MB", updatedAt: "01 Sept" },
  { id: "04-technique", name: "04 - Devis, Plans & Expertises BET", fileCount: 4, size: "32.0 MB", updatedAt: "28 Août" },
  { id: "05-comites", name: "05 - Décisions Comités (CGR, CRC)", fileCount: 1, size: "1.8 MB", updatedAt: "25 Août" },
  { id: "06-notaire", name: "06 - Notaires & Hypothèques", fileCount: 2, size: "8.1 MB", updatedAt: "20 Août" },
];

function generateClientFiles(client: ClientItem): DucFile[] {
  return [
    {
      id: `f-${client.id}-1`,
      name: `CNI_Certifiee_${client.ducId}.pdf`,
      kind: "pdf",
      size: "2.4 MB",
      folderId: "01-kyc",
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
      folderId: "01-kyc",
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
      folderId: "02-revenus",
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
      folderId: "02-revenus",
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
      folderId: "03-foncier",
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
      folderId: "03-foncier",
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
      folderId: "04-technique",
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
      folderId: "04-technique",
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
      folderId: "04-technique",
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
      folderId: "05-comites",
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
      folderId: "06-notaire",
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
      folderId: "06-notaire",
      owner: "Compagnie Assurance CIMA",
      modifiedAt: "06 Sept 2026",
      starred: false,
      status: "Validé",
    },
  ];
}

interface ClientDucManagerProps {
  client: ClientItem | null;
  onSelectClient?: (client: ClientItem) => void;
}

export function ClientDucManager({ client, onSelectClient }: ClientDucManagerProps) {
  const [activeView, setActiveView] = React.useState<"grid" | "list">("grid");
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | "all">("all");
  const [search, setSearch] = React.useState("");
  const [selectedKind, setSelectedKind] = React.useState<string>("all");

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card space-y-4 my-6">
        <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FolderOpen className="size-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-lg font-bold text-foreground">Aucun Dossier DUC Sélectionné</h3>
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

  const clientFiles = generateClientFiles(client);

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
            onClick={() => {
              alert("Module d'import sécurisé de pièce justificative GED.");
            }}
          >
            <Upload className="size-3.5" />
            Téléverser une pièce
          </Button>
        </div>
      </div>

      {/* 2. Folders Section (6 Regulatory DUC Folders) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Chemises Réglementaires DUC
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
          <span className="text-xs text-muted-foreground font-mono">{defaultDucFolders.length} dossiers</span>
        </div>

        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {defaultDucFolders.map((folder) => {
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
              <Card key={file.id} size="sm" className="group/file hover:border-primary/40 transition-all">
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
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px] rounded-md h-4 px-1.5 font-medium">
                      <FileCheck className="size-2.5 mr-1" />
                      {file.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground">
                      <Download className="size-3" />
                    </Button>
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
                className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-xs"
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

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                    {file.modifiedAt}
                  </span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-[10px] rounded-md h-4.5 px-1.5 font-medium">
                    {file.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="size-7 rounded-md">
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
