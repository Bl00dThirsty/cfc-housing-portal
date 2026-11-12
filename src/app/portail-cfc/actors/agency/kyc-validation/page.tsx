import { KycValidationQueue } from "@/components/kyc/kyc-validation-queue";

export default function KycValidationPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <span className="eyebrow-style font-normal text-cfc-gold">
          Guichet · Contrôle KYC
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
