"use client";

import * as React from "react";
import { Check, LoaderCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { decideDossierDocumentAction } from "@/server/actions/dossiers";

interface DucDocumentDecisionActionsProps {
  documentId: string;
  canValidate: boolean;
  canReject: boolean;
  onComplete: () => void;
}

export function DucDocumentDecisionActions({
  documentId,
  canValidate,
  canReject,
  onComplete,
}: DucDocumentDecisionActionsProps) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  if (!canValidate && !canReject) return null;

  const decide = async (decision: "validated" | "rejected") => {
    const rejectionNote = note.trim();
    if (decision === "rejected" && !rejectionNote) {
      setError("Indiquez le motif du rejet.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const result = await decideDossierDocumentAction({
        documentId,
        decision,
        ...(decision === "rejected" ? { note: rejectionNote } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onComplete();
    } catch {
      setError("La décision n’a pas été enregistrée. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Décision documentaire" className="flex flex-col gap-3 border-t bg-muted/20 p-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold">Contrôle documentaire</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Les décisions disponibles suivent le circuit et les habilitations actifs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canValidate ? (
            <Button
              type="button"
              size="sm"
              onClick={() => void decide("validated")}
              disabled={saving}
              title="Valider cette pièce dans l’étape en cours"
            >
              {saving ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : <Check aria-hidden className="size-3.5" />}
              Valider la pièce
            </Button>
          ) : null}
          {canReject ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => { setError(null); setRejectOpen((open) => !open); }}
              disabled={saving}
              aria-expanded={rejectOpen}
            >
              <X aria-hidden className="size-3.5" />
              {rejectOpen ? "Annuler le rejet" : "Rejeter la pièce"}
            </Button>
          ) : null}
        </div>
      </div>

      {rejectOpen ? (
        <div className="flex flex-col gap-3 rounded-md border bg-background p-3">
          <Field
            label="Motif du rejet"
            htmlFor={`document-rejection-${documentId}`}
            required
            hint="Le motif est conservé dans l’historique du dossier et communiqué à l’emprunteur."
            error={error && !note.trim() ? error : undefined}
          >
            <Textarea
              id={`document-rejection-${documentId}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-invalid={Boolean(error && !note.trim())}
              disabled={saving}
              rows={3}
              maxLength={1000}
              placeholder="Précisez la correction attendue…"
            />
          </Field>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void decide("rejected")}
              disabled={saving}
            >
              {saving ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : null}
              Confirmer le rejet
            </Button>
          </div>
        </div>
      ) : null}

      {error && note.trim() ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
