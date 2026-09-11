import KycForm from "@/components/onboarding/kyc-form";

export default function OnboardingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-cfc-brown bg-cfc-lightgold px-3 py-1 rounded-full">
          Étape 2 / 4 · Onboarding
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          Identification & Dossier Unique Client (DUC)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Création de votre fiche fédératrice pour l&apos;épargne et les démarches au Guichet Unique.
        </p>
      </div>

      <KycForm />

    </div>
  );
}
