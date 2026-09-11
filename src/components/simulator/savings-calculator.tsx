"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { PROJECT_TYPE_OPTIONS } from "@/lib/mock-data";
import { ProjectType } from "@/lib/types";
import { calculateHousingPlan } from "@/lib/calculations";
import { formatFCFA } from "@/lib/utils";

interface SavingsCalculatorProps {
  compact?: boolean;
}

export default function SavingsCalculator({ compact = false }: SavingsCalculatorProps) {
  const [selectedType, setSelectedType] = useState<ProjectType>("construction");
  const [projectCost, setProjectCost] = useState<number>(15000000);
  const [apportPercentage, setApportPercentage] = useState<number>(20);
  const [durationMonths, setDurationMonths] = useState<number>(24);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(450000);

  // Calcul dynamique
  const result = calculateHousingPlan({
    projectCost,
    apportPercentage,
    durationMonths,
    monthlyIncome,
    loanDurationYears: 15,
    annualInterestRate: 0.055, // 5.5% bonifié
  });

  const handleProjectTypeChange = (type: ProjectType) => {
    setSelectedType(type);
    const opt = PROJECT_TYPE_OPTIONS.find((p) => p.id === type);
    if (opt) {
      setProjectCost(opt.defaultAmount);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Colonne Gauche : Paramétrage du simulateur */}
      <div className={`${compact ? 'lg:col-span-6' : 'lg:col-span-7'} bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6`}>
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Simulateur Épargne & Crédit</h3>
            <p className="text-xs text-slate-500">Calculez votre apport personnel et votre mensualité d&apos;épargne</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cfc-lightgold text-cfc-brown border border-cfc-gold/30">
            Taux CFC 5,5%
          </span>
        </div>

        {/* 1. Type de projet */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Nature du projet immobilier
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROJECT_TYPE_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleProjectTypeChange(opt.id)}
                  className={`p-3 rounded-xl text-xs font-semibold text-center transition-all border ${
                    isSelected
                      ? "bg-cfc-brown text-white border-cfc-brown shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="truncate">{opt.label.split(" ")[0]}</div>
                  <div className="text-[10px] opacity-75 truncate">{opt.label.split(" ").slice(1).join(" ")}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Coût global du projet */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Coût total estimé du projet
            </label>
            <span className="text-base font-bold text-cfc-brown">
              {formatFCFA(projectCost)}
            </span>
          </div>
          <input
            type="range"
            min={3000000}
            max={60000000}
            step={500000}
            value={projectCost}
            onChange={(e) => setProjectCost(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>3M FCFA</span>
            <span>30M FCFA</span>
            <span>60M FCFA</span>
          </div>
        </div>

        {/* 3. Pourcentage d'apport personnel */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Apport personnel cible (% du projet)
            </label>
            <span className="text-base font-bold text-slate-900">
              {apportPercentage} %
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={30}
            step={1}
            value={apportPercentage}
            onChange={(e) => setApportPercentage(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>10% (Minimum)</span>
            <span>20% (Standard recommandé)</span>
            <span>30% (Optimal)</span>
          </div>
        </div>

        {/* 4. Durée de constitution de l'épargne */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            4. Durée d&apos;épargne programmée
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[12, 24, 36].map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setDurationMonths(months)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  durationMonths === months
                    ? "border-cfc-brown bg-cfc-lightgold/40 text-cfc-brown font-bold shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs">{months} Mois</div>
                <div className="text-[10px] text-slate-500 font-normal">{months / 12} an{months > 12 ? 's' : ''}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Revenu net mensuel */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              5. Revenu net mensuel justifié (Ménage)
            </label>
            <span className="text-base font-bold text-slate-900">
              {formatFCFA(monthlyIncome)}
            </span>
          </div>
          <input
            type="range"
            min={100000}
            max={2500000}
            step={25000}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>100k FCFA</span>
            <span>1M FCFA</span>
            <span>2.5M FCFA</span>
          </div>
        </div>

      </div>

      {/* Colonne Droite : Carte Synthèse Financière & Éligibilité */}
      <div className={`${compact ? 'lg:col-span-6' : 'lg:col-span-5'} space-y-6`}>
        
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-cfc-gold/15 rounded-full blur-3xl"></div>

          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-cfc-gold">Plan de Financement CFC</span>
            <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full text-slate-300 font-medium">Bonifié 15 ans</span>
          </div>

          {/* Bloc 1 : Apport Requis */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div className="text-xs text-slate-300">Apport Personnel à Constituer (Épargne Habitat)</div>
            <div className="text-2xl sm:text-3xl font-black text-cfc-gold mt-1">
              {formatFCFA(result.apportTotal)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-300">Mensualité d&apos;épargne recommandée :</span>
              <span className="font-bold text-white text-sm">
                {formatFCFA(result.monthlySavings)} / mois
              </span>
            </div>
          </div>

          {/* Bloc 2 : Crédit Déblocable */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-5">
            <div className="text-xs text-slate-300">Montant du Crédit Immobilier CFC Déblocable</div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {formatFCFA(result.loanAmount)}
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-300">Remboursement prévisionnel (15 ans) :</span>
              <span className="font-bold text-slate-200">
                ~ {formatFCFA(result.monthlyLoanRepayment)} / mois
              </span>
            </div>
          </div>

          {/* Jauge Prudentielle COBAC */}
          <div className="mb-6 bg-white/5 p-3.5 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cfc-gold" />
                Taux d&apos;endettement ménage
              </span>
              <span className={`font-bold ${
                result.debtToIncomeRatio <= 33 ? 'text-emerald-400' : result.debtToIncomeRatio <= 40 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {result.debtToIncomeRatio.toFixed(1)} %
              </span>
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  result.debtToIncomeRatio <= 33 ? 'bg-emerald-400' : result.debtToIncomeRatio <= 40 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(result.debtToIncomeRatio, 100)}%` }}
              ></div>
            </div>

            <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
              {result.debtToIncomeRatio <= 33 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : result.debtToIncomeRatio <= 40 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>
                {result.debtToIncomeRatio <= 33
                  ? "Conforme aux normes prudentielles COBAC (< 33%)"
                  : result.debtToIncomeRatio <= 40
                  ? "Seuil limite toléré (33% - 40%)"
                  : "Dépassement recommandé : ajuster durée ou apport"}
              </span>
            </p>
          </div>

          {/* CTA Onboarding */}
          <Link
            href={`/onboarding?cost=${projectCost}&apport=${result.apportTotal}&type=${selectedType}&save=${Math.round(result.monthlySavings)}`}
            className="w-full py-3.5 px-4 bg-cfc-gold hover:bg-cfc-goldhover text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <span>Souscrire & Générer mon Dossier Unique (DUC)</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

        </div>

        {/* Moyens de paiement mobile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Dépôts d&apos;épargne simplifiés
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> MTN Mobile Money
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Orange Money
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              Virement SYSTAC
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Lettrage et réconciliation comptable instantanés vers votre compte épargne dans le progiciel Carthago.
          </p>
        </div>

      </div>

    </div>
  );
}
