"use server";

import { createServerSupabaseClient } from "@/server/supabase/server";
import {
  EMPTY_DRAFT,
  fromStoredProfile,
  type AffiliationStatus,
  type OnboardingDraft,
} from "@/domain/entities/onboarding";
import {
  advisorForSequence,
  PRIOR_CLIENT_CASES,
  type PriorClientCase,
} from "@/domain/entities/kyc-profile";

export type OnboardingResult =
  | { ok: true; message?: string; dossierCode?: string }
  | { ok: false; error: string };

async function currentCitizen() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: actor } = await supabase
    .from("actors")
    .select("id, actor_type")
    .eq("id", user.id)
    .maybeSingle();

  if (!actor || actor.actor_type !== "citizen") return null;

  return { supabase, userId: user.id };
}

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  cni_raw: string | null;
  address: string | null;
  affiliation_status: string | null;
};

/** Les déclarations du citoyen, telles que le parcours les a enregistrées. */
type KycProfileRow = {
  identity: Record<string, unknown> | null;
  residence: Record<string, unknown> | null;
  employment: Record<string, unknown> | null;
  compliance: Record<string, unknown> | null;
};

type DossierRow = {
  id: string;
  duc_code: string;
  service_code: string | null;
  name: string | null;
  cni_raw: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  profession: string | null;
  employer: string | null;
  monthly_income: number | null;
  is_diaspora: boolean;
};

