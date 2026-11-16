"use client";

/**
 * Formulaire de connexion — deux portes, un seul composant.
 *
 * Le CFC a **deux portes d'entrée distinctes** :
 *
 * - `/login` — l'emprunteur (Guichet Unique citoyen) ;
 * - `/portail-cfc/login` — l'agent CFC (console d'administration).
 *
 * Elles partagent le même mécanisme (Supabase Auth) mais **pas** la même
 * audience, ni le même texte, ni les mêmes parcours autorisés : un agent se
 * connecte par mot de passe, un emprunteur peut utiliser le lien magique.
 *
 * L'interface du module est donc volontairement étroite : une audience, et
 * rien d'autre.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, Layers, Mail, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { landingPathForRole } from "@/config/rbac/sidebar-by-role";
import { reportAction } from "@/lib/action-feedback";
import { useAuth } from "@/lib/auth-context";

export type SignInAudience = "citizen" | "staff";

type Mode = "password" | "magic-link" | "forgot-password";

const COPY = {
  citizen: {
    badge: "Guichet Unique · Espace Citoyen",
    title: "Connexion à votre espace",
    subtitle: "Votre dossier unique client, votre épargne et vos pièces, au même endroit.",
    panelTitle: "Votre dossier de prêt",
    panelBody:
      "Vous constituez votre dossier unique client, vous constituez votre épargne préalable et vous suivez l'avancement de votre demande de prêt, étape par étape.",
    panelPoints: [
      "Dépôt de vos pièces et suivi de leur complétude",
      "Suivi de votre épargne et de votre capacité d'endettement",
      "Notifications à chaque étape de votre dossier",
    ],
    allowMagicLink: true,
    switchLabel: "Vous êtes agent CFC ? Accéder à l'espace agent",
    switchHref: "/portail-cfc/login",
  },
  staff: {
    badge: "Crédit Foncier du Cameroun · Espace Agent",
    title: "Espace Agent CFC",
    subtitle: "Console d'administration, réservée aux agents habilités.",
    panelTitle: "Cloisonnement par habilitation",
    panelBody:
      "Chaque agent n'accède qu'aux applications et aux dossiers de son périmètre. Les habilitations sont attribuées par la Direction Générale et journalisées.",
    panelPoints: [
      "Un écran d'atterrissage selon votre pôle",
      "Aucune auto-attribution de rôle",
      "Traçabilité intégrale de vos actions",
    ],
    allowMagicLink: false,
    switchLabel: "Vous êtes emprunteur ? Accéder au portail citoyen",
    switchHref: "/login",
  },
} as const;

export function SignInForm({ audience }: { audience: SignInAudience }) {
  const copy = COPY[audience];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, profile, signIn, signInWithMagicLink, resetPassword } = useAuth();

  const [mode, setMode] = React.useState<Mode>("password");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const nextPath = searchParams.get("next");

  React.useEffect(() => {
    if (!session) return;

    const target =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : landingPathForRole(profile?.role ?? "CITIZEN");

    router.replace(target);
    router.refresh();
  }, [session, profile, nextPath, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    if (mode === "password") {
      const result = await signIn(email, password);
      // Le toast **accompagne** l'écran : le refus reste affiché sous le
      // formulaire, il ne se perd pas dans un coin de l'interface.
      reportAction(result, "Connexion réussie — bienvenue.");
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
      }
      return;
    }

    if (mode === "magic-link") {
      const result = await signInWithMagicLink(email);
      if (result.ok) {
        setNotice(result.message ?? "Lien de connexion envoyé.");
      } else {
        setError(result.error);
      }
      setSubmitting(false);
      return;
    }

    const result = await resetPassword(email);
    if (result.ok) {
      setNotice(result.message ?? "Lien de réinitialisation envoyé.");
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-5">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/70 bg-muted/40 p-10 lg:col-span-2 lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow-style font-normal text-subtle">{copy.badge}</span>
            <Badge variant="outline" className="bg-background/80 px-2 py-0 font-mono text-[10px]">
              v1.6.3
            </Badge>
          </div>

          <div className="space-y-3 pt-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm">
              CFC
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                République du Cameroun
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Crédit Foncier du Cameroun
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                Banque de l&apos;Habitat &amp; Guichet Unique Dématérialisé
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-3 border-t border-border/50 pt-8 text-[11px] leading-relaxed text-muted-foreground">
          <div className="space-y-3 text-xs">
            <p>{copy.panelBody}</p>
            <div className="space-y-2 rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>{copy.panelTitle}</span>
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                {copy.panelPoints.map((point) => (
                  <li key={point} className="flex gap-1.5">
                    <span aria-hidden className="text-cfc-gold">
                      ·
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span>&copy; {new Date().getFullYear()} Crédit Foncier du Cameroun</span>
            <span className="font-mono">Réseau Métier Sécurisé</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between bg-background p-6 sm:p-10 lg:col-span-3">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <span className="eyebrow-style font-normal text-subtle">{copy.badge}</span>
          <Badge variant="outline" className="font-mono text-[10px]">
            CFC v1.6.3
          </Badge>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md border shadow-xs">
            <CardContent className="space-y-6 px-6 pb-6 pt-6 sm:px-8">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    CFC
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {copy.title}
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground">
                  {mode === "forgot-password"
                    ? "Saisissez votre adresse e-mail pour recevoir le lien de réinitialisation."
                    : copy.subtitle}
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                  {error}
                </div>
              )}

              {notice && (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {notice}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs font-semibold text-foreground">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="nom.prenom@cfc.cm"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-9 pl-8 font-mono text-xs"
                    />
                  </div>
                </div>

                {mode === "password" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                        Mot de passe
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot-password")}
                        className="text-[10.5px] font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <PasswordInput
                      id="login-password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-9 w-full gap-1.5 rounded-md text-xs font-semibold"
                >
                  <span>
                    {submitting
                      ? "Traitement en cours..."
                      : mode === "password"
                        ? "Se connecter"
                        : mode === "magic-link"
                          ? "Recevoir un lien de connexion"
                          : "Envoyer le lien de réinitialisation"}
                  </span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </form>

              {copy.allowMagicLink && mode !== "forgot-password" && (
                <>
                  <Separator className="my-1" />

                  <button
                    type="button"
                    onClick={() => switchMode(mode === "password" ? "magic-link" : "password")}
                    className="flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {mode === "password" ? (
                      <>
                        <KeyRound className="size-3.5" />
                        Utiliser un lien magique par e-mail
                      </>
                    ) : (
                      <>
                        <Layers className="size-3.5" />
                        Utiliser mon mot de passe
                      </>
                    )}
                  </button>
                </>
              )}

              <div className="flex items-center gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                <span>
                  Session sécurisée, journalisée et rattachée à votre habilitation.
                </span>
              </div>

              <Link
                href={copy.switchHref}
                className="block text-center text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                {copy.switchLabel}
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="pt-4 text-center text-xs text-muted-foreground lg:hidden">
          &copy; {new Date().getFullYear()} Crédit Foncier du Cameroun
        </div>
      </div>
    </div>
  );
}
