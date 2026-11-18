"use client";

import { Database, FileCheck2, FolderKanban, Landmark, WalletCards } from "lucide-react";

import type { AnalyticsOverview } from "@/domain/entities/analytics-overview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersistenceNotice } from "@/components/portail-cfc/persistence-notice";

function formatCount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatXaf(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

const CHANNEL_LABELS: Record<string, string> = {
  agency: "Agence",
  mobile_money_mtn: "MTN MoMo",
  mobile_money_orange: "Orange Money",
  bank_transfer: "Virement bancaire",
  systac: "SYSTAC",
  employer_debit: "Prélèvement employeur",
  swift_transfer: "Virement SWIFT",
  cash: "Espèces",
};

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function PhaseDistribution({ overview }: { overview: AnalyticsOverview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition du portefeuille</CardTitle>
        <CardDescription>Étapes calculées à partir des DUC visibles par les règles de la base.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {overview.dossiers.byPhase.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun dossier ne se trouve dans votre périmètre.</p>
        ) : overview.dossiers.byPhase.map((phase) => {
          const share = overview.dossiers.total > 0 ? (phase.count / overview.dossiers.total) * 100 : 0;
          return (
            <div key={phase.code} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{phase.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{formatCount(phase.count)} · {share.toFixed(1)}%</span>
              </div>
              <Progress value={share} aria-label={`${phase.label}: ${formatCount(phase.count)} dossiers`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ overview }: { overview: AnalyticsOverview }) {
  const channels = Object.entries(overview.savings.byChannel).sort((left, right) => right[1] - left[1]);
  return (
    <section className="flex flex-col gap-5">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Indicateurs issus de Supabase</Badge>
          <Badge variant="secondary">Périmètre RLS</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Pilotage opérationnel CFC</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Vue consolidée des dossiers, de l’épargne, des comités, des garanties et des décaissements réellement enregistrés.
        </p>
      </header>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Vue d’ensemble</TabsTrigger>
          <TabsTrigger value="savings">Épargne</TabsTrigger>
          <TabsTrigger value="channels">Canaux</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
          <TabsTrigger value="conversion">Instruction</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={FolderKanban} label="Dossiers accessibles" value={formatCount(overview.dossiers.total)} detail={`${formatCount(overview.dossiers.diaspora)} dossier(s) diaspora`} />
            <MetricCard icon={WalletCards} label="Comptes d’épargne actifs" value={formatCount(overview.savings.activeAccounts)} detail={formatXaf(overview.savings.activeBalance)} />
            <MetricCard icon={FileCheck2} label="Offres de prêt" value={formatCount(overview.credit.loanOffers)} detail={`${formatCount(overview.credit.committeeSessions)} séance(s) de comité`} />
            <MetricCard icon={Landmark} label="Dossiers notariés" value={formatCount(overview.notary.instruments)} detail={`${formatCount(overview.notary.openOppositions)} opposition(s) ouverte(s)`} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <PhaseDistribution overview={overview} />
            <Card>
              <CardHeader>
                <CardTitle>Alertes de traitement</CardTitle>
                <CardDescription>Opérations présentes dans les registres ouverts.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <MetricCard icon={Database} label="Opérations d’épargne à valider" value={formatCount(overview.savings.pendingOperations)} />
                <MetricCard icon={Database} label="Échéances à traiter" value={formatCount(overview.disbursements.schedulesDue)} />
                <MetricCard icon={Database} label="Échéances en retard" value={formatCount(overview.disbursements.schedulesLate)} />
                <MetricCard icon={Database} label="Écarts de rapprochement" value={formatCount(overview.disbursements.reconciliationMismatches)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="savings" className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard icon={WalletCards} label="Comptes actifs" value={formatCount(overview.savings.activeAccounts)} />
            <MetricCard icon={WalletCards} label="Encours des comptes actifs" value={formatXaf(overview.savings.activeBalance)} detail="Somme calculée dans le périmètre RLS du compte." />
          </div>
          <p className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
            Les totaux sont agrégés côté Postgres. Aucun nom, numéro de compte ou détail de mouvement individuel n’est envoyé au tableau de bord.
          </p>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader><CardTitle>Opérations d’épargne par canal</CardTitle><CardDescription>Comptage des écritures enregistrées, tous statuts visibles selon vos habilitations.</CardDescription></CardHeader>
            <CardContent>
              {channels.length === 0 ? <p className="text-sm text-muted-foreground">Aucune opération enregistrée.</p> : (
                <ul className="divide-y">
                  {channels.map(([channel, channelCount]) => (
                    <li key={channel} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span>{CHANNEL_LABELS[channel] ?? channel}</span>
                      <Badge variant="outline" className="tabular-nums">{formatCount(channelCount)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulations">
          <PersistenceNotice
            title="Mesure des simulations non disponible"
            description="Le simulateur calcule une estimation à partir du catalogue en vigueur, mais ne conserve pas les saisies personnelles. Aucun volume, prospect ou taux de conversion n’est inventé."
          />
        </TabsContent>

        <TabsContent value="conversion" className="grid gap-4 xl:grid-cols-2">
          <PhaseDistribution overview={overview} />
          <Card>
            <CardHeader><CardTitle>Étapes de décision enregistrées</CardTitle><CardDescription>Les statuts comptabilisés proviennent des tables métier.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <h3 className="mb-2 text-sm font-medium">Séances de comité · {formatCount(overview.credit.committeeSessions)}</h3>
                <ul className="flex flex-col gap-2">
                  {Object.entries(overview.credit.sessionsByStatus).map(([status, value]) => <li key={status} className="flex justify-between gap-2 text-xs"><span>{status}</span><span className="tabular-nums text-muted-foreground">{formatCount(value)}</span></li>)}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium">Offres de prêt · {formatCount(overview.credit.loanOffers)}</h3>
                <ul className="flex flex-col gap-2">
                  {Object.entries(overview.credit.offersByStatus).map(([status, value]) => <li key={status} className="flex justify-between gap-2 text-xs"><span>{status}</span><span className="tabular-nums text-muted-foreground">{formatCount(value)}</span></li>)}
                </ul>
              </div>
              <p className="border-t pt-3 text-xs text-muted-foreground">
                Décaissements visibles : {formatCount(overview.disbursements.tranches)} tranche(s), soit {formatXaf(overview.disbursements.amountTotal)}.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
