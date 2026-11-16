"use client";

/**
 * Le formulaire d'inscription — volontairement **court**.
 *
 * Il ne demande que ce qui identifie le demandeur : nom, e-mail, téléphone,
 * CNI. Tout le reste (identité complète, résidence, situation professionnelle,
 * conformité) passe par le KYC, écran par écran : demander quinze champs d'un
 * coup est la première cause d'abandon.
 *
 * La saisie se valide **à la sortie du champ** : le demandeur est HMRC
 * pendant qu'il écrit, pas après coup. Et le refus est **attaché à son
 * champ** — jamais une liste à deviner.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Loader2, ShieldCheck, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { APP_VERSION } from "@/config/app-version";
import { reportAction } from "@/lib/action-feedback";
import { cn } from "@/lib/utils";
import { signupAction } from "@/server/actions/signup";
import {
  MIN_PASSWORD_LENGTH,
  SIGNUP_CONSENT_TEXT,
  validateSignupInput,
  type SignupAccountType,
  type SignupInput,
} from "@/domain/entities/kyc-profile";

/** Les champs sur lesquels on peut sortir le focus. */
type FieldName =
  | "fullName"
  | "email"
  | "phone"
  | "cniNumber"
  | "password"
  | "passwordConfirm"
  | "consent"
  | "accountType";

/** La robustesse du mot de passe, en quatre degrés. */
function passwordStrength(password: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (password.length === 0) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^\w\s]/.test(password) && password.length >= 12) score += 1;

  const labels = ["Très faible", "Faible", "Correct", "Solide", "Excellent"];
  return { score: score as 0 | 1 | 2 | 3, label: labels[Math.min(score, 4)] };
}

const STRENGTH_TONE = [
  "bg-destructive",
  "bg-amber-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-600",
];

