"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isValidCniNumber } from "@/domain/entities/kyc-profile";
import { toE164 } from "@/domain/entities/phone";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";
import { getSiteUrl } from "@/server/env";
import { sendTemplatedEmail, type SendEmailResult } from "@/server/email/send";
import { getAdminClient } from "@/server/supabase/admin";
import { createServerSupabaseClient } from "@/server/supabase/server";

const intakeSchema = z.object({
  fullName: z.string().trim().min(3).max(160),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(5).max(40),
  cni: z.string().trim().min(6).max(12).refine(isValidCniNumber),
  city: z.string().trim().max(120).default(""),
  region: z.string().trim().max(120).default(""),
  affiliationStatus: z.enum(["first_time", "other_bank", "cfc_existing", "non_resident"]),
  isDiaspora: z.boolean().default(false),
});

export type StaffIntakeActionResult =
  | {
      ok: true;
      dossierId: string;
      dossierCode: string;
      advisor: string | null;
      invited: boolean;
      reused: boolean;
      deliveryStatus?: SendEmailResult["status"];
      warning?: string;
    }
  | { ok: false; error: string };

function authLink(tokenHash: string): string {
  const url = new URL("/auth/confirm", getSiteUrl());
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "invite");
  url.searchParams.set("next", "/login/reset-password");
  return url.toString();
}

function nameParts(fullName: string): { prenom: string; nom: string } {
  const [prenom = "", ...rest] = fullName.trim().split(/\s+/);
  return { prenom, nom: rest.join(" ") };
}

function rpcErrorMessage(message: string): string {
  if (message.includes("staff_intake_forbidden")) {
    return "La création de demandes est réservée aux membres du personnel habilités.";
  }
  if (message.includes("borrower_region_required")) {
    return "Renseignez une région de résidence pour orienter la demande.";
  }
  if (message.includes("borrower_region_unroutable") || message.includes("no_active_regional_manager")) {
    return "Aucune agence avec gestionnaire actif ne couvre cette région. Demandez à l’administration de configurer le routage.";
  }
  if (message.includes("staff_intake_borrower_not_found") || message.includes("staff_intake_profile_required")) {
    return "Le profil emprunteur n’est pas disponible pour cette demande.";
  }
  if (message.includes("duplicate key") || message.includes("citizen_profiles_active_cni_key")) {
    return "Un profil existe déjà avec ce numéro de CNI. Recherchez l’adresse e-mail du client avant de recommencer.";
  }
  return "La demande n’a pas pu être créée. Vérifiez les informations et réessayez.";
}

function deliveryWarning(status: SendEmailResult["status"]): string | undefined {
  if (status === "sent") return undefined;
  if (status === "skipped") {
    return "Le compte et le DUC sont prêts, mais le relais SMTP n’a pas envoyé l’invitation. Renvoyez le lien après configuration du relais.";
  }
  return "Le compte et le DUC sont prêts, mais l’invitation n’a pas été distribuée. Consultez le journal des e-mails puis renvoyez le lien.";
}

