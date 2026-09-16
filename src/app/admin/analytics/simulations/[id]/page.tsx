"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  FileText,
  User,
  Home,
  MapPin,
  Calendar,
  Printer,
  ChevronRight,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface SimulationDetail {
  id: string;
  simRef: string;
  prospect: string;
  profession: string;
  employer: string;
  projectType: string;
  location: string;
  loanAmount: string;
  downPayment: string;
  downPaymentPercent: number;
  monthlyIncome: string;
  monthlyPayment: string;
  debtRatio: string;
  recommendedProduct: string;
  date: string;
  contact: string;
  email: string;
  durationYears: number;
  interestRate: string;
  totalInterest: string;
  insuranceMonthly: string;
  remainingIncome: string;
  landArea: string;
  estimatedPropertyValue: string;
}

const simulationsDatabase: Record<string, SimulationDetail> = {
  "sim1": {
    id: "sim1",
    simRef: "SIM-CFC-2026-0812",
    prospect: "ABANDA Eric",
    profession: "Cadre Bancaire",
    employer: "BICEC Cameroun",
    projectType: "Autoconstruction",
    location: "Olembé (Yaoundé II)",
    loanAmount: "18 500 000 FCFA",
    downPayment: "4 800 000 FCFA",
    downPaymentPercent: 26,
    monthlyIncome: "850 000 FCFA",
    monthlyPayment: "135 400 FCFA",
    debtRatio: "15.9%",
    recommendedProduct: "Prêt Bonifié Fonctionnaire & Cadre Privé",
    date: "08 Septembre 2026 à 10:45",
    contact: "+237 699 45 12 80",
    email: "e.abanda@bicec.cm",
    durationYears: 20,
    interestRate: "4.5% l'an (Taux Bonifié)",
    totalInterest: "9 996 000 FCFA",
    insuranceMonthly: "8 200 FCFA / mois",
    remainingIncome: "706 400 FCFA / mois",
    landArea: "500 m² (TF N° 4892/Mfoundi)",
    estimatedPropertyValue: "25 000 000 FCFA",
  },
  "sim2": {
    id: "sim2",
    simRef: "SIM-CFC-2026-0811",
    prospect: "NKOULOU Sandrine",
    profession: "Comptable Entreprise",
    employer: "SABC Brasseries",
    projectType: "Acquisition SIC",
    location: "Cité SIC Mbankolo (Yaoundé)",
    loanAmount: "14 000 000 FCFA",
    downPayment: "3 200 000 FCFA",
    downPaymentPercent: 23,
    monthlyIncome: "480 000 FCFA",
    monthlyPayment: "102 500 FCFA",
    debtRatio: "21.3%",
    recommendedProduct: "Crédit Acquéreur Logement Social SIC",
    date: "07 Septembre 2026 à 15:20",
    contact: "+237 677 82 34 11",
    email: "s.nkoulou@sabc.cm",
    durationYears: 18,
    interestRate: "4.0% l'an (Convention SIC/CFC)",
    totalInterest: "5 940 000 FCFA",
    insuranceMonthly: "6 500 FCFA / mois",
    remainingIncome: "371 000 FCFA / mois",
    landArea: "Appartement T4 (95 m²)",
    estimatedPropertyValue: "17 200 000 FCFA",
  },
  "sim3": {
    id: "sim3",
    simRef: "SIM-CFC-2026-0810",
    prospect: "TCHINDA Raoul",
    profession: "Ingénieur Télécom",
    employer: "Orange France (Paris)",
    projectType: "Autoconstruction",
    location: "Bastos (Yaoundé I)",
    loanAmount: "32 000 000 FCFA",
    downPayment: "8 000 000 FCFA",
    downPaymentPercent: 25,
    monthlyIncome: "2 600 000 FCFA",
    monthlyPayment: "235 000 FCFA",
    debtRatio: "9.0%",
    recommendedProduct: "Crédit Immobilier Diaspora CFC",
    date: "07 Septembre 2026 à 11:15",
    contact: "+33 6 45 78 92 10",
    email: "raoul.tchinda@orange.fr",
    durationYears: 20,
    interestRate: "5.5% l'an (Guichet Diaspora)",
    totalInterest: "19 400 000 FCFA",
    insuranceMonthly: "14 000 FCFA / mois",
    remainingIncome: "2 351 000 FCFA / mois",
    landArea: "750 m² (TF N° 12450/Wouri)",
    estimatedPropertyValue: "45 000 000 FCFA",
  },
};

