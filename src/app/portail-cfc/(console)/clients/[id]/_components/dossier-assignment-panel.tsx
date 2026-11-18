"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Info, UserRoundCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { reassignDossierAction } from "@/server/actions/assignment";
import type { RegionalManagerOption } from "@/server/queries/regional-managers";

export interface AssignmentControl {
  currentManagerId: string | null;
  managers: RegionalManagerOption[];
  error?: string;
}

export function DossierAssignmentPanel({
  dossierId,
  dossierCode,
  currentManagerName,
  assignment,
}: {
  dossierId: string;
  dossierCode: string;
  currentManagerName?: string;
  assignment: AssignmentControl;
}) {
  const router = useRouter();
  const [staffId, setStaffId] = React.useState(assignment.currentManagerId ?? "");
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const currentManager = assignment.managers.find((manager) => manager.userId === assignment.currentManagerId);
  const selectedManager = assignment.managers.find((manager) => manager.userId === staffId);
  const canSubmit = Boolean(
    selectedManager && staffId !== assignment.currentManagerId && reason.trim().length >= 10,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setMessage(null);
    startTransition(async () => {
      const result = await reassignDossierAction({ dossierId, staffId, reason });
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "success", text: "Dossier réaffecté. Le gestionnaire a reçu une notification." });
      setReason("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border bg-card p-4" aria-labelledby="assignment-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <UserRoundCog className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
          <div>
            <h2 id="assignment-heading" className="text-sm font-semibold">Affectation du dossier</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Le dossier {dossierCode} est actuellement suivi par <span className="font-medium text-foreground">{currentManager?.fullName ?? currentManagerName ?? "un gestionnaire non disponible"}</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">Réservé à l’administrateur</Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="À propos de la réaffectation">
                <Info aria-hidden data-icon="inline-start" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="max-w-64">
              Le nouvel agent doit avoir un compte actif dans la même région. Le motif est conservé dans l’audit ; l’administrateur n’accède pas au contenu KYC par cette action.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {assignment.error ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive" role="alert">
          {assignment.error}
        </p>
      ) : assignment.managers.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground" role="status">
          Aucun compte gestionnaire actif n’est enregistré dans la région de ce dossier. Configurez les comptes staff et leurs agences avant de le réaffecter.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-[minmax(14rem,1fr)_minmax(16rem,2fr)_auto] md:items-end">
          <div className="space-y-1.5">
            <label htmlFor="assignment-manager" className="text-xs font-medium">Nouveau gestionnaire</label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id="assignment-manager" aria-label="Nouveau gestionnaire">
                <SelectValue placeholder="Choisir un compte actif" />
              </SelectTrigger>
              <SelectContent>
                {assignment.managers.map((manager) => (
                  <SelectItem key={manager.userId} value={manager.userId}>
                    {manager.fullName} · {manager.agencyLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentManager?.email ? <p className="text-[11px] text-muted-foreground">Compte actuel : {currentManager.email}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="assignment-reason" className="text-xs font-medium">Motif de réaffectation</label>
            <Textarea
              id="assignment-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={10}
              maxLength={500}
              rows={2}
              placeholder="Expliquez la raison pour l’historique d’audit."
              aria-describedby="assignment-reason-help"
            />
            <p id="assignment-reason-help" className="text-[11px] text-muted-foreground">
              10 caractères minimum · {reason.trim().length}/500
            </p>
          </div>

          <Button type="submit" size="sm" disabled={!canSubmit || pending} className="gap-1.5">
            <ArrowRightLeft className="size-3.5" aria-hidden />
            {pending ? "Enregistrement…" : "Réaffecter"}
          </Button>
        </form>
      )}

      {message ? (
        <p
          className={`mt-3 text-xs ${message.kind === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      ) : null}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ArrowRightLeft className="size-3" aria-hidden />
        La base vérifie l’agence régionale, écrit l’historique et notifie le compte destinataire dans la même transaction.
      </p>
    </section>
  );
}