/** Creates or reuses a borrower profile and opens a regionally assigned DUC. */
export async function createStaffIntakeAction(input: unknown): Promise<StaffIntakeActionResult> {
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Vérifiez le nom, l’e-mail, le téléphone, la CNI et la région." };
  }

  const phone = toE164(parsed.data.phone);
  if (!phone) return { ok: false, error: "Renseignez un numéro de téléphone valide." };
  const isDiaspora = parsed.data.isDiaspora || parsed.data.affiliationStatus === "non_resident";
  if (!isDiaspora && !parsed.data.region) {
    return { ok: false, error: "Sélectionnez une région de résidence." };
  }

  const staff = await getServerProfile();
  if (!staff || !hasCapability(staff.role, "dossier:create", staff.capabilities)) {
    return { ok: false, error: "La création de demandes est réservée aux membres du personnel habilités." };
  }

  const { fullName, email, cni, city, region, affiliationStatus } = parsed.data;
  const admin = getAdminClient();
  const { data: existingProfile, error: lookupError } = await admin
    .from("citizen_profiles")
    .select("id, full_name, email, phone, cni_raw, city, region, is_diaspora, deleted_at")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: "Le compte existant n’a pas pu être vérifié. Réessayez." };
  }

  let borrowerId: string;
  let invited = false;
  let tokenHash: string | null = null;
  if (existingProfile?.id) {
    const storedCni = typeof existingProfile.cni_raw === "string"
      ? existingProfile.cni_raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
      : "";
    const enteredCni = cni.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (storedCni && storedCni !== enteredCni) {
      return { ok: false, error: "Cette adresse e-mail est déjà associée à un autre numéro de CNI. Vérifiez l’identité du client." };
    }

    const { data: actor, error: actorError } = await admin
      .from("actors")
      .select("actor_type, deleted_at")
      .eq("id", existingProfile.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (actorError || actor?.actor_type !== "citizen") {
      return { ok: false, error: "Cette adresse e-mail est déjà rattachée à un autre type de compte." };
    }
    borrowerId = existingProfile.id;
  } else {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { actor_type: "citizen", full_name: fullName } },
    });
    borrowerId = data?.user?.id ?? "";
    tokenHash = data?.properties?.hashed_token ?? null;
    if (error || !borrowerId || !tokenHash) {
      if (borrowerId) await admin.auth.admin.deleteUser(borrowerId);
      return { ok: false, error: "Le compte emprunteur n’a pas pu être invité. Vérifiez l’adresse e-mail." };
    }

    const { error: profileError } = await admin.from("citizen_profiles").insert({
      id: borrowerId,
      full_name: fullName,
      email,
      phone,
      cni_raw: cni.toUpperCase(),
      city: city || null,
      region: isDiaspora ? null : region,
      affiliation_status: affiliationStatus,
      is_diaspora: isDiaspora,
      kyc_state: "identity_capture",
      created_by: staff.actorId,
      updated_by: staff.actorId,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(borrowerId);
      return { ok: false, error: rpcErrorMessage(profileError.message) };
    }
    invited = true;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error: rpcError } = await supabase.rpc("cfc_create_staff_intake", {
    p_borrower_id: borrowerId,
  });
  if (rpcError) {
    if (invited) await admin.auth.admin.deleteUser(borrowerId);
    return { ok: false, error: rpcErrorMessage(rpcError.message) };
  }

  const result = (Array.isArray(data) ? data[0] : data) as {
    dossier_id?: string;
    duc_code?: string;
    advisor?: string | null;
    reused?: boolean;
  } | null;
  if (!result?.dossier_id || !result.duc_code) {
    return { ok: false, error: "La demande a été enregistrée, mais son numéro DUC n’a pas pu être relu." };
  }

  let deliveryStatus: SendEmailResult["status"] | undefined;
  let warning: string | undefined;
  if (invited && tokenHash) {
    const { prenom, nom } = nameParts(fullName);
    const delivery = await sendTemplatedEmail({
      templateCode: "BORROWER_INVITATION",
      to: email,
      recipientUserId: borrowerId,
      actorId: staff.actorId,
      variables: {
        prenom,
        nom,
        duc: result.duc_code,
        reference: result.duc_code,
        lien: authLink(tokenHash),
        date: new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }),
        duree: "60 minutes",
        logo: `${getSiteUrl()}/images/logo-cfc.png`,
        siege: getSiteUrl(),
      },
      idempotencyKey: `BORROWER_INVITATION:${borrowerId}:${randomUUID()}`,
    });
    deliveryStatus = delivery.status;
    warning = deliveryWarning(delivery.status);
  }

  revalidatePath("/portail-cfc/clients");
  revalidatePath(`/portail-cfc/dossiers/${result.dossier_id}`);
  return {
    ok: true,
    dossierId: result.dossier_id,
    dossierCode: result.duc_code,
    advisor: result.advisor ?? null,
    invited,
    reused: result.reused === true,
    deliveryStatus,
    warning,
  };
}
