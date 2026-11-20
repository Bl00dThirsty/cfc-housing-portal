"use client";

/**
 * Application d'un nouveau mot de passe après récupération de compte.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { APP_VERSION } from "@/config/app-version";
import { useAuth } from "@/lib/auth-context";

export function UpdatePasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setNotice("Mot de passe mis à jour. Vous pouvez vous connecter.");
    window.setTimeout(() => router.push("/login"), 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour à la connexion
          </Link>
          <Badge variant="outline" className="font-mono text-[10px]">
            CFC {APP_VERSION}
          </Badge>
        </div>

        <Card className="border shadow-xs">
          <CardContent className="space-y-6 px-6 pb-6 pt-6 sm:px-8">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Nouveau mot de passe
              </h1>
              <p className="text-xs text-muted-foreground">
                Choisissez un mot de passe d&apos;au moins 8 caractères, différent de vos
                autres identifiants.
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
                <label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                  Nouveau mot de passe
                </label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-xs font-semibold text-foreground"
                >
                  Confirmer le mot de passe
                </label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-9 w-full gap-1.5 rounded-md text-xs font-semibold"
              >
                <span>{submitting ? "Enregistrement..." : "Enregistrer le mot de passe"}</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </form>

            <div className="flex items-center gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
              <span>Le changement de mot de passe est journalisé dans l&apos;audit.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
