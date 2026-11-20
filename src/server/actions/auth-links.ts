"use server";

/**
 * Les liens d'authentification, envoyés par la messagerie du CFC.
 *
 * La messagerie de la plateforme (Supabase Auth) a un **quota** : quelques
 * envois suffisent à le saturer, et le demandeur ne reçoit plus rien — ni
 * lien de connexion, ni réinitialisation, ni confirmation d'inscription.
 * C'est le premier motif d'« impossible de se connecter » en production.
 *
 * Le lien, lui, reste produit par la plateforme : c'est elle qui détient le
 * compte et le jeton. Seule l'**envoi** change de main — il passe par la
 * messagerie du CFC, qui n'a pas de quota.
 *
 * Le lien produit n'est jamais celui de la plateforme : c'est un lien vers
 * `/auth/confirm`, qui vérifie le jeton **sur place** et ouvre la session.
 * Aucune URL de retour n'a donc besoin d'être déclarée sur la plateforme —
 * et le même code fonctionne en local et en production.
 */

import { getAdminClient } from "@/server/supabase/admin";
import { getSiteUrl } from "@/server/env";
import { sendTemplatedEmail } from "@/server/email/send";

/**
 * Le genre de lien produit.
 *
 * `magiclink` et `recovery` suffisent : le lien magique **confirme aussi**
 * l'adresse d'un compte qui ne l'a pas encore été — le clic prouve que la
 * boîte est bien à lui. Le genre `signup` demanderait le mot de passe, que
 * l'application n'a pas au moment d'une demande de lien.
 */
type AuthLinkType = "magiclink" | "recovery";

export type AuthLinkResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * La réponse **générique**.
 *
 * Elle ne dit jamais si un compte existe : une réponse qui le dirait
 * permettrait de savoir qui est client de la banque.
 */
const GENERIC_MESSAGE =
  "Si un compte est associé à cette adresse, un message vient de lui être envoyé.";

/**
 * Produit un lien et l'envoie.
 *
 * Ne lève jamais : un échec de messagerie ne doit pas faire échouer la
 * demande — le demandeur reçoit un message d'attente, et le journal
 * des envois porte la cause.
 */
async function deliverLink(input: {
  email: string;
  type: AuthLinkType;
  templateCode: "MAGIC_LINK" | "RESET_PASSWORD";
  next: string;
  /** La page où le lien mène une fois le jeton vérifié. */
  landing: string;
}): Promise<AuthLinkResult> {
  const admin = getAdminClient();

  // L'API d'administration est **discriminée** : chaque genre de lien a sa
  // propre forme. On les appelle donc un par un, plutôt que de mentir sur le
  // type.
  const generated = await (async () => {
    switch (input.type) {
      case "recovery":
        return admin.auth.admin.generateLink({ type: "recovery", email: input.email });
      default:
        return admin.auth.admin.generateLink({ type: "magiclink", email: input.email });
    }
  })();

  const { data, error } = generated;

  if (error || !data.properties?.hashed_token) {
    console.error("[auth] lien indisponible :", error?.message ?? "jeton absent");
    return { ok: false, error: "Le lien n'a pas pu être produit. Réessayez dans un instant." };
  }

  const tokenHash = data.properties.hashed_token;
  const link = new URL("/auth/confirm", getSiteUrl());
  link.searchParams.set("token_hash", tokenHash);
  link.searchParams.set("type", input.type);
  link.searchParams.set("next", input.landing);

  const result = await sendTemplatedEmail({
    templateCode: input.templateCode,
    to: input.email,
    variables: {
      lien: link.toString(),
      date: new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }),
      duree: "60 minutes",
      prenom: "Emprunteur",
      nom: "CFC",
      email: input.email,
    },
    // Chaque lien produit est unique : une redemande envoie un nouveau
    // message, un doublon d'envoi du même lien n'en envoie pas.
    idempotencyKey: `${input.templateCode}:${input.email}:${tokenHash.slice(0, 12)}`,
  });

  if (result.status === "failed") {
    console.error("[auth] envoi impossible :", result.error);
    return {
      ok: false,
      error:
        "Le message n'a pas pu être envoyé. Vérifiez votre adresse ou contactez votre agence.",
    };
  }

  if (result.status !== "sent") {
    // `skipped` : aucune messagerie configurée. La demande est prise en
    // compte, mais rien ne partira — il faut le dire.
    console.warn("[auth] envoi ignore :", result.error);
  }

  return { ok: true, message: GENERIC_MESSAGE };
}

/** Demande un lien de connexion. */
export async function requestMagicLinkAction(email: string): Promise<AuthLinkResult> {
  const address = email.trim().toLowerCase();
  if (!address.includes("@")) {
    return { ok: false, error: "Adresse e-mail invalide." };
  }

  return deliverLink({
    email: address,
    type: "magiclink",
    templateCode: "MAGIC_LINK",
    next: "/portail-client",
    landing: "/portail-client",
  });
}

/** Demande un lien de réinitialisation du mot de passe. */
export async function requestPasswordResetAction(email: string): Promise<AuthLinkResult> {
  const address = email.trim().toLowerCase();
  if (!address.includes("@")) {
    return { ok: false, error: "Adresse e-mail invalide." };
  }

  return deliverLink({
    email: address,
    type: "recovery",
    templateCode: "RESET_PASSWORD",
    next: "/login/reset-password",
    landing: "/login/reset-password",
  });
}

/**
 * Renvoie le lien de confirmation d'inscription.
 *
 * Le compte existe déjà — il a été ouvert par `/inscription` — mais son
 * adresse n'est pas confirmée : le lien est la preuve.
 */
export async function requestAccountConfirmationAction(
  email: string,
): Promise<AuthLinkResult> {
  const address = email.trim().toLowerCase();
  if (!address.includes("@")) {
    return { ok: false, error: "Adresse e-mail invalide." };
  }

  return deliverLink({
    email: address,
    type: "magiclink",
    templateCode: "MAGIC_LINK",
    next: "/onboarding",
    landing: "/onboarding",
  });
}
