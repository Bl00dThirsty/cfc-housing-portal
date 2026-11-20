import { notFound } from "next/navigation";

import { OperationalDossierDetail } from "@/components/portail-cfc/operational-dossier-detail";
import { getServerProfile } from "@/server/auth/profile";
import { getOperationalDossiers, isDossierAssignedToActor } from "@/server/queries/operational-dossiers";

export default async function KanbanDossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, profile] = await Promise.all([getOperationalDossiers({ dossierId: id }), getServerProfile()]);
  if (!result.ok) {
    return (
      <section className="mx-auto max-w-2xl rounded-lg border border-destructive/30 bg-card p-6" role="alert">
        <h1 className="font-semibold">Dossier indisponible</h1>
        <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
      </section>
    );
  }

  const dossier = result.dossiers[0];
  if (!dossier) notFound();
  const canOpenAssignedManagerProfile = profile?.role === "GESTIONNAIRE"
    ? await isDossierAssignedToActor(id, profile.actorId)
    : false;

  return (
    <OperationalDossierDetail
      dossier={dossier}
      events={result.events ?? []}
      returnHref="/portail-cfc/kanban"
      canOpenAssignedManagerProfile={canOpenAssignedManagerProfile}
    />
  );
}
