"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, MailPlus, Search, ShieldCheck, UserRoundCog, Users, UserX } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import {
  assignStaffRoleAction,
  inviteStaffUserAction,
  resetStaffPasswordAction,
  setStaffAccountActiveAction,
  updateStaffProfileAction,
  type AdminStaffActionResult,
} from "@/server/actions/admin-users";
import { filterAdminStaffAccounts, type AdminStaffAccount, type AdminStaffDirectory, type AdminStaffStatus } from "@/domain/entities/admin-user";

const SELECT_CLASS = "h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function StaffDirectory({ directory }: { directory: AdminStaffDirectory }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState("all");
  const [status, setStatus] = React.useState<AdminStaffStatus>("all");
  const [view, setView] = React.useState<ViewMode>("list");
  const [notice, setNotice] = React.useState<{ kind: "success" | "warning" | "error"; text: string } | null>(null);
  const filtered = React.useMemo(
    () => filterAdminStaffAccounts(directory.users, { query, role, status }),
    [directory.users, query, role, status],
  );

  const announce = (result: AdminStaffActionResult) => {
    if (result.ok) {
      setNotice({ kind: result.warning ? "warning" : "success", text: result.warning ?? result.message ?? "Modification enregistrée." });
      router.refresh();
    } else {
      setNotice({ kind: "error", text: result.error });
    }
  };

  const activeCount = directory.users.filter((user) => user.active).length;
  const invitedCount = directory.users.filter((user) => user.invitePending).length;
  const disabledCount = directory.users.filter((user) => !user.active).length;

  return (
    <div className="space-y-5 p-5 md:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="eyebrow-style text-cfc-gold">Administration · Identités & accès</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Comptes du personnel</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Gérez les invitations, les affectations et les profils professionnels. Les comptes citoyens et leurs données KYC restent hors de ce répertoire.
          </p>
        </div>
        <InviteStaffDialog directory={directory} onResult={announce} />
      </header>

      {notice ? (
        <div role={notice.kind === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2.5 text-sm ${notice.kind === "error" ? "border-destructive/40 bg-destructive/5 text-destructive" : notice.kind === "warning" ? "border-cfc-gold/40 bg-cfc-gold/10 text-foreground" : "border-success/30 bg-success/5 text-foreground"}`}>
          <div className="flex items-start justify-between gap-3">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs text-muted-foreground hover:text-foreground">Fermer</button>
          </div>
        </div>
      ) : null}

      <section aria-label="Indicateurs des comptes" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Personnel enregistré" value={directory.users.length} icon={<Users aria-hidden className="size-4" />} />
        <SummaryCard label="Affectations actives" value={activeCount} icon={<ShieldCheck aria-hidden className="size-4" />} />
        <SummaryCard label="Invitations à confirmer" value={invitedCount} icon={<MailPlus aria-hidden className="size-4" />} />
        <SummaryCard label="Comptes suspendus" value={disabledCount} icon={<UserX aria-hidden className="size-4" />} />
      </section>

      <section className="space-y-3 rounded-lg border border-line-strong bg-card p-3 md:p-4" aria-label="Répertoire du personnel">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1">
            <Search aria-hidden className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher nom, e-mail, rôle ou agence" className="pl-8" aria-label="Rechercher le personnel" />
          </label>
          <select className={SELECT_CLASS} value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filtrer par rôle">
            <option value="all">Tous les rôles</option>
            {directory.roles.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
          </select>
          <select className={SELECT_CLASS} value={status} onChange={(event) => setStatus(event.target.value as AdminStaffStatus)} aria-label="Filtrer par état">
            <option value="all">Tous les états</option>
            <option value="active">Actifs</option>
            <option value="disabled">Suspendus</option>
            <option value="invited">Invitation à confirmer</option>
          </select>
          <ViewModeToggle value={view} onValueChange={setView} />
          <span className="caption-style ml-auto text-muted-foreground" aria-live="polite">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-line-strong px-5 py-12 text-center">
            <UserRoundCog aria-hidden className="mx-auto mb-2 size-7 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Aucun compte correspondant</h2>
            <p className="mt-1 text-xs text-muted-foreground">Modifiez les filtres ou invitez un membre du personnel.</p>
          </div>
        ) : view === "list" ? (
          <div className="overflow-x-auto rounded-md border border-line-strong">
            <table className="w-full min-w-[850px] border-collapse text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Membre</th>
                  <th className="px-3 py-2.5 font-medium">Rôle & agence</th>
                  <th className="px-3 py-2.5 font-medium">Dernière connexion</th>
                  <th className="px-3 py-2.5 font-medium">État</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-t border-line-strong align-middle">
                    <td className="px-3 py-2.5"><StaffIdentity user={user} /></td>
                    <td className="px-3 py-2.5"><StaffAssignment user={user} directory={directory} onResult={announce} /></td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(user.lastSignInAt)}</td>
                    <td className="px-3 py-2.5"><AccountState user={user} /></td>
                    <td className="px-3 py-2.5"><AccountActions user={user} currentUserId={directory.currentUserId} onResult={announce} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((user) => (
              <article key={user.id} className="space-y-3 rounded-md border border-line-strong bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <StaffIdentity user={user} />
                  <AccountState user={user} />
                </div>
                <StaffAssignment user={user} directory={directory} onResult={announce} />
                <p className="border-t border-line-strong pt-2 text-xs text-muted-foreground">Dernière connexion · {formatDate(user.lastSignInAt)}</p>
                <AccountActions user={user} currentUserId={directory.currentUserId} onResult={announce} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line-strong bg-card px-4 py-3">
      <div><p className="caption-style text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p></div>
      <span className="flex size-8 items-center justify-center rounded-md bg-cfc-lightgold text-cfc-brown">{icon}</span>
    </div>
  );
}

function StaffIdentity({ user }: { user: AdminStaffAccount }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="size-9 border border-line-strong">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback>{user.initials ?? initialsFor(user.fullName ?? user.email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{user.fullName ?? "Nom non renseigné"}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        {user.phone ? <p className="truncate text-[11px] text-muted-foreground">{user.phone}</p> : null}
      </div>
    </div>
  );
}

function AccountState({ user }: { user: AdminStaffAccount }) {
  if (!user.active) return <Badge variant="destructive">Suspendu</Badge>;
  if (user.invitePending) return <Badge variant="cfc">Invitation en attente</Badge>;
  return <Badge variant="success">Actif</Badge>;
}

function StaffAssignment({ user, directory, onResult }: {
  user: AdminStaffAccount;
  directory: AdminStaffDirectory;
  onResult: (result: AdminStaffActionResult) => void;
}) {
  const [role, setRole] = React.useState(user.roleCode ?? "");
  const [agencyId, setAgencyId] = React.useState(user.agencyId ?? "");
  const [pending, startTransition] = React.useTransition();
  React.useEffect(() => {
    setRole(user.roleCode ?? "");
    setAgencyId(user.agencyId ?? "");
  }, [user.roleCode, user.agencyId]);
  const changed = role !== (user.roleCode ?? "") || agencyId !== (user.agencyId ?? "");

  return (
    <div className="flex min-w-[230px] flex-wrap items-center gap-1.5">
      <select aria-label={`Rôle de ${user.fullName ?? user.email}`} className={`${SELECT_CLASS} h-8 max-w-[180px] text-xs`} value={role} onChange={(event) => setRole(event.target.value)}>
        <option value="" disabled>Rôle à choisir</option>
        {directory.roles.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
      </select>
      <select aria-label={`Agence de ${user.fullName ?? user.email}`} className={`${SELECT_CLASS} h-8 max-w-[180px] text-xs`} value={agencyId} onChange={(event) => setAgencyId(event.target.value)}>
        <option value="">Aucune agence</option>
        {directory.agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.label}</option>)}
      </select>
      {changed ? <Button size="xs" variant="outline" disabled={pending || !role} onClick={() => startTransition(async () => onResult(await assignStaffRoleAction({ userId: user.id, role, agencyId: agencyId || null })))}>{pending ? "Enregistrement…" : "Appliquer"}</Button> : null}
      <span className="sr-only">{user.pole ?? "Pôle non renseigné"}{user.scope ? ` · ${user.scope}` : ""}</span>
    </div>
  );
}

function AccountActions({ user, currentUserId, onResult }: {
  user: AdminStaffAccount;
  currentUserId: string;
  onResult: (result: AdminStaffActionResult) => void;
}) {
  const [pending, startTransition] = React.useTransition();
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <EditStaffDialog user={user} onResult={onResult} />
      <Button size="xs" variant="outline" disabled={pending} title={user.invitePending ? "Renvoyer le lien d’activation" : "Envoyer un lien de réinitialisation"} onClick={() => startTransition(async () => onResult(await resetStaffPasswordAction(user.id)))}>
        <KeyRound aria-hidden className="size-3" />{user.invitePending ? "Renvoyer le lien" : "Réinitialiser"}
      </Button>
      {user.id !== currentUserId ? (
        <Button size="xs" variant={user.active ? "ghost" : "outline"} disabled={pending} onClick={() => startTransition(async () => onResult(await setStaffAccountActiveAction(user.id, !user.active)))}>
          {user.active ? "Suspendre" : "Réactiver"}
        </Button>
      ) : <span className="caption-style text-muted-foreground">Votre compte</span>}
    </div>
  );
}

function EditStaffDialog({ user, onResult }: { user: AdminStaffAccount; onResult: (result: AdminStaffActionResult) => void }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [fullName, setFullName] = React.useState(user.fullName ?? "");
  const [jobTitle, setJobTitle] = React.useState(user.jobTitle ?? "");
  const [phone, setPhone] = React.useState(user.phone ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="xs" variant="ghost">Modifier</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Profil professionnel</DialogTitle><DialogDescription>Modifiez les coordonnées et l’intitulé du membre du personnel. L’adresse e-mail reste gérée par Supabase Auth.</DialogDescription></DialogHeader>
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updateStaffProfileAction({ userId: user.id, fullName, jobTitle: jobTitle || null, phone: phone || null });
            onResult(result);
            if (result.ok) setOpen(false);
          });
        }}>
          <Field label="Nom complet" htmlFor={`staff-name-${user.id}`} required><Input id={`staff-name-${user.id}`} value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={3} /></Field>
          <Field label="Fonction" htmlFor={`staff-job-${user.id}`}><Input id={`staff-job-${user.id}`} value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></Field>
          <Field label="Téléphone" htmlFor={`staff-phone-${user.id}`}><Input id={`staff-phone-${user.id}`} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
          <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le profil"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InviteStaffDialog({ directory, onResult }: { directory: AdminStaffDirectory; onResult: (result: AdminStaffActionResult) => void }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState(directory.roles[0]?.code ?? "");
  const [agencyId, setAgencyId] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><MailPlus aria-hidden className="size-3.5" />Inviter un membre</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Inviter un membre du personnel</DialogTitle><DialogDescription>Le membre reçoit un lien à usage unique pour confirmer son adresse et choisir lui-même son mot de passe.</DialogDescription></DialogHeader>
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await inviteStaffUserAction({ email, fullName, role, agencyId: agencyId || null, jobTitle: jobTitle || null });
            onResult(result);
            if (result.ok) {
              setOpen(false);
              setEmail("");
              setFullName("");
            }
          });
        }}>
          <Field label="Adresse professionnelle" htmlFor="staff-invite-email" required><Input id="staff-invite-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
          <Field label="Nom complet" htmlFor="staff-invite-name" required><Input id="staff-invite-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={3} /></Field>
          <Field label="Rôle" htmlFor="staff-invite-role" required>
            <select id="staff-invite-role" className={`${SELECT_CLASS} w-full`} value={role} onChange={(event) => setRole(event.target.value)} required>
              {directory.roles.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Agence" htmlFor="staff-invite-agency">
            <select id="staff-invite-agency" className={`${SELECT_CLASS} w-full`} value={agencyId} onChange={(event) => setAgencyId(event.target.value)}>
              <option value="">Aucune agence</option>
              {directory.agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.label}{agency.region ? ` · ${agency.region}` : ""}</option>)}
            </select>
          </Field>
          <Field label="Fonction" htmlFor="staff-invite-job"><Input id="staff-invite-job" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></Field>
          {directory.roles.length === 0 ? <p role="alert" className="text-xs text-destructive">Aucun rôle staff disponible dans le catalogue.</p> : null}
          <DialogFooter><Button type="submit" disabled={pending || directory.roles.length === 0}>{pending ? "Création du compte…" : "Créer et envoyer l’invitation"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function initialsFor(value: string): string {
  return value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatDate(value: string | null): string {
  if (!value) return "Jamais connecté";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date inconnue" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}
