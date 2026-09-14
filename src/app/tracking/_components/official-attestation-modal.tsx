"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  ExternalLink,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import type { OfficialCertificate } from "@/lib/tracking-data";

interface OfficialAttestationModalProps {
  certificate: OfficialCertificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfficialAttestationModal({
  certificate,
  open,
  onOpenChange,
}: OfficialAttestationModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!certificate) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}${certificate.qrPayloadUrl}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl max-h-[92vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="size-4" />
            </span>
            <DialogTitle className="text-sm font-bold text-foreground">
              Document Officiel Scellé Numériquement
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 rounded-lg text-xs gap-1.5 font-mono"
            >
              {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
              {copied ? "Lien copié !" : "Copier lien de vérification"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-lg text-xs gap-1.5"
            >
              <Printer className="size-3.5" />
              Imprimer
            </Button>
            <Button
              size="sm"
              onClick={() => alert("Téléchargement du PDF scellé en cours...")}
              className="h-8 rounded-lg text-xs gap-1.5 shadow-xs"
            >
              <Download className="size-3.5" />
              Télécharger PDF
            </Button>
          </div>
        </div>

        {/* Official Certificate Paper Document */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 dark:bg-zinc-950">
          <div className="max-w-2xl mx-auto rounded-xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 md:p-12 shadow-md relative overflow-hidden text-slate-900 dark:text-zinc-100">
            {/* Watermark Logo Stamp Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
              <div className="size-96 rounded-full border-8 border-current flex items-center justify-center">
                <span className="text-6xl font-black font-serif tracking-widest text-center">
                  CFC
                  <br />
                  OFFICIEL
                </span>
              </div>
            </div>

            {/* Republic & Ministry Header */}
            <div className="flex items-start justify-between text-center text-[10px] uppercase font-bold tracking-tight border-b-2 border-slate-900 dark:border-zinc-100 pb-4 mb-6">
              <div className="space-y-0.5 text-left">
                <p>RÉPUBLIQUE DU CAMEROUN</p>
                <p className="text-[9px] font-normal italic">Paix - Travail - Patrie</p>
                <p className="text-slate-600 dark:text-zinc-400 font-semibold pt-1">
                  MINISTÈRE DES FINANCES
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="size-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  CFC
                </div>
                <span className="text-[8.5px] font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                  CRÉDIT FONCIER DU CAMEROUN
                </span>
              </div>

              <div className="space-y-0.5 text-right">
                <p>REPUBLIC OF CAMEROON</p>
                <p className="text-[9px] font-normal italic">Peace - Work - Fatherland</p>
                <p className="text-slate-600 dark:text-zinc-400 font-semibold pt-1">
                  MINISTRY OF FINANCE
                </p>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center space-y-2 mb-8">
              <Badge
                variant="outline"
                className="font-mono text-xs font-bold px-3 py-1 rounded-full border-emerald-600 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
              >
                RÉFÉRENCE OFFICIELLE : {certificate.referenceNumber}
              </Badge>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground font-serif pt-1">
                {certificate.title}
              </h2>
              <p className="text-xs text-muted-foreground italic">
                Délivré en application de la convention de crédit immobilier du Crédit Foncier du Cameroun
              </p>
            </div>

            {/* Certificate Content Body */}
            <div className="space-y-4 text-xs leading-relaxed">
              <p>
                Le <strong>Crédit Foncier du Cameroun (CFC)</strong>, Établissement Public de Financement de l&apos;Habitat,
                représenté par <strong>{certificate.signingAuthority}</strong>, en sa qualité de {certificate.authorityTitle},
                certifie par la présente que :
              </p>

              <div className="rounded-lg border bg-slate-50/80 dark:bg-zinc-800/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Bénéficiaire :</span>
                  <strong className="text-foreground font-semibold">{certificate.beneficiaryName}</strong>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Identifiant CNI :</span>
                  <span className="font-mono font-medium text-foreground">{certificate.beneficiaryCni}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Projet Financé :</span>
                  <span className="font-medium text-foreground">{certificate.projectTitle}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Montant Approuvé :</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {certificate.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Période de validité de l&apos;accord :</span>
                  <span className="font-medium text-foreground">
                    Du {certificate.issueDate} au {certificate.validUntil}
                  </span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-zinc-300 text-[11.5px] text-justify pt-1">
                Le présent document vaut accord de principe et attestation d&apos;engagement financier auprès des études notariales,
                des services du cadastre (MINDCAF) et des promoteurs immobiliers agréés. Il est infalsifiable et vérifiable en temps réel
                par scannage du sceau cryptographique ci-dessous.
              </p>
            </div>

            {/* Signature & Cryptographic QR Verification Footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-900 dark:border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* QR Code Block */}
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl border border-slate-300 dark:border-zinc-700">
                {/* SVG High-contrast QR Code Mockup */}
                <div className="size-20 bg-white p-1.5 rounded-lg border flex flex-col items-center justify-center shadow-xs">
                  <QrCode className="size-full text-slate-900" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Sceau Numérique Certifié
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Code : {certificate.verificationCode}
                  </p>
                  <Link
                    href={certificate.qrPayloadUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[10.5px] text-primary hover:underline font-semibold"
                  >
                    Vérifier en ligne <ExternalLink className="size-2.5" />
                  </Link>
                </div>
              </div>

              {/* Official Seal and Signature */}
              <div className="text-right space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Fait à {certificate.agency.split("·")[1] || "Yaoundé"}, le {certificate.issueDate}
                </p>
                <p className="text-xs font-bold text-foreground">Pour le Crédit Foncier du Cameroun</p>
                <div className="pt-2 font-serif italic text-emerald-700 dark:text-emerald-400 text-sm font-semibold tracking-wider">
                  [Signé numériquement]
                  <br />
                  <span className="text-xs font-sans text-foreground font-bold not-italic">
                    {certificate.signingAuthority}
                  </span>
                </div>
                <p className="text-[9.5px] text-muted-foreground">{certificate.authorityTitle}</p>
              </div>
            </div>

            {/* Cryptographic SHA-256 Hash Footnote */}
            <div className="mt-6 pt-3 border-t border-slate-200 dark:border-zinc-800 text-[9px] font-mono text-muted-foreground flex flex-col sm:flex-row justify-between gap-1">
              <span>SHA-256: {certificate.hashSha256}</span>
              <span>Registre Central CFC · Serveur Horodatage Sécurisé</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
