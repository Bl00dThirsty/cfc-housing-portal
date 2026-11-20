"use client";

/**
 * Les pièces du service choisi — **par catégorie**.
 *
 * L'exigence vient du catalogue (`ref.service_document_requirement`), et
 * l'état de chaque pièce vient du dépôt du demandeur. Trois états, et ils ne
 * se ressemblent pas :
 *
 * - **à fournir** : la pièce manque ;
 * - **déjà fournie** : elle a été déposée au KYC — elle n'est **jamais**
 *   demandée deux fois ;
 * - **envoyée** : le demandeur l'a déposée ici, elle attend sa vérification.
 *
 * « Passer pour l'instant » ne bloque **rien** : un dossier incomplet est
 * instruit, pas rejeté. L'écran dit simplement ce qui reste.
 */

import * as React from "react";
import { ArrowRight, CheckCircle2, CircleDashed, FileText, Loader2, Send } from "lucide-react";

import { DocumentUploader } from "@/components/upload/document-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportAction } from "@/lib/action-feedback";
import { cn } from "@/lib/utils";
import {
  recordKycDocumentAction,
} from "@/server/actions/kyc-profile";
import { submitServiceApplicationAction } from "@/server/actions/borrower-requests";
import {
  DELAI_REPRISE_CONSEILLER_JOURS,
} from "@/domain/entities/kyc-profile";
import { markProvidedDocuments } from "@/domain/entities/services";
import type { ServiceSummary } from "@/domain/entities/services";

/** L'ordre des catégories : le demandeur les lit dans l'ordre du dossier. */
const CATEGORY_ORDER = ["emprunteur", "projet", "programme", "partenaires"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  emprunteur: "Pièces de l'emprunteur",
  projet: "Pièces du projet",
  programme: "Pièces du programme",
  partenaires: "Pièces des partenaires",
};

export interface ServiceDocumentsProps {
  /** Le service choisi — il porte les pièces exigées. */
  service: ServiceSummary;
  /** Le dossier qui reçoit les pièces. */
  dossierId: string | null;
  /** Les codes des pièces déjà fournies au KYC. */
  providedCodes: readonly string[];
  /** Les codes des pièces déjà envoyées par le demandeur. */
  sentCodes: readonly string[];
  /** Le demandeur passe à l'étape suivante. */
  onFinish: () => void;
}

