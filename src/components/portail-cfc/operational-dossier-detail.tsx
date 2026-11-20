import Link from "next/link";
import { ArrowLeft, Clock3, History, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DossierAssignmentPanel, type AssignmentControl } from "@/app/portail-cfc/(console)/clients/[id]/_components/dossier-assignment-panel";
import type { OperationalDossier, OperationalEvent } from "@/domain/entities/operational-dossier";

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function eventLabel(value: string): string {
  return value.replaceAll("_", " ").toLocaleLowerCase("fr").replace(/^./, (letter) => letter.toLocaleUpperCase("fr"));
}

export function OperationalDossierDetail({
  dossier,
  events,
  returnHref = "/portail-cfc/dossiers",
  canOpenAssignedManagerProfile = false,
  assignmentControl,
}: {
  dossier: OperationalDossier;
  events: OperationalEvent[];
  returnHref?: string;
  canOpenAssignedManagerProfile?: boolean;
  assignmentControl?: AssignmentControl;
}) {
  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href={returnHref}><ArrowLeft className="size-3.5" aria-hidden />Retour à la file</Link>
      </Button>

      <header className="space-y-3 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-mono text-xl font-bold tracking-tight">{dossier.ducCode}</h1>
            <p className="text-sm text-muted-foreground">Dossier opérationnel</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{dossier.status}</Badge>
            <Badge variant="secondary">{dossier.phaseCode}</Badge>
            {dossier.isDiaspora ? <Badge variant="outline">Diaspora</Badge> : null}
          </div>
        </div>
        <dl className="grid gap-3 border-t pt-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <div><dt className="text-xs text-muted-foreground">Agence / région</dt><dd className="mt-0.5 font-medium">{dossier.agency} · {dossier.region}</dd></div>
          </div>
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
            <div><dt className="text-xs text-muted-foreground">Dernière mise à jour</dt><dd className="mt-0.5 font-medium">{displayDate(dossier.updatedAt ?? "")}</dd></div>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Cette vue affiche uniquement l’état de traitement. L’identité, les coordonnées, les justificatifs KYC et les données financières ne sont chargés que dans les écrans dont l’accès est autorisé.
        </p>
        {canOpenAssignedManagerProfile ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/portail-cfc/clients/${dossier.id}`}>Ouvrir la fiche du portefeuille attribué</Link>
          </Button>
        ) : null}
      </header>

      {assignmentControl ? (
        <DossierAssignmentPanel dossierId={dossier.id} dossierCode={dossier.ducCode} assignment={assignmentControl} />
      ) : null}

      <section className="rounded-lg border bg-card p-5" aria-labelledby="history-heading">
        <div className="flex items-center gap-2 border-b pb-3">
          <History className="size-4 text-muted-foreground" aria-hidden />
          <h2 id="history-heading" className="text-sm font-semibold">Historique enregistré</h2>
          <Badge variant="outline" className="ml-auto tabular-nums">{events.length}</Badge>
        </div>
        {events.length > 0 ? (
          <ol className="mt-3 divide-y">
            {events.map((event) => (
              <li key={event.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div>
                  <p className="text-sm font-medium">{eventLabel(event.type)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.actorRole}</p>
                </div>
                <time className="text-xs text-muted-foreground">{displayDate(event.occurredAt)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Aucun événement n’a encore été enregistré pour ce dossier.</p>
        )}
      </section>
    </article>
  );
}
