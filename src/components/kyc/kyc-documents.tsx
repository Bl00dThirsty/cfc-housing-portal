"use client";

/**
 * Les pièces du KYC — **facultatives**.
 *
 * Elles font la preuve de l'identité et de la situation du demandeur : CNI
 * recto-verso, justificatif de domicile, justificatif de revenus. Elles ne
 * bloquent pas le dossier — elles font gagner du temps à l'instruction.
 *
 * Le dépôt **réutilise** le composant réel déjà livré
 * (`src/components/upload/document-uploader.tsx`) : glisser-déposer, photo
 * d'appareil, progression, remplacement et suppression. On ne crée pas un
 * second composant de dépôt.
 *
 * Seules les **métadonnées** sont conservées dans `kyc_documents` : le nom,
 * le type, la taille et la date. Les octets restent dans le coffre du
 * dossier — ils ne sont jamais dupliqués.
 */

import * as React from "react";
import { FileCheck2, Loader2 } from "lucide-react";

import { DocumentUploader } from "@/components/upload/document-uploader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportAction } from "@/lib/action-feedback";
import { recordKycDocumentAction } from "@/server/actions/kyc-profile";
import { KYC_DOCUMENTS } from "@/domain/entities/kyc-profile";
import { cn } from "@/lib/utils";

export interface KycDocumentsProps {
  /** Le dossier qui reçoit les pièces. */
  dossierId: string | null;
  /** Les codes des pièces déjà déposées. */
  providedCodes: readonly string[];
}

export function KycDocuments({ dossierId, providedCodes }: KycDocumentsProps) {
  const [saving, setSaving] = React.useState<string | null>(null);
  const [provided, setProvided] = React.useState<string[]>([...providedCodes]);

  if (!dossierId) {
    return (
      <p className="text-xs text-muted-foreground">
        Les pièces se déposeront dès que votre dossier sera ouvert.
      </p>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[13px]">
          <FileCheck2 className="size-3.5" aria-hidden />
          Vos pièces justificatives
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            facultatif
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Elles ne vous bloquent pas, mais elles font gagner du temps à
          l&apos;instruction de votre dossier.
        </p>

        {KYC_DOCUMENTS.map((document) => {
          const isProvided = provided.includes(document.code);

          return (
            <div
              key={document.code}
              className={cn(
                "space-y-2 rounded-md border border-line-strong bg-background p-3",
                isProvided && "border-emerald-500/40 bg-emerald-500/5",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {document.label}
                </span>
                {isProvided ? (
                  <Badge variant="success" className="h-4 gap-1 px-1.5 text-[10px]">
                    Déjà fournie
                  </Badge>
                ) : saving === document.code ? (
                  <span className="flex items-center gap-1 caption-style text-subtle">
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                    Enregistrement…
                  </span>
                ) : null}
              </div>

              {!isProvided && (
                <DocumentUploader
                  dossierId={dossierId}
                  docTypeCode={document.code}
                  chemiseCode="C1"
                  label={document.label}
                  hint="PDF, JPEG ou PNG — 10 Mo maximum."
                  onUploaded={async (uploaded) => {
                    setSaving(document.code);

                    const result = await recordKycDocumentAction({
                      docCode: document.code,
                      label: document.label,
                      category: document.category,
                      fileName: uploaded.filename,
                      fileType: uploaded.mimeType,
                      fileSize: uploaded.sizeBytes,
                      dossierId,
                    });

                    setSaving(null);

                    if (!reportAction(result, "Pièce enregistrée.")) return;

                    setProvided((current) =>
                      current.includes(document.code)
                        ? current
                        : [...current, document.code],
                    );
                  }}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