export function SignupForm() {
  const router = useRouter();

  const [accountType, setAccountType] = React.useState<SignupAccountType>("particulier");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cniNumber, setCniNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [consent, setConsent] = React.useState(false);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  const input = React.useMemo<SignupInput>(
    () => ({
      accountType,
      fullName,
      email,
      phone,
      cniNumber,
      password,
      passwordConfirm,
      consent,
    }),
    [accountType, fullName, email, phone, cniNumber, password, passwordConfirm, consent],
  );

  /**
   * La validation ne porte que sur les champs **déjà quittés**.
   *
   * Un champ jamais quitté n'est pas en faute : le demandeur le voit encore.
   */
  const validate = React.useCallback(
    (fields: readonly FieldName[]): Record<string, string> => {
      const all = validateSignupInput(input).errors;
      const kept: Record<string, string> = {};

      for (const field of fields) {
        const message = all[field];
        if (message) kept[field] = message;
      }

      return kept;
    },
    [input],
  );

  const markTouched = (field: FieldName) => {
    setErrors((current) => ({ ...current, ...validate([field]) }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Un double clic ne crée pas deux comptes.
    if (submitting) return;

    setFailure(null);

    const validation = validateSignupInput(input);
    setErrors(validation.errors);

    if (!validation.ok) {
      reportAction({ ok: false, error: "Votre inscription est incomplète." });
      return;
    }

    setSubmitting(true);

    const result = await signupAction(input);

    if (!result.ok) {
      setFailure(result.error);
      reportAction({ ok: false, error: result.error });
      if (result.errors) setErrors(result.errors);
      setSubmitting(false);
      return;
    }

    reportAction({ ok: true }, result.message ?? "Votre compte est créé.");

    if (result.pendingConfirmation) {
      setSubmitting(false);
      return;
    }

    router.replace(result.redirectTo);
    router.refresh();
  };

  const strength = passwordStrength(password);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-5">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/70 bg-muted/40 p-10 lg:col-span-2 lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow-style font-normal text-subtle">Guichet Unique · Espace Citoyen</span>
            <Badge variant="outline" className="bg-background/80 px-2 py-0 font-mono text-[10px]">
              {APP_VERSION}
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
            <p>
              L&apos;inscription ouvre votre dossier unique client. Vous le complétez
              étape par étape : vos pièces, votre épargne, votre demande de prêt.
            </p>
            <div className="space-y-2 rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Vos données restent les vôtres</span>
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                <li className="flex gap-1.5">
                  <span aria-hidden className="text-cfc-gold">
                    ·
                  </span>
                  Un identifiant unique, réutilisable sur toutes vos démarches
                </li>
                <li className="flex gap-1.5">
                  <span aria-hidden className="text-cfc-gold">
                    ·
                  </span>
                  Un dossier qui suit votre demande, pièce par pièce
                </li>
                <li className="flex gap-1.5">
                  <span aria-hidden className="text-cfc-gold">
                    ·
                  </span>
                  Aucune donnée transmise à un tiers
                </li>
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
          <span className="eyebrow-style font-normal text-subtle">Guichet Unique · Espace Citoyen</span>
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
                    Créer un compte
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cinq informations suffisent. Le reste vous sera demandé à
                  l&apos;étape suivante.
                </p>
              </div>

              {failure && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                >
                  {failure}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Le type de compte ------------------------------------ */}
                <fieldset className="space-y-1.5">
                  <legend className="text-xs font-semibold text-foreground">
                    Type de compte
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountType("particulier")}
                      aria-pressed={accountType === "particulier"}
                      className={cn(
                        "flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
                        accountType === "particulier"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-line-strong",
                      )}
                    >
                      <User className="size-3.5" />
                      Particulier
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Bientôt disponible"
                      className="flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground/60"
                    >
                      <Building2 className="size-3.5" />
                      Entreprise
                      <Badge variant="outline" className="ml-1 px-1 py-0 text-[9px]">
                        Bientôt
                      </Badge>
                    </button>
                  </div>
                </fieldset>

                <Field
                  label="Nom complet"
                  htmlFor="signup-fullname"
                  required
                  error={errors.fullName}
                >
                  <Input
                    id="signup-fullname"
                    autoComplete="name"
                    placeholder="Awa Njoya"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    onBlur={() => markTouched("fullName")}
                    aria-invalid={errors.fullName ? true : undefined}
                    className="h-9 text-xs"
                  />
                </Field>

                <Field
                  label="Adresse e-mail"
                  htmlFor="signup-email"
                  required
                  error={errors.email}
                >
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nom.prenom@cfc.cm"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => markTouched("email")}
                    aria-invalid={errors.email ? true : undefined}
                    className="h-9 font-mono text-xs"
                  />
                </Field>

                <PhoneInput
                  id="signup-phone"
                  label="Téléphone"
                  required
                  value={phone}
                  onChange={setPhone}
                  error={errors.phone}
                  hint="Le numéro qui vous joindra pendant l'instruction du dossier."
                />

                <Field
                  label="Numéro de CNI"
                  htmlFor="signup-cni"
                  required
                  error={errors.cniNumber}
                  hint="Il identifie votre dossier de façon unique."
                >
                  <Input
                    id="signup-cni"
                    placeholder="AB123456"
                    value={cniNumber}
                    onChange={(event) => setCniNumber(event.target.value)}
                    onBlur={() => markTouched("cniNumber")}
                    aria-invalid={errors.cniNumber ? true : undefined}
                    className="h-9 font-mono text-xs uppercase"
                  />
                </Field>

                <Field
                  label="Mot de passe"
                  htmlFor="signup-password"
                  required
                  error={errors.password}
                >
                  <PasswordInput
                    id="signup-password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => markTouched("password")}
                    aria-invalid={errors.password ? true : undefined}
                    className="h-9 font-mono text-xs"
                  />
                </Field>

                {password.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-1 flex-1 gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <span
                          key={step}
                          className={cn(
                            "h-full flex-1 rounded-full transition-colors",
                            step <= strength.score
                              ? STRENGTH_TONE[strength.score]
                              : "bg-muted",
                          )}
                        />
                      ))}
                    </div>
                    <span className="caption-style text-subtle">{strength.label}</span>
                  </div>
                )}

                <Field
                  label="Confirmer le mot de passe"
                  htmlFor="signup-password-confirm"
                  required
                  error={errors.passwordConfirm}
                >
                  <PasswordInput
                    id="signup-password-confirm"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    onBlur={() => markTouched("passwordConfirm")}
                    aria-invalid={errors.passwordConfirm ? true : undefined}
                    className="h-9 font-mono text-xs"
                  />
                </Field>

                {/* Le consentement ------------------------------------- */}
                <div className="space-y-1.5">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => {
                        setConsent(event.target.checked);
                        setErrors((current) => {
                          const next = { ...current };
                          if (event.target.checked) delete next.consent;
                          else next.consent = "Vous devez accepter la collecte de vos données pour continuer.";
                          return next;
                        });
                      }}
                      className="mt-0.5 size-3.5 shrink-0 accent-cfc-brown"
                    />
                    <span className="text-[11px] leading-relaxed text-muted-foreground">
                      {SIGNUP_CONSENT_TEXT}
                    </span>
                  </label>
                  {errors.consent && (
                    <p role="alert" className="text-[11px] text-destructive">
                      {errors.consent}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-9 w-full gap-1.5 rounded-md text-xs font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Création de votre compte…
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                <span>Session sécurisée, journalisée et rattachée à votre dossier.</span>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Connectez-vous
                </Link>
              </p>
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
