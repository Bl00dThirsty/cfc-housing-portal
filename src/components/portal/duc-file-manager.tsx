"use client";

import { useState } from "react";
import {
  Folder,
  FileText,
  ShieldCheck,
  Upload,
  FolderPlus,
  Grid2X2,
  List,
  Clock,
  Download,
  Eye,
  Star,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface DucFolder {
  id: string;
  name: string;
  category: "kyc" | "income" | "land" | "technical" | "committee" | "legal";
  fileCount: number;
  size: string;
  updatedAt: string;
  status: "Complet" | "En attente" | "En cours de revue";
}

export interface DucFile {
  id: string;
  name: string;
  kind: "kyc" | "income" | "land" | "technical" | "committee" | "legal";
  folderId: string;
  ducId: string;
  customerName: string;
  size: string;
  owner: string;
  ownerInitials: string;
  modifiedAt: string;
  complianceStatus: "Conforme" | "En attente" | "Rejeté";
  integrityHash: string;
  starred: boolean;
}

const DUC_FOLDERS: DucFolder[] = [
  {
    id: "duc-kyc",
    name: "01 - Identité & KYC (DUC)",
    category: "kyc",
    fileCount: 2,
    size: "2.2 MB",
    updatedAt: "Il y a 10 min",
    status: "Complet",
  },
  {
    id: "duc-income",
    name: "02 - Revenus & Solvabilité",
    category: "income",
    fileCount: 1,
    size: "2.8 MB",
    updatedAt: "Hier",
    status: "Complet",
  },
  {
    id: "duc-land",
    name: "03 - Foncier & Titre Foncier (MINDCAF)",
    category: "land",
    fileCount: 2,
    size: "7.9 MB",
    updatedAt: "28 Août 2026",
    status: "Complet",
  },
  {
    id: "duc-technical",
    name: "04 - Devis, Plans & Expertises BET",
    category: "technical",
    fileCount: 2,
    size: "18.8 MB",
    updatedAt: "25 Août 2026",
    status: "En cours de revue",
  },
  {
    id: "duc-committee",
    name: "05 - Comités CGR & Décisions CRC",
    category: "committee",
    fileCount: 1,
    size: "940 KB",
    updatedAt: "22 Août 2026",
    status: "Complet",
  },
  {
    id: "duc-legal",
    name: "06 - Notaires, Assurances & Mainlevées",
    category: "legal",
    fileCount: 2,
    size: "7.7 MB",
    updatedAt: "19 Août 2026",
    status: "En attente",
  },
];

const INITIAL_FILES: DucFile[] = [
  {
    id: "f1",
    name: "CNI_Mballa_JeanPaul_recto_verso_certifie.pdf",
    kind: "kyc",
    folderId: "duc-kyc",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "1.4 MB",
    owner: "Agence Yaoundé Centre",
    ownerInitials: "YC",
    modifiedAt: "Il y a 5 min",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:7f83b165...1d65d",
    starred: true,
  },
  {
    id: "f2",
    name: "Acte_Mariage_Legalisé_Mballa.pdf",
    kind: "kyc",
    folderId: "duc-kyc",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "820 KB",
    owner: "Agence Yaoundé Centre",
    ownerInitials: "YC",
    modifiedAt: "Il y a 2h",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:3a1b4c9e...8c9d",
    starred: false,
  },
  {
    id: "f3",
    name: "Bulletins_Salaires_3Derniers_Mois_AVI.pdf",
    kind: "income",
    folderId: "duc-income",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "2.8 MB",
    owner: "Direction du Crédit (DCR)",
    ownerInitials: "DC",
    modifiedAt: "Hier",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:e3b0c442...fb924",
    starred: true,
  },
  {
    id: "f4",
    name: "Titre_Foncier_Original_N4892_Mfoundi_MINDCAF.pdf",
    kind: "land",
    folderId: "duc-land",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "6.8 MB",
    owner: "Conservation Foncière",
    ownerInitials: "CF",
    modifiedAt: "28 Août 2026",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:9f86d081...5ad015",
    starred: true,
  },
  {
    id: "f5",
    name: "Certificat_Propriété_Valide_MINDCAF.pdf",
    kind: "land",
    folderId: "duc-land",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "1.1 MB",
    owner: "Conservation Foncière",
    ownerInitials: "CF",
    modifiedAt: "28 Août 2026",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:5e884898...62927",
    starred: false,
  },
  {
    id: "f6",
    name: "Plans_Architecte_Vises_Permis_Batir.pdf",
    kind: "technical",
    folderId: "duc-technical",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "14.2 MB",
    owner: "Bureau d'Études Techniques",
    ownerInitials: "BT",
    modifiedAt: "25 Août 2026",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:4b227777...41d02",
    starred: true,
  },
  {
    id: "f7",
    name: "Rapport_Expertise_Terrain_PV_Tripartite_BET.pdf",
    kind: "technical",
    folderId: "duc-technical",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "4.6 MB",
    owner: "BET Sarl (Agréé CFC)",
    ownerInitials: "BT",
    modifiedAt: "24 Août 2026",
    complianceStatus: "En attente",
    integrityHash: "SHA256:ef2d127d...54b0c61",
    starred: false,
  },
  {
    id: "f8",
    name: "PV_Avis_Favorable_Comite_Gestion_Risques_CGR.pdf",
    kind: "committee",
    folderId: "duc-committee",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "940 KB",
    owner: "Secrétariat CGR",
    ownerInitials: "GR",
    modifiedAt: "22 Août 2026",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:bc816e88...169fa",
    starred: false,
  },
  {
    id: "f9",
    name: "Police_Assurance_Tous_Risques_Chantier_TRC.pdf",
    kind: "legal",
    folderId: "duc-legal",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "2.3 MB",
    owner: "Compagnie Assurance Axa",
    ownerInitials: "AS",
    modifiedAt: "19 Août 2026",
    complianceStatus: "Conforme",
    integrityHash: "SHA256:1a2b3c4d...a4b5c6d",
    starred: false,
  },
  {
    id: "f10",
    name: "Convention_Pret_Hypothecaire_Me_Nkouendjin.pdf",
    kind: "legal",
    folderId: "duc-legal",
    ducId: "CFC-2026-DUC-04829",
    customerName: "MBALLA Jean-Paul",
    size: "5.4 MB",
    owner: "Étude Notariale",
    ownerInitials: "NO",
    modifiedAt: "18 Août 2026",
    complianceStatus: "En attente",
    integrityHash: "SHA256:8c6976e5...e15df",
    starred: true,
  },
];

export default function DucFileManager({ ducId = "CFC-2026-DUC-04829" }: { ducId?: string }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filesList, setFilesList] = useState<DucFile[]>(INITIAL_FILES);

  const filteredFiles = filesList.filter((f) => {
    const matchesFolder = selectedFolder ? f.folderId === selectedFolder : true;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const toggleStar = (fileId: string) => {
    setFilesList((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, starred: !f.starred } : f))
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header DUC & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cfc">{ducId}</Badge>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Scellé Numériquement · Loi 2024/001
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Dossier Unique Client (DUC) — MBALLA Jean-Paul
          </h2>
          <p className="text-xs text-slate-500">
            Référentiel centralisé des pièces d&apos;instruction classées par sous-dossiers thématiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <FolderPlus className="w-4 h-4 mr-1.5" />
            Nouveau sous-dossier
          </Button>
          <Button
            size="sm"
            onClick={() => {
              alert("Téléversement d'une pièce vers le DUC : scellement cryptographique et horodatage certifié.");
            }}
            className="bg-[#7B2E15] hover:bg-[#5C220F] text-white text-xs font-semibold shadow-sm"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Verser une pièce au DUC
          </Button>
        </div>
      </div>

      {/* 2. Sous-dossiers thématiques (6 catégories DUC) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Sous-dossiers du DUC ({DUC_FOLDERS.length})
          </h3>
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-xs text-[#7B2E15] font-semibold hover:underline"
            >
              Afficher tous les sous-dossiers
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {DUC_FOLDERS.map((folder) => {
            const isSelected = selectedFolder === folder.id;
            return (
              <Card
                key={folder.id}
                onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
                className={`cursor-pointer transition-all hover:border-[#7B2E15] hover:shadow-md ${
                  isSelected ? "border-[#7B2E15] ring-2 ring-[#7B2E15]/20 bg-amber-50/20" : ""
                }`}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#7B2E15] flex items-center justify-center">
                      <Folder className="w-5 h-5 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-xs font-bold text-slate-900 truncate">
                        {folder.name}
                      </CardTitle>
                      <CardDescription className="text-[11px]">
                        {folder.fileCount} pièces déposées
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={folder.status === "Complet" ? "success" : "secondary"}
                    className="text-[10px]"
                  >
                    {folder.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {folder.updatedAt}
                  </span>
                  <span className="font-semibold text-slate-600">{folder.size}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. Toolbar & Liste/Grille des Pièces Justificatives */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pièces Scellées du Dossier ({filteredFiles.length})
            </h3>
            <p className="text-xs text-slate-500">
              Chaque fichier possède une empreinte cryptographique SHA-256 inaltérable.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une pièce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#7B2E15]/20 focus:border-[#7B2E15] outline-none"
              />
            </div>

            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => v && setView(v as "grid" | "list")}
            >
              <ToggleGroupItem value="grid" aria-label="Vue grille">
                <Grid2X2 className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Vue liste">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* VUE GRILLE */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="p-4 space-y-3 hover:border-[#7B2E15]/40 transition-all shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">{file.owner}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStar(file.id)}
                    className="text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    <Star className={`w-4 h-4 ${file.starred ? "text-amber-500 fill-amber-500" : ""}`} />
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Empreinte SHA-256 :</span>
                    <span className="font-mono font-medium text-slate-700">{file.integrityHash}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Statut conformité :</span>
                    <Badge variant={file.complianceStatus === "Conforme" ? "success" : "secondary"} className="text-[9px] px-1.5 py-0">
                      {file.complianceStatus}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{file.size} · {file.modifiedAt}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Consulter">
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Télécharger">
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* VUE LISTE */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pièce justificative</TableHead>
                  <TableHead>Pôle émetteur</TableHead>
                  <TableHead>Conformité</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Modifié le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate max-w-xs">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">{file.owner}</TableCell>
                    <TableCell>
                      <Badge variant={file.complianceStatus === "Conforme" ? "success" : "secondary"}>
                        {file.complianceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{file.size}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{file.modifiedAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleStar(file.id)}
                          className="p-1 text-slate-400 hover:text-amber-500"
                        >
                          <Star className={`w-3.5 h-3.5 ${file.starred ? "text-amber-500 fill-amber-500" : ""}`} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-slate-700">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

      </div>

    </div>
  );
}
