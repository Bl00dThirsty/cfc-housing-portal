"use client";

import * as React from "react";
import { Activity, AlertTriangle, Check, Clock3, Search, ShieldCheck } from "lucide-react";

import type { AdminAuditDashboard, AdminAuditEvent } from "@/domain/entities/admin-audit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";

const CONTROL_CLASS = "h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

const ACTION_LABELS: Record<AdminAuditEvent["action"], string> = {
  insert: "Création",
  update: "Modification",
  delete: "Suppression",
};

function dateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AdminAuditDirectory({ dashboard }: { dashboard: AdminAuditDashboard }) {
  const [query, setQuery] = React.useState("");
  const [action, setAction] = React.useState<AdminAuditEvent["action"] | "all">("all");
  const [view, setView] = React.useState<ViewMode>("list");
  const events = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return dashboard.events.filter((event) => {
      if (action !== "all" && event.action !== action) return false;
      if (!normalizedQuery) return true;
      return [event.actorRole, event.actorId, event.entityType, event.entityKey, event.action]
        .some((value) => value?.toLocaleLowerCase("fr").includes(normalizedQuery));
    });
  }, [action, dashboard.events, query]);

  const readiness = dashboard.readiness;
  const grantCatalogueReady = readiness.activeRoles > 0 && readiness.activeCapabilities > 0 && readiness.orphanedGrants === 0;
  const workflowReady = readiness.activeProcesses > 0 && readiness.activeWorkflowSteps > 0;

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6" data-testid="admin-audit-directory">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow-style text-cfc-gold">Administration · Sécurité</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Journal & état du système</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">Suivez les changements administratifs et vérifiez les principaux référentiels. Le journal ne contient ni valeur de champ, ni courriel, ni donnée KYC.</p>
        </div>
        <Badge variant="outline"><Clock3 aria-hidden />100 événements récents</Badge>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="État des référentiels">
        <ReadinessCard
          icon={<ShieldCheck aria-hidden />}
          title="Rôles & habilitations"
          value={`${readiness.activeRoles} rôles · ${readiness.activeCapabilities} droits`}
          detail={readiness.orphanedGrants === 0 ? "Tous les droits référencent le catalogue." : `${readiness.orphanedGrants} droit(s) sans entrée de catalogue.`}
          ready={grantCatalogueReady}
        />
        <ReadinessCard
          icon={<Activity aria-hidden />}
          title="Circuits de travail"
          value={`${readiness.activeProcesses} processus · ${readiness.activeWorkflowSteps} étapes`}
          detail="Référentiels actifs lus depuis Supabase."
          ready={workflowReady}
        />
        <ReadinessCard
          icon={readiness.emailConfigured ? <Check aria-hidden /> : <AlertTriangle aria-hidden />}
          title="Fournisseur de courriel"
          value={readiness.emailConfigured ? readiness.emailProvider.toUpperCase() : "À configurer"}
          detail={readiness.emailConfigured ? "Secret présent côté serveur." : "Aucun fournisseur actif dans cet environnement."}
          ready={readiness.emailConfigured}
        />
        <ReadinessCard
          icon={<Activity aria-hidden />}
          title="Journal d'administration"
          value={`${dashboard.events.length} événement(s)`}
          detail="Historique récent, filtrable et sans instantané de ligne."
          ready
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-line-strong bg-card p-3 md:p-4" aria-label="Événements d'administration">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1">
            <Search aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher acteur, table ou référence" aria-label="Rechercher dans le journal" className="pl-8" />
          </label>
          <select className={CONTROL_CLASS} aria-label="Filtrer par opération" value={action} onChange={(event) => setAction(event.target.value as AdminAuditEvent["action"] | "all")}>
            <option value="all">Toutes les opérations</option>
            <option value="insert">Créations</option>
            <option value="update">Modifications</option>
            <option value="delete">Suppressions</option>
          </select>
          <ViewModeToggle value={view} onValueChange={setView} />
        </div>

        {events.length === 0 ? (
          <Empty className="min-h-44">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Activity aria-hidden /></EmptyMedia>
              <EmptyTitle>Aucun événement correspondant</EmptyTitle>
              <EmptyDescription>{dashboard.events.length === 0 ? "Les prochaines modifications de comptes, rôles, groupes, workflows et catalogues apparaîtront ici." : "Modifiez votre recherche ou le filtre d'opération."}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : view === "list" ? (
          <AuditTable events={events} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => <AuditCard key={event.id} event={event} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function ReadinessCard({ icon, title, value, detail, ready }: { icon: React.ReactNode; title: string; value: string; detail: string; ready: boolean }) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">{icon}</span>
          <CardTitle>{title}</CardTitle>
        </div>
        <Badge variant={ready ? "success" : "outline"}>{ready ? "Prêt" : "À vérifier"}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="font-semibold tabular-nums">{value}</p>
        <CardDescription>{detail}</CardDescription>
      </CardContent>
    </Card>
  );
}

function AuditTable({ events }: { events: AdminAuditEvent[] }) {
  return (
    <Table containerClassName="rounded-md border">
      <TableHeader>
        <TableRow>
          <TableHead>Heure</TableHead>
          <TableHead>Opération</TableHead>
          <TableHead>Acteur</TableHead>
          <TableHead>Objet</TableHead>
          <TableHead>Référence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{events.map((event) => <AuditRow key={event.id} event={event} />)}</TableBody>
    </Table>
  );
}

function AuditRow({ event }: { event: AdminAuditEvent }) {
  return (
    <TableRow>
      <TableCell>{dateLabel(event.occurredAt)}</TableCell>
      <TableCell><Badge variant={event.action === "delete" ? "destructive" : "secondary"}>{ACTION_LABELS[event.action]}</Badge></TableCell>
      <TableCell><span className="font-medium">{event.actorRole ?? "Service"}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{event.actorId?.slice(0, 8) ?? "—"}</span></TableCell>
      <TableCell className="font-mono text-xs">{event.entityType}</TableCell>
      <TableCell className="max-w-64 truncate font-mono text-xs">{event.entityKey ?? "—"}</TableCell>
    </TableRow>
  );
}

function AuditCard({ event }: { event: AdminAuditEvent }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{ACTION_LABELS[event.action]}</CardTitle>
        <Badge variant={event.action === "delete" ? "destructive" : "secondary"}>{event.actorRole ?? "Service"}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="font-mono text-xs">{event.entityType}</p>
        <p className="break-all text-muted-foreground">{event.entityKey ?? "Référence indisponible"}</p>
        <p className="text-xs text-muted-foreground">{dateLabel(event.occurredAt)} · {event.actorId?.slice(0, 8) ?? "sans acteur associé"}</p>
      </CardContent>
    </Card>
  );
}
