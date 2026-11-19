"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { getSiteUrl } from "@/server/env";
import { sendTemplatedEmail, type SendEmailResult } from "@/server/email/send";
import { getAdminClient } from "@/server/supabase/admin";
import { createServerSupabaseClient } from "@/server/supabase/server";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  fullName: z.string().trim().min(3).max(160),
  role: z.string().trim().min(1).max(64),
  agencyId: z.string().uuid().nullable().optional(),
  jobTitle: z.string().trim().max(120).nullable().optional(),
});

const updateProfileSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(3).max(160),
  jobTitle: z.string().trim().max(120).nullable(),
  phone: z.string().trim().max(40).nullable(),
});

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().trim().min(1).max(64),
  agencyId: z.string().uuid().nullable(),
});

export type AdminStaffActionResult =
  | { ok: true; message?: string; deliveryStatus?: SendEmailResult["status"]; warning?: string }
  | { ok: false; error: string };

function canManageUsers(role: string, capabilities?: Parameters<typeof hasCapability>[2]): boolean {
  return hasCapability(role as Parameters<typeof hasCapability>[0], "admin:users", capabilities);
}

function canManageRoles(role: string, capabilities?: Parameters<typeof hasCapability>[2]): boolean {
  return hasCapability(role as Parameters<typeof hasCapability>[0], "admin:roles", capabilities);
}

function authLink(tokenHash: string, type: "invite" | "magiclink" | "recovery"): string {
  const url = new URL("/auth/confirm", getSiteUrl());
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  url.searchParams.set("next", "/login/reset-password");
  return url.toString();
}

function greeting(fullName: string): { prenom: string; nom: string } {
  const [first = "", ...rest] = fullName.trim().split(/\s+/);
  return { prenom: first, nom: rest.join(" ") };
}

function deliveryFeedback(result: SendEmailResult): Pick<AdminStaffActionResult & { ok: true }, "deliveryStatus" | "warning"> {
  if (result.status === "sent") return { deliveryStatus: "sent" };
  return {
    deliveryStatus: result.status,
    warning: result.status === "skipped"
      ? "Le compte est enregistré, mais aucun e-mail n’a été envoyé. Configurez le relais SMTP puis renvoyez le lien."
      : "Le compte est enregistré, mais le message n’a pas été distribué. Consultez le journal des e-mails puis renvoyez le lien.",
  };
}

/** Create a pending Supabase Auth invite, then attach its staff role in Postgres. */
export async function inviteStaffUserAction(input: unknown): Promise<AdminStaffActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez l’adresse, le nom, le rôle et l’agence." };

  const profile = await getServerProfile();
  if (!profile || !canManageUsers(profile.role, profile.capabilities)) {
    return { ok: false, error: "La gestion des comptes est réservée aux personnes habilitées." };
  }

  const { email, fullName, role, agencyId = null, jobTitle = null } = parsed.data;
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { actor_type: "staff", full_name: fullName } },
  });

  const tokenHash = data?.properties?.hashed_token;
  const userId = data?.user?.id;
  if (error || !tokenHash || !userId) {
    return { ok: false, error: "Le compte n’a pas pu être invité. Vérifiez l’adresse et réessayez." };
  }

  const supabase = await createServerSupabaseClient();
  const { error: registerError } = await supabase.rpc("cfc_register_invited_staff", {
    p_user_id: userId,
    p_full_name: fullName,
    p_role: role,
    p_agency: agencyId,
    p_job_title: jobTitle,
  });

  if (registerError) {
    // This identity was just created by this operation and has no staff rows yet.
    // Remove only that incomplete invitation so a retry cannot strand a duplicate.
    await admin.auth.admin.deleteUser(userId);
    const message = registerError.message;
    if (message.includes("unknown_role")) return { ok: false, error: "Ce rôle n’est plus disponible." };
    if (message.includes("unknown_agency")) return { ok: false, error: "Cette agence n’est plus disponible." };
    return { ok: false, error: "Le profil et l’affectation du compte n’ont pas pu être enregistrés." };
  }

  const link = authLink(tokenHash, "invite");
  const { prenom, nom } = greeting(fullName);
  const delivery = await sendTemplatedEmail({
    templateCode: "STAFF_INVITATION",
    to: email,
    recipientUserId: userId,
    actorId: profile.actorId,
    variables: {
      prenom,
      nom,
      lien: link,
      date: new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }),
      duree: "60 minutes",
      logo: `${getSiteUrl()}/images/logo-cfc.png`,
      siege: getSiteUrl(),
    },
    idempotencyKey: `STAFF_INVITATION:${userId}:${randomUUID()}`,
  });

  revalidatePath("/portail-cfc/settings/users");
  return { ok: true, message: "Le compte du membre du personnel a été créé.", ...deliveryFeedback(delivery) };
}

