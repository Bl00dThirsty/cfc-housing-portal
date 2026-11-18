import { DossierQueueView } from "@/components/portail-cfc/dossier-queue-view";
import { ClientWorkspaceHub } from "./_components/client-workspace-hub";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { getOperationalDossiers } from "@/server/queries/operational-dossiers";
import { getStaffDossiers } from "@/server/queries/staff-dossiers";

export default async function ClientsPage() {
  const profile = await getServerProfile();
  if (profile?.role !== "GESTIONNAIRE") {
    const result = await getOperationalDossiers();
    if (!result.ok) {
      return (
        <section className="rounded-lg border border-destructive/30 bg-card p-5" role="alert">
          <h1 className="font-semibold">Répertoire indisponible</h1>
          <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
        </section>
      );
    }
    return (
      <DossierQueueView
        dossiers={result.dossiers}
        title="Dossiers accessibles"
        description="Répertoire opérationnel limité aux numéros DUC, étapes et rattachements autorisés pour votre rôle. Les profils et justificatifs restent réservés au gestionnaire attribué."
      />
    );
  }

  const result = await getStaffDossiers();
  const savingsCapabilities = {
    canCredit: hasCapability(profile.role, "savings:credit"),
    canDebit: hasCapability(profile.role, "savings:debit"),
    canValidate: hasCapability(profile.role, "savings:validate"),
    canReverse: hasCapability(profile.role, "savings:reverse"),
  };
  return (
    <ClientWorkspaceHub
      clients={result.ok ? result.dossiers : []}
      loadError={result.ok ? undefined : result.error}
      savingsCapabilities={savingsCapabilities}
      canOpenProfile
    />
  );
}
