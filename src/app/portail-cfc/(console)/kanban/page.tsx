import Link from "next/link";
import { ArrowRight, CircleAlert, FolderKanban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OperationalDossier } from "@/domain/entities/operational-dossier";
import { getOperationalDossiers } from "@/server/queries/operational-dossiers";

const PIPELINE_STAGES = [
  { code: "kyc_savings", label: "Épargne & KYC" },
  { code: "risk_bet", label: "Risques & BET" },
  { code: "committees", label: "Comités de crédit" },
  { code: "notary_mortgage", label: "Notaire & hypothèque" },
  { code: "disbursements", label: "Déblocages" },
  { code: "closing_release", label: "Clôture & mainlevée" },
] as const;

function DossierCard({ dossier }: { dossier: OperationalDossier }) {
  return (
    <article className="rounded-md border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/portail-cfc/kanban/${dossier.id}`}
            className="font-mono text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {dossier.ducCode}
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground">{dossier.region} · {dossier.agency}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">{dossier.status}</Badge>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Mis à jour : {dossier.updatedAt ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(dossier.updatedAt)) : "—"}
      </p>
      <Button asChild variant="ghost" size="sm" className="mt-2 h-7 w-full justify-between px-2 text-xs">
        <Link href={`/portail-cfc/kanban/${dossier.id}`}>
          État opérationnel <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}

export default async function KanbanPage() {
  const result = await getOperationalDossiers();
  if (!result.ok) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg border bg-card p-6" role="alert">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 text-destructive" aria-hidden />
          <div>
            <h1 className="font-semibold">Pipeline indisponible</h1>
            <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
          </div>
        </div>
      </section>
    );
  }

  const dossiers = result.dossiers;
  const unclassified = dossiers.filter((dossier) => !PIPELINE_STAGES.some((stage) => stage.code === dossier.phaseCode));

  return (
    <section className="space-y-5" aria-labelledby="pipeline-title">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 id="pipeline-title" className="text-2xl font-bold tracking-tight">Pipeline des dossiers</h1>
          <p className="text-sm text-muted-foreground">
            {dossiers.length} dossier{dossiers.length === 1 ? "" : "s"} dans votre périmètre. La vue montre des références opérationnelles, sans profils ni justificatifs.
          </p>
        </div>
        <Button asChild variant="outline" size="sm"><Link href="/portail-cfc/clients">Répertoire des dossiers</Link></Button>
      </header>

      {dossiers.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center">
          <FolderKanban className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 font-semibold">Aucun dossier dans votre périmètre</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">Les dossiers apparaîtront ici lorsqu’ils seront enregistrés et accessibles selon vos habilitations.</p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-3 2xl:grid-cols-6">
          {PIPELINE_STAGES.map((stage) => {
            const stageDossiers = dossiers.filter((dossier) => dossier.phaseCode === stage.code);
            return (
              <section key={stage.code} className="min-w-0 rounded-lg border bg-muted/20 p-2.5" aria-label={stage.label}>
                <header className="mb-2.5 flex items-center justify-between gap-2 px-1">
                  <h2 className="text-xs font-semibold">{stage.label}</h2>
                  <Badge variant="secondary" className="tabular-nums">{stageDossiers.length}</Badge>
                </header>
                <div className="flex flex-col gap-2">
                  {stageDossiers.map((dossier) => <DossierCard key={dossier.id} dossier={dossier} />)}
                  {stageDossiers.length === 0 ? <p className="rounded-md border border-dashed px-2 py-5 text-center text-xs text-muted-foreground">Aucun dossier à cette étape.</p> : null}
                </div>
              </section>
            );
          })}
          {unclassified.length > 0 ? (
            <section className="min-w-0 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5" aria-label="Étape non répertoriée">
              <header className="mb-2.5 flex items-center justify-between gap-2 px-1">
                <h2 className="text-xs font-semibold">Étape à vérifier</h2>
                <Badge variant="outline" className="tabular-nums">{unclassified.length}</Badge>
              </header>
              <div className="flex flex-col gap-2">{unclassified.map((dossier) => <DossierCard key={dossier.id} dossier={dossier} />)}</div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
