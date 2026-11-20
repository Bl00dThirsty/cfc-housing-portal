import { KycValidationQueue } from "@/components/kyc/kyc-validation-queue";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";

export default async function KycValidationPage() {
  const profile = await getServerProfile();
  if (
    profile?.role !== "GESTIONNAIRE" ||
    !hasCapability(profile.role, "kyc:read", profile.capabilities)
  ) {
    return (
      <section className="rounded-lg border border-destructive/30 bg-card p-5" role="alert">
        <h1 className="font-semibold">Accès refusé</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La revue KYC est réservée au gestionnaire affecté au dossier.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <span className="eyebrow-style font-normal text-cfc-gold">
          Gestionnaire · Contrôle KYC
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Validation des dossiers KYC
        </h1>
        <p className="text-sm text-muted-foreground">
          Chaque décision suit la machine à états réglementaire : le
          contrôle de filtrage est un verrou, et une vigilance renforcée est
          obligatoire pour les clients non-résident, les PPE et les opérations
          d&apos;origine incertaine. Toute transition est journalisée.
        </p>
      </header>

      <KycValidationQueue />
    </div>
  );
}
