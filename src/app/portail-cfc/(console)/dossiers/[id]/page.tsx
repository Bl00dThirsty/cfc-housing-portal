import { notFound } from "next/navigation";

import { hasCapability } from "@/domain/policies/permissions";
import { OperationalDossierDetail } from "@/components/portail-cfc/operational-dossier-detail";
import { getServerProfile } from "@/server/auth/profile";
import { getRegionalManagersForDossier } from "@/server/queries/regional-managers";
import { getOperationalDossiers, isDossierAssignedToActor } from "@/server/queries/operational-dossiers";

export default async function OperationalDossierPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [isAssignedManager, managerRoster] = await Promise.all([
    profile?.role === "GESTIONNAIRE" ? isDossierAssignedToActor(id, profile.actorId) : Promise.resolve(false),
    profile?.role === "ADMIN" && hasCapability(profile.role, "admin:users", profile.capabilities)
      ? getRegionalManagersForDossier(id)
      : Promise.resolve(null),
  ]);
  const assignmentControl = managerRoster
    ? managerRoster.ok
      ? { currentManagerId: managerRoster.currentManagerId, managers: managerRoster.managers }
      : { currentManagerId: null, managers: [], error: managerRoster.error }
    : undefined;

  return (
    <OperationalDossierDetail
      dossier={dossier}
      events={result.events ?? []}
      canOpenAssignedManagerProfile={isAssignedManager}
      assignmentControl={assignmentControl}
    />
  );
}
