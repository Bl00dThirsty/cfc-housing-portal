import { Clock, MessageSquare, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { DELAI_REPRISE_CONSEILLER_JOURS } from "@/domain/entities/kyc-profile";

/**
 * L'espace d'attente — le tableau de bord d'un dossier **en pause**.
 *
 * Un dossier en attente n'a **aucune fonctionnalité** à montrer : ni
 * graphiques, ni pièces, ni dépôt. Afficher un tableau de bord vide serait
 * mentir. L'écran dit ce qui se passe, **qui** l'examine, et combien de
 * temps il faut compter.
 *
 * Ce n'est pas un second tableau de bord : c'est son **contraire** — le même
 * écran, vidé de ce qu'un dossier en attente ne peut pas encore montrer.
 */
export function OnboardingWaiting({
  advisor,
  ducCode,
  isUnderReview = false,
  contactHref = "/portail-client",
}: {
  /** Le conseiller qui examine le dossier, s'il y en a un. */
  advisor: string | null;
  /** Le code du dossier — il est cité dans la conversation. */
  ducCode: string;
  /** Le dossier est-il déjà transmis, ou simplement en pause ? */
  isUnderReview?: boolean;
  /** Où le demandeur peut-il joindre son conseiller ? */
  contactHref?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-line-strong">
        <CardContent className="space-y-5 px-6 py-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-cfc-lightgold text-cfc-brown">
            <Clock className="size-6" aria-hidden />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="cfc">
                {isUnderReview ? "Dossier en cours d'examen" : "Dossier en attente"}
              </Badge>
              <Tag tone="blue">{ducCode}</Tag>
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {isUnderReview
                ? "Votre dossier est examiné par un conseiller"
                : "Votre dossier est en cours d'orientation"}
            </h1>

            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              {isUnderReview
                ? "Un conseiller CFC instruit votre dossier. Vous serez prévenu dès qu'il aura une décision : il n'y a rien à faire de votre côté pour le moment."
                : `Pour souscrire ce service, il faut être client du Crédit Foncier du Cameroun depuis au moins six mois — donc avoir tenu un carnet d'épargne logement. Votre cas n'est pas perdu : il a été transmis à un conseiller, qui vous recontactera pour vous orienter.`}
            </p>
          </div>

          {advisor && (
            <div className="mx-auto flex max-w-md items-center gap-3 rounded-lg border border-cfc-gold/40 bg-cfc-lightgold/40 p-4 text-left">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-cfc-brown">
                <UserRound className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="caption-style text-subtle">Votre conseiller</p>
                <p className="truncate text-sm font-semibold text-foreground">{advisor}</p>
              </div>
            </div>
          )}

          <p className="caption-style text-subtle">
            Comptez environ {DELAI_REPRISE_CONSEILLER_JOURS} jours avant son
            premier contact.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild variant="cfc" size="sm" className="gap-1.5 text-xs">
              <a href={contactHref}>
                <MessageSquare className="size-3.5" aria-hidden />
                Écrire à mon conseiller
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
