"use server";

import { randomUUID } from "node:crypto";

import { validateOwnProfileInput } from "@/domain/entities/profile";
import { validateProfileAvatarBytes } from "@/domain/entities/profile-avatar";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type ProfileActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function databaseError(message: string): ProfileActionResult {
  if (message.includes("profile_name_review_required")) {
    return {
      ok: false,
      error: "Votre nom a été transmis avec le KYC. Demandez une correction à votre gestionnaire.",
      fieldErrors: { fullName: "Après la soumission du KYC, demandez une correction à votre gestionnaire." },
    };
  }
  if (message.includes("profile_staff_assignment_required")) {
    return { ok: false, error: "Votre compte agent n’a pas d’affectation active. Contactez l’administrateur." };
  }
  if (message.includes("profile_phone_invalid")) {
    return { ok: false, error: "Renseignez un numéro de téléphone valide.", fieldErrors: { phone: "Numéro invalide." } };
  }
  if (message.includes("profile_name_correction_pending")) {
    return { ok: false, error: "Une demande de correction de nom est déjà en cours d’examen." };
  }
  if (message.includes("profile_name_correction_manager_unavailable")) {
    return { ok: false, error: "Aucun gestionnaire actif n’est affecté à ce dossier. Contactez l’assistance." };
  }
  if (message.includes("profile_name_correction_request_not_found")) {
    return { ok: false, error: "La demande choisie n’existe plus ou ne vous appartient pas." };
  }
  if (message.includes("profile_name_correction_forbidden")) {
    return { ok: false, error: "Votre habilitation ne permet pas de traiter cette demande." };
  }
  return { ok: false, error: "La mise à jour du profil a échoué. Réessayez dans un instant." };
}

export async function updateOwnProfileAction(input: {
  fullName: string;
  phone: string;
}): Promise<ProfileActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const validation = validateOwnProfileInput(input);
  if (!validation.ok) {
    return {
      ok: false,
      error: "Corrigez les champs indiqués.",
      fieldErrors: validation.errors as Record<string, string>,
    };
  }

  const { error } = await supabase.rpc("update_own_profile", {
    p_full_name: validation.value.fullName,
    p_phone: validation.value.phone,
  });

  if (error) return databaseError(error.message);
  return { ok: true, message: "Votre profil a été mis à jour." };
}

export async function requestOwnNameCorrectionAction(input: {
  dossierId: string;
  requestedFullName: string;
  reason: string;
}): Promise<ProfileActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const requestedFullName = input.requestedFullName.trim();
  const reason = input.reason.trim();
  const fieldErrors: Record<string, string> = {};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.dossierId)) {
    fieldErrors.dossierId = "Choisissez une demande en cours.";
  }
  if (requestedFullName.length < 2 || requestedFullName.length > 160) {
    fieldErrors.requestedFullName = "Renseignez un nom de 2 à 160 caractères.";
  }
  if (reason.length < 10 || reason.length > 1000) {
    fieldErrors.reason = "Expliquez la correction en 10 à 1000 caractères.";
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Corrigez les champs indiqués.", fieldErrors };
  }

  const { error } = await supabase.rpc("request_citizen_name_correction", {
    p_dossier_id: input.dossierId,
    p_requested_full_name: requestedFullName,
    p_reason: reason,
  });
  if (error) return databaseError(error.message);
  return { ok: true, message: "Votre demande de correction a été transmise à votre gestionnaire." };
}