/** Update ordinary staff profile fields; authorization state is never changed here. */
export async function updateStaffProfileAction(input: unknown): Promise<AdminStaffActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez le nom, la fonction et le téléphone." };

  const profile = await getServerProfile();
  if (!profile || !canManageUsers(profile.role, profile.capabilities)) {
    return { ok: false, error: "La gestion des comptes est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_update_staff_user", {
    p_user_id: parsed.data.userId,
    p_full_name: parsed.data.fullName,
    p_job_title: parsed.data.jobTitle,
    p_phone: parsed.data.phone,
  });
  if (error) return { ok: false, error: "Le profil du membre du personnel n’a pas pu être enregistré." };

  revalidatePath("/portail-cfc/settings/users");
  return { ok: true, message: "Profil enregistré." };
}

/** Change an effective-dated staff role and agency through the audited database RPC. */
export async function assignStaffRoleAction(input: unknown): Promise<AdminStaffActionResult> {
  const parsed = assignRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sélectionnez un rôle et une agence valides." };

  const profile = await getServerProfile();
  if (!profile || !canManageRoles(profile.role, profile.capabilities)) {
    return { ok: false, error: "La gestion des rôles est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_set_user_role", {
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
    p_agency: parsed.data.agencyId,
  });
  if (error) {
    if (error.message.includes("cannot_remove_last_admin")) {
      return { ok: false, error: "Le dernier administrateur actif ne peut pas perdre ce rôle." };
    }
    return { ok: false, error: "Le rôle et l’agence n’ont pas pu être modifiés." };
  }

  revalidatePath("/portail-cfc/settings/users");
  return { ok: true, message: "Affectation mise à jour." };
}

/** Enable or suspend a staff account; reactivation also restores its last assignment. */
export async function setStaffAccountActiveAction(
  userId: string,
  active: boolean,
): Promise<AdminStaffActionResult> {
  if (!z.string().uuid().safeParse(userId).success) {
    return { ok: false, error: "Identifiant de compte invalide." };
  }

  const profile = await getServerProfile();
  if (!profile || !canManageUsers(profile.role, profile.capabilities)) {
    return { ok: false, error: "La gestion des comptes est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cfc_set_user_active", {
    p_user_id: userId,
    p_active: active,
  });
  if (error) {
    if (error.message.includes("cannot_disable_self")) return { ok: false, error: "Vous ne pouvez pas suspendre votre propre compte." };
    if (error.message.includes("cannot_disable_last_admin")) return { ok: false, error: "Le dernier administrateur actif ne peut pas être suspendu." };
    return { ok: false, error: "L’état du compte n’a pas pu être modifié." };
  }

  revalidatePath("/portail-cfc/settings/users");
  return { ok: true, message: active ? "Compte réactivé avec son affectation." : "Compte suspendu." };
}

/** Send an invite or recovery link to a staff member without exposing its address or token. */
export async function resetStaffPasswordAction(userId: string): Promise<AdminStaffActionResult> {
  if (!z.string().uuid().safeParse(userId).success) {
    return { ok: false, error: "Identifiant de compte invalide." };
  }

  const profile = await getServerProfile();
  if (!profile || !canManageUsers(profile.role, profile.capabilities)) {
    return { ok: false, error: "La gestion des comptes est réservée aux personnes habilitées." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error: listError } = await supabase.rpc("cfc_admin_list_staff");
  if (listError) return { ok: false, error: "Le compte sélectionné ne peut pas être chargé." };

  const row = (data ?? []).find((item: { id?: string }) => item.id === userId) as
    | { id: string; email: string; full_name: string | null; email_confirmed: boolean }
    | undefined;
  if (!row) return { ok: false, error: "Le compte sélectionné n’est plus disponible." };

  const type = row.email_confirmed ? "recovery" : "magiclink";
  const admin = getAdminClient();
  const generated = type === "recovery"
    ? await admin.auth.admin.generateLink({ type, email: row.email })
    : await admin.auth.admin.generateLink({ type, email: row.email });
  const tokenHash = generated.data?.properties?.hashed_token;
  if (generated.error || !tokenHash) {
    return { ok: false, error: "Le lien sécurisé n’a pas pu être produit." };
  }

  const fullName = row.full_name ?? row.email;
  const { prenom, nom } = greeting(fullName);
  const delivery = await sendTemplatedEmail({
    templateCode: row.email_confirmed ? "RESET_PASSWORD" : "STAFF_INVITATION",
    to: row.email,
    recipientUserId: row.id,
    actorId: profile.actorId,
    variables: {
      prenom,
      nom,
      lien: authLink(tokenHash, type),
      date: new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }),
      duree: "60 minutes",
      logo: `${getSiteUrl()}/images/logo-cfc.png`,
      siege: getSiteUrl(),
    },
    idempotencyKey: `${row.email_confirmed ? "STAFF_PASSWORD_RESET" : "STAFF_INVITATION"}:${row.id}:${randomUUID()}`,
  });

  revalidatePath("/portail-cfc/settings/users");
  return {
    ok: true,
    message: row.email_confirmed ? "Un lien de réinitialisation a été envoyé." : "Un lien d’activation a été envoyé.",
    ...deliveryFeedback(delivery),
  };
}
