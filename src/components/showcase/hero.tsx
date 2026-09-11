import Link from "next/link";
import { ArrowRight, Calculator, Sparkles, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-8 pb-14 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cfc-lightgold border border-cfc-gold/40 text-cfc-brown text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cfc-gold" />
            <span>Campagne Nationale Épargne Habitat 2026</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
            La vitrine officielle pour accéder au{" "}
            <span className="text-cfc-brown underline decoration-cfc-gold/60 decoration-wavy underline-offset-4">
              Guichet Unique
            </span>{" "}
            du Crédit Foncier.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Constituez votre apport personnel progressivement via Mobile Money ou virement bancaire, simulez votre prêt bonifié et déposez vos documents sans vous déplacer d&apos;agence en agence.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/simulator"
              className="w-full sm:w-auto px-8 py-3.5 bg-cfc-brown hover:bg-cfc-darkbrown text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <Calculator className="w-4 h-4 text-cfc-gold" />
              <span>Lancer le Simulateur d&apos;Épargne</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/portal"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Accéder au Guichet Unique</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Apport accessible dès 10%
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Taux préférentiel CFC à 5,5%
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Réglementation COBAC & BEAC
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
