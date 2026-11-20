"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Landmark, MapPin, Plus, Search, Users } from "lucide-react";

import type { AdminGroup, AdminGroupKind } from "@/domain/entities/admin-group";
import { filterAdminGroups } from "@/domain/entities/admin-group";
import { saveAgencyAction, savePoleAction, type AdminGroupActionResult } from "@/server/actions/admin-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";

const CONTROL_CLASS = "h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function GroupDirectory({ groups }: { groups: AdminGroup[] }) {
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<AdminGroupKind | "all">("all");
  const [view, setView] = React.useState<ViewMode>("list");
  const [notice, setNotice] = React.useState<string | null>(null);
  const filtered = React.useMemo(() => filterAdminGroups(groups, { query, kind }), [groups, query, kind]);
  const poles = groups.filter((group) => group.kind === "pole");
  const agencies = groups.filter((group) => group.kind === "agency");

  return (
    <main className="space-y-6 p-4 md:p-6" data-testid="admin-group-directory">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="eyebrow-style text-cfc-gold">Administration · Organisation</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pôles & agences</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">Consultez et mettez à jour les unités organisationnelles persistées. Les affectations du personnel se gèrent depuis le répertoire des comptes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GroupEditor kind="pole" onResult={setNotice} />
          <GroupEditor kind="agency" onResult={setNotice} />
        </div>
      </header>

      {notice ? <div role="status" className="rounded-md border border-success/30 bg-success/5 px-3 py-2.5 text-sm">{notice}<button className="ml-3 text-xs text-muted-foreground underline" onClick={() => setNotice(null)}>Fermer</button></div> : null}

      <section aria-label="Résumé organisationnel" className="grid gap-3 sm:grid-cols-3">
        <Summary icon={<Landmark aria-hidden className="size-4" />} label="Pôles actifs" value={poles.length} />
        <Summary icon={<Building2 aria-hidden className="size-4" />} label="Agences actives" value={agencies.length} />
        <Summary icon={<Users aria-hidden className="size-4" />} label="Affectations actives" value={groups.reduce((sum, group) => sum + group.memberCount, 0)} />
      </section>

      <section className="space-y-4 rounded-lg border border-line-strong bg-card p-3 md:p-4" aria-label="Répertoire des groupes organisationnels">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1">
            <Search aria-hidden className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher code, nom, région" aria-label="Rechercher les groupes" className="pl-8" />
          </label>
          <select className={CONTROL_CLASS} aria-label="Filtrer par type" value={kind} onChange={(event) => setKind(event.target.value as AdminGroupKind | "all")}>
            <option value="all">Tous les groupes</option><option value="pole">Pôles</option><option value="agency">Agences</option>
          </select>
          <ViewModeToggle value={view} onValueChange={setView} />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="font-medium">Aucun groupe ne correspond à cette recherche.</p>
            <p className="mt-1 text-sm text-muted-foreground">Changez le filtre ou créez un pôle ou une agence.</p>
          </div>
        ) : (
          <div className={view === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "divide-y divide-border rounded-md border"}>
            {filtered.map((group) => <GroupRow key={`${group.kind}:${group.code}`} group={group} view={view} onResult={setNotice} />)}
          </div>
        )}
      </section>

      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-strong bg-muted/30 p-4">
        <div><p className="text-sm font-medium">Affecter le personnel</p><p className="text-xs text-muted-foreground">Les rôles, pôles et agences associés aux comptes se gèrent dans le répertoire du personnel.</p></div>
        <Button asChild variant="outline" size="sm"><Link href="/portail-cfc/settings/users">Ouvrir les comptes du personnel</Link></Button>
      </aside>
    </main>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-3 rounded-lg border border-line-strong bg-card p-4"><span className="grid size-9 place-items-center rounded-lg bg-cfc-lightgold text-cfc-brown">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p></div></div>;
}

