import Link from "next/link";
import { ArrowLeft, FileText, ListChecks, MessageSquare, Timer } from "lucide-react";

import { DossierPhaseCard, DossierTimeline } from "@/components/portail-client/dossier-timeline";
import { DossierRequirements } from "@/components/portail-client/dossier-requirements";
import { CitizenDashboard } from "@/components/portail-client/dashboard/dashboard";
import { buildDashboardModel } from "@/components/portail-client/dashboard/dashboard-model";
import DocumentDropzone from "@/components/portail-client/document-dropzone";
import { OnboardingWaiting } from "@/components/portail-client/onboarding-waiting";
import { SupportChat } from "@/components/support/support-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { borrowerRequestStatusLabel } from "@/domain/entities/borrower-request";
import type { CitizenSpace } from "@/domain/entities/citizen-space";

export function CitizenRequestWorkspace({
  space,
  displayName,
  anchorStepCode,
  anchorDocumentId,
}: {
  space: CitizenSpace;
  displayName: string;
  anchorStepCode?: string;
  anchorDocumentId?: string;
}) {
  const roomName = `dossier:${space.dossierId}`;
  const requestedStep = anchorStepCode
    ? (space.steps.find((step) => step.code === anchorStepCode) ?? null)
    : null;
  const requestedDocument = anchorDocumentId
    ? (space.checklist.find((item) => item.documentId === anchorDocumentId) ?? null)
    : null;
  const anchor = requestedDocument
    ? { kind: "piece" as const, id: requestedDocument.documentId!, label: requestedDocument.label }
    : requestedStep
      ? { kind: "etape" as const, id: requestedStep.code, label: `${requestedStep.code} — ${requestedStep.label}` }
      : space.currentStep
        ? { kind: "etape" as const, id: space.currentStep.code, label: `${space.currentStep.code} — ${space.currentStep.label}` }
        : null;
  const dashboard = buildDashboardModel({
    completionPercent: space.completionPercent,
    currentPhaseLabel: space.currentPhaseLabel,
    checklist: space.checklist,
    events: space.events,
    finance: space.finance,
  });
  const isAwaitingAdvisor = space.onboardingState === "suspension" || space.onboardingState === "en_examen";
  const canResume = space.onboardingState === "kyc" || space.onboardingState === "service" || space.onboardingState === "documents";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cfc">Guichet Unique · Espace Citoyen</Badge>
            <Tag tone="blue">{space.ducCode}</Tag>
            {space.unreadNotifications > 0 ? <Tag tone="amber">{space.unreadNotifications} notification(s)</Tag> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bonjour {displayName.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Suivez l&apos;avancement de cette demande, déposez vos pièces et échangez avec votre conseiller.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="neutral">{borrowerRequestStatusLabel(space.onboardingState, space.status)}</Tag>
          {canResume ? <Button asChild size="sm" variant="cfc"><Link href={`/onboarding?dossier=${encodeURIComponent(space.dossierId)}`}>Continuer cette demande</Link></Button> : null}
          <Button asChild size="sm" variant="outline"><Link href="/portail-client/demandes"><ArrowLeft data-icon="inline-start" />Toutes mes demandes</Link></Button>
        </div>
      </header>

      {isAwaitingAdvisor ? (
        <OnboardingWaiting advisor={space.advisor} ducCode={space.ducCode} isUnderReview={space.onboardingState === "en_examen"} />
      ) : (
        <>
          <CitizenDashboard model={dashboard} />
          <DossierPhaseCard
            currentPhaseLabel={space.currentPhaseLabel}
            completionPercent={space.completionPercent}
            status={space.status}
            serviceLabel={space.serviceLabel}
          />
        </>
      )}

      <Tabs defaultValue={anchor ? "messages" : "suivi"} className="w-full">
        <TabsList className="flex w-full flex-wrap gap-1 border border-line-strong bg-muted/40 p-1">
          <TabsTrigger value="suivi" className="gap-2 text-xs font-semibold"><Timer className="size-3.5" aria-hidden />Suivi du dossier</TabsTrigger>
          <TabsTrigger value="pieces" className="gap-2 text-xs font-semibold"><ListChecks className="size-3.5" aria-hidden />Mes pièces</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2 text-xs font-semibold"><MessageSquare className="size-3.5" aria-hidden />Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="suivi" className="mt-4 flex flex-col gap-4 focus-visible:outline-none">
          <DossierTimeline events={space.events} />
          <DossierRequirements
            checklist={space.checklist}
            uploadedRequiredCount={space.checklist.filter((item) => item.required && item.status !== "missing").length}
            requiredCount={space.checklist.filter((item) => item.required).length}
            optionalCount={space.checklist.filter((item) => !item.required).length}
            discussionPath={`/portail-client/demandes/${space.dossierId}`}
          />
        </TabsContent>

        <TabsContent value="pieces" className="mt-4 flex flex-col gap-4 focus-visible:outline-none">
          <DocumentDropzone dossierId={space.dossierId} ducId={space.ducCode} checklist={space.checklist} steps={space.steps} />
        </TabsContent>

        <TabsContent value="messages" className="mt-4 focus-visible:outline-none">
          <div className="overflow-hidden rounded-lg border border-line-strong bg-card">
            <div className="flex items-center justify-between border-b border-line-strong px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Mon conseiller</span>
                <span className="caption-style text-soft">Échanges enregistrés sur votre demande {space.ducCode}</span>
                {anchor ? <span data-anchor={anchor.kind} className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-cfc-lightgold px-2 py-0.5 text-[10.5px] font-medium text-cfc-brown">{anchor.kind === "etape" ? "Étape" : "Pièce"} · {anchor.label}</span> : null}
              </div>
              <FileText className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <SupportChat roomName={roomName} dossierId={space.dossierId} displayName={displayName} anchor={anchor} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
