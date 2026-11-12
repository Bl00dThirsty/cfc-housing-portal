/**
 * Émission des notifications.
 *
 * Un événement important produit **deux** traces :
 *
 * 1. une ligne dans `public.notifications` — le signal in-app, ce que
 *    l'acteur voit sans ouvrir sa boîte mail ;
 * 2. un envoi par courriel, via la chaîne d'e-mail existante.
 *
 * L'écriture se fait par le rôle de service : la RLS ne doit pas devenir
 * le mécanisme d'autorisation d'une notification addressed à quelqu'un
 * d'autre. L'action serveur qui appelle ce module est, elle, gardée par la
 * capacité.
 *
 * Ce module est le **seul** endroit qui décrit ce qu'un événement métier
 * signifie pour l'acteur : `DOMAIN_EVENT_NOTIFICATIONS` en donne le type et
 * le titre affichés. Le modèle d'e-mail reste la propriété du module e-mail
 * (`DOMAIN_EVENT_TEMPLATES`) : les deux catalogues répondent à deux questions
 * distinctes — « quoi afficher » et « quel courriel envoyer » — et le
 * dispatch ci-dessous les rapproche sans les dupliquer.
 */

import "server-only";

import { getSiteUrl } from "@/server/env";
import { eventLabel } from "@/domain/entities/processes";
import { getAdminClient } from "@/server/supabase/admin";
import {
  DOMAIN_EVENT_TEMPLATES,
  formatDate,
  notifyDomainEvent,
  splitName,
  type DomainEventEnvelope,
} from "@/server/email/events";
import { sendTemplatedEmail } from "@/server/email/send";

export type NotificationType =
  | "kyc.decision"
  | "document.requested"
  | "document.validated"
  | "document.uploaded"
  | "committee.decision"
  | "loan.offer"
  | "disbursement.released"
  | "payoff.statement"
  | "mainlevee.ready"
  | "support.message"
  | "dossier.updated";

export interface NotifyInput {
  /** Destinataire. */
  recipientUserId: string;
  /** Adresse du destinataire — résolue si absente. */
  recipientEmail?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  dossierId?: string | null;
  /** Lien proposé à l'utilisateur (« Ouvrir mon dossier »). */
  actionUrl?: string | null;
  /** Événement métier à traduire en courriel, si la notification en mérite un. */
  email?: { eventType: string; payload?: Record<string, unknown> } | null;
}

/**
 * Ce qu'un événement métier produit comme signal in-app.
 *
 * Le **titre** n'est pas décidé ici : c'est le libellé du domaine
 * (`eventLabel`), le même que celui de la chronologie de l'emprunteur. Ce
 * module n'ajoute que le **type** de notification — donc le traitement visuel
 * de la cloche — et la précision affichée sous le titre.
 */
export interface NotificationSignal {
  type: NotificationType;
  body?: string;
}

/**
 * Catalogue des événements métier notifiés.
 *
 * Les clés sont les **types d'événements** écrits dans `public.dossier_events`
 * — le journal qui fait foi. Un événement absent de ce catalogue ne produit
 * aucune notification : c'est volontaire, le journal peut porter des faits
 * purement techniques (`kyc.state_changed` brut) qui n'ont pas à déranger
 * l'acteur.
 */
export const DOMAIN_EVENT_NOTIFICATIONS: Record<string, NotificationSignal> = {
  KYC_SUBMITTED: {
    type: "dossier.updated",
    body: "Un conseiller examine votre dossier. Vous serez notifié de la décision.",
  },
  KYC_APPROVED: {
    type: "kyc.decision",
    body: "Votre dossier d'identité a été validé : vous pouvez poursuivre votre demande.",
  },
  KYC_REJECTED: {
    type: "kyc.decision",
    body: "Un conseiller vous recontacte pour régulariser votre dossier.",
  },
  DOCUMENT_REQUESTED: {
    type: "document.requested",
    body: "Déposez la pièce depuis votre espace emprunteur pour faire avancer votre dossier.",
  },
  DOCUMENT_VALIDATED: {
    type: "document.validated",
    body: "Votre dossier progresse : cette pièce est définitivement retenue.",
  },
  DOCUMENT_UPLOADED: {
    type: "document.uploaded",
    body: "Une pièce justificative attend maintenant la vérification de votre conseiller.",
  },
  COMMITTEE_DECISION: {
    type: "committee.decision",
    body: "Le comité de crédit a rendu sa décision sur votre dossier.",
  },
  LOAN_OFFER_ISSUED: {
    type: "loan.offer",
    body: "L'offre de prêt est consultable dans votre espace emprunteur.",
  },
  DISBURSEMENT_RELEASED: {
    type: "disbursement.released",
    body: "Le montant de votre prêt a été décaissé.",
  },
  PAYOFF_STATEMENT: {
    type: "payoff.statement",
    body: "Le décompte de solde de votre prêt est consultable dans votre espace.",
  },
  MAINLEVEE_READY: {
    type: "mainlevee.ready",
    body: "La mainlevée est prête et consultable dans votre espace emprunteur.",
  },
  DOSSIER_UPDATED: {
    type: "dossier.updated",
    body: "Votre dossier a progressé : consultez les pièces restantes.",
  },
};

/**
 * Notifie un acteur et, le cas échéant, l'envoie par courriel.
 *
 * Ne lève jamais : un échec de notification ne doit pas faire échouer
 * l'action métier qui l'a déclenchée. Le journal `public.dossier_events`
 * reste, lui, la preuve de l'événement.
 */
