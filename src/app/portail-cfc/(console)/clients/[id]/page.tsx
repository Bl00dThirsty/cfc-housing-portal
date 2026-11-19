import { notFound } from "next/navigation";

import { hasCapability } from "@/domain/policies/permissions";
import { OperationalDossierDetail } from "@/components/portail-cfc/operational-dossier-detail";
import { ClientDetailView } from "./_components/client-detail-view";
import { getServerProfile } from "@/server/auth/profile";
import { getRegionalManagersForDossier } from "@/server/queries/regional-managers";
import { getOperationalDossiers } from "@/server/queries/operational-dossiers";
import { getStaffDossiers } from "@/server/queries/staff-dossiers";

function unavailable(message: string) {
  return (
    <section className="mx-auto max-w-2xl rounded-lg border border-destructive/30 bg-card p-6" role="alert">
      <h1 className="font-semibold">Dossier indisponible</h1>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </section>
  );
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getServerProfile();

  // Only the dossier's assigned GESTIONNAIRE invokes the full profile/KYC read.
  if (profile?.role === "GESTIONNAIRE") {
    const result = await getStaffDossiers(id);
    if (!result.ok) return unavailable(result.error);
    const dossier = result.dossiers[0];
    if (!dossier) notFound();
    if (dossier.ownerUserId !== profile.actorId) return unavailable("Ce dossier n’appartient pas à votre portefeuille.");
    return <ClientDetailView initialClient={dossier} />;
  }

  // Every other role sees an allowlisted summary; ADMIN may only reassign it.
  const result = await getOperationalDossiers({ dossierId: id });
  if (!result.ok) return unavailable(result.error);
  const dossier = result.dossiers[0];
  if (!dossier) notFound();

  const isAssignmentAdmin = profile?.role === "ADMIN" && hasCapability(profile.role, "admin:users", profile.capabilities);
  if (!isAssignmentAdmin) {
    return <OperationalDossierDetail dossier={dossier} events={result.events ?? []} />;
  }

  const managerRoster = await getRegionalManagersForDossier(id);
  const assignmentControl = managerRoster.ok
    ? { currentManagerId: managerRoster.currentManagerId, managers: managerRoster.managers }
    : { currentManagerId: null, managers: [], error: managerRoster.error };

  return <OperationalDossierDetail dossier={dossier} events={result.events ?? []} assignmentControl={assignmentControl} />;
}
