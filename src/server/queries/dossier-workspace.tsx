import "server-only";

import { DossierQueueView } from "@/components/portail-cfc/dossier-queue-view";
import { getOperationalDossiers } from "@/server/queries/operational-dossiers";

/** The staff queue uses an allowlisted operational projection, never a profile read. */
export async function DossierQueuePage({
  title,
  description,
  phaseCodes,
  diasporaOnly = false,
  savingsOnly = false,
  pendingSavingsOnly = false,
}: {
  title: string;
  description: string;
  phaseCodes?: readonly string[];
  diasporaOnly?: boolean;
  savingsOnly?: boolean;
  pendingSavingsOnly?: boolean;
}) {
  const result = await getOperationalDossiers({
    phaseCodes,
    diasporaOnly,
    savingsOnly,
    pendingSavingsOnly,
  });
  if (!result.ok) {
    return (
      <section className="rounded-lg border border-destructive/30 bg-card p-5" role="alert">
        <h1 className="font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
      </section>
    );
  }

  return <DossierQueueView dossiers={result.dossiers} title={title} description={description} />;
}
