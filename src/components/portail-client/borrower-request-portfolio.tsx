"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, FilePlus2, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  borrowerRequestStatusLabel,
  type BorrowerRequestCardModel,
  type BorrowerRequestsResult,
} from "@/domain/entities/borrower-request";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tag } from "@/components/ui/tag";
import { startBorrowRequestAction, withdrawBorrowRequestAction } from "@/server/actions/borrower-requests";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-CM", { dateStyle: "medium" }).format(date);
}

function isEditableDraft(request: BorrowerRequestCardModel) {
  return request.state === "kyc" || request.state === "service" || request.state === "documents";
}

export function BorrowerRequestPortfolio({ result }: { result: BorrowerRequestsResult }) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<BorrowerRequestCardModel | null>(null);
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [error, setError] = React.useState(result.ok ? null : result.error);

  React.useEffect(() => {
    setError(result.ok ? null : result.error);
  }, [result]);

  const startRequest = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await startBorrowRequestAction();
      if (!response.ok || !response.dossierId) {
        const message = response.ok ? "Le dossier n’a pas pu être ouvert." : response.error;
        setError(message);
        toast.error(message);
        return;
      }
      router.push(`/onboarding?dossier=${encodeURIComponent(response.dossierId)}`);
    } catch {
      const message = "La nouvelle demande n’a pas pu être ouverte. Réessayez.";
      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const withdrawRequest = async () => {
    if (!selected) return;
    setWithdrawing(true);
    try {
      const response = await withdrawBorrowRequestAction(selected.id);
      if (!response.ok) {
        setError(response.error);
        toast.error(response.error);
        return;
      }
      toast.success(response.message);
      setSelected(null);
      router.refresh();
    } catch {
      const message = "Le brouillon n’a pas pu être clôturé. Réessayez.";
      setError(message);
      toast.error(message);
    } finally {
      setWithdrawing(false);
    }
  };

  const requests = result.ok ? result.requests : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          <span className="eyebrow-style font-normal text-cfc-gold">Guichet Unique · Espace Citoyen</span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mes demandes</h1>
          <p className="text-sm text-muted-foreground">Retrouvez chaque dossier, reprenez une demande inachevée et suivez séparément les démarches déjà transmises.</p>
        </div>
        <Button type="button" variant="cfc" size="sm" onClick={() => void startRequest()} disabled={creating || !result.ok}>
          {creating ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <FilePlus2 data-icon="inline-start" />}
          Nouvelle demande
        </Button>
      </header>

      {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {!result.ok ? (
        <Card>
          <CardHeader><CardTitle className="text-sm">Demandes momentanément indisponibles</CardTitle><CardDescription className="text-xs">Vos dossiers n’ont pas pu être chargés. Vous pouvez réessayer sans perdre vos demandes.</CardDescription></CardHeader>
          <CardContent><Button type="button" variant="outline" size="sm" onClick={() => router.refresh()}><RotateCcw data-icon="inline-start" />Réessayer</Button></CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Aucune demande n’est encore ouverte</CardTitle>
            <CardDescription className="max-w-xl text-sm">Démarrez une demande pour enregistrer votre dossier. Vous pourrez le compléter, le retrouver et en ouvrir d’autres depuis cet espace.</CardDescription>
          </CardHeader>
          <CardContent><Button type="button" variant="cfc" size="sm" onClick={() => void startRequest()} disabled={creating}>{creating ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <FilePlus2 data-icon="inline-start" />}Commencer</Button></CardContent>
        </Card>
      ) : (
        <section aria-label="Liste de mes demandes" className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => {
            const resumePath = isEditableDraft(request)
              ? `/onboarding?dossier=${encodeURIComponent(request.id)}`
              : `/portail-client/demandes/${request.id}`;
            const progress = request.completionPercent === null
              ? null
              : Math.max(0, Math.min(100, request.completionPercent));
            return (
              <Card key={request.id} className="gap-4">
                <CardHeader className="items-start">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag tone="blue">{request.ducCode}</Tag>
                      <Tag tone={request.state === "closed" || request.dossierStatus === "closed" ? "neutral" : request.state === "en_examen" || request.state === "suspension" ? "amber" : "green"}>
                        {borrowerRequestStatusLabel(request.state, request.dossierStatus)}
                      </Tag>
                    </div>
                    <CardTitle className="text-sm">{request.serviceLabel ?? (request.state === "service" ? "Service à choisir" : "Demande de prêt")}</CardTitle>
                    <CardDescription className="font-mono text-[11px]">Identifiant de dossier · {request.ducCode}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" aria-hidden />Dernière activité · {formatDate(request.updatedAt)}</span>
                    <span>Ouverte le {formatDate(request.createdAt)}</span>
                  </div>
                  {progress !== null ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Avancement enregistré</span><span className="font-medium tabular-nums">{progress} %</span></div>
                      <Progress value={progress} aria-label={`Avancement ${progress} %`} />
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-strong pt-3">
                    <Button asChild variant="outline" size="sm"><Link href={`/portail-client/demandes/${request.id}`}>Détails<ArrowRight data-icon="inline-end" /></Link></Button>
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditableDraft(request) ? <Button asChild variant="cfc" size="sm"><Link href={resumePath}>Reprendre<ArrowRight data-icon="inline-end" /></Link></Button> : null}
                      {request.canWithdraw ? <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(request)}><Trash2 data-icon="inline-start" />Clôturer le brouillon</Button> : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open && !withdrawing) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clôturer ce brouillon ?</DialogTitle>
            <DialogDescription>La demande {selected?.ducCode} sera marquée comme clôturée. Son numéro et son historique resteront conservés. Vous pourrez ouvrir une nouvelle demande ensuite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={withdrawing} onClick={() => setSelected(null)}>Garder le brouillon</Button>
            <Button type="button" variant="destructive" disabled={withdrawing} onClick={() => void withdrawRequest()}>
              {withdrawing ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Trash2 data-icon="inline-start" />}
              Clôturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