export async function notify(input: NotifyInput): Promise<boolean> {
  try {
    const admin = getAdminClient();

    const { error } = await admin.from("notifications").insert({
      recipient_user_id: input.recipientUserId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      dossier_id: input.dossierId ?? null,
      action_url: input.actionUrl ?? null,
    });

    if (error) {
      console.error("[notifications] écriture refusée :", error.message);
      return false;
    }

    if (input.email) {
      // Le courriel est un canal **complémentaire** : son échec ne doit pas
      // faire perdre la notification in-app, qui est déjà écrite.
      try {
        await notifyDomainEvent({
          eventType: input.email.eventType,
          dossierId: input.dossierId ?? null,
          citizenId: input.recipientUserId,
          recipientEmail: input.recipientEmail ?? null,
          payload: input.email.payload ?? {},
        });
      } catch (error) {
        console.error("[notifications] envoi du courriel impossible :", error);
      }
    }

    return true;
  } catch (error) {
    console.error("[notifications] échec :", error);
    return false;
  }
}

/** Fait métier à traduire en signal. */
export interface BusinessEventInput {
  /** Type d'événement métier (`KYC_APPROVED`, `DOCUMENT_UPLOADED`, …). */
  eventType: string;
  /** Dossier concerné, s'il y en a un. */
  dossierId?: string | null;
  /** Destinataire explicite ; à défaut, le citoyen du dossier. */
  recipientUserId?: string | null;
  /** Adresse du destinataire — résolue si absente. */
  recipientEmail?: string | null;
  /** Détails du fait métier (nom de pièce, motif, montant…). */
  payload?: Record<string, unknown>;
  /** Précision affichée, si le catalogue n'en fournit pas. */
  body?: string | null;
  /** Lien proposé à l'utilisateur ; par défaut, son espace. */
  actionUrl?: string | null;
}

/**
 * Résout le citoyen d'un dossier.
 *
 * `dossiers.citizen_id` référence `public.actors`, dont `id` est
 * l'identifiant du compte `auth.users` : c'est donc bien l'identifiant
 * attendu par `notifications.recipient_user_id`.
 */
async function resolveDossierCitizen(dossierId: string): Promise<string | null> {
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from("dossiers")
      .select("citizen_id")
      .eq("id", dossierId)
      .is("deleted_at", null)
      .maybeSingle();

    return (data?.citizen_id as string | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Traduit un fait métier en signal adressé.
 *
 * C'est le **point d'entrée unique** du produit : toute action serveur qui
 * produit un fait important appelle cette fonction, et la notification in-app
 * comme le courriel en découlent. Les deux canaux partagent le même
 * destinataire, le même dossier et la même charge utile.
 *
 * Ne lève jamais : l'action métier ne doit pas échouer parce qu'une
 * notification n'a pas pu être écrite.
 */
export async function notifyBusinessEvent(input: BusinessEventInput): Promise<boolean> {
  try {
    const signal = DOMAIN_EVENT_NOTIFICATIONS[input.eventType];
    if (!signal) return false;

    const dossierId = input.dossierId ?? null;
    const recipientUserId =
      input.recipientUserId ?? (dossierId ? await resolveDossierCitizen(dossierId) : null);
    if (!recipientUserId) return false;

    const hasEmail = Boolean(DOMAIN_EVENT_TEMPLATES[input.eventType]);

    return await notify({
      recipientUserId,
      recipientEmail: input.recipientEmail ?? null,
      type: signal.type,
      title: eventLabel(input.eventType),
      body: input.body ?? signal.body ?? null,
      dossierId,
      // Lien **relatif** : la cloche le rend par un `Link` Next.js.
      actionUrl: input.actionUrl ?? (dossierId ? "/portail-client" : null),
      email: hasEmail
        ? { eventType: input.eventType, payload: input.payload ?? {} }
        : null,
    });
  } catch (error) {
    console.error("[notifications] dispatch impossible :", error);
    return false;
  }
}

/**
 * Traite une enveloppe d'événement reçue du relais base de données.
 *
 * Deux sources sont comprises :
 * - `citizen_profiles` : création d'un profil → message de bienvenue (par
 *   courriel seulement : le compte vient d'être créé, l'espace n'est pas
 *   encore ouvert) ;
 * - `dossier_events` : fait métier daté → notification in-app et courriel.
 */
export async function handleBusinessEventEnvelope(
  envelope: DomainEventEnvelope,
): Promise<{ notified: boolean; emailed: boolean }> {
  const row = envelope.row ?? {};
  const source = envelope.source ?? "";

  if (source === "citizen_profiles") {
    const citizenId = typeof row.id === "string" ? row.id : null;
    const email = typeof row.email === "string" ? row.email : null;
    const fullName = typeof row.full_name === "string" ? row.full_name : null;

    if (!email) return { notified: false, emailed: false };

    const { prenom, nom } = splitName(fullName);
    await sendTemplatedEmail({
      templateCode: DOMAIN_EVENT_TEMPLATES.PROFILE_CREATED,
      to: email,
      recipientUserId: citizenId,
      variables: {
        prenom,
        nom,
        email,
        date: formatDate(new Date()),
        lien: `${getSiteUrl()}/portail-client`,
      },
      idempotencyKey: `PROFILE_CREATED:${citizenId ?? email}`,
    });

    return { notified: false, emailed: true };
  }

  const eventType =
    envelope.event_type ?? (typeof row.event_type === "string" ? row.event_type : "");
  if (!eventType) return { notified: false, emailed: false };

  const dossierId =
    typeof row.dossier_id === "string"
      ? row.dossier_id
      : typeof row.dossierId === "string"
        ? row.dossierId
        : null;

  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};

  const notified = await notifyBusinessEvent({ eventType, dossierId, payload });

  return { notified, emailed: notified };
}
