"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, ShieldLock } from "lucide-react";

import type { AdminRolePermissionDirectory, AdminRolePermissionRole } from "@/domain/entities/admin-role-permissions";
import type { Capability } from "@/domain/policies/capabilities";
import { saveRoleCapabilitiesAction } from "@/server/actions/admin-role-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";

const SCOPE_LABELS: Record<string, string> = {
  OWN_AGENCY: "Agence",
  OWN_PORTFOLIO: "Portefeuille affecté",
  OWN_FILES: "Dossiers affectés",
  ALL: "Tout le périmètre",
  DIASPORA_FILES: "Dossiers diaspora",
};

function grantsFor(role: AdminRolePermissionRole): Capability[] {
  return [...role.capabilities].sort();
}

export function RolePermissionsDirectory({ directory }: { directory: AdminRolePermissionDirectory }) {
  const router = useRouter();
  const editableRoles = directory.roles.filter((role) => role.code !== "ADMIN");
  const [selectedCode, setSelectedCode] = React.useState(editableRoles[0]?.code ?? "ADMIN");
  const [drafts, setDrafts] = React.useState<Record<string, Capability[]>>(() =>
    Object.fromEntries(directory.roles.map((role) => [role.code, grantsFor(role)])),
  );
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<ViewMode>("list");
  const [acknowledgeAdminGrant, setAcknowledgeAdminGrant] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setDrafts(Object.fromEntries(directory.roles.map((role) => [role.code, grantsFor(role)])));
  }, [directory.roles]);

  React.useEffect(() => {
    if (editableRoles.some((role) => role.code === selectedCode)) return;
    setSelectedCode(editableRoles[0]?.code ?? "ADMIN");
  }, [editableRoles, selectedCode]);

  const selectedRole = directory.roles.find((role) => role.code === selectedCode) ?? null;
  const selectedGrants = selectedRole ? (drafts[selectedRole.code] ?? grantsFor(selectedRole)) : [];
  const initialGrants = selectedRole ? grantsFor(selectedRole) : [];
  const isDirty = selectedRole && JSON.stringify(selectedGrants) !== JSON.stringify(initialGrants);
  const isAdminGrantElevation = Boolean(
    selectedRole &&
    !selectedRole.capabilities.includes("admin:roles") &&
    selectedGrants.includes("admin:roles"),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCapabilities = directory.capabilities.filter((capability) =>
    !normalizedQuery ||
    [capability.code, capability.label, capability.groupLabel, capability.description]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );
  const groups = [...new Set(filteredCapabilities.map((capability) => capability.groupLabel))];

  function toggleCapability(code: Capability, checked: boolean) {
    if (!selectedRole || selectedRole.code === "ADMIN") return;
    setDrafts((current) => {
      const grants = new Set(current[selectedRole.code] ?? grantsFor(selectedRole));
      if (checked) grants.add(code);
      else grants.delete(code);
      return { ...current, [selectedRole.code]: [...grants].sort() };
    });
    setAcknowledgeAdminGrant(false);
    setNotice(null);
    setError(null);
  }

  function save() {
    if (!selectedRole || selectedRole.code === "ADMIN" || !isDirty) return;
    if (isAdminGrantElevation && !acknowledgeAdminGrant) return;
    setNotice(null);
    setError(null);
    startTransition(async () => {
      const capabilities = [...selectedGrants].sort();
      const result = await saveRoleCapabilitiesAction({ roleCode: selectedRole.code, capabilities });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDrafts((current) => ({ ...current, [selectedRole.code]: capabilities }));
      setNotice("Habilitations enregistrées.");
      setAcknowledgeAdminGrant(false);
      router.refresh();
    });
  }

  return (
    <main className="space-y-6 p-4 md:p-6" data-testid="admin-role-permissions">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="eyebrow-style text-cfc-gold">Administration · Contrôle des accès</p>
          <h1 className="text-2xl font-semibold tracking-tight">Rôles & habilitations</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">Les droits enregistrés ici sont appliqués à la navigation, aux actions serveur et aux contrôles de la base. Les changements restent historisés.</p>
        </div>
        <ViewModeToggle value={view} onValueChange={setView} />
      </header>

      {notice ? <p role="status" className="rounded-md border border-success/30 bg-success/5 px-3 py-2.5 text-sm">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.8fr)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-semibold">Rôles du personnel</h2><p className="text-xs text-muted-foreground">{directory.roles.length} rôles référencés</p></div>
            <Badge variant="outline">{editableRoles.length} modifiables</Badge>
          </div>
          <div className={view === "grid" ? "grid gap-2 sm:grid-cols-2 xl:grid-cols-1" : "divide-y rounded-lg border bg-card"}>
            {directory.roles.map((role) => {
              const protectedRole = role.code === "ADMIN";
              const active = selectedCode === role.code;
              return (
                <button
                  key={role.code}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${role.label}${protectedRole ? " protégé" : ""}`}
                  disabled={protectedRole}
                  onClick={() => { setSelectedCode(role.code); setAcknowledgeAdminGrant(false); setNotice(null); setError(null); }}
                  className={`flex w-full items-start justify-between gap-3 p-3 text-left transition-colors ${view === "grid" ? "rounded-lg border bg-card" : "first:rounded-t-lg last:rounded-b-lg"} ${active ? "bg-secondary/60" : "hover:bg-secondary/30"} disabled:cursor-not-allowed disabled:opacity-80`}
                >
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{role.label}</span><Badge variant="outline" className="font-mono text-[10px]">{role.code}</Badge></span>
                    <span className="block text-xs text-muted-foreground">{role.description ?? role.poleCode ?? "Rôle CFC"}</span>
                    <span className="block text-xs text-muted-foreground">{role.capabilities.length} habilitations · {SCOPE_LABELS[role.scope ?? ""] ?? role.scope ?? "Périmètre à vérifier"}</span>
                  </span>
                  {protectedRole ? <ShieldLock aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" /> : <ShieldCheck aria-hidden className={`mt-1 size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />}
                </button>
              );
            })}
            {directory.roles.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Aucun rôle actif dans le référentiel.</p> : null}
          </div>
        </div>

        <section aria-label="Habilitations du rôle sélectionné" className="min-w-0 space-y-4 rounded-lg border border-line-strong bg-card p-4">
          {selectedRole ? <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-muted-foreground">Rôle sélectionné</p><h2 className="text-lg font-semibold">{selectedRole.label}</h2><p className="font-mono text-xs text-muted-foreground">{selectedRole.code} · {selectedGrants.length} habilitation(s)</p></div>
              {selectedRole.code === "ADMIN" ? <Badge variant="secondary">Rôle de référence protégé</Badge> : <Button onClick={save} disabled={!isDirty || pending || (isAdminGrantElevation && !acknowledgeAdminGrant)}>{pending ? "Enregistrement…" : "Enregistrer les habilitations"}</Button>}
            </div>
            {isAdminGrantElevation ? <div className="space-y-2 rounded-md border border-cfc-gold/40 bg-cfc-gold/10 p-3">
              <p className="text-sm font-medium">Cette attribution donnera à ce rôle la gestion des habilitations de tous les rôles.</p>
              <label className="flex items-start gap-2 text-xs text-muted-foreground"><Checkbox aria-label="Je confirme l’attribution de admin:roles" checked={acknowledgeAdminGrant} onCheckedChange={(checked) => setAcknowledgeAdminGrant(checked === true)} /><span>Je confirme cette délégation sensible.</span></label>
            </div> : null}
            <div className="relative"><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Rechercher une habilitation" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par action, module ou ressource" className="pl-9" /></div>
            <Separator />
            <div className="max-h-[68vh] space-y-5 overflow-y-auto pr-1">
              {groups.map((group) => <section key={group} aria-label={`Habilitations ${group}`} className="space-y-2">
                <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{group}</h3><Badge variant="outline">{filteredCapabilities.filter((capability) => capability.groupLabel === group).length}</Badge></div>
                <div className="divide-y rounded-md border">
                  {filteredCapabilities.filter((capability) => capability.groupLabel === group).map((capability) => {
                    const checked = selectedGrants.includes(capability.code);
                    return <label key={capability.code} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-secondary/20">
                      <Checkbox aria-label={capability.label} checked={checked} disabled={selectedRole.code === "ADMIN"} onCheckedChange={(value) => toggleCapability(capability.code, value === true)} className="mt-0.5" />
                      <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{capability.label}</span><code className="text-[10px] text-muted-foreground">{capability.code}</code></span>{capability.description ? <span className="mt-1 block text-xs text-muted-foreground">{capability.description}</span> : null}</span>
                    </label>;
                  })}
                </div>
              </section>)}
              {filteredCapabilities.length === 0 ? <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Aucune habilitation ne correspond à la recherche.</p> : null}
            </div>
          </> : <p className="p-8 text-center text-sm text-muted-foreground">Aucun rôle à configurer.</p>}
        </section>
      </section>
      <p className="text-xs text-muted-foreground">Les droits d’administration ne permettent pas de lire le KYC intégral d’un client. Le contrôle de périmètre agence et de dossier reste appliqué séparément.</p>
    </main>
  );
}