export async function loadOnboardingDraft(): Promise<OnboardingDraft> {
  const citizen = await currentCitizen();
  if (!citizen) return EMPTY_DRAFT;

  const { supabase, userId } = citizen;

  const [
    { data: profileData, error: profileError },
    { data: dossierData, error: dossierError },
    { data: kycData, error: kycError },
  ] = await Promise.all([
    // Le profil **citoyen** porte l'identité ; la profession et l'employeur
    // appartiennent au dossier. Les demander ici ferait échouer la lecture
    // entière.
    supabase
      .from("citizen_profiles")
      .select(
        "full_name, email, phone, birth_date, cni_raw, address, affiliation_status",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("dossiers")
      .select(
        "id, duc_code, service_code, name, cni_raw, birth_date, phone, email, address, profession, employer, monthly_income, is_diaspora",
      )
      .eq("citizen_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Les déclarations du citoyen : le revenu déclaré, les personnes à charge,
    // les crédits en cours.
    supabase
      .from("kyc_profiles")
      .select("identity, residence, employment, compliance")
      .eq("citizen_id", userId)
      .maybeSingle(),
  ]);

  if (profileError || dossierError || kycError) {
    console.error(
      "[onboarding] lecture du parcours impossible :",
      profileError?.message ?? dossierError?.message ?? kycError?.message,
    );
  }

  const profile = profileData as ProfileRow | null;
  const dossier = dossierData as DossierRow | null;
  const kyc = (kycData ?? null) as KycProfileRow | null;

  if (!profile && !dossier && !kyc) return EMPTY_DRAFT;

  // Les déclarations sont **stockées** en snake_case : la traduction vit
  // dans le domaine, une fois.
  const { identity, residence, employment, compliance } = fromStoredProfile(kyc);
  // L'identité que l'inscription a portée est **pré-remplie** : le demandeur
  // la vérifie, il ne la ressaisit pas. Le dossier en est la copie de travail :
  // il porte les mêmes faits, et il comble ce que le profil citizen n'a pas.
  if (!identity.birthDate) {
    identity.birthDate = profile?.birth_date ?? dossier?.birth_date ?? null;
  }
  if (!identity.idDocumentNumber) {
    identity.idDocumentNumber = profile?.cni_raw ?? dossier?.cni_raw ?? null;
  }
  if (!identity.nationality && !dossier?.is_diaspora) {
    identity.nationality = "Cameroun";
  }

  return {
    serviceCode: dossier?.service_code ?? null,
    dossierId: dossier?.id ?? null,
    fullName: profile?.full_name ?? dossier?.name ?? "",
    phone: profile?.phone ?? dossier?.phone ?? "",
    affiliation:
      (profile?.affiliation_status as AffiliationStatus | null) ??
      (dossier?.is_diaspora ? "non_resident" : null),
    profile: { identity, residence, employment, compliance },
  };
}

/**
 * Enregistre la situation du demandeur.
 *
 * Le compte, lui, est ouvert par `/inscription` : cette action ne crée plus
 * de compte, elle ne complète que le dossier d'un demandeur déjà connecté.
 */
export async function saveServiceAction(serviceCode: string): Promise<OnboardingResult> {  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const { supabase, userId } = citizen;

  const { data: existing } = await supabase
    .from("dossiers")
    .select("id, duc_code")
    .eq("citizen_id", userId)
    .eq("service_code", serviceCode)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return { ok: true, dossierCode: existing.duc_code };
  }

  // Le dossier ouvert par l'inscription attend son service : on le complète,
  // on n'en ouvre pas un second. Un dossier par parcours.
  const { data: opened } = await supabase
    .from("dossiers")
    .select("id, duc_code, service_code")
    .eq("citizen_id", userId)
    .is("service_code", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (opened) {
    const { error } = await supabase
      .from("dossiers")
      .update({ service_code: serviceCode, updated_at: new Date().toISOString() })
      .eq("id", opened.id);

    if (error) return { ok: false, error: error.message };

    return { ok: true, dossierCode: opened.duc_code };
  }

  // Aucun dossier ouvert : on en ouvre un. Le code vient de la séquence, pour
  // que deux inscriptions simultanées n'aient pas le même.
  const { data: code, error: codeError } = await supabase.rpc("next_duc_code");
  if (codeError || typeof code !== "string" || code.length === 0) {
    return { ok: false, error: "Votre dossier n'a pas pu être ouvert. Réessayez." };
  }

  const { data, error } = await supabase
    .from("dossiers")
    .insert({
      duc_code: code,
      citizen_id: userId,
      service_code: serviceCode,
      current_phase: "kyc_savings",
      status: "open",
    })
    .select("duc_code")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  return { ok: true, dossierCode: data?.duc_code ?? code };
}

/**
 * Le profil du demandeur est enregistré par `saveKycDraftAction`
 * (`src/server/actions/kyc-profile.ts`) : il n'y a qu'une action qui écrit
 * les déclarations, et elle écrit aussi la copie de travail du dossier.
 */

/**
 * L'index de rotation du conseiller.
 *
 * Il est **dérivé de l'identifiant** du demandeur : un même demandeur
 * retrouve toujours le même conseiller, et deux inscriptions simultanées ne
 * se partagent pas le même. Un compteur lu puis incrémenté ferait les deux.
 */
function advisorIndexFor(citizenId: string): number {
  let hash = 0;
  for (let index = 0; index < citizenId.length; index += 1) {
    hash = (hash * 31 + citizenId.charCodeAt(index)) % 1_000_003;
  }
  return hash;
}

/**
 * Enregistre la situation du demandeur face au service choisi.
 *
 * Trois issues, et elles ne se corrigent pas de la même façon :
 *
 * - le demandeur a déjà bénéficié de ce service **au CFC** : il passe au
 *   dépôt des pièces ;
 * - il ne l'a jamais eu, ou chez un autre établissement : il doit d'abord
 *   être client du CFC pendant six mois. Son cas est transmis à un
 *   conseiller, et l'onboarding est **mis en pause**.
 */
export async function setPriorClientCaseAction(input: {
  priorClientCase: PriorClientCase;
}): Promise<OnboardingResult & { advisor?: string }> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const priorCase = PRIOR_CLIENT_CASES.find((item) => item.value === input.priorClientCase);
  if (!priorCase) {
    return { ok: false, error: "Situation inconnue." };
  }

  const supabase = await createServerSupabaseClient();

  // Le conseiller est calculé par le domaine — il est l'unique propriétaire de
  // la rotation — et la transition est appliquée par la base.
  const advisor = advisorForSequence(advisorIndexFor(citizen.userId));

  const { error } = await supabase.rpc("set_prior_client_case", {
    p_case: input.priorClientCase,
    p_advisor: advisor.name,
  });

  if (error) {
    if (/no_dossier/.test(error.message)) {
      return { ok: false, error: "Votre dossier n'est pas encore ouvert." };
    }
    if (/unknown_prior_client_case/.test(error.message)) {
      return { ok: false, error: "Situation inconnue." };
    }
    return { ok: false, error: error.message };
  }

  if (priorCase.eligible) {
    // Déjà servi au CFC : la suite est le dépôt des pièces.
    return { ok: true, message: "Votre dossier passe au dépôt des pièces." };
  }

  // Pas encore client du CFC : un conseiller est affecté, et l'onboarding est
  // en pause jusqu'à son activation du DUC.
  return {
    ok: true,
    advisor: advisor.name,
    message: `Votre dossier est transmis à ${advisor.name}.`,
  };
}

/**
 * Transmet le dossier au conseiller.
 *
 * La transmission est **atomique** et **journalisée** : le dossier passe en
 * examen, le conseiller est affecté, et l'événement est écrit dans la
 * chronologie du dossier. Le demandeur peut ne pas avoir toutes les pièces :
 * « passer pour l'instant » ne bloque pas, il se dit.
 */
export async function submitServiceApplicationAction(): Promise<
  OnboardingResult & { advisor?: string }
> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const supabase = await createServerSupabaseClient();
  const advisor = advisorForSequence(advisorIndexFor(citizen.userId));

  const { data, error } = await supabase.rpc("submit_service_application", {
    p_advisor: advisor.name,
  });

  if (error) {
    if (/no_dossier/.test(error.message)) {
      return { ok: false, error: "Votre dossier n'est pas encore ouvert." };
    }
    if (/onboarding_suspended/.test(error.message)) {
      return {
        ok: false,
        error:
          "Votre dossier est en pause : un conseiller doit vous orienter avant qu'il puisse être examiné.",
      };
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    advisor: typeof data === "string" ? data : advisor.name,
    message: "Votre dossier est transmis.",
  };
}

/**
 * Le dossier attend-il l'examen d'un conseiller ?
 *
 * C'est la question que pose l'espace citoyen avant d'afficher quoi que ce
 * soit : un dossier en pause n'a pas de fonctionnalités à montrer, seulement
 * un message et un nom.
 */
export async function loadOnboardingState(): Promise<{
  onboardingState: string | null;
  advisor: string | null;
  dossierCode: string | null;
}> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { onboardingState: null, advisor: null, dossierCode: null };
  }

  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("dossiers")
    .select("duc_code, onboarding_state, advisor")
    .eq("citizen_id", citizen.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const dossier = (data ?? null) as {
    duc_code: string | null;
    onboarding_state: string | null;
    advisor: string | null;
  } | null;

  return {
    onboardingState: dossier?.onboarding_state ?? null,
    advisor: dossier?.advisor ?? null,
    dossierCode: dossier?.duc_code ?? null,
  };
}

