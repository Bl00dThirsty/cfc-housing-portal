"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, UserRoundPen, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { AssignedNameCorrectionRequest } from "@/domain/entities/profile";
import { decideCitizenNameCorrectionAction } from "@/server/actions/profile";

interface NameCorrectionReviewPanelProps {
  currentName: string;
  request: AssignedNameCorrectionRequest;
  canDecide: boolean;
}

export function NameCorrectionReviewPanel({ currentName, request, canDecide }: NameCorrectionReviewPanelProps) {
  const router = useRouter();
  const [rejecting, setRejecting] = React.useState(false);
  const [reviewNote, setReviewNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const decide = async (decision: "approved" | "rejected") => {
    const note = reviewNote.trim();
    if (decision === "rejected" && note.length < 10) {
      setError("Ajoutez un motif précis d’au moins 10 caractères.");
      return;
    }
    if (note.length > 1000) {
      setError("Le commentaire ne peut pas dépasser 1000 caractères.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const result = await decideCitizenNameCorrectionAction({
        requestId: request.id,
        decision,
        reviewNote: note,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("La décision n’a pas été enregistrée. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="name-correction-title" className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
            <UserRoundPen aria-hidden className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 id="name-correction-title" className="text-sm font-semibold">Correction du nom légal</h2>
            <p className="mt-1 text-xs text-muted-foreground">Demande reçue le {request.createdAtLabel}</p>
          </div>
        </div>
        <Badge variant="secondary">En attente de votre décision</Badge>
      </div>

      <dl className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-[11px] text-muted-foreground">Nom au dossier</dt>
          <dd className="mt-1 break-words text-sm font-medium">{currentName}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] text-muted-foreground">Nom demandé</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-primary">{request.requestedFullName}</dd>
        </div>
      </dl>

      <div>
        <h3 className="text-xs font-semibold">Justification de l’emprunteur</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{request.reason}</p>
      </div>

      <div className="flex flex-col gap-3 border-t pt-3">
        {!canDecide ? (
          <p role="status" className="text-xs text-muted-foreground">
            Vous pouvez consulter cette demande, mais votre habilitation ne permet pas de la traiter.
          </p>
        ) : null}

        {canDecide && rejecting ? (
          <Field
            label="Motif de refus"
            htmlFor={`name-correction-note-${request.id}`}
            required
            hint="Au moins 10 caractères. Le motif sera conservé dans l’historique et communiqué à l’emprunteur."
            error={error ?? undefined}
          >
            <Textarea
              id={`name-correction-note-${request.id}`}
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              aria-invalid={Boolean(error)}
              disabled={saving}
              maxLength={1000}
              rows={3}
              placeholder="Expliquez les justificatifs manquants ou la décision…"
            />
          </Field>
        ) : null}

        {canDecide && error && !rejecting ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}

        {canDecide ? <div className="flex flex-wrap justify-end gap-2">
          {rejecting ? (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => { setRejecting(false); setError(null); }} disabled={saving}>
                Annuler
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => void decide("rejected")} disabled={saving}>
                {saving ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : <X aria-hidden className="size-3.5" />}
                Confirmer le refus
              </Button>
            </>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => { setRejecting(true); setError(null); }} disabled={saving}>
                Refuser la demande
              </Button>
              <Button type="button" size="sm" onClick={() => void decide("approved")} disabled={saving}>
                {saving ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : <Check aria-hidden className="size-3.5" />}
                Approuver la correction
              </Button>
            </>
          )}
        </div> : null}
      </div>
    </section>
  );
}