function GroupRow({ group, view, onResult }: { group: AdminGroup; view: ViewMode; onResult: (message: string) => void }) {
  const isPole = group.kind === "pole";
  return (
    <article className={view === "grid" ? "space-y-3 rounded-lg border border-line-strong bg-background p-4" : "flex flex-wrap items-center justify-between gap-3 p-3.5"}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">{isPole ? <Landmark aria-hidden className="size-4" /> : <Building2 aria-hidden className="size-4" />}</span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{group.label}</h2><Badge variant="outline">{group.code}</Badge>{group.isDiasporaDesk ? <Badge variant="cfc">Diaspora</Badge> : null}</div>
          <p className="text-xs text-muted-foreground">{isPole ? group.description || "Pôle organisationnel" : [group.city, group.region].filter(Boolean).join(" · ") || "Localisation à renseigner"}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {group.city || group.region ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin aria-hidden className="size-3.5" />{[group.city, group.region].filter(Boolean).join(", ")}</span> : null}
        <span className="text-xs text-muted-foreground"><strong className="text-foreground">{group.memberCount}</strong> agents · <strong className="text-foreground">{group.roleCount}</strong> rôles</span>
        <GroupEditor kind={group.kind} group={group} onResult={onResult} />
      </div>
    </article>
  );
}

function GroupEditor({ kind, group, onResult }: { kind: AdminGroupKind; group?: AdminGroup; onResult: (message: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [diaspora, setDiaspora] = React.useState(group?.isDiasporaDesk ?? false);
  const isPole = kind === "pole";
  const title = `${group ? "Modifier" : "Ajouter"} ${isPole ? "un pôle" : "une agence"}`;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const nullable = (name: string) => String(form.get(name) ?? "").trim() || null;
    const payload = isPole
      ? { code: String(form.get("code") ?? ""), label: String(form.get("label") ?? ""), description: nullable("description"), sortOrder: Number(form.get("sortOrder") ?? 500) }
      : { id: group?.id ?? null, code: String(form.get("code") ?? ""), label: String(form.get("label") ?? ""), city: nullable("city"), region: nullable("region"), isDiasporaDesk: diaspora };

    startTransition(async () => {
      const result: AdminGroupActionResult = isPole ? await savePoleAction(payload) : await saveAgencyAction(payload);
      if (!result.ok) { setError(result.error); return; }
      setOpen(false);
      onResult(`${isPole ? "Pôle" : "Agence"} enregistré${isPole ? "" : "e"}.`);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setError(null); }}>
      <DialogTrigger asChild><Button size="sm" variant={group ? "outline" : "secondary"}>{group ? "Modifier" : <><Plus aria-hidden className="size-3.5" />{isPole ? "Nouveau pôle" : "Nouvelle agence"}</>}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Les données sont enregistrées dans le référentiel organisationnel et utilisées pour les affectations du personnel.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-3 px-6 pb-2">
          <label className="grid gap-1.5 text-sm"><span>Code {group && !isPole ? "(non modifiable)" : ""}</span><Input name="code" required minLength={2} maxLength={isPole ? 32 : 48} defaultValue={group?.code ?? ""} disabled={Boolean(group && !isPole)} /></label>
          <label className="grid gap-1.5 text-sm"><span>Nom</span><Input name="label" required minLength={2} maxLength={160} defaultValue={group?.label ?? ""} /></label>
          {isPole ? <>
            <label className="grid gap-1.5 text-sm"><span>Description</span><Input name="description" maxLength={500} defaultValue={group?.description ?? ""} /></label>
            <label className="grid gap-1.5 text-sm"><span>Ordre d’affichage</span><Input name="sortOrder" type="number" min={0} max={32767} defaultValue={group?.sortOrder ?? 500} /></label>
          </> : <>
            <label className="grid gap-1.5 text-sm"><span>Ville</span><Input name="city" maxLength={120} defaultValue={group?.city ?? ""} /></label>
            <label className="grid gap-1.5 text-sm"><span>Région</span><Input name="region" maxLength={120} defaultValue={group?.region ?? ""} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={diaspora} onChange={(event) => setDiaspora(event.target.checked)} />Guichet dédié à la diaspora</label>
          </>}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="-mx-6"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