export async function decideCitizenNameCorrectionAction(input: {
  requestId: string;
  decision: "approved" | "rejected";
  reviewNote: string;
}): Promise<ProfileActionResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) {
    return { ok: false, error: "La demande sélectionnée est invalide." };
  }
  if (input.decision !== "approved" && input.decision !== "rejected") {
    return { ok: false, error: "Décision inconnue." };
  }
  const reviewNote = input.reviewNote.trim();
  if (input.decision === "rejected" && reviewNote.length < 10) {
    return { ok: false, error: "Un motif de refus d’au moins 10 caractères est obligatoire.", fieldErrors: { reviewNote: "Ajoutez un motif précis." } };
  }
  if (reviewNote.length > 1000) {
    return { ok: false, error: "Le commentaire ne peut pas dépasser 1000 caractères.", fieldErrors: { reviewNote: "Commentaire trop long." } };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const { error } = await supabase.rpc("decide_citizen_name_correction", {
    p_request_id: input.requestId,
    p_decision: input.decision,
    p_review_note: reviewNote || null,
  });
  if (error) return databaseError(error.message);
  return {
    ok: true,
    message: input.decision === "approved" ? "La correction a été approuvée." : "La demande a été refusée.",
  };
}

export type NameCorrectionRequestView = {
  id: string;
  requestedFullName: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export async function listOwnNameCorrectionRequestsAction(): Promise<
  | { ok: true; requests: NameCorrectionRequestView[] }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session requise." };

  const { data, error } = await supabase
    .from("citizen_profile_change_requests")
    .select("id, requested_full_name, reason, status, review_note, created_at, reviewed_at")
    .eq("citizen_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: "Les demandes de correction ne sont pas disponibles." };

  return {
    ok: true,
    requests: (data ?? []).map((row) => ({
      id: row.id,
      requestedFullName: row.requested_full_name,
      reason: row.reason,
      status: row.status,
      reviewNote: row.review_note,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
    })),
  };
}

export async function uploadOwnProfileAvatarAction(file: File): Promise<ProfileActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }
  if (!(file instanceof File)) return { ok: false, error: "Sélectionnez une image." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateProfileAvatarBytes(file.type, bytes);
  if (!validation.ok) {
    return { ok: false, error: validation.error, fieldErrors: { avatar: validation.error } };
  }

  const { data: previous } = await supabase
    .from("actor_profile_media")
    .select("avatar_path")
    .eq("actor_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  const path = `${user.id}/${randomUUID()}.${validation.extension}`;
  const contentType = validation.format === "jpeg" ? "image/jpeg" : `image/${validation.format}`;
  const { error: uploadError } = await supabase.storage
    .from("profile-avatars")
    .upload(path, bytes, { contentType, cacheControl: "300", upsert: false });
  if (uploadError) {
    return { ok: false, error: "La photo n’a pas pu être téléversée. Vérifiez le format puis réessayez." };
  }

  const { error: metadataError } = await supabase
    .from("actor_profile_media")
    .upsert({ actor_id: user.id, avatar_path: path }, { onConflict: "actor_id" });
  if (metadataError) {
    await supabase.storage.from("profile-avatars").remove([path]);
    return { ok: false, error: "La photo a été téléversée mais son profil n’a pas été mis à jour. Réessayez." };
  }

  if (previous?.avatar_path && previous.avatar_path !== path) {
    const { error: cleanupError } = await supabase.storage
      .from("profile-avatars")
      .remove([previous.avatar_path]);
    if (cleanupError) {
      return { ok: true, message: "La nouvelle photo est enregistrée. L’ancienne image sera nettoyée ultérieurement." };
    }
  }

  return { ok: true, message: "Votre photo de profil a été mise à jour." };
}

export async function removeOwnProfileAvatarAction(): Promise<ProfileActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour continuer." };
  }

  const { data: existing } = await supabase
    .from("actor_profile_media")
    .select("avatar_path")
    .eq("actor_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing?.avatar_path) return { ok: true, message: "Aucune photo de profil à retirer." };

  const { error: metadataError } = await supabase
    .from("actor_profile_media")
    .delete()
    .eq("actor_id", user.id);
  if (metadataError) return { ok: false, error: "La photo de profil n’a pas pu être retirée." };

  const { error: storageError } = await supabase.storage
    .from("profile-avatars")
    .remove([existing.avatar_path]);
  if (storageError) {
    return { ok: true, message: "Votre photo est retirée du profil. Un nettoyage de stockage reste à effectuer." };
  }
  return { ok: true, message: "Votre photo de profil a été retirée." };
}
