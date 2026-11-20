"use server";

/**
 * Les écritures du parcours KYC.
 *
 * Deux familles, et la séparation est **structurante** :
 *
 * - ce que le **citoyen** déclare (`saveKycDraftAction`, `submitKycAction`,
 *   `recordKycDocumentAction`, `deleteKycDocumentAction`) ;
 * - ce que le **conseiller** décide (`rejectKycAction`).
 *
 * Le citoyen n'écrit **jamais** l'état de son dossier : l'état a un
 * propriétaire — la machine à états — et la soumission passe par la fonction
 * `public.submit_kyc_profile()`, qui l'applique en une opération.
 *
 * ⚠️ Aucune de ces actions ne reçoit l'identifiant du citoyen : il est
 *    déduit de la session. Une action qui recevrait un identifiantallowingait
 *    d'écrire le dossier d'un autre.
 */

import { createServerSupabaseClient } from "@/server/supabase/server";
import { getServerProfile } from "@/server/auth/profile";
import { hasCapability } from "@/domain/policies/permissions";
import { toE164 } from "@/domain/entities/phone";
import { notifyBusinessEvent } from "@/server/notifications/notify";
import {
  missingRequiredFields,
  toStoredProfile,
  validateKycProfile,
  type KycProfile,
} from "@/domain/entities/kyc-profile";
import type { AffiliationStatus } from "@/domain/entities/onboarding";
import type { KycOptionCategory } from "@/domain/entities/kyc-options";

export type KycActionResult =
  | { ok: true; message?: string; state?: string }
  | { ok: false; error: string; errors?: Record<string, string> };

const KYC_OPTION_FIELD_BY_CATEGORY: Record<KycOptionCategory, string> = {
  family_status: "identity.familyStatus",
  employment_status: "employment.status",
  income_origin: "employment.incomeOrigin",
  income_band: "employment.incomeBand",
  id_document_type: "identity.idDocumentType",
  occupation_status: "residence.occupationStatus",
  pep_reason: "compliance.pepReason",
};

/** Le citoyen connecté, et rien d'autre. */
async function currentCitizen(): Promise<{ id: string } | null> {
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

  return { id: user.id };
}

async function ownedKycDossier(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  citizenId: string,
  dossierId: string,
) {
  const { data } = await supabase
    .from("dossiers")
    .select("id")
    .eq("id", dossierId)
    .eq("citizen_id", citizenId)
    .eq("onboarding_state", "kyc")
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

/**
 * Enregistre le brouillon déclaré.
 *
 * Le brouillon est **automatiquement** enregistré à la frappe : il n'a pas à
 * être validé pour être conservé. L'état du KYC, lui, n'est pas touché.
 */
export async function saveKycDraftAction(input: {
  profile: KycProfile;
  /** The exact request whose editable KYC draft is being completed. */
  dossierId: string;
  /** Le téléphone de contact — il vient du compte, mais il reste modifiable. */
  phone?: string;
  /** La situation bancaire — elle vient du compte. */
  affiliation?: AffiliationStatus | null;
  /** Le nom du demandeur — il vient du compte. */
  fullName?: string;
}): Promise<KycActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  if (!input.dossierId || !/^[0-9a-f-]{36}$/i.test(input.dossierId)) {
    return { ok: false, error: "Sélectionnez un dossier valide avant d’enregistrer vos informations." };
  }

  const supabase = await createServerSupabaseClient();
  const dossier = await ownedKycDossier(supabase, citizen.id, input.dossierId);
  if (!dossier) return { ok: false, error: "Ce dossier n’existe pas ou ne vous appartient pas." };

  const now = new Date().toISOString();
  const stored = toStoredProfile(input.profile);

  const { error: kycError } = await supabase.from("kyc_profiles").upsert(
    {
      citizen_id: citizen.id,
      identity: stored.identity,
      residence: stored.residence,
      employment: stored.employment,
      compliance: stored.compliance,
      updated_at: now,
      updated_by: citizen.id,
    },
    { onConflict: "citizen_id" },
  );

  if (kycError) return { ok: false, error: kycError.message };

  // Le profil citoyen porte l'**identité** ; la profession et l'employeur
  // appartiennent au dossier. Les écrire ici ferait échouer l'enregistrement
  // entier — et le citoyen verrait « votre session a expiré ».
  const profilePatch: Record<string, unknown> = { updated_at: now };

  if (input.phone !== undefined) profilePatch.phone = toE164(input.phone);
  if (input.affiliation !== undefined) profilePatch.affiliation_status = input.affiliation;
  if (input.fullName) profilePatch.full_name = input.fullName.trim();
  if (input.profile.identity.birthDate) {
    profilePatch.birth_date = input.profile.identity.birthDate;
  }
  if (input.profile.identity.idDocumentNumber) {
    profilePatch.cni_raw = input.profile.identity.idDocumentNumber.trim().toUpperCase();
  }

  const { error: profileError } = await supabase
    .from("citizen_profiles")
    .update(profilePatch)
    .eq("id", citizen.id);

  if (profileError) return { ok: false, error: profileError.message };

  // La **copie de travail** de la plateforme : le dossier est ce que l'agent
  // lit. Il porte les mêmes faits, et le revenu déclaré n'y entre pas — il
  // reste la déclaration du citoyen.
  const { identity, residence, employment } = input.profile;

  const { error: dossierError } = await supabase
    .from("dossiers")
    .update({
      name: input.fullName?.trim() || null,
      birth_date: identity.birthDate || null,
      cni_raw: identity.idDocumentNumber?.trim().toUpperCase() || null,
      address: residence.landmark || residence.city || null,
      city: residence.city || null,
      region: residence.region || null,
      profession: employment.profession || null,
      employer: employment.employer || null,
      updated_at: now,
    })
    .eq("id", dossier.id);

  if (dossierError) return { ok: false, error: dossierError.message };

  return { ok: true, message: "Vos informations sont enregistrées." };
}

