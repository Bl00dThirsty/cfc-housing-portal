"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Info, ShieldCheck } from "lucide-react";

import { calculateHousingPlan } from "@/domain/calculations";
import type { DebtCapacityPolicy, ServiceProduct, ServiceSummary } from "@/domain/entities/services";
import { formatFCFA } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CalculatorProduct = ServiceProduct & {
  serviceCode: string;
  serviceLabel: string;
  serviceDescription: string | null;
};

interface SavingsCalculatorProps {
  compact?: boolean;
  services: ServiceSummary[];
  debtCapacityPolicy: DebtCapacityPolicy | null;
}

function productsFromServices(services: ServiceSummary[]): CalculatorProduct[] {
  return services.flatMap((service) => service.products.map((product) => ({
    ...product,
    serviceCode: service.code,
    serviceLabel: service.label,
    serviceDescription: service.description,
  })));
}

function numericInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function SavingsCalculator({
  compact = false,
  services,
  debtCapacityPolicy,
}: SavingsCalculatorProps) {
  const products = useMemo(() => productsFromServices(services), [services]);
  const [selectedProductCode, setSelectedProductCode] = useState(products[0]?.code ?? "");
  const [projectCost, setProjectCost] = useState("");
  const [apportPercentage, setApportPercentage] = useState(0);
  const [durationMonths, setDurationMonths] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [loanDurationYears, setLoanDurationYears] = useState(0);

  const selectedProduct = products.find((product) => product.code === selectedProductCode);
  const currentProjectCost = numericInput(projectCost);
  const currentIncome = numericInput(monthlyIncome);
  const currentSavingsMonths = numericInput(durationMonths);
  const productRate = selectedProduct?.indicativeRate;
  const readyToCalculate = Boolean(
    selectedProduct && productRate !== null && productRate !== undefined &&
    currentProjectCost > 0 && apportPercentage > 0 && apportPercentage <= 100 &&
    currentSavingsMonths > 0 && currentIncome > 0 && loanDurationYears > 0,
  );

  const result = readyToCalculate && selectedProduct && productRate !== null && productRate !== undefined
    ? calculateHousingPlan({
        projectCost: currentProjectCost,
        apportPercentage,
        durationMonths: currentSavingsMonths,
        monthlyIncome: currentIncome,
        loanDurationYears,
        annualInterestRate: productRate / 100,
      })
    : null;

  const loanExceedsCeiling = Boolean(
    result && selectedProduct?.loanCeiling !== null && selectedProduct?.loanCeiling !== undefined &&
    result.loanAmount > selectedProduct.loanCeiling,
  );
  const withinCapacity = Boolean(
    result && debtCapacityPolicy && result.debtToIncomeRatio <= debtCapacityPolicy.maxDebtRatio,
  );

  const handleProductChange = (code: string) => {
    const nextProduct = products.find((product) => product.code === code);
    setSelectedProductCode(code);
    setApportPercentage(nextProduct?.minApportPercent ?? 0);
    setLoanDurationYears(nextProduct?.maxDurationYears ?? 0);
  };

  if (products.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <AlertCircle className="mx-auto size-7 text-amber-600" aria-hidden />
        <h2 className="mt-3 font-semibold text-slate-900">Catalogue de financement indisponible</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
          Aucun produit actif avec un barème n’est disponible dans le référentiel. Le simulateur n’invente pas de taux ni de produit de remplacement.
        </p>
      </section>
    );
  }

  return (
    <div className={`grid grid-cols-1 items-start gap-6 ${compact ? "lg:grid-cols-12" : "lg:grid-cols-12"}`}>
      <section className={`${compact ? "lg:col-span-6" : "lg:col-span-7"} space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7`} aria-labelledby="calculator-title">
        <header className="space-y-1 border-b border-slate-100 pb-4">
          <h2 id="calculator-title" className="text-lg font-bold text-slate-900">Simulateur Épargne &amp; Crédit</h2>
          <p className="text-sm text-slate-600">Les produits, taux, apports minimums et durées sont lus dans le catalogue CFC actif.</p>
        </header>

        <div className="space-y-2">
          <label htmlFor="sim-product" className="text-sm font-medium text-slate-800">Produit de financement</label>
          <Select value={selectedProductCode} onValueChange={handleProductChange}>
            <SelectTrigger id="sim-product" className="bg-white">
              <SelectValue placeholder="Choisir un produit" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.code} value={product.code}>{product.serviceLabel} · {product.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProduct?.serviceDescription ? (
            <p className="text-xs leading-relaxed text-slate-600">{selectedProduct.serviceDescription}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedProduct?.indicativeRate !== null && selectedProduct?.indicativeRate !== undefined ? (
              <Badge variant="outline">Taux annuel : {selectedProduct.indicativeRate.toLocaleString("fr-FR")} %</Badge>
            ) : <Badge variant="outline">Taux indisponible</Badge>}
            {selectedProduct?.savingsRate !== null && selectedProduct?.savingsRate !== undefined ? (
              <Badge variant="outline">Rémunération épargne : {selectedProduct.savingsRate.toLocaleString("fr-FR")} %</Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="sim-project-cost" className="text-sm font-medium text-slate-800">Coût du projet (FCFA)</label>
            <Input id="sim-project-cost" inputMode="numeric" type="number" min="1" step="1" value={projectCost} onChange={(event) => setProjectCost(event.target.value)} placeholder="Saisir le coût total" />
            <p className="text-xs text-slate-600">Aucun montant type n’est prérempli.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="sim-income" className="text-sm font-medium text-slate-800">Revenu mensuel net (FCFA)</label>
            <Input id="sim-income" inputMode="numeric" type="number" min="1" step="1" value={monthlyIncome} onChange={(event) => setMonthlyIncome(event.target.value)} placeholder="Saisir le revenu mensuel" />
          </div>
          <div className="space-y-2">
            <label htmlFor="sim-apport" className="text-sm font-medium text-slate-800">Apport ciblé (%)</label>
            <Input id="sim-apport" type="number" min={selectedProduct?.minApportPercent ?? 0} max="100" step="0.1" value={apportPercentage || ""} onChange={(event) => setApportPercentage(numericInput(event.target.value))} placeholder="Selon le produit" />
            <p className="text-xs text-slate-600">Minimum produit : {selectedProduct?.minApportPercent === null || selectedProduct?.minApportPercent === undefined ? "non défini" : `${selectedProduct.minApportPercent.toLocaleString("fr-FR")} %`}.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="sim-saving-duration" className="text-sm font-medium text-slate-800">Durée de constitution (mois)</label>
            <Input id="sim-saving-duration" type="number" min="1" step="1" value={durationMonths} onChange={(event) => setDurationMonths(event.target.value)} placeholder="Saisir une durée" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sim-loan-duration" className="text-sm font-medium text-slate-800">Durée du crédit (années)</label>
            <Input id="sim-loan-duration" type="number" min="1" max={selectedProduct?.maxDurationYears ?? undefined} step="1" value={loanDurationYears || ""} onChange={(event) => setLoanDurationYears(numericInput(event.target.value))} placeholder="Selon le produit" />
            <p className="text-xs text-slate-600">Durée maximale du produit : {selectedProduct?.maxDurationYears ? `${selectedProduct.maxDurationYears} ans` : "non définie"}.</p>
          </div>
        </div>

        {!debtCapacityPolicy ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900" role="status">
            Le barème institutionnel de capacité d’endettement n’est pas disponible. Le calcul financier reste indicatif, sans avis de conformité.
          </p>
        ) : null}
      </section>

      <section className="relative overflow-hidden rounded-2xl bg-cfc-brown p-5 text-white shadow-md sm:p-7 lg:col-span-5" aria-labelledby="results-title">
        <header className="mb-5 flex items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <h2 id="results-title" className="text-base font-semibold">Estimation du financement</h2>
            <p className="mt-1 text-xs text-white/75">Calcul indicatif à partir du produit choisi</p>
          </div>
          <ShieldCheck className="size-5 text-cfc-gold" aria-hidden />
        </header>

        {result ? (
          <div className="space-y-4">
            <dl className="space-y-3">
              <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                <dt className="text-xs text-white/75">Apport à constituer</dt>
                <dd className="mt-1 text-2xl font-bold text-cfc-gold">{formatFCFA(result.apportTotal)}</dd>
                <div className="mt-2 flex justify-between gap-3 border-t border-white/15 pt-2 text-xs">
                  <dt className="text-white/75">Épargne mensuelle estimée</dt>
                  <dd className="font-semibold">{formatFCFA(result.monthlySavings)}</dd>
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                <dt className="text-xs text-white/75">Crédit estimé</dt>
                <dd className="mt-1 text-2xl font-bold">{formatFCFA(result.loanAmount)}</dd>
                <div className="mt-2 flex justify-between gap-3 border-t border-white/15 pt-2 text-xs">
                  <dt className="text-white/75">Mensualité estimée</dt>
                  <dd className="font-semibold">{formatFCFA(result.monthlyLoanRepayment)}</dd>
                </div>
              </div>
            </dl>

            {loanExceedsCeiling ? (
              <p className="flex gap-2 rounded-md border border-amber-300/40 bg-amber-300/10 p-3 text-xs text-amber-100" role="alert">
                <AlertCircle className="size-4 shrink-0" aria-hidden />
                Le crédit estimé dépasse le plafond enregistré pour ce produit ({formatFCFA(selectedProduct?.loanCeiling ?? 0)}).
              </p>
            ) : null}

            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-white/75">
                  <ShieldCheck className="size-3.5 text-cfc-gold" aria-hidden />
                  Capacité d’endettement
                </span>
                <span className={`font-semibold ${debtCapacityPolicy ? (withinCapacity ? "text-emerald-300" : "text-rose-200") : "text-white"}`}>
                  {result.debtToIncomeRatio.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                <div className={`h-full ${debtCapacityPolicy ? (withinCapacity ? "bg-emerald-400" : "bg-rose-400") : "bg-cfc-gold"}`} style={{ width: `${Math.min(result.debtToIncomeRatio, 100)}%` }} />
              </div>
              {debtCapacityPolicy ? (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-white/80" title={debtCapacityPolicy.description ?? debtCapacityPolicy.label}>
                  {withinCapacity ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-300" aria-hidden /> : <Info className="mt-0.5 size-3.5 shrink-0 text-rose-200" aria-hidden />}
                  {withinCapacity
                    ? `Dans la limite du barème actif : ${debtCapacityPolicy.maxDebtRatio.toLocaleString("fr-FR")} % (${debtCapacityPolicy.label}).`
                    : `Au-dessus du barème actif : ${debtCapacityPolicy.maxDebtRatio.toLocaleString("fr-FR")} % (${debtCapacityPolicy.label}).`}
                </p>
              ) : null}
            </div>

            <Button asChild disabled={loanExceedsCeiling} className="w-full bg-cfc-gold text-slate-950 hover:bg-cfc-goldhover">
              <Link href="/onboarding" aria-disabled={loanExceedsCeiling}>
                Commencer un dossier <ArrowRight className="ml-2 size-4" aria-hidden />
              </Link>
            </Button>
            <p className="text-[11px] leading-relaxed text-white/70">
              Cette estimation ne vaut pas accord de crédit. Les valeurs finales dépendent de l’instruction du dossier et du barème en vigueur.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/25 p-5 text-sm text-white/75">
            Sélectionnez un produit puis saisissez les données du projet pour calculer l’épargne et la mensualité estimées.
          </div>
        )}
      </section>
    </div>
  );
}