export function ServiceDocuments({
  service,
  dossierId,
  providedCodes,
  sentCodes,
  onFinish,
}: ServiceDocumentsProps) {
  const [sent, setSent] = React.useState<string[]>([...sentCodes]);
  const [transmitting, setTransmitting] = React.useState(false);
  const [transmitted, setTransmitted] = React.useState<{ advisor: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Les pièces déjà fournies au KYC ne sont **jamais** demandées deux fois.
  const requirements = markProvidedDocuments<ChecklistEntry>(
    service.documents.map(
      (document): ChecklistEntry => ({
        docTypeCode: document.docTypeCode,
        label: document.label,
        category: document.category,
        required: document.required,
        minCount: document.minCount,
        status: "missing",
      }),
    ),
    providedCodes,
  );

  const groups = React.useMemo(() => {
    const byCategory = new Map<string, ChecklistEntry[]>();

    for (const entry of requirements) {
      const key = entry.category ?? "emprunteur";
      byCategory.set(key, [...(byCategory.get(key) ?? []), entry]);
    }

    return CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      entries: byCategory.get(category) ?? [],
    }));
  }, [requirements]);

  const missing = requirements.filter(
    (entry) => entry.status === "missing" && entry.required,
  ).length;

  const transmit = async () => {
    if (!dossierId) {
      setError("Ouvrez une demande depuis votre espace avant de la transmettre.");
      return;
    }
    setTransmitting(true);
    setError(null);

    const result = await submitServiceApplicationAction(dossierId);

    setTransmitting(false);

    if (!result.ok) {
      reportAction({ ok: false, error: result.error });
      setError(result.error);
      return;
    }

    reportAction(result, result.message);
    setTransmitted({ advisor: result.advisor ?? "votre conseiller" });
  };

  if (transmitted) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
            Votre dossier est transmis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{transmitted.advisor}</span>{" "}
            examine votre dossier. Vous serez prévenu dès qu&apos;il aura une
            décision — comptez environ {DELAI_REPRISE_CONSEILLER_JOURS} jours.
          </p>
          {missing > 0 && (
            <p className="text-xs text-muted-foreground">
              {missing} pièce{missing > 1 ? "s" : ""} reste{missing > 1 ? "nt" : ""}{" "}
              à fournir : votre conseiller vous les demandera s&apos;il en a besoin.
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="cfc"
              size="sm"
              onClick={onFinish}
              className="gap-1.5 text-xs"
            >
              Aller à mon espace
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">
          Les pièces de {service.label}
        </h2>
        <p className="text-sm text-muted-foreground">
          Déposez ce que vous avez maintenant. Vous pourrez passer pour
          l&apos;instant : votre conseiller vous demandera le reste si besoin.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {groups.map((group) => (
        <section key={group.category} className="space-y-2">
          <h3 className="eyebrow-style font-normal text-subtle">{group.label}</h3>

          <div className="space-y-2">
            {group.entries.map((entry) => {
              const isSent = sent.includes(entry.docTypeCode);
              const isProvided = entry.status === "deja_fournie";

              return (
                <div
                  key={entry.docTypeCode}
                  className={cn(
                    "space-y-2 rounded-md border border-line-strong bg-background p-3",
                    (isSent || isProvided) && "border-emerald-500/40 bg-emerald-500/5",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                      {isSent || isProvided ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                      ) : (
                        <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                      )}
                      {entry.label}
                    </span>

                    {isProvided ? (
                      <Badge variant="success" className="h-4 gap-1 px-1.5 text-[10px]">
                        Déjà fournie
                      </Badge>
                    ) : isSent ? (
                      <Badge variant="secondary" className="h-4 gap-1 px-1.5 text-[10px]">
                        Envoyée
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px]">
                        <CircleDashed className="size-2.5" aria-hidden />
                        À fournir
                      </Badge>
                    )}
                  </div>

                  {!isSent && !isProvided && dossierId && (
                    <DocumentUploader
                      dossierId={dossierId}
                      docTypeCode={entry.docTypeCode}
                      chemiseCode="C1"
                      label={entry.label}
                      hint="PDF, JPEG ou PNG — 10 Mo maximum."
                      onUploaded={async (uploaded) => {
                        const result = await recordKycDocumentAction({
                          docCode: entry.docTypeCode,
                          label: entry.label,
                          category: (entry.category ?? "emprunteur") as
                            | "emprunteur"
                            | "projet"
                            | "programme"
                            | "partenaires",
                          fileName: uploaded.filename,
                          fileType: uploaded.mimeType,
                          fileSize: uploaded.sizeBytes,
                          dossierId,
                        });

                        if (!reportAction(result, "Pièce enregistrée.")) return;

                        setSent((current) =>
                          current.includes(entry.docTypeCode)
                            ? current
                            : [...current, entry.docTypeCode],
                        );
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-col gap-3 border-t pt-4">
        {missing > 0 && (
          <p className="text-xs text-muted-foreground">
            Il vous manque{" "}
            <span className="font-medium text-foreground">
              {missing} pièce{missing > 1 ? "s" : ""}
            </span>{" "}
            pour un dossier complet. Vous pouvez transmettre malgré tout.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={transmitting}
            onClick={() => void transmit()}
            className="text-xs"
          >
            Passer pour l&apos;instant
          </Button>

          <Button
            type="button"
            variant="cfc"
            size="sm"
            disabled={transmitting}
            onClick={() => void transmit()}
            className="gap-1.5 text-xs"
          >
            {transmitting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Send className="size-3.5" aria-hidden />
            )}
            Confirmer la transmission
          </Button>
        </div>
      </div>
    </div>
  );
}

/** L'entrée de la checklist, telle que la liste des pièces la manipule. */
type ChecklistEntry = {
  docTypeCode: string;
  label: string;
  category: string | null;
  required: boolean;
  minCount: number;
  status: "missing" | "deja_fournie" | "envoyee";
};
