import Hero from "@/components/showcase/hero";
import Features from "@/components/showcase/features";
import SavingsCalculator from "@/components/simulator/savings-calculator";

export default function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. Hero Showcase */}
      <Hero />

      {/* 2. Interactive Simulator Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-cfc-brown bg-cfc-lightgold px-3 py-1 rounded-full">
            Simulation en direct
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Simulez votre apport et votre prêt CFC
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Testez différents scénarios selon votre capacité d&apos;épargne et vos revenus mensuels.
          </p>
        </div>

        <SavingsCalculator compact={false} />
      </section>

      {/* 3. Features & Ecosystem */}
      <Features />

    </div>
  );
}
