import { notFound } from "next/navigation";

import { OperationalDossierDetail } from "@/components/portail-cfc/operational-dossier-detail";
import { getRegionalManagersForDossier } from "@/server/queries/regional-managers";
import { getOperationalDossiers } from "@/server/queries/operational-dossiers";

export default async function AnalyticsDossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getOperationalDossiers({ dossierId: id });
  if (!result.ok) {
    return <p className="rounded-lg border border-destructive/30 bg-card p-5 text-sm" role="alert">{result.error}</p>;
  }
  const dossier = result.dossiers[0];
  if (!dossier) notFound();

  const roster = await getRegionalManagersForDossier(id);
  const assignmentControl = roster.ok
    ? { currentManagerId: roster.currentManagerId, managers: roster.managers }
    : { currentManagerId: null, managers: [], error: roster.error };

  return <OperationalDossierDetail dossier={dossier} events={result.events ?? []} returnHref="/portail-cfc/analytics" assignmentControl={assignmentControl} />;
}
