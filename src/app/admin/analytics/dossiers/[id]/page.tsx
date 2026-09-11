"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  ChevronRight,
  Printer,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DucDetail {
  id: string;
  ducId: string;
  client: string;
  profession: string;
  employer: string;
  project: string;
  currentPhase: string;
  phaseCode: string;
  completionPercent: number;
  loanAmount: string;
  landTitle: string;
  officer: string;
  lastUpdate: string;
  createdDate: string;
  riskStatus: string;
  contact: string;
  email: string;
  estimatedCost: string;
  approvedAmount: string;
}

const ducDatabase: Record<string, DucDetail> = {
  "duc1": {
    id: "duc1",
    ducId: "CFC-2026-DUC-04750",
    client: "MBALLA Jean-Paul",
    profession: "Cadre d'Entreprise",
    employer: "ENEO Cameroun",
    project: "Construction Villa R+1 (Olembé)",
    currentPhase: "G3 · Risques & BET",
    phaseCode: "G3",
    completionPercent: 85,
    loanAmount: "18 500 000 FCFA",
    landTitle: "TF N° 4892/Mfoundi",
    officer: "Mme Belinga (Agence Centre)",
    lastUpdate: "Aujourd'hui, 11:10",
    createdDate: "12 Août 2026",
    riskStatus: "Faible",
    contact: "+237 699 12 34 56",
    email: "jp.mballa@eneo.cm",
    estimatedCost: "25 000 000 FCFA",
    approvedAmount: "En arbitrage technique",
  },
  "duc2": {
    id: "duc2",
    ducId: "CFC-2026-DUC-04712",
    client: "FOTSO Michel",
    profession: "Commerçant Import-Export",
    employer: "Éts Fotso & Frères",
    project: "Immeuble Locatif R+2 (Bonapriso)",
    currentPhase: "G6 · Comités CGR/CRC",
    phaseCode: "G6",
    completionPercent: 95,
    loanAmount: "25 000 000 FCFA",
    landTitle: "TF N° 12450/Wouri",
    officer: "M. Talla (Agence Bonanjo)",
    lastUpdate: "Hier, 16:45",
    createdDate: "05 Juillet 2026",
    riskStatus: "Modéré",
    contact: "+237 677 88 99 00",
    email: "michel.fotso@yahoo.fr",
    estimatedCost: "40 000 000 FCFA",
    approvedAmount: "25 000 000 FCFA (CGR)",
  },
  "duc3": {
    id: "duc3",
    ducId: "CFC-2026-DUC-04655",
    client: "NGO NSOA Marie",
    profession: "Fonctionnaire MINJEC",
    employer: "Ministère de la Jeunesse",
    project: "Acquisition Appartement SIC (Mbankolo)",
    currentPhase: "G8 · Notaires & Cadastre",
    phaseCode: "G8",
    completionPercent: 90,
    loanAmount: "14 400 000 FCFA",
    landTitle: "TF N° 3110/Mfoundi",
    officer: "M. Etoa (Guichet Siège)",
    lastUpdate: "02 Septembre 2026",
    createdDate: "20 Juin 2026",
    riskStatus: "Faible",
    contact: "+237 694 55 66 77",
    email: "marie.ngonsoa@minjec.gov.cm",
    estimatedCost: "16 000 000 FCFA",
    approvedAmount: "14 400 000 FCFA (Validé)",
  },
};

