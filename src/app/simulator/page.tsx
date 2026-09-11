import SavingsCalculator from "@/components/simulator/savings-calculator";

export default function SimulatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-cfc-brown bg-cfc-lightgold px-3 py-1 rounded-full">
          Campagne Épargne Habitat
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-2">
          Simulateur Officiel de Financement Immobilier
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Définissez vos mensualités d&apos;épargne et découvrez immédiatement votre capacité d&apos;emprunt au Crédit Foncier du Cameroun.
        </p>
      </div>

      <SavingsCalculator compact={false} />

    </div>
  );
}