export default function SimulationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "sim1";

  const sim = simulationsDatabase[id] || {
    ...simulationsDatabase["sim1"],
    id,
    simRef: `SIM-CFC-2026-${id}`,
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/admin/analytics?tab=engagement"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux Analytics
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span>Simulations</span>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span className="text-foreground font-mono font-semibold">{sim.simRef}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Printer className="size-3.5" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Download className="size-3.5" />
            Fiche PDF
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/actors/agency")}
            className="h-8 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="size-3.5" />
            Convertir en Dossier Unique Client (DUC)
          </Button>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              {sim.simRef}
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-transparent h-5 px-2 text-xs font-medium">
              {sim.projectType}
            </Badge>
            <span className="text-xs text-muted-foreground">• Calculé le {sim.date}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Simulation Financière : {sim.prospect}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{sim.profession} ({sim.employer})</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {sim.location}
            </span>
            <span>•</span>
            <span>{sim.contact}</span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <span className="text-xs text-muted-foreground">Capacité d&apos;endettement</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {sim.debtRatio}
            </span>
            <span className="text-xs text-muted-foreground">(Norme COBAC ≤ 33%)</span>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-[11px] font-medium border-transparent">
            Dossier Éligible au Financement
          </Badge>
        </div>
      </div>

      {/* Key Financial KPIs Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Montant Prêt Sollicité</span>
          <div className="text-2xl font-bold font-mono text-foreground">{sim.loanAmount}</div>
          <span className="text-[11px] text-muted-foreground">Durée : <strong>{sim.durationYears} ans (240 mois)</strong></span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Apport Personnel Mobilisé</span>
          <div className="text-2xl font-bold font-mono text-foreground">{sim.downPayment}</div>
          <div className="flex items-center gap-2 pt-0.5">
            <Progress value={sim.downPaymentPercent} className="h-1.5 flex-1" />
            <span className="text-[11px] font-semibold text-emerald-600">{sim.downPaymentPercent}%</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Mensualité Estimée (TTC)</span>
          <div className="text-2xl font-bold font-mono text-foreground">{sim.monthlyPayment}</div>
          <span className="text-[11px] text-muted-foreground">Dont assurance : <strong>{sim.insuranceMonthly}</strong></span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Reste à Vivre Ménage</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{sim.remainingIncome}</div>
          <span className="text-[11px] text-muted-foreground">Revenu net : <strong>{sim.monthlyIncome}</strong></span>
        </div>
      </div>

      {/* 2-Column In-Depth Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Plan d'Amortissement & Paramètres de Prêt */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Detailed Loan Terms */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Percent className="size-4 text-primary" />
              Paramètres Financiers &amp; Conditions d&apos;Octroi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Taux d&apos;Intérêt Appliqué</span>
                <span className="font-semibold text-foreground text-sm font-mono">{sim.interestRate}</span>
                <span className="text-[10px] text-muted-foreground block">Taux bonifié État du Cameroun</span>
              </div>

              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Coût Total des Intérêts</span>
                <span className="font-semibold text-foreground text-sm font-mono">{sim.totalInterest}</span>
                <span className="text-[10px] text-muted-foreground block">Sur 20 ans d&apos;amortissement</span>
              </div>

              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Différé d&apos;Amortissement</span>
                <span className="font-semibold text-foreground text-sm font-mono">12 mois</span>
                <span className="text-[10px] text-muted-foreground block">Franchise pendant les travaux</span>
              </div>
            </div>

            {/* Produit Recommandé Box */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Produit de Financement CFC Préconisé
                </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent text-[11px]">
                  Taux Bonifié MINFI
                </Badge>
              </div>
              <h4 className="text-base font-bold text-foreground">
                {sim.recommendedProduct}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ce produit offre une bonification de 2.5% prise en charge directement par le Ministère des Finances, réduisant la charge de remboursement mensuelle de plus de 38 000 FCFA par rapport à un crédit bancaire standard.
              </p>
            </div>
          </div>

          {/* Tableau d'Amortissement Prévisionnel Indicatif */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Échéancier Prévisionnel d&apos;Amortissement (Années Clés)
              </h3>
              <span className="text-xs text-muted-foreground">Annuités constantes</span>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-foreground px-3">Période / Année</TableHead>
                    <TableHead className="text-xs font-medium text-foreground text-right px-3">Capital Amorti</TableHead>
                    <TableHead className="text-xs font-medium text-foreground text-right px-3">Intérêts</TableHead>
                    <TableHead className="text-xs font-medium text-foreground text-right px-3">Assurance ADI</TableHead>
                    <TableHead className="text-xs font-medium text-foreground text-right px-3">Mensualité Globale</TableHead>
                    <TableHead className="text-xs font-medium text-foreground text-right px-3">Capital Restant Dû</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { period: "Année 1 (Différé Travaux)", principal: "0 FCFA", interest: "69 375 FCFA", insurance: "8 200 FCFA", total: "77 575 FCFA", crd: "18 500 000 FCFA" },
                    { period: "Année 2 (Début Amortissement)", principal: "62 100 FCFA", interest: "65 100 FCFA", insurance: "8 200 FCFA", total: "135 400 FCFA", crd: "17 754 800 FCFA" },
                    { period: "Année 5", principal: "71 200 FCFA", interest: "56 000 FCFA", insurance: "8 200 FCFA", total: "135 400 FCFA", crd: "15 310 000 FCFA" },
                    { period: "Année 10", principal: "89 400 FCFA", interest: "37 800 FCFA", insurance: "8 200 FCFA", total: "135 400 FCFA", crd: "10 520 000 FCFA" },
                    { period: "Année 15", principal: "112 000 FCFA", interest: "15 200 FCFA", insurance: "8 200 FCFA", total: "135 400 FCFA", crd: "4 890 000 FCFA" },
                    { period: "Année 20 (Dernière Échéance)", principal: "127 200 FCFA", interest: "0 FCFA", insurance: "8 200 FCFA", total: "135 400 FCFA", crd: "0 FCFA (Soldé)" },
                  ].map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">{row.period}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">{row.principal}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">{row.interest}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">{row.insurance}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">{row.total}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">{row.crd}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Profil Demandeur & Garanties */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Profil Demandeur Card */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="size-4 text-primary" />
              Profil de l&apos;Emprunteur
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Nom complet</span>
                <span className="font-semibold text-foreground">{sim.prospect}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Profession</span>
                <span className="font-medium text-foreground">{sim.profession}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Employeur</span>
                <span className="font-medium text-foreground">{sim.employer}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Revenu net mensuel</span>
                <span className="font-mono font-semibold text-foreground">{sim.monthlyIncome}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Téléphone</span>
                <span className="font-medium text-foreground">{sim.contact}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground truncate max-w-[160px]">{sim.email}</span>
              </div>
            </div>
          </div>

          {/* Bien Immobilier & Garantie */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Home className="size-4 text-primary" />
              Garantie &amp; Assiette Foncière
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Type de projet</span>
                <span className="font-semibold text-foreground">{sim.projectType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Localisation</span>
                <span className="font-medium text-foreground">{sim.location}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Titre Foncier (TF)</span>
                <Badge variant="secondary" className="font-mono text-xs h-5 px-2 bg-slate-500/10">
                  {sim.landArea}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Valeur vénale estimée</span>
                <span className="font-mono font-semibold text-foreground">{sim.estimatedPropertyValue}</span>
              </div>
            </div>
          </div>

          {/* Actions & Conversion */}
          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Actions Opérationnelles
            </h3>
            <Button
              onClick={() => router.push("/admin/actors/agency")}
              className="w-full h-10 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="size-4" />
              Convertir en Enrôlement DUC
            </Button>
            <Button variant="outline" className="w-full h-9 text-xs font-medium gap-2">
              <FileText className="size-4" />
              Assigner à un Conseiller Clientèle
            </Button>
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground hover:text-foreground">
              Transmettre le Récapitulatif par SMS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
