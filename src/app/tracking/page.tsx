"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  DollarSign,
  Globe,
  HelpCircle,
  QrCode,
  Sparkles,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_TRACKING_DOSSIERS, type TrackingDossier } from "@/lib/tracking-data";

import { TrackingSearchCard } from "./_components/tracking-search-card";
import { TrackingTimelineStepper } from "./_components/tracking-timeline-stepper";
import { TrackingPiecesAction } from "./_components/tracking-pieces-action";
import { TrackingAdvisorCard } from "./_components/tracking-advisor-card";
import { OfficialAttestationModal } from "./_components/official-attestation-modal";

function TrackingPageContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("duc") || "DUC-2026-04829";

  const [currentDossierId, setCurrentDossierId] = React.useState<string>(initialId);
  const [dossier, setDossier] = React.useState<TrackingDossier | null>(
    MOCK_TRACKING_DOSSIERS[initialId] || MOCK_TRACKING_DOSSIERS["DUC-2026-04829"]
  );
  const [isSearching, setIsSearching] = React.useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = React.useState(false);

  const handleSearch = (id: string) => {
    setIsSearching(true);
    setTimeout(() => {
      const found =
        MOCK_TRACKING_DOSSIERS[id.toUpperCase()] ||
        Object.values(MOCK_TRACKING_DOSSIERS).find(
          (d) =>
            d.cniNumber.toLowerCase() === id.toLowerCase() ||
            d.phone.includes(id) ||
            d.clientName.toLowerCase().includes(id.toLowerCase())
        );

      if (found) {
        setDossier(found);
        setCurrentDossierId(found.ducId);
      } else {
        alert(
          `Aucun dossier trouvé pour la référence « ${id} ». Vous pouvez essayer avec les références de démo DUC-2026-04829, DUC-2026-04750 ou DUC-2026-04912.`
        );
      }
      setIsSearching(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
              <span>Retour au Portail Citoyen</span>
            </Link>
            <div className="h-4 w-px bg-border/80 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                CFC
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight hidden sm:inline">
                Guichet Unique de Suivi Numérique
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/simulator">
              <Button variant="ghost" size="sm" className="h-8.5 text-xs font-medium">
                Simulateur de Crédit
              </Button>
            </Link>
            <Link href="/admin/clients">
              <Button variant="outline" size="sm" className="h-8.5 text-xs font-medium gap-1.5 border-border/80">
                <Building2 className="size-3.5" />
                Espace Back-Office CFC
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 space-y-8 max-w-7xl">
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3 rounded-full border-primary/30 text-primary bg-primary/5">
            <Sparkles className="size-3.5" />
            Transparence &amp; Dématérialisation Intégrale CFC
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
            Suivi en Direct de votre Prêt Immobilier
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Consultez en temps réel l&apos;avancement de votre Dossier Unique de Crédit (DUC), les visas des comités,
            les délais garantis et téléchargez vos attestations scellées avec QR Code infalsifiable.
          </p>
        </div>

        {/* Search Strip */}
        <TrackingSearchCard
          currentDossierId={currentDossierId}
          onSearch={handleSearch}
          isLoading={isSearching}
        />

        {dossier ? (
          <div className="space-y-7">
            {/* Dossier Summary Banner */}
            <div className="rounded-2xl border bg-card p-5 md:p-7 shadow-xs relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                {/* Left: Identity & Project */}
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-bold rounded-md bg-muted/60 px-2 py-0.5">
                      {dossier.ducId}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs rounded-md">
                      {dossier.phaseLabel}
                    </Badge>
                    {dossier.isDiaspora && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 text-xs rounded-md gap-1">
                        <Globe className="size-3" />
                        Pack Diaspora · {dossier.diasporaCountry}
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {dossier.clientName}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                    <Home className="size-3.5 text-primary shrink-0" />
                    <span>{dossier.projectTitle} · <strong className="text-foreground/90">{dossier.location}</strong></span>
                  </p>
                </div>

                {/* Middle: Financials */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/60">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Financement Sollicité</span>
                    <div className="font-mono text-base font-bold text-foreground">
                      {dossier.amountRequested}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Apport : {dossier.personalContribution}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Durée &amp; Taux CFC</span>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {dossier.durationMonths / 12} ans ({dossier.durationMonths} mois)
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Taux : {dossier.interestRate.split(" ")[0]}
                    </span>
                  </div>
                </div>

                {/* Right: Official Certificate CTA */}
                {dossier.certificate && (
                  <div className="shrink-0 flex items-center">
                    <Button
                      onClick={() => setIsCertificateModalOpen(true)}
                      className="h-11 px-5 rounded-xl font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <QrCode className="size-4" />
                      Attestation Scellée (QR Code)
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
              {/* Left 2 Cols: Timeline Stepper & Regulatory Documents Actions */}
              <div className="lg:col-span-2 space-y-7">
                <TrackingTimelineStepper
                  steps={dossier.steps}
                  currentPhaseIndex={dossier.currentPhaseIndex}
                  globalProgress={dossier.globalProgress}
                  slaStatus={dossier.slaStatus}
                />

                <TrackingPiecesAction
                  documents={dossier.documents}
                  ducId={dossier.ducId}
                />
              </div>

              {/* Right Col: Advisor, Financial Details, FAQ */}
              <div className="space-y-7">
                <TrackingAdvisorCard
                  advisor={dossier.advisor}
                  agency={dossier.agency}
                  submissionDate={dossier.submissionDate}
                  lastUpdated={dossier.lastUpdated}
                />

                {/* Financial conditions recap card */}
                <div className="rounded-2xl border bg-card/95 p-5 md:p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-foreground border-b pb-3 flex items-center gap-2">
                    <DollarSign className="size-4 text-primary" />
                    Conditions Financières du Prêt
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Apport mobilisé (Carthago) :</span>
                      <span className="font-semibold font-mono text-foreground">{dossier.personalContribution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux nominal annuel :</span>
                      <span className="font-semibold text-foreground">{dossier.interestRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Échéances mensuelles :</span>
                      <span className="font-semibold text-foreground font-mono">Prélèvement à la source</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Garantie exigée :</span>
                      <span className="font-semibold text-foreground">Hypothèque de 1er rang</span>
                    </div>
                  </div>
                </div>

                {/* FAQ / Direct Help */}
                <div className="rounded-2xl border bg-primary/5 border-primary/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <HelpCircle className="size-4" />
                    Besoin d&apos;assistance sur votre dossier ?
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Le Crédit Foncier du Cameroun met à votre disposition un service d&apos;écoute citoyen.
                    Appelez le numéro vert gratuit <strong>8008</strong> ou écrivez à <strong>contact@creditfoncier.cm</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal for official signed document */}
        <OfficialAttestationModal
          certificate={dossier?.certificate || null}
          open={isCertificateModalOpen}
          onOpenChange={setIsCertificateModalOpen}
        />
      </main>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-sm">Chargement du portail de suivi...</div>}>
      <TrackingPageContent />
    </React.Suspense>
  );
}
