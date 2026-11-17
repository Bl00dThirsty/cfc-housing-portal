"use client";

import * as React from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, PauseCircle } from "lucide-react";
import { toast } from "sonner";

import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/action-feedback";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/domain/entities/phone";
import {
  decideDucEligibilityAction,
  listDocumentTypesAction,
  listDossiersToOrientAction,
  requestDossierDocumentAction,
  type DocumentTypeOption,
  type DossierToOrient,
} from "@/server/actions/dossiers";

/**
 * La file des dossiers à orienter.
 *
 * C'est le poste de travail du conseiller : les dossiers qui attendent une
 * décision — une activation, un refus motivé, une pièce manquante. Chaque
 * décision est **journalisée** et **notifiée** à l'emprunteur : la file
 * n'est pas une liste de tâches, c'est le travail du dossier.
 */

/** La situation du parcours, en langage lisible. */
const STATE_LABELS: Record<string, string> = {
  suspension: "En attente d'orientation",
  en_examen: "En cours d'instruction",
  documents: "Pièces à déposer",
};

const STATE_TONE: Record<string, "neutral" | "blue" | "amber" | "green" | "red"> = {
  suspension: "amber",
  en_examen: "blue",
  documents: "neutral",
};

export function DossierOrientationQueue() {
  const [dossiers, setDossiers] = React.useState<DossierToOrient[]>([]);
  const [documentTypes, setDocumentTypes] = React.useState<DocumentTypeOption[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  /** Le motif ou la pièce demandée, par dossier. */
  const [motifs, setMotifs] = React.useState<Record<string, string>>({});
  const [requestedType, setRequestedType] = React.useState<Record<string, string>>({});

  const refresh = React.useCallback(() => {
    setLoading(true);
    void listDossiersToOrientAction().then((result) => {
      if (result.ok) {
        setDossiers(result.dossiers);
        setError(null);
      } else {
        setError(result.error);
        reportError(result.error);
      }
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    void listDocumentTypesAction().then((result) => {
      if (result.ok) setDocumentTypes(result.types);
    });
  }, []);

  const decide = (dossier: DossierToOrient, eligible: boolean) => {
    const motif = motifs[dossier.dossierId] ?? "";

    setError(null);
    setPendingId(dossier.dossierId);

    void decideDucEligibilityAction({
      dossierId: dossier.dossierId,
      eligible,
      motif,
    }).then((result) => {
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        reportError(result.error);
        return;
      }
      toast.success(result.message);
      refresh();
    });
  };

  const askDocument = (dossier: DossierToOrient) => {
    const docTypeCode = requestedType[dossier.dossierId] ?? "";
    if (!docTypeCode) {
      const message = "Choisissez la pièce à demander.";
      setError(message);
      reportError(message);
      return;
    }

    setError(null);
    setPendingId(dossier.dossierId);

    void requestDossierDocumentAction({
      dossierId: dossier.dossierId,
      docTypeCode,
      motif: motifs[dossier.dossierId] ?? "",
    }).then((result) => {
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        reportError(result.error);
        return;
      }
      toast.success(result.message);
      refresh();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Chargement de la file des dossiers…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {dossiers.length === 0 ? (
        <p className="rounded-md border border-line-strong p-6 text-sm text-muted-foreground">
          Aucun dossier n&apos;attend de décision. La file est vide.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-strong rounded-md border border-line-strong">
          {dossiers.map((dossier) => (
            <li key={dossier.dossierId} className="flex flex-col gap-3 px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {dossier.fullName ?? "Emprunteur sans nom"}
                  </span>
                  <span className="truncate caption-style text-soft">
                    {dossier.ducCode}
                    {dossier.email ? ` · ${dossier.email}` : ""}
                    {dossier.phone ? ` · ${formatPhone(dossier.phone)}` : ""}
                    {dossier.advisor ? ` · conseiller : ${dossier.advisor}` : ""}
                    {dossier.isDiaspora ? " · non-résident" : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Tag tone={STATE_TONE[dossier.onboardingState ?? ""] ?? "neutral"} size="sm">
                    {STATE_LABELS[dossier.onboardingState ?? ""] ?? dossier.onboardingState ?? "—"}
                  </Tag>
                  {dossier.ducStatus === "active" && (
                    <Tag tone="green" size="sm">
                      DUC activé
                    </Tag>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                  <label
                    htmlFor={`dossier-motif-${dossier.dossierId}`}
                    className="eyebrow-style font-normal text-subtle"
                  >
                    Motif de la décision
                  </label>
                  <input
                    id={`dossier-motif-${dossier.dossierId}`}
                    value={motifs[dossier.dossierId] ?? ""}
                    onChange={(event) =>
                      setMotifs((current) => ({
                        ...current,
                        [dossier.dossierId]: event.target.value,
                      }))
                    }
                    placeholder="Six mois d'épargne à justifier, pièce périmée…"
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none transition-colors duration-200 ease-power3-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingId === dossier.dossierId}
                    onClick={() => decide(dossier, true)}
                    className="h-8 gap-1.5 rounded-md text-xs"
                  >
                    {pendingId === dossier.dossierId ? (
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-3" aria-hidden />
                    )}
                    Activer le DUC
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingId === dossier.dossierId}
                    onClick={() => decide(dossier, false)}
                    className="h-8 gap-1.5 rounded-md text-xs"
                  >
                    <PauseCircle className="size-3" aria-hidden />
                    Refuser
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                  <label
                    htmlFor={`dossier-piece-${dossier.dossierId}`}
                    className="eyebrow-style font-normal text-subtle"
                  >
                    Pièce à demander
                  </label>
                  <select
                    id={`dossier-piece-${dossier.dossierId}`}
                    value={requestedType[dossier.dossierId] ?? ""}
                    onChange={(event) =>
                      setRequestedType((current) => ({
                        ...current,
                        [dossier.dossierId]: event.target.value,
                      }))
                    }
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none transition-colors duration-200 ease-power3-out focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <option value="">— Choisir une pièce —</option>
                    {documentTypes.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pendingId === dossier.dossierId}
                  onClick={() => askDocument(dossier)}
                  className={cn("h-8 gap-1.5 rounded-md text-xs")}
                >
                  {pendingId === dossier.dossierId ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : (
                    <ArrowRight className="size-3" aria-hidden />
                  )}
                  Demander la pièce
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
