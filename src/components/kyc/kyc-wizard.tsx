"use client";

/**
 * L'assistant KYC — quatre écrans, un seul dossier.
 *
 * Le demandeur déclare qui il est, écran par écran : identité, résidence et
 * contact, situation professionnelle, conformité et déclaration. Puis il
 * relit, et il transmet.
 *
 * Trois règles tiennent l'ensemble :
 *
 * - **la saisie est conservée automatiquement** : un brouillon n'a pas à être
 *   validé pour être gardé ;
 * - **le « Continuer » est bloqué tant qu'un champ bloquant manque**, et il
 *   dit **lequel** : un bouton muet n'apprend rien au demandeur ;
 * - **la lecture se fait avant l'écriture** : l'écran de récapitulatif montre
 *   ce qui sera transmis, avec ce qui reste à corriger.
 */

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Info, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { reportAction } from "@/lib/action-feedback";
import { cn } from "@/lib/utils";
import { saveKycDraftAction, submitKycAction } from "@/server/actions/kyc-profile";
import {
  validateStep,
  type AffiliationStatus,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";
import type { KycProfile } from "@/domain/entities/kyc";

import { KycIdentityStep } from "./steps/kyc-identity";
import { KycResidenceStep } from "./steps/kyc-residence";
import { KycEmploymentStep } from "./steps/kyc-employment";
import { KycComplianceStep } from "./steps/kyc-compliance";

/** Les écrans du KYC, dans l'ordre. */
const SCREENS = [
  { id: "identity", title: "Identité", caption: "Qui vous êtes" },
  { id: "residence", title: "Résidence et contact", caption: "Où vous êtes" },
  { id: "employment", title: "Situation professionnelle", caption: "Comment vous gagnez votre vie" },
  { id: "compliance", title: "Conformité et déclaration", caption: "Ce que vous déclarez" },
] as const;

/**
 * Les champs bloquants, **par écran**.
 *
 * Ce sont les mêmes que ceux du domaine : l'écran ne les réinvente pas, il
 * les affiche. `REQUIRED_FIELDS` du profil fait foi.
 */
const BLOCKING_BY_SCREEN: Record<string, readonly string[]> = {
  identity: [
    "identity.birthDate",
    "identity.nationality",
    "identity.idDocumentType",
    "identity.idDocumentNumber",
    "identity.idDocumentExpiresAt",
  ],
  residence: ["phone", "residence.city"],
  employment: [
    "employment.status",
    "employment.contractType",
    "employment.hiredAt",
    "employment.declaredIncome",
  ],
  compliance: ["affiliation"],
};

/** Le délai d'enregistrement automatique. */
const AUTOSAVE_DELAY_MS = 600;

export interface KycWizardProps {
  /** Les déclarations du demandeur. */
  profile: KycProfile;
  onProfileChange: (profile: KycProfile) => void;
  /** Le nom du demandeur — il vient du compte. */
  fullName: string;
  /** Le téléphone de contact — il vient du compte. */
  phone: string;
  onPhoneChange: (phone: string) => void;
  /** La situation bancaire — elle vient du compte. */
  affiliation: AffiliationStatus | null;
  onAffiliationChange: (value: AffiliationStatus) => void;
  /** Le parcours passe à l'étape suivante. */
  onNext: () => void;
}

export function KycWizard({
  profile,
  onProfileChange,
  fullName,
  phone,
  onPhoneChange,
  affiliation,
  onAffiliationChange,
  onNext,
}: KycWizardProps) {
  /** L'écran courant : 0 à 3, puis le récapitulatif. */
  const [screen, setScreen] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const draft: OnboardingDraft = React.useMemo(
    () => ({
      serviceCode: null,
      fullName,
      phone,
      affiliation,
      profile,
    }),
    [affiliation, fullName, phone, profile],
  );

  const validation = React.useMemo(() => validateStep("kyc", draft), [draft]);

  /**
   * Le refus, rattaché à son champ.
   *
   * Les règles du domaine d'abord, puis les refus du serveur : un refus de
   * la base est plus précis qu'un refus de formulaire, il l'emporte.
   */
  const fields = React.useMemo(
    () => ({ ...validation.fields, ...errors }),
    [errors, validation.fields],
  );

  /**
   * L'enregistrement automatique.
   *
   * Il part **après** la frappe, jamais à chaque touche : un dossier n'est
   * pas écrit vingt fois par seconde.
   */
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSaving(true);
      void saveKycDraftAction({
        profile,
        phone,
        affiliation,
        fullName,
      })
        .then((result) => {
          if (result.ok) {
            setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
          }
        })
        .finally(() => setSaving(false));
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [affiliation, fullName, phone, profile]);

  const currentScreen = SCREENS[screen];
  const isSummary = screen >= SCREENS.length;

  const blocking = isSummary ? [] : (BLOCKING_BY_SCREEN[currentScreen?.id ?? ""] ?? []);
  const missing = blocking.filter((field) => fields[field]);
  const canContinue = missing.length === 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});

    const result = await submitKycAction({
      profile,
      honourAttestation: profile.compliance.honourAttestation,
    });

    if (!result.ok) {
      setErrors(result.errors ?? {});
      reportAction({ ok: false, error: result.error });
      setSubmitting(false);
      return;
    }

    reportAction(result, result.message);
    setSubmitting(false);
    onNext();
  };

  const isForeignNationality =
    (profile.identity.nationality ?? "").trim().toLowerCase() !== "" &&
    (profile.identity.nationality ?? "").trim().toLowerCase() !== "cameroun";

  return (
    <div className="flex flex-col gap-5">
      {/* La progression ------------------------------------------------ */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow-style font-normal text-subtle">
            {isSummary ? "Récapitulatif" : `Écran ${screen + 1} sur ${SCREENS.length}`}
          </span>
          {saving ? (
            <span className="flex items-center gap-1.5 caption-style text-subtle">
              <Loader2 className="size-3 animate-spin" aria-hidden />
              Enregistrement…
            </span>
          ) : savedAt ? (
            <span className="flex items-center gap-1.5 caption-style text-subtle">
              <Check className="size-3 text-success" aria-hidden />
              Enregistré à {savedAt}
            </span>
          ) : null}
        </div>

        <Progress
          value={((isSummary ? SCREENS.length : screen) / SCREENS.length) * 100}
          className="h-1.5"
        />

        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {SCREENS.map((item, index) => {
            const state = index < screen ? "done" : index === screen ? "current" : "todo";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setScreen(index)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] transition-colors",
                    state === "todo" ? "text-soft" : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border text-[9px] font-semibold",
                      state === "done" && "border-cfc-gold bg-cfc-gold text-white",
                      state === "current" && "border-cfc-brown bg-cfc-brown text-white",
                      state === "todo" && "border-line-strong text-soft",
                    )}
                  >
                    {state === "done" ? <Check className="size-2.5" aria-hidden /> : index + 1}
                  </span>
                  {item.title}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* L'avertissement — il n'arrête rien --------------------------- */}
      {isForeignNationality && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200"
        >
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p>
            Votre nationalité n&apos;est pas camerounaise : votre dossier fera
            l&apos;objet d&apos;une vérification renforcée. Cela ne vous empêche
            pas de demander un prêt.
          </p>
        </div>
      )}

      {/* L'écran ------------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {isSummary ? "Vérifiez avant de transmettre" : currentScreen?.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSummary
              ? "Voici ce qui sera transmis à la plateforme. Vous pouvez revenir sur un écran pour le corriger."
              : currentScreen?.caption}
          </p>
        </div>

        {!isSummary && screen === 0 && (
          <KycIdentityStep
            identity={profile.identity}
            onChange={(values) =>
              onProfileChange({ ...profile, identity: { ...profile.identity, ...values } })
            }
            errors={fields}
          />
        )}

        {!isSummary && screen === 1 && (
          <KycResidenceStep
            residence={profile.residence}
            onChange={(values) =>
              onProfileChange({ ...profile, residence: { ...profile.residence, ...values } })
            }
            phone={phone}
            onPhoneChange={onPhoneChange}
            errors={fields}
          />
        )}

        {!isSummary && screen === 2 && (
          <KycEmploymentStep
            employment={profile.employment}
            onChange={(values) =>
              onProfileChange({ ...profile, employment: { ...profile.employment, ...values } })
            }
            errors={fields}
          />
        )}

        {!isSummary && screen === 3 && (
          <KycComplianceStep
            compliance={profile.compliance}
            onChange={(values) =>
              onProfileChange({ ...profile, compliance: { ...profile.compliance, ...values } })
            }
            affiliation={affiliation}
            onAffiliationChange={onAffiliationChange}
            errors={fields}
          />
        )}

        {isSummary && <Summary profile={profile} phone={phone} fullName={fullName} />}
      </div>

      {/* La navigation ------------------------------------------------- */}
      <div className="flex flex-col gap-3 border-t pt-4">
        {missing.length > 0 && (
          <p role="status" className="text-xs text-muted-foreground">
            Il vous manque{" "}
            <span className="font-medium text-foreground">
              {missing.length > 1 ? `${missing.length} informations` : "une information"}
            </span>{" "}
            pour continuer :{" "}
            {missing.map((field) => field.split(".").pop()).join(", ")}.
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={screen === 0 || submitting}
            onClick={() => setScreen((current) => Math.max(0, current - 1))}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Précédent
          </Button>

          {isSummary ? (
            <Button
              type="button"
              variant="cfc"
              size="sm"
              disabled={submitting}
              onClick={handleSubmit}
              className="gap-1.5 text-xs"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <ShieldCheck className="size-3.5" aria-hidden />
              )}
              Transmettre mon dossier
            </Button>
          ) : (
            <Button
              type="button"
              variant="cfc"
              size="sm"
              disabled={!canContinue}
              onClick={() => setScreen((current) => Math.min(SCREENS.length, current + 1))}
              className="gap-1.5 text-xs"
            >
              Continuer
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Le récapitulatif : ce qui sera transmis, et ce qui manque. */
function Summary({
  profile,
  phone,
  fullName,
}: {
  profile: KycProfile;
  phone: string;
  fullName: string;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Nom", value: fullName || "—" },
    { label: "Téléphone", value: phone || "—" },
    { label: "Date de naissance", value: profile.identity.birthDate || "—" },
    { label: "Nationalité", value: profile.identity.nationality || "—" },
    {
      label: "Pièce d'identité",
      value: profile.identity.idDocumentNumber
        ? `${profile.identity.idDocumentType ?? "—"} ${profile.identity.idDocumentNumber}`
        : "—",
    },
    {
      label: "Adresse",
      value:
        [profile.residence.city, profile.residence.neighbourhood].filter(Boolean).join(", ") ||
        "—",
    },
    {
      label: "Profession",
      value:
        [profile.employment.profession, profile.employment.employer]
          .filter(Boolean)
          .join(" — ") || "—",
    },
    {
      label: "Revenu déclaré",
      value: profile.employment.declaredIncome
        ? `${profile.employment.declaredIncome.toLocaleString("fr-FR")} FCFA`
        : "—",
    },
    {
      label: "Attestation sur l'honneur",
      value: profile.compliance.honourAttestation ? "Acceptée" : "—",
    },
  ];

  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-md border border-line-strong bg-muted/30 p-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5">
          <dt className="caption-style text-subtle">{row.label}</dt>
          <dd className="text-xs font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
      {!profile.compliance.honourAttestation && (
        <div className="sm:col-span-2">
          <Badge variant="destructive" className="text-[10px]">
            L&apos;attestation sur l&apos;honneur reste à accepter
          </Badge>
        </div>
      )}
    </dl>
  );
}
