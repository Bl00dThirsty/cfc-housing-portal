import { File, FileArchive, FileChartColumn, FileImage, FileText } from "lucide-react";

export type FileKind = "document" | "spreadsheet" | "design" | "pdf" | "archive";
export type FileManagerView = "grid" | "list";

export const fileIcons = {
  archive: FileArchive,
  design: FileImage,
  document: FileText,
  pdf: File,
  spreadsheet: FileChartColumn,
} satisfies Record<FileKind, typeof File>;

export const fileKindLabels: Record<FileKind, string> = {
  archive: "Archive",
  design: "Plan / Image",
  document: "Document Acte",
  pdf: "Pièce PDF Scellée",
  spreadsheet: "Bordereau / Devis",
};

export interface FileManagerFolder {
  id: string;
  name: string;
  fileCount: number;
  size: string;
  updatedAt: string;
}

export interface FileManagerFile {
  id: string;
  name: string;
  kind: FileKind;
  size: string;
  owner: string;
  ownerInitials: string;
  modifiedAt: string;
  shared: boolean;
  starred: boolean;
}

export const folders: FileManagerFolder[] = [
  {
    id: "01-kyc",
    name: "01 - Identité & KYC (DUC)",
    fileCount: 4,
    size: "12.4 MB",
    updatedAt: "Il y a 10 min",
  },
  {
    id: "02-revenus",
    name: "02 - Revenus & Solvabilité",
    fileCount: 6,
    size: "18.6 MB",
    updatedAt: "Hier",
  },
  {
    id: "03-foncier",
    name: "03 - Foncier & Titres Fonciers (MINDCAF)",
    fileCount: 3,
    size: "45.2 MB",
    updatedAt: "01 Sept",
  },
  {
    id: "04-technique",
    name: "04 - Devis, Plans & Expertises BET",
    fileCount: 8,
    size: "84.0 MB",
    updatedAt: "28 Août",
  },
  {
    id: "05-comites",
    name: "05 - Décisions Comités (CGR, CRC)",
    fileCount: 2,
    size: "8.5 MB",
    updatedAt: "25 Août",
  },
  {
    id: "06-notaire",
    name: "06 - Notaires, Assurances & Mainlevées",
    fileCount: 5,
    size: "32.1 MB",
    updatedAt: "20 Août",
  },
];

export const files: FileManagerFile[] = [
  {
    id: "cni-demandeur",
    name: "CNI_Certifiee_Demandeur_DUC04829.pdf",
    kind: "pdf",
    size: "2.4 MB",
    owner: "Suzanne Nga (CFC Agence)",
    ownerInitials: "SN",
    modifiedAt: "Il y a 10 min",
    shared: true,
    starred: true,
  },
  {
    id: "titre-foncier-mindcaf",
    name: "Titre_Foncier_No14892_Mfoundi_MINDCAF.pdf",
    kind: "pdf",
    size: "14.8 MB",
    owner: "MINDCAF Foncier",
    ownerInitials: "MF",
    modifiedAt: "01 Sept 2026",
    shared: true,
    starred: true,
  },
  {
    id: "bulletin-paie",
    name: "Bulletin_Paie_Fonctionnaire_Q1_2026.pdf",
    kind: "pdf",
    size: "1.8 MB",
    owner: "ABANDA Eric (Emprunteur)",
    ownerInitials: "AE",
    modifiedAt: "Hier",
    shared: false,
    starred: true,
  },
  {
    id: "devis-bet",
    name: "Devis_Descriptif_Quantitatif_Villa_BET.xlsx",
    kind: "spreadsheet",
    size: "3.2 MB",
    owner: "BET Epsilon",
    ownerInitials: "BE",
    modifiedAt: "28 Août 2026",
    shared: true,
    starred: false,
  },
  {
    id: "plan-archi",
    name: "Plan_Architecte_Vise_Permis_Batir_MINHDU.pdf",
    kind: "pdf",
    size: "34.5 MB",
    owner: "Cabinet Archis",
    ownerInitials: "CA",
    modifiedAt: "26 Août 2026",
    shared: true,
    starred: false,
  },
  {
    id: "pv-crc",
    name: "Extrait_PV_Resolution_Comite_CRC_032026.pdf",
    kind: "pdf",
    size: "1.2 MB",
    owner: "Comité CRC",
    ownerInitials: "CC",
    modifiedAt: "25 Août 2026",
    shared: true,
    starred: true,
  },
  {
    id: "convention-notaire",
    name: "Convention_Pret_Hypothecaire_Notaire.docx",
    kind: "document",
    size: "890 KB",
    owner: "Me Nkouendjin (Notaire)",
    ownerInitials: "MN",
    modifiedAt: "22 Août 2026",
    shared: true,
    starred: false,
  },
  {
    id: "police-assurance",
    name: "Police_Assurance_Deces_Incendie_Chantier.pdf",
    kind: "pdf",
    size: "4.1 MB",
    owner: "Assurances Chanas",
    ownerInitials: "AC",
    modifiedAt: "20 Août 2026",
    shared: true,
    starred: false,
  },
  {
    id: "bordereau-momo",
    name: "Bordereau_Versement_Apport_MoMo_SYSTAC.xlsx",
    kind: "spreadsheet",
    size: "1.5 MB",
    owner: "Comptabilité CFC",
    ownerInitials: "CC",
    modifiedAt: "Hier",
    shared: false,
    starred: false,
  },
  {
    id: "pv-avancement-vd",
    name: "PV_Contradictoire_Avancement_Travaux_VD1.pdf",
    kind: "pdf",
    size: "16.2 MB",
    owner: "BET Epsilon",
    ownerInitials: "BE",
    modifiedAt: "18 Août 2026",
    shared: true,
    starred: true,
  },
];
