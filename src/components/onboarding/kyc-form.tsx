"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, ArrowRight, CheckCircle2, Copy, Check } from "lucide-react";
import { CustomerProfile } from "@/lib/types";

export default function KycForm() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [createdDuc, setCreatedDuc] = useState<CustomerProfile | null>(null);

  const [formData, setFormData] = useState({
    firstName: "Jean-Paul",
    lastName: "MBALLA",
    cniNumber: "102938475",
    phone: "+237 699 00 11 22",
    email: "jeanpaul.mballa@email.cm",
    region: "Centre (Yaoundé)",
    profession: "Ingénieur Télécoms",
    employer: "Entreprise Privée (CDI)",
    monthlyIncome: 450000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomId = Math.floor(10000 + Math.random() * 90000);
    const newDuc: CustomerProfile = {
      ducId: `CFC-2026-DUC-${randomId}`,
      ...formData,
      createdAt: new Date().toLocaleDateString("fr-FR"),
    };
    setCreatedDuc(newDuc);
  };

  const handleCopy = () => {
    if (!createdDuc) return;
    navigator.clipboard.writeText(createdDuc.ducId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      
      {!createdDuc ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          
          <div className="text-center max-w-lg mx-auto pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-cfc-lightgold mx-auto flex items-center justify-center text-cfc-brown mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Ouverture de votre Dossier Unique Client (DUC)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Renseignez vos informations pour générer votre identifiant fédérateur CFC et démarrer la constitution de votre épargne.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nom patronymique *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cfc-brown/20 focus:border-cfc-brown outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Prénoms *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cfc-brown/20 focus:border-cfc-brown outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">N° CNI ou Passeport *</label>
                <input
                  type="text"
                  required
                  value={formData.cniNumber}
                  onChange={(e) => setFormData({ ...formData, cniNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cfc-brown/20 focus:border-cfc-brown outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Numéro Mobile Money (MTN / Orange) *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cfc-brown/20 focus:border-cfc-brown outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Région de résidence *</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cfc-brown/20 focus:border-cfc-brown outline-none bg-white"
                >
                  <option value="Centre (Yaoundé)">Centre (Yaoundé)</option>
                  <option value="Littoral (Douala)">Littoral (Douala)</option>
                  <option value="Ouest (Bafoussam)">Ouest (Bafoussam)</option>
                  <option value="Sud (Ebolowa / Kribi)">Sud (Ebolowa / Kribi)</option>
                  <option value="Nord (Garoua)">Nord (Garoua)</option>
                  <option value="Diaspora">Diaspora</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Profession / Activité *</label>
                <input
                  type="text"
                  required
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cfc-brown/20 focus:border-cfc-brown outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Employeur / Statut</label>
                <input
                  type="text"
                  value={formData.employer}
                  onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cfc-brown/20 focus:border-cfc-brown outline-none"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                ← Retour au simulateur
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-cfc-brown hover:bg-cfc-darkbrown text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Générer mon Identifiant Unique DUC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* Écran Succès : DUC Généré */
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-10 shadow-lg text-center space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Dossier Unique Client Actif
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-3">
              Bienvenue au CFC, {createdDuc.firstName} {createdDuc.lastName}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Votre dossier a été immatriculé dans le référentiel central du Crédit Foncier du Cameroun.
            </p>
          </div>

          {/* Badge DUC */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl max-w-md mx-auto relative overflow-hidden border border-slate-800">
            <div className="text-[11px] text-cfc-gold font-semibold uppercase tracking-wider">
              Identifiant Fédérateur CFC (DUC)
            </div>
            <div className="text-2xl font-mono font-black tracking-wider text-white mt-1 flex items-center justify-center gap-3">
              <span>{createdDuc.ducId}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                title="Copier le numéro"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Agence : {createdDuc.region}</span>
              <span>Statut : Épargne Ouverte</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push(`/portal?duc=${createdDuc.ducId}`)}
              className="w-full sm:w-auto px-8 py-3.5 bg-cfc-brown hover:bg-cfc-darkbrown text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Accéder au Guichet Unique pour Déposer mes Pièces</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
