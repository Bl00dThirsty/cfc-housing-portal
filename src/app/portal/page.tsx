"use client";

import DucFileManager from "@/components/portal/duc-file-manager";
import DocumentDropzone from "@/components/portal/document-dropzone";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FolderKanban, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PortalPage() {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Guichet Unique Citoyen */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="cfc">Guichet Unique Dématérialisé</Badge>
          <Badge variant="success">Espace Citoyen</Badge>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Gestionnaire Documentaire DUC & Suivi de Prêt
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Consultez et complétez les pièces de votre Dossier Unique Client (DUC) réparties en sous-dossiers thématiques et suivez l&apos;avancement en temps réel.
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="file-manager" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
            <TabsTrigger value="file-manager" className="gap-2 text-xs font-semibold px-4 py-2">
              <FileText className="w-4 h-4 text-[#7B2E15]" />
              1. File Manager DUC (Sous-dossiers & Pièces)
            </TabsTrigger>
            <TabsTrigger value="workflow-tracking" className="gap-2 text-xs font-semibold px-4 py-2">
              <FolderKanban className="w-4 h-4 text-amber-600" />
              2. Circuit des 6 Phases & Dépôt Guidé
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: File Manager DUC */}
        <TabsContent value="file-manager">
          <DucFileManager ducId="CFC-2026-DUC-04829" />
        </TabsContent>

        {/* Tab 2: Workflow 6 phases & Guided Dropzone */}
        <TabsContent value="workflow-tracking">
          <DocumentDropzone ducId="CFC-2026-DUC-04829" />
        </TabsContent>
      </Tabs>

    </div>
  );
}