/**
 * Soumet le profil à la plateforme.
 *
 * La validation est **celle du domaine** : majorité, pièce d'identité non
 * expirée, date d'embauche non future, champs bloquants. Chaque refus est
 * rattaché à son champ.
 */
export async function submitKycAction(input: {
  profile: KycProfile;
  /** The exact request whose KYC step is being submitted. */
  dossierId: string;
  /** L'attestation sur l'honneur, acceptée par le demandeur. */
  honourAttestation: boolean;
}): Promise<KycActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  if (!input.dossierId || !/^[0-9a-f-]{36}$/i.test(input.dossierId)) {
    return { ok: false, error: "Sélectionnez un dossier valide avant de transmettre vos informations." };
  }

  const errors: Record<string, string> = {};

  for (const field of missingRequiredFields(input.profile)) {
    errors[field] ??= "Ce champ est obligatoire.";
  }

  const validation = validateKycProfile(input.profile);
  for (const [field, message] of Object.entries(validation.errors)) {
    errors[field] ??= message;
  }

  if (!input.honourAttestation) {
    errors["compliance.honourAttestation"] ??=
      "Vous devez accepter l'attestation sur l'honneur pour soumettre votre dossier.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      error: "Votre dossier est incomplet. Corrigez les champs signalés.",
      errors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const ownedDossier = await ownedKycDossier(supabase, citizen.id, input.dossierId);
  if (!ownedDossier) return { ok: false, error: "Ce dossier n’existe pas ou ne vous appartient pas." };

  const now = new Date().toISOString();
  const stored = toStoredProfile(input.profile);

  // Le profil est d'abord enregistré : la soumission porte sur des faits
  // **présents**, pas sur des faits déclarés ailleurs.
  const { error: kycError } = await supabase.from("kyc_profiles").upsert(
    {
      citizen_id: citizen.id,
      identity: stored.identity,
      residence: stored.residence,
      employment: stored.employment,
      compliance: {
        ...stored.compliance,
        honour_attestation: true,
        honour_mention: "Lu et approuvé",
        accepted_at: now,
      },
      updated_at: now,
      updated_by: citizen.id,
    },
    { onConflict: "citizen_id" },
  );

  if (kycError) return { ok: false, error: kycError.message };

  // La soumission : horodatage et transition, **en une opération**.
  const { data: state, error: submitError } = await supabase.rpc("submit_kyc_profile", {
    p_dossier_id: input.dossierId,
  });

  if (submitError) {
    if (/kyc_not_submittable/.test(submitError.message)) {
      return {
        ok: false,
        error: "Votre dossier a déjà été transmis : il est en cours d'examen.",
      };
    }
    if (/not_a_citizen/.test(submitError.message)) {
      return { ok: false, error: "Session requise." };
    }
    const invalidOption = submitError.message.match(/invalid_kyc_option:([a-z_]+)/)?.[1] as
      | KycOptionCategory
      | undefined;
    if (invalidOption && invalidOption in KYC_OPTION_FIELD_BY_CATEGORY) {
      return {
        ok: false,
        error: "Une option du formulaire n’est plus disponible. Choisissez une valeur actuelle et réessayez.",
        errors: {
          [KYC_OPTION_FIELD_BY_CATEGORY[invalidOption]]: "Cette valeur n’est plus disponible. Choisissez une option du catalogue actuel.",
        },
      };
    }
    return { ok: false, error: submitError.message };
  }

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("id")
    .eq("citizen_id", citizen.id)
    .eq("id", input.dossierId)
    .is("deleted_at", null)
    .maybeSingle();

  if (dossierError) {
    console.error("[kyc] dossier transmis, mais dossier introuvable pour la notification :", dossierError.message);
  } else if (dossier) {
    await notifyBusinessEvent({
      eventType: "KYC_SUBMITTED",
      dossierId: dossier.id,
      recipientUserId: citizen.id,
    });
  } else {
    console.warn("[kyc] dossier transmis sans dossier associé pour la notification.");
  }

  return {
    ok: true,
    state: typeof state === "string" ? state : "document_verification",
    message: "Votre dossier est transmis. Un conseiller va l'examiner.",
  };
}

