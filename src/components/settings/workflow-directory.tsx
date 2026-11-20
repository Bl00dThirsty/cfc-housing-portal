"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GitBranch, ListOrdered, Plus, Search, Timer } from "lucide-react";

import type { DocumentStageAction, DocumentStagePhase, DocumentStageRolePolicy, ProcessFamily, ProcessLane, ProcessPriority, WorkflowPhase, WorkflowProcess, WorkflowRoleOption, WorkflowStep } from "@/domain/entities/admin-workflow";
import { filterWorkflowSteps } from "@/domain/entities/admin-workflow";
import { saveWorkflowProcessAction, saveWorkflowStepAction, setDocumentStagePhaseAction, setDocumentStageRolePolicyAction, setWorkflowStepOrderAction, type WorkflowActionResult } from "@/server/actions/admin-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";

const CONTROL_CLASS = "h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";
const FAMILY_LABELS: Record<ProcessFamily, string> = { pilotage: "Pilotage", realisation: "Réalisation", support: "Support", ecosysteme: "Écosystème" };
const LANE_LABELS: Record<ProcessLane, string> = { client: "Client", agence: "Agence", siege: "Siège", partenaires: "Partenaires", support: "Support" };

export function WorkflowDirectory({
  processes,
  steps,
  phases,
  documentStages = [],
  documentPolicies = [],
  roles = [],
}: {
  processes: WorkflowProcess[];
  steps: WorkflowStep[];
  phases: WorkflowPhase[];
  documentStages?: DocumentStagePhase[];
  documentPolicies?: DocumentStageRolePolicy[];
  roles?: WorkflowRoleOption[];
}) {
  const [query, setQuery] = React.useState("");
  const [phase, setPhase] = React.useState("all");
  const [processCode, setProcessCode] = React.useState("all");
  const [view, setView] = React.useState<ViewMode>("list");
  const [notice, setNotice] = React.useState<string | null>(null);
  const filtered = React.useMemo(() => filterWorkflowSteps(steps, { query, phase, processCode }), [steps, query, phase, processCode]);

  return (
    <main className="space-y-6 p-4 md:p-6" data-testid="admin-workflow-directory">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="eyebrow-style text-cfc-gold">Administration · Référentiel métier</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Étapes & workflows</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">Configurez les processus et leurs étapes. Les modifications sont persistées et auditées; les codes des phases métier restent des références stables des dossiers existants.</p>
        </div>
        <div className="flex flex-wrap gap-2"><WorkflowEditor kind="process" onResult={setNotice} /><WorkflowEditor kind="step" processes={processes} phases={phases} onResult={setNotice} /></div>
      </header>
      {notice ? <div role="status" className="rounded-md border border-success/30 bg-success/5 px-3 py-2.5 text-sm">{notice}<button className="ml-3 text-xs text-muted-foreground underline" onClick={() => setNotice(null)}>Fermer</button></div> : null}

      <section aria-label="Résumé du workflow" className="grid gap-3 sm:grid-cols-3">
        <Summary icon={<GitBranch aria-hidden className="size-4" />} label="Processus actifs" value={processes.length} />
        <Summary icon={<ListOrdered aria-hidden className="size-4" />} label="Étapes actives" value={steps.length} />
        <Summary icon={<Timer aria-hidden className="size-4" />} label="Étapes avec délai défini" value={steps.filter((step) => step.slaDays !== null).length} />
      </section>

      <section aria-label="Phases du parcours de crédit" className="space-y-3 rounded-lg border border-line-strong bg-card p-4">
        <div><h2 className="text-sm font-semibold">Phases du parcours</h2><p className="text-xs text-muted-foreground">Phases référencées par les dossiers et la chronologie opérationnelle.</p></div>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {phases.map((item, index) => <li key={item.code} className="flex min-w-0 items-center gap-3 rounded-md border bg-background p-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-cfc-lightgold text-xs font-semibold text-cfc-brown">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{item.label}</p><p className="font-mono text-[11px] text-muted-foreground">{item.code}</p></div></li>)}
        </ol>
      </section>

      <DocumentWorkflowControls
        documentStages={documentStages}
        documentPolicies={documentPolicies}
        roles={roles}
        phases={phases}
      />

      <section aria-label="Répertoire des étapes" className="space-y-4 rounded-lg border border-line-strong bg-card p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1"><Search aria-hidden className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Rechercher les étapes" className="pl-8" placeholder="Rechercher code, libellé ou pilote" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select aria-label="Filtrer par processus" className={CONTROL_CLASS} value={processCode} onChange={(event) => setProcessCode(event.target.value)}><option value="all">Tous les processus</option>{processes.map((process) => <option key={process.code} value={process.code}>{process.code} · {process.label}</option>)}</select>
          <select aria-label="Filtrer par phase" className={CONTROL_CLASS} value={phase} onChange={(event) => setPhase(event.target.value)}><option value="all">Toutes les phases</option><option value="unassigned">Sans phase</option>{phases.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select>
          <ViewModeToggle value={view} onValueChange={setView} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className={view === "grid" ? "grid content-start gap-3 md:grid-cols-2" : "divide-y divide-border rounded-md border"}>
            {filtered.map((step) => <StepRow key={step.code} step={step} processes={processes} phases={phases} view={view} onResult={setNotice} />)}
            {filtered.length === 0 ? <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Aucune étape ne correspond aux filtres.</p> : null}
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Catalogue des processus</h2>
            {processes.map((process) => <ProcessCard key={process.code} process={process} onResult={setNotice} />)}
            {processes.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Aucun processus actif dans le référentiel.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

const DOCUMENT_ACTIONS: { code: DocumentStageAction; label: string }[] = [
  { code: "upload", label: "Déposer" },
  { code: "validate", label: "Valider" },
  { code: "reject", label: "Rejeter" },
];

function DocumentWorkflowControls({
  documentStages,
  documentPolicies,
  roles,
  phases,
}: {
  documentStages: DocumentStagePhase[];
  documentPolicies: DocumentStageRolePolicy[];
  roles: WorkflowRoleOption[];
  phases: WorkflowPhase[];
}) {
  const router = useRouter();
  const [stageCode, setStageCode] = React.useState(documentStages[0]?.stageCode ?? "");
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const stage = documentStages.find((item) => item.stageCode === stageCode);

  React.useEffect(() => {
    if (!documentStages.some((item) => item.stageCode === stageCode)) {
      setStageCode(documentStages[0]?.stageCode ?? "");
    }
  }, [documentStages, stageCode]);

  const saveRoleAction = async (roleCode: string, action: DocumentStageAction, enabled: boolean) => {
    if (!stage) return;
    const key = `${stage.stageCode}:${roleCode}:${action}`;
    setPendingKey(key);
    setError(null);
    const result = await setDocumentStageRolePolicyAction({
      stageCode: stage.stageCode,
      roleCode,
      action,
      enabled,
    });
    setPendingKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const savePhase = async (phaseCode: string) => {
    if (!stage) return;
    setPendingKey(`${stage.stageCode}:phase`);
    setError(null);
    const result = await setDocumentStagePhaseAction({ stageCode: stage.stageCode, phaseCode });
    setPendingKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <section aria-label="Dépôt et contrôle documentaire" className="space-y-3 rounded-lg border border-line-strong bg-card p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Dépôt et contrôle documentaire</h2>
          <p className="max-w-3xl text-xs text-muted-foreground">
            Règles par étape et par rôle. L’identité KYC reste réservée au gestionnaire affecté, quel que soit ce paramétrage.
          </p>
        </div>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Étape documentaire
          <select
            aria-label="Étape documentaire"
            className={CONTROL_CLASS}
            value={stageCode}
            onChange={(event) => setStageCode(event.target.value)}
            disabled={documentStages.length === 0}
          >
            {documentStages.map((item) => <option key={item.stageCode} value={item.stageCode}>{item.label}</option>)}
          </select>
        </label>
      </header>

      {stage ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2">
          <Badge variant="outline">{stage.stageCode}</Badge>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Phase courante
            <select
              aria-label={`Phase pour ${stage.label}`}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              value={stage.phaseCode}
              onChange={(event) => void savePhase(event.target.value)}
              disabled={pendingKey === `${stage.stageCode}:phase`}
            >
              {phases.map((phase) => <option key={phase.code} value={phase.code}>{phase.label}</option>)}
            </select>
          </label>
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Aucune étape documentaire n’est configurée dans le référentiel.</p>
      )}

      {stage && roles.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[650px] text-sm">
            <caption className="sr-only">Actions documentaires autorisées par rôle pour {stage.label}</caption>
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr><th scope="col" className="px-3 py-2 font-medium">Rôle</th>{DOCUMENT_ACTIONS.map((action) => <th scope="col" key={action.code} className="px-3 py-2 font-medium">{action.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.map((role) => (
                <tr key={role.code}>
                  <th scope="row" className="px-3 py-2 text-left font-medium">
                    <span>{role.label}</span><span className="ml-2 font-mono text-[10px] text-muted-foreground">{role.code}</span>
                  </th>
                  {DOCUMENT_ACTIONS.map((action) => {
                    const rule = documentPolicies.find((item) => item.stageCode === stage.stageCode && item.roleCode === role.code && item.action === action.code);
                    const enabled = rule?.enabled ?? false;
                    const key = `${stage.stageCode}:${role.code}:${action.code}`;
                    return (
                      <td key={action.code} className="px-3 py-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={`Autoriser ${role.label} à ${action.label.toLocaleLowerCase("fr")} des pièces pour ${stage.label}`}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 ${enabled ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground"}`}
                          disabled={pendingKey === key}
                          onClick={() => void saveRoleAction(role.code, action.code, !enabled)}
                        >
                          {pendingKey === key ? "…" : enabled ? "Autorisé" : "Bloqué"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : stage ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Aucun rôle actif n’est disponible pour configurer cette étape.</p>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-3 rounded-lg border border-line-strong bg-card p-4"><span className="grid size-9 place-items-center rounded-lg bg-cfc-lightgold text-cfc-brown">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p></div></div>;
}

function ProcessCard({ process, onResult }: { process: WorkflowProcess; onResult: (message: string) => void }) {
  return <article className="space-y-2 rounded-md border bg-background p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-mono text-xs text-muted-foreground">{process.code}</p><h3 className="text-sm font-medium">{process.label}</h3></div><Badge variant={process.priority === "prioritaire" ? "cfc" : "outline"}>{process.priority}</Badge></div><div className="flex flex-wrap gap-1">{process.pilots.map((pilot) => <Badge variant="secondary" key={pilot}>{pilot}</Badge>)}{process.pilots.length === 0 ? <span className="text-xs text-muted-foreground">Aucun pilote renseigné</span> : null}</div><p className="text-xs text-muted-foreground">{FAMILY_LABELS[process.family]} · {process.activeStepCount} étape(s)</p><WorkflowEditor kind="process" process={process} onResult={onResult} /></article>;
}

function StepRow({ step, processes, phases, view, onResult }: { step: WorkflowStep; processes: WorkflowProcess[]; phases: WorkflowPhase[]; view: ViewMode; onResult: (message: string) => void }) {
  const process = processes.find((item) => item.code === step.processCode);
  const phaseName = phases.find((item) => item.code === step.phase)?.label ?? (step.phase ? step.phase : "Sans phase");
  const [sortOrder, setSortOrder] = React.useState(step.sortOrder);
  const [pending, startTransition] = React.useTransition();
  const saveOrder = () => startTransition(async () => {
    const result = await setWorkflowStepOrderAction({ code: step.code, sortOrder });
    onResult(result.ok ? `Ordre de ${step.code} mis à jour.` : result.error);
  });
  return <article className={view === "grid" ? "space-y-2 rounded-md border bg-background p-3" : "flex flex-wrap items-center justify-between gap-3 p-3"}>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{step.code}</Badge><span className="text-xs text-muted-foreground">{step.processCode} · {process?.label ?? "Processus indisponible"}</span>{step.external ? <Badge variant="secondary">Partenaire</Badge> : null}</div><p className="mt-1 text-sm font-medium">{step.label}</p><p className="text-xs text-muted-foreground">{phaseName} · {LANE_LABELS[step.lane]}{step.slaDays ? ` · ${step.slaDays} jours` : ""}</p></div>
    <div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-1 text-xs text-muted-foreground"><span>Ordre</span><Input aria-label={`Ordre ${step.code}`} type="number" min={0} max={2_000_000_000} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} className="h-8 w-20" /></label><Button size="sm" variant="outline" disabled={pending || sortOrder === step.sortOrder} onClick={saveOrder}>{pending ? "…" : "Appliquer"}</Button><WorkflowEditor kind="step" step={step} processes={processes} phases={phases} onResult={onResult} /></div>
  </article>;
}

function WorkflowEditor({ kind, process, step, processes = [], phases = [], onResult }: { kind: "process" | "step"; process?: WorkflowProcess; step?: WorkflowStep; processes?: WorkflowProcess[]; phases?: WorkflowPhase[]; onResult: (message: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [external, setExternal] = React.useState(step?.external ?? false);
  const isProcess = kind === "process";
  const existing = isProcess ? process : step;
  const title = `${existing ? "Modifier" : "Ajouter"} ${isProcess ? "un processus" : "une étape"}`;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    const nullableNumber = (name: string) => { const raw = String(form.get(name) ?? "").trim(); return raw ? Number(raw) : null; };
    const payload = isProcess ? {
      code: process?.code ?? String(form.get("code") ?? ""),
      label: String(form.get("label") ?? ""),
      family: String(form.get("family") ?? "realisation") as ProcessFamily,
      pilots: String(form.get("pilots") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
      priority: String(form.get("priority") ?? "standard") as ProcessPriority,
    } : {
      code: step?.code ?? String(form.get("code") ?? ""),
      processCode: String(form.get("processCode") ?? ""),
      label: String(form.get("label") ?? ""),
      phase: String(form.get("phase") ?? "") || null,
      lane: String(form.get("lane") ?? "agence") as ProcessLane,
      slaDays: nullableNumber("slaDays"),
      sortOrder: nullableNumber("sortOrder") ?? 100,
      external,
    };
    startTransition(async () => {
      let result: WorkflowActionResult;
      if (isProcess) result = await saveWorkflowProcessAction(payload);
      else {
        result = await saveWorkflowStepAction(payload);
        if (result.ok) result = await setWorkflowStepOrderAction({ code: payload.code, sortOrder: payload.sortOrder });
      }
      if (!result.ok) { setError(result.error); return; }
      setOpen(false);
      onResult(`${isProcess ? "Processus" : "Étape"} enregistré${isProcess ? "" : "e"}.`);
      router.refresh();
    });
  };

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setError(null); }}><DialogTrigger asChild><Button size="sm" variant={existing ? "ghost" : "secondary"}>{existing ? "Modifier" : <><Plus aria-hidden className="size-3.5" />{isProcess ? "Nouveau processus" : "Nouvelle étape"}</>}</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Les modifications sont sauvegardées dans le catalogue Supabase et vérifiées par la capacité de gestion des workflows.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-3 px-6 pb-2">
      <label className="grid gap-1.5 text-sm"><span>Code {existing ? "(stable)" : ""}</span><Input name="code" required defaultValue={isProcess ? process?.code : step?.code} disabled={Boolean(existing)} minLength={2} maxLength={24} /></label>
      <label className="grid gap-1.5 text-sm"><span>Libellé</span><Input name="label" required minLength={2} maxLength={180} defaultValue={isProcess ? process?.label : step?.label} /></label>
      {isProcess ? <>
        <label className="grid gap-1.5 text-sm"><span>Famille</span><select className={CONTROL_CLASS} name="family" defaultValue={process?.family ?? "realisation"}>{Object.entries(FAMILY_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm"><span>Pilotes (codes séparés par une virgule)</span><Input name="pilots" defaultValue={process?.pilots.join(", ") ?? ""} placeholder="DCR, DCM" /></label>
        <label className="grid gap-1.5 text-sm"><span>Priorité</span><select className={CONTROL_CLASS} name="priority" defaultValue={process?.priority ?? "standard"}><option value="standard">Standard</option><option value="prioritaire">Prioritaire</option></select></label>
      </> : <>
        <label className="grid gap-1.5 text-sm"><span>Processus</span><select className={CONTROL_CLASS} name="processCode" required defaultValue={step?.processCode ?? processes[0]?.code ?? ""}>{processes.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.label}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm"><span>Phase</span><select className={CONTROL_CLASS} name="phase" defaultValue={step?.phase ?? ""}><option value="">Sans phase</option>{phases.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm"><span>Couloir</span><select className={CONTROL_CLASS} name="lane" defaultValue={step?.lane ?? "agence"}>{Object.entries(LANE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm"><span>Délai cible (jours, facultatif)</span><Input name="slaDays" type="number" min={1} max={3650} defaultValue={step?.slaDays ?? ""} /></label>
        <label className="grid gap-1.5 text-sm"><span>Ordre d’affichage</span><Input name="sortOrder" type="number" min={0} max={2_000_000_000} defaultValue={step?.sortOrder ?? 100} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={external} onChange={(event) => setExternal(event.target.checked)} />Étape réalisée par un partenaire externe</label>
      </>}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter className="-mx-6"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" disabled={pending || (!isProcess && processes.length === 0)}>{pending ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
