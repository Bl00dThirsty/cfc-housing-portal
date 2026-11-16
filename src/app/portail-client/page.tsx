import { redirect } from "next/navigation";
import { FileText, ListChecks, MessageSquare, Timer } from "lucide-react";

import { DossierPhaseCard, DossierTimeline } from "@/components/portail-client/dossier-timeline";
import { DossierRequirements } from "@/components/portail-client/dossier-requirements";
import { CitizenDashboard } from "@/components/portail-client/dashboard/dashboard";
import { buildDashboardModel } from "@/components/portail-client/dashboard/dashboard-model";
import DucFileManager from "@/components/portail-client/duc-file-manager";
import DocumentDropzone from "@/components/portail-client/document-dropzone";
import { OnboardingWaiting } from "@/components/portail-client/onboarding-waiting";
import { SupportChat } from "@/components/support/support-chat";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { getCitizenSpace } from "@/server/queries/citizen-space";
import { createServerSupabaseClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

/**
 * **Portail citoyen** — l'espace de l'emprunteur.
 *
 * Le client y voit : un **tableau de bord** (sa situation en quatre
 * indicateurs et trois graphiques), l'état de son dossier, la
 * **chronologie** de son avancement, les pièces qui lui sont encore
 * demandées, ses conversations avec son conseiller et ses notifications.
 */
export default async function CitizenPortalPage({
  searchParams,
}: {
  /** `etape` : code d'étape du circuit (`CRD-07`) ; `piece` : pièce visée. */
  searchParams: Promise<{ etape?: string; piece?: string }>;
}) {
  // La session et la configuration sont déjà vérifiées par la coquille
  // (`layout.tsx`) : un visiteur anonyme n'atteint jamais cette page.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [spaceResult, profileResult, params] = await Promise.all([
    getCitizenSpace(user.id),
    supabase
      .from("citizen_profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
    searchParams,
  ]);

  if (!spaceResult.ok) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm text-destructive">
          Espace citoyen illisible : {spaceResult.error}
        </p>
      </div>
    );
  }

  const space = spaceResult.space;
  const displayName = (profileResult.data?.full_name as string | undefined) ?? user.email ?? "Emprunteur";

  /**
   * Pas encore de dossier : l'emprunteur vient d'ouvrir son compte.
   *
   * L'ouverture du dossier unique client est **l'étape qui suit
   * l'inscription** : on y conduit directement, plutôt que d'afficher un
   * tableau de bord vide. Le parcours est donc continu — inscription,
   * dossier, dépôt des pièces — sans écran intermédiaire.
   */
  if (!space) {
    redirect("/onboarding");
  }

  const roomName = `dossier:${space.dossierId}`;

  /**
   * Ancrage de la conversation.
   *
   * Le message n'est pas suspendu dans le vide : il porte l'**étape du
   * circuit** ou la **pièce** dont on parle. L'ancrage vient du contexte —
   * on arrive du suivi sur une étape, de la liste des pièces sur une pièce —
   * et à défaut de l'étape en cours.
   */
  const requestedStep = params.etape
    ? (space.steps.find((step) => step.code === params.etape) ?? null)
    : null;

  const requestedDocument = params.piece
    ? (space.checklist.find((item) => item.documentId === params.piece) ?? null)
    : null;

  const anchor = requestedDocument
    ? { kind: "piece" as const, id: requestedDocument.documentId!, label: requestedDocument.label }
    : requestedStep
      ? { kind: "etape" as const, id: requestedStep.code, label: `${requestedStep.code} — ${requestedStep.label}` }
      : space.currentStep
        ? { kind: "etape" as const, id: space.currentStep.code, label: `${space.currentStep.code} — ${space.currentStep.label}` }
        : null;

  // Une seule lecture, un seul modèle : le tableau de bord reçoit des
  // valeurs sérialisables, jamais un client Supabase.
  const dashboard = buildDashboardModel({
    completionPercent: space.completionPercent,
    currentPhase: space.currentPhase,
    checklist: space.checklist,
    events: space.events,
    finance: space.finance,
  });

  /**
   * Le dossier attend-il un conseiller ?
   *
   * En pause ou en examen, l'espace citoyen n'a **rien** à montrer : ni
   * graphiques, ni dépôt de pièces. Un tableau de bord vide serait un mensonge.
   * L'écran d'attente dit ce qui se passe et **qui** l'examine — et la
   * conversation reste ouverte, pour joindre le conseiller.
   */
  const isAwaitingAdvisor =
    space.onboardingState === "suspension" || space.onboardingState === "en_examen";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cfc">Guichet Unique · Espace Citoyen</Badge>
            <Tag tone="blue">{space.ducCode}</Tag>
            {space.unreadNotifications > 0 && (
              <Tag tone="amber">
                {space.unreadNotifications} notification(s)
              </Tag>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bonjour {displayName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivez l&apos;avancement de votre dossier, déposez vos pièces et
            échangez avec votre conseiller.
          </p>
        </div>
      </header>

      {isAwaitingAdvisor ? (
        <OnboardingWaiting
          advisor={space.advisor}
          ducCode={space.ducCode}
          isUnderReview={space.onboardingState === "en_examen"}
        />
      ) : (
        <>
          <CitizenDashboard model={dashboard} />

          <DossierPhaseCard
            currentPhase={space.currentPhase}
            completionPercent={space.completionPercent}
            status={space.status}
            serviceLabel={space.serviceLabel}
          />
        </>
      )}

      <Tabs defaultValue={anchor ? "messages" : "suivi"} className="w-full">
        <TabsList className="flex w-full flex-wrap gap-1 border border-line-strong bg-muted/40 p-1">
          <TabsTrigger value="suivi" className="gap-2 text-xs font-semibold">
            <Timer className="size-3.5" aria-hidden />
            Suivi du dossier
          </TabsTrigger>
          <TabsTrigger value="pieces" className="gap-2 text-xs font-semibold">
            <ListChecks className="size-3.5" aria-hidden />
            Mes pièces
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2 text-xs font-semibold">
            <MessageSquare className="size-3.5" aria-hidden />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suivi" className="mt-4 flex flex-col gap-4 focus-visible:outline-none">
          <DossierTimeline events={space.events} />
          <DossierRequirements
            checklist={space.checklist}
            uploadedRequiredCount={
              space.checklist.filter(
                (item) => item.required && item.status !== "missing",
              ).length
            }
            requiredCount={space.checklist.filter((item) => item.required).length}
            optionalCount={
              space.checklist.filter((item) => !item.required).length
            }
            discussionPath="/portail-client"
          />
        </TabsContent>

        <TabsContent value="pieces" className="mt-4 flex flex-col gap-4 focus-visible:outline-none">
          <DucFileManager ducId={space.ducCode} />
          <DocumentDropzone ducId={space.ducCode} />
        </TabsContent>

        <TabsContent value="messages" className="mt-4 focus-visible:outline-none">
          <div className="overflow-hidden rounded-lg border border-line-strong bg-card">
            <div className="flex items-center justify-between border-b border-line-strong px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  Mon conseiller
                </span>
                <span className="caption-style text-soft">
                  Échanges enregistrés sur votre dossier {space.ducCode}
                </span>
                {anchor ? (
                  <span
                    data-anchor={anchor.kind}
                    className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-cfc-lightgold px-2 py-0.5 text-[10.5px] font-medium text-cfc-brown"
                  >
                    {anchor.kind === "etape" ? "Étape" : "Pièce"} · {anchor.label}
                  </span>
                ) : null}
              </div>
              <FileText className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <SupportChat
              roomName={roomName}
              dossierId={space.dossierId}
              displayName={displayName}
              anchor={anchor}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
