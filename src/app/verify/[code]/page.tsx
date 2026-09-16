"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  Building,
  Calendar,
  DollarSign,
  UserCheck,
  ArrowRight,
  Printer,
  QrCode,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CERTIFICATES_DATABASE } from "@/lib/tracking-data";

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase();

  const certificate = CERTIFICATES_DATABASE[code];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              CFC
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Crédit Foncier du Cameroun</h1>
              <p className="text-[11px] text-muted-foreground">
                Plateforme Centrale de Vérification d&apos;Actes &amp; d&apos;Attestations
              </p>
            </div>
          </div>

          <Link href="/portal">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
              Portail Citoyen
            </Button>
          </Link>
        </div>

        {certificate ? (
          /* VALID CERTIFICATE VIEW */
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-card p-6 sm:p-10 shadow-lg space-y-8 relative overflow-hidden">
            {/* Authenticity Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <ShieldCheck className="size-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white text-xs rounded-md">
                    ACTE AUTHENTIFIÉ &amp; VALIDE
                  </Badge>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    Code : {certificate.verificationCode}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  Ce document a été officiellement émis et signé numériquement par le <strong>Crédit Foncier du Cameroun</strong>.
                  Les mentions ci-dessous sont certifiées conformes aux registres de la banque.
                </p>
              </div>
            </div>

            {/* Document Title & Reference */}
            <div className="space-y-1.5 border-b pb-5">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                Réf : {certificate.referenceNumber}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {certificate.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                Émis par la {certificate.agency}
              </p>
            </div>

            {/* Certified Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <UserCheck className="size-3.5 text-primary" />
                  Bénéficiaire Habilité
                </span>
                <div className="text-sm font-bold text-foreground">{certificate.beneficiaryName}</div>
                <div className="text-muted-foreground font-mono text-[11px]">{certificate.beneficiaryCni}</div>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <DollarSign className="size-3.5 text-emerald-600" />
                  Montant Accordé sous Mandat
                </span>
                <div className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {certificate.amount}
                </div>
                <div className="text-muted-foreground text-[11px]">Financement garanti CFC</div>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-1 md:col-span-2">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Building2 className="size-3.5 text-primary" />
                  Projet Immobilier Associé
                </span>
                <div className="text-sm font-semibold text-foreground">{certificate.projectTitle}</div>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Calendar className="size-3.5 text-primary" />
                  Date d&apos;Émission de l&apos;Acte
                </span>
                <div className="text-sm font-bold text-foreground">{certificate.issueDate}</div>
                <div className="text-muted-foreground text-[11px]">Valide jusqu&apos;au {certificate.validUntil}</div>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Building className="size-3.5 text-primary" />
                  Autorité Signataire
                </span>
                <div className="text-sm font-bold text-foreground">{certificate.signingAuthority}</div>
                <div className="text-muted-foreground text-[11px]">{certificate.authorityTitle}</div>
              </div>
            </div>

            {/* Cryptographic Signature & Proof */}
            <div className="p-4 rounded-xl border border-dashed bg-muted/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <QrCode className="size-4 text-emerald-600" />
                  Empreinte Cryptographique (SHA-256)
                </span>
                <span className="text-[10.5px] text-muted-foreground">Registre National CFC</span>
              </div>
              <p className="font-mono text-[10.5px] text-muted-foreground break-all bg-background/80 p-2.5 rounded-lg border">
                {certificate.hashSha256}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link href={`/tracking?duc=${certificate.referenceNumber.split("/")[3] || "DUC-2026-04829"}`}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs gap-1.5 rounded-xl">
                  Accéder au suivi complet du Dossier Unique Client (DUC)
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>

              <Button
                size="sm"
                onClick={handlePrint}
                className="w-full sm:w-auto text-xs gap-1.5 rounded-xl shadow-xs"
              >
                <Printer className="size-3.5" />
                Imprimer le rapport de conformité
              </Button>
            </div>
          </div>
        ) : (
          /* INVALID CODE VIEW */
          <div className="rounded-2xl border-2 border-rose-300 bg-card p-8 sm:p-12 text-center space-y-5 shadow-md">
            <div className="size-16 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="size-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-foreground">Code de vérification non reconnu</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Le code <strong>{code}</strong> ne correspond à aucun document certifié dans le registre officiel du Crédit Foncier du Cameroun.
                Ce document peut être une contrefaçon, avoir été révoqué ou présenter une erreur de saisie.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/tracking">
                <Button className="text-xs rounded-xl">
                  Retourner au portail de suivi
                </Button>
              </Link>
              <Link href="/verify/CFC-VERIF-78A9B2">
                <Button variant="outline" className="text-xs rounded-xl">
                  Tester un code valide (CFC-VERIF-78A9B2)
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Footer legal mention */}
        <p className="text-center text-[11px] text-muted-foreground">
          Crédit Foncier du Cameroun · Direction Générale · BP 1531 Yaoundé · Tél: (+237) 222 23 40 10 / 8008 (Numéro vert)
        </p>
      </div>
    </div>
  );
}
