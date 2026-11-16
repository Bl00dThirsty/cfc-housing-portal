"use client";

/**
 * Le panneau de démonstration — le rôle du **conseiller**.
 *
 * Il permet de rejouer le parcours complet sans agent : connexion en un clic
 * à un compte de démonstration, décision sur le dossier d'identité, décision
 * d'éligibilité, et remise à zéro.
 *
 * Chaque décision **écrit** : elle passe dans le journal du dossier et notifie
 * le demandeur. Une démonstration qui ne laisserait de trace ne prouverait
 * rien.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, ShieldCheck, UserRound, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportAction } from "@/lib/action-feedback";
import { cn } from "@/lib/utils";
import { DEMO_ACCOUNTS } from "@/config/demo-accounts";
import {
  demoDecideEligibilityAction,
  demoDecideKycAction,
  demoResetAction,
  demoSignInAction,
} from "@/server/actions/demo";

export interface DemoPanelProps {
  /** Le demandeur actuellement connecté, s'il y en a un. */
  citizen: { id: string; email: string; fullName: string } | null;
  /** L'état de son dossier, tel que la base le porte. */
  dossier: {
    ducCode: string;
    kycState: string;
    onboardingState: string;
    ducStatus: string;
    advisor: string | null;
  } | null;
}

export function DemoPanel({ citizen, dossier }: DemoPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);

  const run = async (key: string, action: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setBusy(key);
    setNotice(null);

    const result = await action();

    setBusy(null);

    if (result.ok) {
      reportAction({ ok: true }, result.message);
      setNotice(result.message ?? null);
      router.refresh();
      return;
    }

    reportAction({ ok: false, error: result.error ?? "Action impossible." });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <Badge variant="cfc" className="w-fit">
          Développement
        </Badge>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Panneau de démonstration
        </h1>
        <p className="text-sm text-muted-foreground">
          Il joue le rôle du conseiller : il décide, il journalise, il notifie
          le demandeur. Cette page n&apos;existe pas en production.
        </p>
      </header>

      {notice && (
        <p role="status" className="rounded-md border border-line-strong bg-muted/40 px-3 py-2 text-xs text-foreground">
          {notice}
        </p>
      )}

      {/* Les comptes ---------------------------------------------------- */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <UserRound className="size-3.5" aria-hidden />
            Se connecter en un clic
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => {
            const active = citizen?.email === account.email;

            return (
              <Button
                key={account.email}
                type="button"
                variant={active ? "cfc" : "outline"}
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  void run(account.email, () =>
                    demoSignInAction({
                      email: account.email,
                      fullName: `Emprunteur — ${account.label}`,
                    }),
                  )
                }
                className="h-auto justify-start px-3 py-2 text-left text-[11px]"
              >
                {busy === account.email ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : null}
                <span className="flex flex-col">
                  <span className="font-medium">{account.label}</span>
                  <span className="font-mono text-[10px] opacity-70">
                    {account.email}
                  </span>
                </span>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Le dossier ----------------------------------------------------- */}
      {citizen && dossier && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[13px]">
              <ShieldCheck className="size-3.5" aria-hidden />
              Décision du conseiller
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <dl className="grid gap-x-6 gap-y-2 rounded-md border border-line-strong bg-muted/30 p-3 sm:grid-cols-2">
              <div>
                <dt className="caption-style text-subtle">Demandeur</dt>
                <dd className="text-xs font-medium text-foreground">
                  {citizen.fullName}
                </dd>
              </div>
              <div>
                <dt className="caption-style text-subtle">Dossier</dt>
                <dd className="font-mono text-xs font-medium text-foreground">
                  {dossier.ducCode}
                </dd>
              </div>
              <div>
                <dt className="caption-style text-subtle">État du KYC</dt>
                <dd className="font-mono text-xs text-foreground">
                  {dossier.kycState}
                </dd>
              </div>
              <div>
                <dt className="caption-style text-subtle">Parcours</dt>
                <dd className="font-mono text-xs text-foreground">
                  {dossier.onboardingState} · {dossier.ducStatus}
                  {dossier.advisor ? ` · ${dossier.advisor}` : ""}
                </dd>
              </div>
            </dl>

            <div className="space-y-1.5">
              <Label htmlFor="demo-reason" className="text-xs">
                Motif de la décision (facultatif)
              </Label>
              <Input
                id="demo-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Pièce d'identité illisible — une version lisible est requise."
                className="h-8 text-xs"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  void run("kyc-approved", () =>
                    demoDecideKycAction({
                      citizenId: citizen.id,
                      decision: "approved",
                      reason: reason || undefined,
                    }),
                  )
                }
                className="gap-1.5 text-xs"
              >
                {busy === "kyc-approved" ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                )}
                Valider le dossier d&apos;identité
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  void run("kyc-rejected", () =>
                    demoDecideKycAction({
                      citizenId: citizen.id,
                      decision: "rejected",
                      reason: reason || undefined,
                    }),
                  )
                }
                className="gap-1.5 text-xs"
              >
                {busy === "kyc-rejected" ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <XCircle className="size-3.5" aria-hidden />
                )}
                Rejeter le dossier d&apos;identité
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  void run("eligible", () =>
                    demoDecideEligibilityAction({
                      citizenId: citizen.id,
                      eligible: true,
                      note: reason || undefined,
                    }),
                  )
                }
                className="gap-1.5 text-xs"
              >
                {busy === "eligible" ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : null}
                Éligible — activer le DUC
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  void run("not-eligible", () =>
                    demoDecideEligibilityAction({
                      citizenId: citizen.id,
                      eligible: false,
                      note: reason || undefined,
                    }),
                  )
                }
                className="gap-1.5 text-xs"
              >
                {busy === "not-eligible" ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : null}
                Non éligible
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={() =>
                void run("reset", () => demoResetAction({ citizenId: citizen.id }))
              }
              className={cn("gap-1.5 text-xs")}
            >
              {busy === "reset" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <RotateCcw className="size-3.5" aria-hidden />
              )}
              Remettre le dossier à zéro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
