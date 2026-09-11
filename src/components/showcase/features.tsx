import { Calculator, Smartphone, FileSpreadsheet, ShieldCheck } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Calculator,
      title: "Simulateur d'Objectif Financier",
      description: "Calculez l'effort d'épargne mensuel nécessaire (10% à 30%) pour débloquer votre financement immobilier au CFC.",
    },
    {
      icon: Smartphone,
      title: "Dépôts Instantanés Mobile Money",
      description: "Versez vos mensualités d'épargne via MTN MoMo ou Orange Money avec lettrage comptable automatique dans Carthago.",
    },
    {
      icon: FileSpreadsheet,
      title: "Guichet Unique Dématérialisé",
      description: "Déposez vos pièces (Titre Foncier, plans, bulletins de paie) en ligne sans faire le tour de la ville entre notaires, ministères et banques.",
    },
    {
      icon: ShieldCheck,
      title: "Dossier Unique Client (DUC)",
      description: "Un identifiant fédérateur unique garantissant la traçabilité et la conformité légale (Loi 2024/001 & COBAC).",
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-cfc-brown bg-cfc-lightgold px-3 py-1 rounded-full">
            Avantages Clés
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            La simplification complète de votre parcours immobilier
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200/70 hover:border-cfc-brown/40 hover:bg-white hover:shadow-md transition-all duration-200 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-cfc-lightgold flex items-center justify-center text-cfc-brown">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
