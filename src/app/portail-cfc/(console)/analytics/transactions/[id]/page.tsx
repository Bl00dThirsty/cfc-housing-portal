import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSavingsTransactionDetail } from "@/server/queries/operational-registers";

function formatMoney(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

export default async function AnalyticsTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSavingsTransactionDetail(id);
  if (!result.ok) notFound();
  const transaction = result.transaction;
  const date = new Date(transaction.transactionDate);
  const formattedDate = Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/portail-cfc/analytics">Retour au tableau de bord</Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Opération du carnet d’épargne</CardTitle>
              <CardDescription>{formattedDate} · {transaction.channel}</CardDescription>
            </div>
            <Badge variant="secondary">{transaction.decisionState}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Type</p><p className="mt-1 text-sm font-medium">{transaction.transactionType}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Montant</p><p className="mt-1 text-sm font-semibold tabular-nums">{formatMoney(transaction.amount)}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Débit / crédit</p><p className="mt-1 text-sm font-medium tabular-nums">{transaction.debit === null ? "—" : formatMoney(transaction.debit)} / {transaction.credit === null ? "—" : formatMoney(transaction.credit)}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Solde après opération</p><p className="mt-1 text-sm font-medium tabular-nums">{formatMoney(transaction.balanceAfter)}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Référence</p><p className="mt-1 break-all font-mono text-xs">{transaction.reference ?? "—"}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Quittance</p><p className="mt-1 break-all font-mono text-xs">{transaction.receiptReference ?? "—"}</p></div>
          {transaction.dossierId && transaction.dossierCode ? (
            <div className="sm:col-span-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/portail-cfc/dossiers/${transaction.dossierId}`}>État opérationnel du dossier {transaction.dossierCode}</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
