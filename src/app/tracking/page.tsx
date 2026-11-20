import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, LogIn } from "lucide-react";

import { DossierRequirements } from "@/components/portail-client/dossier-requirements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { stageLabel } from "@/domain/entities/services";
import { getCitizenTracking } from "@/server/queries/citizen-space";
import { getPublicEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";

import { TrackingStepper } from "./_components/tracking-stepper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi de mon dossier | Crédit Foncier du Cameroun",
  description:
    "Suivez l'avancement de votre dossier de crédit : étapes du circuit CFC, phase en cours et pièces restant à fournir.",
};

/**
 * **Suivi du dossier** — la page personnelle de l'emprunteur.
 *
 * Elle ne cherche rien : elle montre **le dossier de l'emprunteur
 * connecté**, indexé par la cartographie officielle des processus (CRD-01 à
 * CRD-13, GAR-01), et les pièces qu'il doit encore fournir. Aucun dossier
 * n'est interrogeable par un tiers.
 */
export default async function TrackingPage() {
  if (!getPublicEnv()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Configuration Supabase absente : le suivi du dossier ne peut pas être servi pour le
          moment.
        </p>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignInRequired />;
  }

  const result = await getCitizenTracking(user.id);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-col items-start gap-3 rounded-xl border border-line-strong bg-card p-6">
          <Badge variant="cfc">Guichet Unique · Suivi du dossier</Badge>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Suivi momentanément indisponible
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre dossier n&apos;a pas pu être lu pour l&apos;instant. Réessayez dans quelques
            instants, ou contactez votre conseiller.
          </p>
          <p className="caption-style text-soft">{result.error}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portail-client">
              <ArrowLeft className="size-3.5" aria-hidden />
              Retour au Portail Citoyen
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const tracking = result.tracking;

  if (!tracking) {
    return <NoDossier />;
  }

  // Les étapes viennent du domaine (codes de procédure) ; les pièces
  // viennent du catalogue déclarable, dont le libellé de phase est traduit ici.
  const checklist = tracking.checklist.map((item) => ({
    ...item,
    stageLabel: stageLabel(item.stage),
  }));
  // Les compteurs distinguent l'**obligatoire** du facultatif : dire
  // « 12 attendues » quand 8 seulement sont exigées surestime l'effort.
  const requiredItems = checklist.filter((item) => item.required);
  const uploadedRequiredCount = requiredItems.filter(
    (item) => item.status !== "missing",
  ).length;
  const requiredCount = requiredItems.length;
  const optionalCount = checklist.length - requiredCount;

  const currentStep = tracking.steps.find((step) => step.status === "current");
  const currentPhaseLabel = currentStep?.phaseLabel ?? tracking.currentPhaseLabel;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/portail-client"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Retour au Portail Citoyen
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cfc">Guichet Unique · Suivi du dossier</Badge>
          <Tag tone="blue" size="sm" className="text-[11px]">
            {tracking.ducCode}
          </Tag>
          {currentPhaseLabel ? (
            <Tag tone="amber" size="sm" className="max-w-full whitespace-normal text-[11px]">
              Phase en cours : {currentPhaseLabel}
            </Tag>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Suivi de votre dossier de crédit
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre parcours est présenté étape par étape, avec le code de procédure de chaque
            étape (CRD-01 à CRD-13, GAR-01) et le couloir qui la porte, conformément à la
            cartographie officielle des processus du Crédit Foncier du Cameroun.
          </p>
        </div>
      </header>

      <TrackingStepper
        steps={tracking.steps}
        progress={tracking.progress}
        events={tracking.events}
        discussionPath="/portail-client"
      />

      <section aria-labelledby="pieces-titre" className="flex flex-col gap-3">
        <h2 id="pieces-titre" className="text-sm font-semibold text-foreground">
          Pièces de votre dossier
        </h2>
        <DossierRequirements
          checklist={checklist}
          uploadedRequiredCount={uploadedRequiredCount}
          requiredCount={requiredCount}
          optionalCount={optionalCount}
          discussionPath="/portail-client"
        />
      </section>
    </div>
  );
}

/**
 * Visiteur non connecté : on l'invite à s'identifier, sans jamais afficher de
 * formulaire d'identification ici — la connexion a sa propre porte.
 */
function SignInRequired() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col items-start gap-4 rounded-xl border border-line-strong bg-card p-6">
        <Badge variant="cfc">Guichet Unique · Suivi du dossier</Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Suivez votre dossier de crédit
        </h1>
        <p className="text-sm text-muted-foreground">
          Le suivi est strictement réservé à l&apos;emprunteur : il ne se consulte qu&apos;en
          ligne, depuis votre espace citoyen. Aucun dossier n&apos;est interrogeable par une
          autre personne.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="cfc" size="sm" asChild>
            <Link href="/login">
              <LogIn className="size-3.5" aria-hidden />
              Se connecter
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portail-client">
              <ArrowLeft className="size-3.5" aria-hidden />
              Portail Citoyen
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Compte connecté, mais aucun dossier ouvert : on l'accompagne vers l'ouverture. */
function NoDossier() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col items-start gap-4 rounded-xl border border-line-strong bg-card p-6">
        <Badge variant="cfc">Guichet Unique · Suivi du dossier</Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Aucun dossier de crédit en cours
        </h1>
        <p className="text-sm text-muted-foreground">
          Aucun dossier unique client n&apos;est encore rattaché à votre compte. Dès que vous
          aurez choisi un service et déposé vos premières pièces, votre parcours apparaîtra ici,
          phase par phase.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="cfc" size="sm" asChild>
            <Link href="/onboarding">
              <FileText className="size-3.5" aria-hidden />
              Ouvrir mon dossier
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portail-client">
              <ArrowLeft className="size-3.5" aria-hidden />
              Portail Citoyen
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