export default function DucDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "duc1";

  const duc = ducDatabase[id] || {
    ...ducDatabase["duc1"],
    id,
    ducId: `CFC-2026-DUC-${id}`,
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/admin/analytics?tab=conversions"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux Analytics
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span>Dossiers DUC</span>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span className="text-foreground font-mono font-semibold">{duc.ducId}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Printer className="size-3.5" />
            Imprimer Fiche DUC
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Download className="size-3.5" />
            Bordereau GED (ZIP)
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/actors/risk-engineering")}
            className="h-8 gap-1.5 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowRight className="size-3.5" />
            Transmettre à l&apos;Étape Suivante
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              {duc.ducId}
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent h-5 px-2 text-xs font-medium">
              {duc.currentPhase}
            </Badge>
            <span className="text-xs text-muted-foreground">• Créé le {duc.createdDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dossier Unique Client : {duc.client}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{duc.project}</span>
            <span>•</span>
            <span>Garantie : <strong className="font-mono">{duc.landTitle}</strong></span>
            <span>•</span>
            <span>Conseiller : <strong>{duc.officer}</strong></span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <span className="text-xs text-muted-foreground">Complétude du Dossier GED</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {duc.completionPercent}%
            </span>
            <span className="text-xs text-muted-foreground">(Pièces Validées)</span>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-[11px] font-medium border-transparent">
            Risque Global : {duc.riskStatus}
          </Badge>
        </div>
      </div>

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Financement Sollicité</span>
          <div className="text-2xl font-bold font-mono text-foreground">{duc.loanAmount}</div>
          <span className="text-[11px] text-muted-foreground">Coût estimé : <strong>{duc.estimatedCost}</strong></span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Étape Actuelle du Circuit</span>
          <div className="text-sm font-bold text-foreground mt-2">{duc.currentPhase}</div>
          <span className="text-[11px] text-muted-foreground">Acteur en charge de l&apos;instruction</span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Complétude Pièces Numérisées</span>
          <div className="text-2xl font-bold font-mono text-foreground">{duc.completionPercent}%</div>
          <div className="flex items-center gap-2 pt-0.5">
            <Progress value={duc.completionPercent} className="h-1.5 flex-1" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Dernière Mise à Jour</span>
          <div className="text-base font-semibold text-foreground mt-1">{duc.lastUpdate}</div>
          <span className="text-[11px] text-muted-foreground">Par {duc.officer}</span>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left (8 cols): Checklist des Pièces & Traçabilité */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Checklist Pièces Réglementaires */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Checklist des Pièces Réglementaires (GED CFC)
              </h3>
              <span className="text-xs text-muted-foreground">6 sur 6 requises</span>
            </div>

            <div className="rounded-lg border divide-y overflow-hidden text-xs">
              {[
                { name: "1. Pièce d'Identité (CNI / Passeport)", status: "Conforme", date: "14/08/2026", agent: "Agence Centre" },
                { name: "2. Certificat de Propriété Foncier récent (< 3 mois)", status: "Conforme", date: "18/08/2026", agent: "Cadastre MINDCAF" },
                { name: "3. Devis Estimatif & Plans d'Architecte", status: "Conforme", date: "22/08/2026", agent: "BET Agréé" },
                { name: "4. Justificatifs de Revenus (3 Bulletins + Relevé Bancaire)", status: "Conforme", date: "15/08/2026", agent: "Agence Centre" },
                { name: "5. Permis de Bâtir / Attestation Urbaine", status: duc.completionPercent >= 90 ? "Conforme" : "En Attente", date: duc.completionPercent >= 90 ? "29/08/2026" : "À fournir", agent: "Mairie Urbaine" },
                { name: "6. Police d'Assurance Décès & Incendie", status: duc.completionPercent >= 95 ? "Conforme" : "En Cours", date: duc.completionPercent >= 95 ? "01/09/2026" : "En cours", agent: "Compagnie Assurance" },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center justify-between p-3 bg-card">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{doc.name}</span>
                    <span className="text-[11px] text-muted-foreground">Validé par {doc.agent} • {doc.date}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      doc.status === "Conforme"
                        ? "bg-emerald-500/10 text-emerald-700 h-5 px-2 text-xs border-transparent font-medium"
                        : "bg-amber-500/10 text-amber-700 h-5 px-2 text-xs border-transparent font-medium"
                    }
                  >
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Circuit Traçabilité Guichet Unique */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Historique des Visas &amp; Circuit Guichet Unique
            </h3>

            <div className="rounded-lg border divide-y overflow-hidden text-xs">
              <div className="p-3 bg-card flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">Groupe G1 · Agence Commerciale</span>
                  <span className="text-muted-foreground text-[11px]">Enrôlement, KYC et collecte épargne validés</span>
                </div>
                <span className="text-emerald-600 font-semibold">Visa Accordé (14/08)</span>
              </div>
              <div className="p-3 bg-card flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">Groupe G3 · Risques &amp; Expertise BET</span>
                  <span className="text-muted-foreground text-[11px]">Visite chantier et contre-expertise du devis</span>
                </div>
                <span className="text-emerald-600 font-semibold">Rapport Favorable (28/08)</span>
              </div>
              <div className="p-3 bg-card flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">Groupe G6 · Comités CGR / CRC</span>
                  <span className="text-muted-foreground text-[11px]">Arbitrage d&apos;octroi et délibération</span>
                </div>
                <span className="text-blue-600 font-semibold">Inscrit à la Séance du 10/09</span>
              </div>
              <div className="p-3 bg-card flex items-center justify-between opacity-50">
                <div>
                  <span className="font-semibold text-foreground block">Groupe G8 · Notaires &amp; Cadastre</span>
                  <span className="text-muted-foreground text-[11px]">Affectation hypothécaire de 1er rang</span>
                </div>
                <span className="text-muted-foreground">En attente accord comité</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (4 cols): Profil & Actions */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="size-4 text-primary" />
              Identité de l&apos;Emprunteur
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Nom &amp; Prénom</span>
                <span className="font-semibold text-foreground">{duc.client}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Profession</span>
                <span className="font-medium text-foreground">{duc.profession}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Employeur</span>
                <span className="font-medium text-foreground">{duc.employer}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Téléphone</span>
                <span className="font-medium text-foreground">{duc.contact}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground truncate max-w-[160px]">{duc.email}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Garantie Foncière</span>
                <Badge variant="secondary" className="font-mono text-xs h-5 px-2 bg-slate-500/10">
                  {duc.landTitle}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Actions sur le Dossier
            </h3>
            <Button
              onClick={() => router.push("/admin/actors/credit-committees")}
              className="w-full h-10 text-xs font-semibold gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowRight className="size-4" />
              Soumettre au Comité CGR / CRC
            </Button>
            <Button variant="outline" className="w-full h-9 text-xs font-medium gap-2">
              <AlertTriangle className="size-4" />
              Envoyer Relance Pièces Manquantes (SMS)
            </Button>
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground hover:text-foreground">
              Transférer le Dossier à une Autre Agence
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
