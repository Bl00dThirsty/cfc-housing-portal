"use client";

import * as React from "react";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Tag } from "@/components/ui/tag";
import { reportError } from "@/lib/action-feedback";
import { cn } from "@/lib/utils";
import { advanceKycAction, listKycQueueAction, type KycQueueEntry } from "@/server/actions/kyc";
import { KYC_STATE_LABELS, type KycState } from "@/domain/workflows/kyc";
import { formatPhone } from "@/domain/entities/phone";

const STATE_TONE: Record<KycState, "neutral" | "blue" | "amber" | "green" | "red" | "purple" | "teal"> = {
  pre_boarding: "neutral",
  identity_capture: "blue",
  document_verification: "blue",
  screening_pending: "amber",
  screening_cleared: "teal",
  screening_potential_match: "red",
  enhanced_due_diligence: "amber",
  risk_rated: "purple",
  approval_pending: "amber",
  approved: "green",
  active: "green",
  dormant: "neutral",
  review_due: "amber",
  review_in_progress: "blue",
  exited: "neutral",
  offboarded: "neutral",
  blocked: "red",
};

const RISK_TONE = {
  LOW: "green",
  STANDARD: "amber",
  HIGH: "red",
} as const;

export function KycValidationQueue() {
  const [entries, setEntries] = React.useState<KycQueueEntry[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  /**
   * Retour de la dernière décision.
   *
   * `journaled` distingue la décision **tracée** de la décision **appliquée
   * sans trace** : les deux ne s'affichent pas de la même façon.
   */
  const [message, setMessage] = React.useState<{ text: string; journaled: boolean } | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<Record<string, string>>({});

  const refresh = React.useCallback(() => {
    setLoading(true);
    void listKycQueueAction().then((result) => {
      if (result.ok) {
        setEntries(result.entries);
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

  const decide = (citizenId: string, to: KycState) => {
    setError(null);
    setMessage(null);
    setPendingId(citizenId);
    void advanceKycAction({ citizenId, to, note: note[citizenId] ?? "" }).then((result) => {
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        reportError(result.error);
        return;
      }
      setMessage({ text: result.message, journaled: result.journaled });
      // Une décision **journalisée** est acquise. Une décision appliquée sans
      // trace est un défaut : elle se dit comme telle, jamais comme un succès.
      if (result.journaled) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
      refresh();
    });
  };
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Chargement de la file KYC…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-md border p-2.5 text-xs",
            message.journaled
              ? "border-line-strong bg-muted/50 text-foreground"
              : "border-destructive/40 bg-destructive/5 text-destructive",
          )}
        >
          {message.journaled ? (
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          )}
          {message.text}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          Aucun dossier citoyen à contrôler pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-strong rounded-md border border-line-strong">
          {entries.map((entry) => (
            <li key={entry.citizenId} className="flex flex-col gap-2.5 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {entry.fullName ?? "Emprunteur sans nom"}
                  </span>
                  <span className="truncate caption-style text-soft">
                    {entry.email ?? "—"} · {entry.phone ? formatPhone(entry.phone) : "—"}
                    {entry.isDiaspora ? " · non-résident" : ""}
                    {entry.affiliation ? ` · ${entry.affiliation}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Tag tone={STATE_TONE[entry.kycState]} size="sm">
                    {KYC_STATE_LABELS[entry.kycState]}
                  </Tag>
                  {entry.riskRating && (
                    <Tag tone={RISK_TONE[entry.riskRating]} size="sm">
                      Risque {entry.riskRating}
                    </Tag>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                  <label
                    htmlFor={`kyc-note-${entry.citizenId}`}
                    className="eyebrow-style font-normal text-subtle"
                  >
                    Motif de la décision
                  </label>
                  <input
                    id={`kyc-note-${entry.citizenId}`}
                    value={note[entry.citizenId] ?? ""}
                    onChange={(event) =>
                      setNote((current) => ({ ...current, [entry.citizenId]: event.target.value }))
                    }
                    placeholder="Pièce vérifiée, contrôle favorable…"
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs outline-none transition-colors duration-200 ease-power3-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.allowedNext.length === 0 && (
                    <span className="caption-style text-soft">État final.</span>
                  )}
                  {entry.allowedNext.map((next) => (
                    <button
                      key={next}
                      type="button"
                      disabled={pendingId === entry.citizenId}
                      onClick={() => decide(entry.citizenId, next)}
                      className={cn(
                        "flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-background px-2.5 text-xs text-foreground transition-all duration-200 ease-power3-out",
                        "hover:border-cfc-brown hover:bg-cfc-lightgold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      {pendingId === entry.citizenId ? (
                        <Loader2 className="size-3 animate-spin" aria-hidden />
                      ) : (
                        <ArrowRight className="size-3" aria-hidden />
                      )}
                      {KYC_STATE_LABELS[next]}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
