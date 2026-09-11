"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  User,
  CreditCard,
  Building,
  ChevronRight,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface SaverDetail {
  id: string;
  accountNumber: string;
  client: string;
  profession: string;
  employer: string;
  segment: string;
  agency: string;
  currentBalance: string;
  targetBalance: string;
  progressPercent: number;
  regularity: string;
  lastDepositDate: string;
  contact: string;
  email: string;
  monthlyDeposit: string;
  joinedDate: string;
  ribCarthago: string;
}

const saversDatabase: Record<string, SaverDetail> = {
  "sav1": {
    id: "sav1",
    accountNumber: "CPT-EH-2024-00481",
    client: "ABANDA Eric",
    profession: "Cadre Bancaire",
    employer: "BICEC Cameroun",
    segment: "Salarié Privé",
    agency: "Agence Yaoundé Centre",
    currentBalance: "4 800 000 FCFA",
    targetBalance: "4 800 000 FCFA",
    progressPercent: 100,
    regularity: "Très régulier",
    lastDepositDate: "08 Septembre 2026",
    contact: "+237 699 45 12 80",
    email: "e.abanda@bicec.cm",
    monthlyDeposit: "250 000 FCFA / mois",
    joinedDate: "14 Mars 2024",
    ribCarthago: "10025-00100-048192001-44",
  },
  "sav2": {
    id: "sav2",
    accountNumber: "CPT-EH-2024-00522",
    client: "EBALE Marthe",
    profession: "Enseignante Titulaire",
    employer: "MINESEC",
    segment: "Salarié Public",
    agency: "Agence Bafoussam",
    currentBalance: "3 200 000 FCFA",
    targetBalance: "4 000 000 FCFA",
    progressPercent: 80,
    regularity: "Régulier",
    lastDepositDate: "07 Septembre 2026",
    contact: "+237 677 82 34 11",
    email: "m.ebale@minesec.cm",
    monthlyDeposit: "120 000 FCFA / mois",
    joinedDate: "05 Juin 2024",
    ribCarthago: "10025-00300-052291001-18",
  },
  "sav3": {
    id: "sav3",
    accountNumber: "CPT-EH-2025-00109",
    client: "TCHINDA Raoul",
    profession: "Ingénieur Télécom",
    employer: "Orange France",
    segment: "Diaspora",
    agency: "Guichet Diaspora / Siège",
    currentBalance: "6 000 000 FCFA",
    targetBalance: "6 000 000 FCFA",
    progressPercent: 100,
    regularity: "Très régulier",
    lastDepositDate: "02 Septembre 2026",
    contact: "+33 6 45 78 92 10",
    email: "raoul.tchinda@orange.fr",
    monthlyDeposit: "500 000 FCFA / mois",
    joinedDate: "10 Janvier 2025",
    ribCarthago: "10025-00100-001093401-92",
  },
};

