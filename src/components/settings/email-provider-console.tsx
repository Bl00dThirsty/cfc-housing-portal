"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Mail, MailCheck, Send, ShieldCheck } from "lucide-react";

import type { EmailProviderDeliveryStats, SafeEmailProviderSummary } from "@/domain/entities/email-provider";
import { sendEmailProviderTestAction } from "@/server/actions/admin-email-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("fr-CM", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Douala" }).format(new Date(value)) : "Aucun envoi enregistré";

export function EmailProviderConsole({ provider, deliveries }: { provider: SafeEmailProviderSummary; deliveries: EmailProviderDeliveryStats }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<{ error: boolean; text: string } | null>(null);
  const test = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await sendEmailProviderTestAction({ email });
      if (!result.ok) { setMessage({ error: true, text: result.error }); return; }
      setMessage({ error: false, text: result.message });
      router.refresh();
    });
  };

  const providerLabel = provider.provider === "smtp" ? "SMTP" : provider.provider === "resend" ? "Resend" : "Aucun fournisseur";
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5"><p className="eyebrow-style text-cfc-gold">Administration · Notifications</p><h1 className="text-2xl font-semibold tracking-tight">Relais de messagerie</h1><p className="max-w-3xl text-sm text-muted-foreground">Consultez l’état du transport, vérifiez les derniers envois et expédiez un message de test sans donnée client.</p></div>
        <Button asChild variant="outline" size="sm"><Link href="/portail-cfc/settings/email/deliveries"><Mail aria-hidden className="size-4" />Journal des envois</Link></Button>
      </header>

      <section aria-label="État du fournisseur" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={provider.configured ? <CheckCircle2 aria-hidden className="size-4" /> : <CircleAlert aria-hidden className="size-4" />} label="Fournisseur actif" value={providerLabel} detail={provider.configured ? "Configuration détectée côté serveur" : "Envois journalisés comme ignorés"} />
        <Metric icon={<Mail aria-hidden className="size-4" />} label="Adresse d’expédition" value={provider.from} detail="Valeur non secrète" />
        <Metric icon={<MailCheck aria-hidden className="size-4" />} label="Envois réussis · 7 jours" value={deliveries.available ? String(deliveries.sentRecently) : "—"} detail={deliveries.available ? `Dernier succès : ${formatDate(deliveries.latestSentAt)}` : "Journal temporairement indisponible"} />
        <Metric icon={<CircleAlert aria-hidden className="size-4" />} label="Échecs · 7 jours" value={deliveries.available ? String(deliveries.failedRecently) : "—"} detail={deliveries.available ? `${deliveries.skippedRecently} ignoré(s) · dernier essai : ${formatDate(deliveries.lastAttemptAt)}` : "Journal temporairement indisponible"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <article className="space-y-4 rounded-lg border border-line-strong bg-card p-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Configuration détectée</h2><p className="text-xs text-muted-foreground">Seuls les paramètres non secrets sont affichés.</p></div><Badge variant={provider.configured ? "success" : "outline"}>{provider.configured ? "Prêt à tester" : "À configurer"}</Badge></div>
          {provider.provider === "smtp" ? <dl className="grid gap-3 sm:grid-cols-2"><ConfigValue label="Hôte SMTP" value={provider.smtpHost ?? "—"} /><ConfigValue label="Port" value={provider.smtpPort?.toString() ?? "—"} /><ConfigValue label="Nom d’utilisateur" value={provider.smtpUsernameConfigured ? "Configuré" : "Non configuré"} /><ConfigValue label="Mot de passe" value={provider.smtpPasswordConfigured ? "Configuré · valeur masquée" : "Non configuré"} /><ConfigValue label="TLS implicite" value={provider.smtpImplicitTls === null ? "—" : provider.smtpImplicitTls ? "Activé (port 465)" : "Démarrage TLS selon le relais"} /><ConfigValue label="Vérification du certificat" value={provider.tlsCertificateVerification ? "Activée" : "Désactivée"} /></dl> : provider.provider === "resend" ? <dl className="grid gap-3 sm:grid-cols-2"><ConfigValue label="Clé API" value={provider.resendApiKeyConfigured ? "Configurée · valeur masquée" : "Non configurée"} /><ConfigValue label="Transport" value="API Resend" /></dl> : <div className="rounded-md border border-cfc-gold/40 bg-cfc-gold/10 p-3 text-sm">Aucun hôte SMTP ni clé Resend n’a été détecté par le serveur.</div>}
          <div className="flex gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground"><ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-cfc-brown" /><p>En local, configurez les variables de messagerie dans <code>.env.local</code>. Pour staging ou production, utilisez les secrets du déploiement puis redémarrez ou redéployez le service. Les valeurs secrètes ne sont jamais modifiables depuis cette page ni renvoyées au navigateur.</p></div>
        </article>

        <article className="space-y-4 rounded-lg border border-line-strong bg-card p-4">
          <div><h2 className="font-semibold">Envoyer un test</h2><p className="text-xs text-muted-foreground">Un seul test par administrateur chaque minute. Le résultat est ajouté au journal des livraisons.</p></div>
          <form className="space-y-3" onSubmit={test}><label className="grid gap-1.5 text-sm"><span>Adresse de réception</span><Input type="email" required maxLength={255} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="administrateur@cfc.cm" /></label><Button type="submit" disabled={pending || !provider.configured}><Send aria-hidden className="size-4" />{pending ? "Envoi…" : "Envoyer le test"}</Button></form>
          {!provider.configured ? <p className="text-xs text-muted-foreground">Configurez un fournisseur côté serveur pour activer ce test.</p> : null}
          {message ? <div role={message.error ? "alert" : "status"} className={`rounded-md border px-3 py-2.5 text-sm ${message.error ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-success/30 bg-success/5"}`}>{message.text}</div> : null}
        </article>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="min-w-0 rounded-lg border border-line-strong bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div><p className="mt-2 truncate text-lg font-semibold" title={value}>{value}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{detail}</p></div>;
}

function ConfigValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border bg-background p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>;
}