/**
 * Déclare une pièce du parcours.
 *
 * Seules les **métadonnées** sont conservées : les octets restent dans le
 * coffre du dossier. La pièce est « envoyée » — elle attend sa vérification.
 */
export async function recordKycDocumentAction(input: {
  docCode: string;
  label: string;
  category: "kyc" | "emprunteur" | "projet" | "programme" | "partenaires";
  fileName: string;
  fileType: string;
  fileSize: number;
  dossierId?: string | null;
}): Promise<KycActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("kyc_documents").upsert(
    {
      citizen_id: citizen.id,
      dossier_id: input.dossierId ?? null,
      doc_code: input.docCode,
      label: input.label,
      category: input.category,
      file_name: input.fileName,
      file_type: input.fileType,
      file_size: input.fileSize,
      sent_at: new Date().toISOString(),
      created_by: citizen.id,
      updated_at: new Date().toISOString(),
      updated_by: citizen.id,
    },
    { onConflict: "citizen_id,doc_code" },
  );

  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Pièce enregistrée." };
}

/** Retire une pièce déclarée. */
export async function deleteKycDocumentAction(input: {
  docCode: string;
}): Promise<KycActionResult> {
  const citizen = await currentCitizen();
  if (!citizen) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("kyc_documents")
    .delete()
    .eq("citizen_id", citizen.id)
    .eq("doc_code", input.docCode);

  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Pièce retirée." };
}

/**
 * Rejette le profil — **côté conseiller**.
 *
 * L'action écrit le **motif** du rejet ; l'état reste à la machine à états,
 * qui décide de la suite. Un refus sans motif n'est pas un refus.
 */
export async function rejectKycAction(input: {
  citizenId: string;
  reason: string;
}): Promise<KycActionResult> {
  const profile = await getServerProfile().catch(() => null);
  if (!profile) return { ok: false, error: "Session requise." };

  // Le refus est une **décision** : elle appartient à un habilité. Un
  // citoyen qui l'appellerait pour lui-même n'obtiendrait rien — et le
  // contrôle est ici, pas seulement dans la politique de sécurité.
  if (profile.role === "CITIZEN" || !hasCapability(profile.role, "kyc:decide", profile.capabilities)) {
    return {
      ok: false,
      error: "Votre habilitation ne permet pas de décider sur un dossier KYC.",
    };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("kyc_profiles")
    .update({
      rejection_reason: input.reason.trim() || null,
      updated_at: new Date().toISOString(),
      updated_by: profile.actorId,
    })
    .eq("citizen_id", input.citizenId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Le motif du rejet est enregistré." };
}
