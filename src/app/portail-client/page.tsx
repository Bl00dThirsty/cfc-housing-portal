import Link from "next/link";
import { FolderKanban, FileText, ListChecks, LogIn } from "lucide-react";

import DucFileManager from "@/components/portal/duc-file-manager";
import DocumentDropzone from "@/components/portal/document-dropzone";
import { DossierRequirements } from "@/components/portal/dossier-requirements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { getPublicEnv } from "@/server/env";
import { getCitizenDossier } from "@/server/queries/dossiers";
import { createServerSupabaseClient } from "@/server/supabase/server";

const PHASE_LABELS: Record<string, string> = {
  kyc_savings: "Épargne & KYC",
  risk_bet: "Risques & BET",
  committees: "Comités CGR/CRC",
  notary_mortgage: "Notaire & Hypothèque",
  disbursements: "Déblocages Travaux",
  closing_release: "Clôture & Mainlevée",
};

export default async function PortalPage() {
  const configured = getPublicEnv() !== null;

  let userId: string | null = null;
  if (configured) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  const result = userId ? await getCitizenDossier(userId) : null;
  const dossier = result && "dossier" in result ? result.dossier : null;

  if (!configured || !userId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start gap-4 rounded-lg border border-line-strong bg-card p-6">
          <Badge variant="cfc">Guichet Unique Dématérialisé</Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Votre dossier de prêt, en un seul endroit
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour déposer vos pièces, suivre l&apos;avancement de
            votre dossier unique client et recevoir les demandes de
            complements.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="cfc" size="sm" className="gap-1.5 text-xs" asChild>
              <Link href="/login">
                <LogIn className="size-3.5" aria-hidden />
                Se connecter
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
              <Link href="/onboarding">
                Commencer mon dossier
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start gap-4 rounded-lg border border-line-strong bg-card p-6">
          <Badge variant="cfc">Guichet Unique Dématérialisé</Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Vous n&apos;avez pas encore de dossier
          </h1>
          <p className="text-sm text-muted-foreground">
            Choisissez le service auquel vous sollicitez un prêt, lengkap vos
            informations et déposez vos pièces : votre dossier unique client
            s&apos;ouvre en quatre étapes.
          </p>
          <Button variant="cfc" size="sm" className="gap-1.5 text-xs" asChild>
            <Link href="/onboarding">Commencer mon dossier</Link>
          </Button>
        </div>
      </div>
    );
  }

  const phaseLabel = dossier.currentPhase
    ? (PHASE_LABELS[dossier.currentPhase] ?? dossier.currentPhase)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="cfc">Guichet Unique Dématérialisé</Badge>
          <Badge variant="success">Espace Citoyen</Badge>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Gestionnaire Documentaire DUC & Suivi de Prêt
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Consultez et complétez les pièces de votre Dossier Unique Client (DUC)
          réparties en sous-dossiers thématiques et suivez l&apos;avancement en
          temps réel.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Tag tone="blue">{dossier.ducCode}</Tag>
          {dossier.serviceLabel && <Tag tone="neutral">{dossier.serviceLabel}</Tag>}
          {phaseLabel && <Tag tone="amber">{phaseLabel}</Tag>}
          {dossier.completionPercent !== null && (
            <Tag tone="teal">{dossier.completionPercent} %</Tag>
          )}
        </div>
      </div>

      <Tabs defaultValue="requirements" className="w-full">
        <div className="mb-6 flex justify-center">
          <TabsList className="rounded-xl border border-slate-200 bg-slate-100 p-1">
            <TabsTrigger value="requirements" className="gap-2 px-4 py-2 text-xs font-semibold">
              <ListChecks className="size-4 text-[#7B2E15]" />
              1. Mes pièces exigées
            </TabsTrigger>
            <TabsTrigger value="file-manager" className="gap-2 px-4 py-2 text-xs font-semibold">
              <FileText className="size-4 text-[#7B2E15]" />
              2. File Manager DUC (Sous-dossiers &amp; Pièces)
            </TabsTrigger>
            <TabsTrigger value="workflow-tracking" className="gap-2 px-4 py-2 text-xs font-semibold">
              <FolderKanban className="size-4 text-amber-600" />
              3. Circuit des 6 Phases &amp; Dépôt Guidé
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="requirements">
          <DossierRequirements
            checklist={dossier.checklist}
            uploadedCount={dossier.uploadedCount}
            requiredCount={dossier.requiredCount}
          />
        </TabsContent>

        <TabsContent value="file-manager">
          <DucFileManager ducId={dossier.ducCode} />
        </TabsContent>

        <TabsContent value="workflow-tracking">
          <DocumentDropzone ducId={dossier.ducCode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