export default function SaverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "sav1";

  const saver = saversDatabase[id] || {
    ...saversDatabase["sav1"],
    id,
    accountNumber: `CPT-EH-2026-${id}`,
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/admin/analytics?tab=audience"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux Analytics
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span>Épargnants</span>
          <ChevronRight className="size-3.5 text-muted-foreground/40" />
          <span className="text-foreground font-mono font-semibold">{saver.accountNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Printer className="size-3.5" />
            Imprimer Relevé
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium">
            <Download className="size-3.5" />
            Attestation d&apos;Apport (PDF)
          </Button>
          {saver.progressPercent >= 100 && (
            <Button
              size="sm"
              onClick={() => router.push("/admin/actors/agency")}
              className="h-8 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="size-3.5" />
              Initier Dossier Prêt DUC
            </Button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              {saver.accountNumber}
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent h-5 px-2 text-xs font-medium">
              {saver.segment}
            </Badge>
            <span className="text-xs text-muted-foreground">• Ouvert le {saver.joinedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Compte Épargne Habitat : {saver.client}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{saver.profession} ({saver.employer})</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building className="size-3.5" />
              {saver.agency}
            </span>
            <span>•</span>
            <span>RIB Carthago : <strong className="font-mono">{saver.ribCarthago}</strong></span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <span className="text-xs text-muted-foreground">Progression vers l&apos;Apport Cible</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {saver.progressPercent}%
            </span>
            <span className="text-xs text-muted-foreground">({saver.currentBalance} / {saver.targetBalance})</span>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-[11px] font-medium border-transparent">
            {saver.progressPercent >= 100 ? "Apport 100% Constitué · Éligible au Prêt" : "Constitution d'apport en cours"}
          </Badge>
        </div>
      </div>

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Solde Actuel Disponible</span>
          <div className="text-2xl font-bold font-mono text-foreground">{saver.currentBalance}</div>
          <span className="text-[11px] text-muted-foreground">Rémunération : <strong>3.75% l&apos;an</strong></span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Objectif d&apos;Apport Cible</span>
          <div className="text-2xl font-bold font-mono text-foreground">{saver.targetBalance}</div>
          <div className="flex items-center gap-2 pt-0.5">
            <Progress value={saver.progressPercent} className="h-1.5 flex-1" />
            <span className="text-[11px] font-semibold text-emerald-600">{saver.progressPercent}%</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Rythme Moyen Mensuel</span>
          <div className="text-2xl font-bold font-mono text-foreground">{saver.monthlyDeposit}</div>
          <span className="text-[11px] text-muted-foreground">Assiduité : <strong>{saver.regularity}</strong></span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1 shadow-xs">
          <span className="text-xs text-muted-foreground">Dernière Opération</span>
          <div className="text-2xl font-bold text-foreground">{saver.lastDepositDate}</div>
          <span className="text-[11px] text-muted-foreground">Canal : <strong>MTN Mobile Money</strong></span>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left (8 cols): Historique Complet des Versements */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Historique des Versements (Compte Carthago)
              </h3>
              <span className="text-xs text-muted-foreground">Journal certifié</span>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-foreground px-3">Date</TableHead>
                    <TableHead className="text-xs font-medium text-foreground px-3">Réf. Transaction</TableHead>
                    <TableHead className="text-xs font-medium text-foreground px-3">Canal</TableHead>
                    <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Versé</TableHead>
                    <TableHead className="text-xs font-medium text-foreground text-right px-3">Solde Cumulé</TableHead>
                    <TableHead className="text-xs font-medium text-foreground px-3">Reçu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { date: "08 Septembre 2026", ref: "TX-MOMO-84912", canal: "MTN Mobile Money", amount: "+ 250 000 FCFA", balance: "4 800 000 FCFA" },
                    { date: "05 Août 2026", ref: "TX-SYS-74102", canal: "Virement SYSTAC", amount: "+ 250 000 FCFA", balance: "4 550 000 FCFA" },
                    { date: "03 Juillet 2026", ref: "TX-MOMO-63219", canal: "MTN Mobile Money", amount: "+ 250 000 FCFA", balance: "4 300 000 FCFA" },
                    { date: "05 Juin 2026", ref: "TX-GUI-51104", canal: "Versement Caisse Agence", amount: "+ 250 000 FCFA", balance: "4 050 000 FCFA" },
                    { date: "02 Mai 2026", ref: "TX-MOMO-48190", canal: "MTN Mobile Money", amount: "+ 250 000 FCFA", balance: "3 800 000 FCFA" },
                    { date: "05 Avril 2026", ref: "TX-SYS-39102", canal: "Virement SYSTAC", amount: "+ 250 000 FCFA", balance: "3 550 000 FCFA" },
                  ].map((tx) => (
                    <TableRow key={tx.ref} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-3 py-2.5 text-xs font-medium text-foreground">{tx.date}</TableCell>
                      <TableCell className="px-3 py-2.5">
                        <Badge variant="outline" className="font-mono text-[11px] bg-muted/30">
                          {tx.ref}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{tx.canal}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {tx.amount}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                        {tx.balance}
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground">
                          <Download className="size-3" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right (4 cols): Profil & Conformité */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="size-4 text-primary" />
              Informations du Titulaire
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Nom &amp; Prénom</span>
                <span className="font-semibold text-foreground">{saver.client}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Profession</span>
                <span className="font-medium text-foreground">{saver.profession}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Employeur</span>
                <span className="font-medium text-foreground">{saver.employer}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Téléphone</span>
                <span className="font-medium text-foreground">{saver.contact}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{saver.email}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Statut KYC</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Dossier Conforme
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Actions Compte Épargne
            </h3>
            {saver.progressPercent >= 100 ? (
              <Button
                onClick={() => router.push("/admin/actors/agency")}
                className="w-full h-10 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="size-4" />
                Transférer vers Enrôlement DUC
              </Button>
            ) : (
              <Button variant="outline" className="w-full h-9 text-xs font-medium gap-2">
                <Download className="size-4" />
                Délivrer Attestation de Solde
              </Button>
            )}
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground hover:text-foreground">
              Envoyer une Notification de Rappel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
