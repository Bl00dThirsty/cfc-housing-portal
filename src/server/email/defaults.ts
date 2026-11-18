/**
 * Modèles d'e-mail **par défaut**, embarqués dans le code.
 *
 * Rôle : garantir que le service d'e-mail dispose d'un modèle même si le
 * catalogue `ref.email_template` est vide, indisponible ou en cours de
 * rechargement. Le modèle embarqué est volontairement plus sobre que le
 * modèle publié en base (celui-ci porte l'identité visuelle complète) : il
 * doit être **exploitable**, pas un simple décor.
 *
 * Ce module est **pur** : aucun accès base, aucun accès réseau.
 */

import type { EmailAudience, EmailTemplateContent } from "./types";

/** Définition d'un modèle par défaut. */
export interface EmailTemplateDefinition {
  code: string;
  label: string;
  eventType: string;
  audience: EmailAudience;
  variables: string[];
  subject: string;
  html: string;
  text: string;
}

/**
 * L'identité visuelle du CFC dans un courriel.
 *
 * Les couleurs sont celles de la marque — brun `#7b2e15`, or `#e59819` — et
 * non celles d'un gabarit générique : un message du CFC doit ressembler à
 * un message du CFC, avant même qu'on lise le logo.
 *
 * Le logo est une **variable** (`{{logo}}`) : le gabarit ne connaît pas
 * l'adresse du portail, c'est l'envoi qui la donne. C'est ce qui permet au
 * même gabarit de servir la production et la démonstration.
 */
const CFC = {
  brown: "#7b2e15",
  darkBrown: "#5c220f",
  gold: "#e59819",
  page: "#f6f1ea",
  card: "#ffffff",
  border: "#e8ded2",
  text: "#3f2d22",
  muted: "#7a6a5e",
  soft: "#faf7f3",
} as const;

/** Enveloppe HTML minimale, en styles en ligne (les clients e-mail ignorent `<style>`). */
function wrapHtml(title: string, body: string): string {
  return [
    `<div style="margin:0;padding:0;background-color:${CFC.page};font-family:Arial,Helvetica,sans-serif;color:${CFC.text};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CFC.page};padding:28px 12px;">`,
    '<tr><td align="center">',
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${CFC.card};border-radius:10px;overflow:hidden;border:1px solid ${CFC.border};">`,
    // L'entête porte le logo : c'est la signature de la banque.
    `<tr><td style="background-color:${CFC.card};padding:22px 28px;border-bottom:3px solid ${CFC.gold};">`,
    '<img src="{{logo}}" alt="Crédit Foncier du Cameroun" width="190" style="display:block;border:0;height:auto;width:190px;max-width:190px;" />',
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${CFC.brown};padding-top:8px;letter-spacing:0.3px;">CFC Habitat — Épargne, Crédit Foncier et Garanties</div>`,
    "</td></tr>",
    `<tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:${CFC.text};">`,
    `<p style="margin:0 0 16px 0;font-size:17px;font-weight:bold;color:${CFC.brown};">${title}</p>`,
    body,
    "</td></tr>",
    `<tr><td style="background-color:${CFC.soft};border-top:1px solid ${CFC.border};padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:${CFC.muted};">`,
    `<strong style="color:${CFC.brown};">Crédit Foncier du Cameroun</strong> — Direction Générale · Yaoundé, Cameroun<br />`,
    "Ce message est généré automatiquement : merci de ne pas y répondre directement.",
    "<br />Pour toute question, rapprochez-vous de votre agence CFC ou de votre conseiller au Guichet Unique.",
    `<br /><a href="{{siege}}" style="color:${CFC.brown};">{{siege}}</a>`,
    "</td></tr>",
    "</table>",
    "</td></tr>",
    "</table>",
    "</div>",
  ].join("");
}

/** Bloc « bouton » d'appel à l'action. */
function cta(label: string, href: string): string {
  return [
    `<p style="margin:24px 0 8px 0;"><a href="${href}" style="display:inline-block;background-color:${CFC.gold};color:${CFC.darkBrown};text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;font-size:14px;">${label}</a></p>`,
    `<p style="margin:0;font-size:12px;color:${CFC.muted};word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />${href}</p>`,
  ].join("");
}

/** Modèles par défaut, indexés par code métier. */
export const DEFAULT_EMAIL_TEMPLATES: Record<string, EmailTemplateDefinition> = {
  WELCOME: {
    code: "WELCOME",
    label: "Bienvenue — création de compte",
    eventType: "PROFILE_CREATED",
    audience: "citizen",
    variables: ["prenom", "nom", "email", "lien", "date", "logo", "siege"],
    subject: "Bienvenue chez CFC Habitat, {{prenom}}",
    html: wrapHtml(
      "Bienvenue chez CFC Habitat",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Votre compte citoyen a bien été créé. Vous pouvez désormais déposer votre dossier de crédit et suivre son avancement depuis le portail.</p>",
        cta("Accéder à mon portail", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Votre compte citoyen CFC a bien été créé. Vous pouvez désormais déposer votre dossier de crédit et suivre son avancement depuis le portail.",
      "",
      "Accéder à mon portail : {{lien}}",
      "",
      "Cordialement,",
      "Crédit Foncier du Cameroun — Direction Générale",
    ].join("\n"),
  },

  MAGIC_LINK: {
    code: "MAGIC_LINK",
    label: "Lien de connexion magic",
    eventType: "MAGIC_LINK_REQUESTED",
    audience: "citizen",
    variables: ["lien", "date", "duree", "logo", "siege"],
    subject: "Votre lien de connexion CFC Habitat",
    html: wrapHtml(
      "Votre lien de connexion",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour,</p>",
        "<p style=\"margin:0 0 12px 0;\">Vous avez demandé un lien de connexion sans mot de passe. Ce lien est valable {{duree}} et ne peut être utilisé qu'une seule fois.</p>",
        cta("Se connecter", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour,",
      "",
      "Voici votre lien de connexion CFC Habitat. Il est valable {{duree}} et ne peut être utilisé qu'une fois.",
      "",
      "Se connecter : {{lien}}",
      "",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
    ].join("\n"),
  },

  RESET_PASSWORD: {
    code: "RESET_PASSWORD",
    label: "Réinitialisation du mot de passe",
    eventType: "PASSWORD_RESET_REQUESTED",
    audience: "citizen",
    variables: ["lien", "date", "duree", "logo", "siege"],
    subject: "Réinitialisation de votre mot de passe CFC Habitat",
    html: wrapHtml(
      "Réinitialisation de votre mot de passe",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour,</p>",
        "<p style=\"margin:0 0 12px 0;\">Une réinitialisation de mot de passe a été demandée pour votre compte. Le lien ci-dessous est à usage unique et expire au bout de {{duree}}.</p>",
        cta("Choisir un nouveau mot de passe", "{{lien}}"),
        "<p style=\"margin:16px 0 0 0;font-size:12px;color:#6b7280;\">Si vous n'êtes pas à l'origine de cette demande, aucune action n'est requise et votre mot de passe actuel reste valable.</p>",
      ].join(""),
    ),
    text: [
      "Bonjour,",
      "",
      "Une réinitialisation de mot de passe a été demandée pour votre compte. Le lien ci-dessous est à usage unique et expire au bout de {{duree}}.",
      "",
      "Choisir un nouveau mot de passe : {{lien}}",
      "",
      "Si vous n'êtes pas à l'origine de cette demande, aucune action n'est requise.",
    ].join("\n"),
  },

  /**
   * Le mot de passe vient d'être modifié.
   *
   * C'est le **CFC** qui prévient, et non la plateforme : la messagerie de la
   * plateforme a un quota, et son modèle n'est pas celui de la banque. Un
   * avis de sécurité doit dire d'où il vient.
   */
  PASSWORD_CHANGED: {
    code: "PASSWORD_CHANGED",
    label: "Modification du mot de passe",
    eventType: "PASSWORD_CHANGED",
    audience: "citizen",
    variables: ["prenom", "nom", "email", "date", "lien", "logo", "siege"],
    subject: "Votre mot de passe a été modifié — CFC Habitat",
    html: wrapHtml(
      "Votre mot de passe a été modifié",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le mot de passe de votre compte CFC Habitat ({{email}}) a été modifié le {{date}}. Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement votre agence : votre compte doit être sécurisé.</p>",
        cta("Ouvrir mon portail", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Le mot de passe de votre compte CFC Habitat ({{email}}) a été modifié le {{date}}. Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement votre agence.",
      "",
      "Ouvrir mon portail : {{lien}}",
    ].join("\n"),
  },

  KYC_SUBMITTED: {
    code: "KYC_SUBMITTED",
    label: "Dépôt du dossier KYC",
    eventType: "KYC_SUBMITTED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien", "logo", "siege"],
    subject: "Votre dossier KYC a bien été reçu — {{reference}}",
    html: wrapHtml(
      "Votre dossier KYC a bien été reçu",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Nous avons bien enregistré votre dossier d'identité (référence {{reference}}, DUC {{duc}}) le {{date}}. Un conseiller du Guichet Unique va vérifier vos pièces.</p>",
        cta("Suivre mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Nous avons bien enregistré votre dossier d'identité (référence {{reference}}, DUC {{duc}}) le {{date}}. Un conseiller du Guichet Unique va vérifier vos pièces.",
      "",
      "Suivre mon dossier : {{lien}}",
    ].join("\n"),
  },

  KYC_APPROVED: {
    code: "KYC_APPROVED",
    label: "KYC approuvé",
    eventType: "KYC_APPROVED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien", "logo", "siege"],
    subject: "Votre dossier KYC est approuvé — {{reference}}",
    html: wrapHtml(
      "Votre dossier KYC est approuvé",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Votre dossier d'identité (référence {{reference}}, DUC {{duc}}) a été approuvé le {{date}}. Vous pouvez poursuivre votre demande de crédit.</p>",
        cta("Continuer ma demande", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Votre dossier d'identité (référence {{reference}}, DUC {{duc}}) a été approuvé le {{date}}. Vous pouvez poursuivre votre demande de crédit.",
      "",
      "Continuer ma demande : {{lien}}",
    ].join("\n"),
  },

  KYC_REJECTED: {
    code: "KYC_REJECTED",
    label: "KYC refusé",
    eventType: "KYC_REJECTED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "motif", "lien", "logo", "siege"],
    subject: "Votre dossier KYC nécessite des corrections — {{reference}}",
    html: wrapHtml(
      "Votre dossier KYC nécessite des corrections",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Votre dossier d'identité (référence {{reference}}, DUC {{duc}}) n'a pas pu être validé le {{date}}.</p>",
        "<p style=\"margin:0 0 12px 0;\"><strong>Motif :</strong> {{motif}}</p>",
        cta("Corriger mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Votre dossier d'identité (référence {{reference}}, DUC {{duc}}) n'a pas pu être validé le {{date}}.",
      "",
      "Motif : {{motif}}",
      "",
      "Corriger mon dossier : {{lien}}",
    ].join("\n"),
  },

  APPLICATION_SUBMITTED: {
    code: "APPLICATION_SUBMITTED",
    label: "Transmission du dossier au conseiller",
    eventType: "APPLICATION_SUBMITTED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "conseiller", "date", "lien", "logo", "siege"],
    subject: "Votre dossier est transmis au conseiller — {{reference}}",
    html: wrapHtml(
      "Votre dossier est transmis",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Votre dossier (référence {{reference}}, DUC {{duc}}) a été transmis à {{conseiller}} le {{date}}. Il instruit désormais votre demande.</p>",
        "<p style=\"margin:0 0 12px 0;\">Vous pouvez suivre l'avancement et échanger avec lui depuis votre espace.</p>",
        cta("Suivre mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Votre dossier (référence {{reference}}, DUC {{duc}}) a été transmis à {{conseiller}} le {{date}}. Il instruit désormais votre demande.",
      "",
      "Suivre mon dossier : {{lien}}",
    ].join("\n"),
  },

  APPLICATION_SUSPENDED: {
    code: "APPLICATION_SUSPENDED",
    label: "Dossier en attente d'orientation",
    eventType: "APPLICATION_SUSPENDED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "conseiller", "date", "lien", "logo", "siege"],
    subject: "Votre dossier attend l'orientation de votre conseiller — {{reference}}",
    html: wrapHtml(
      "Votre dossier attend votre conseiller",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Pour ce service, il faut être client du Crédit Foncier du Cameroun depuis au moins six mois — donc avoir tenu un carnet d'épargne logement. Votre dossier (référence {{reference}}, DUC {{duc}}) n'est pas perdu : il a été transmis à {{conseiller}} le {{date}}, qui vous recontactera pour vous orienter.</p>",
        cta("Suivre mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Pour ce service, il faut être client du Crédit Foncier du Cameroun depuis au moins six mois — donc avoir tenu un carnet d'épargne logement. Votre dossier (référence {{reference}}, DUC {{duc}}) n'est pas perdu : il a été transmis à {{conseiller}} le {{date}}, qui vous recontactera pour vous orienter.",
      "",
      "Suivre mon dossier : {{lien}}",
    ].join("\n"),
  },

  DOCUMENTS_READY: {
    code: "DOCUMENTS_READY",
    label: "Dépôt des pièces ouvert",
    eventType: "DOCUMENTS_READY",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien", "logo", "siege"],
    subject: "Votre dossier est prêt pour le dépôt des pièces — {{reference}}",
    html: wrapHtml(
      "Votre dossier est prêt pour le dépôt des pièces",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Votre dossier (référence {{reference}}, DUC {{duc}}) est prêt pour le dépôt de vos pièces justificatives. Vous pouvez les transmettre depuis votre espace CFC Habitat.</p>",
        cta("Déposer mes pièces", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Votre dossier (référence {{reference}}, DUC {{duc}}) est prêt pour le dépôt de vos pièces justificatives. Vous pouvez les transmettre depuis votre espace CFC Habitat.",
      "",
      "Déposer mes pièces : {{lien}}",
    ].join("\n"),
  },

  DUC_ACTIVATED: {
    code: "DUC_ACTIVATED",
    label: "Dossier activé",
    eventType: "DUC_ACTIVATED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "conseiller", "date", "lien", "logo", "siege"],
    subject: "Votre dossier est activé — vous pouvez demander un prêt — {{reference}}",
    html: wrapHtml(
      "Votre dossier est activé",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Votre dossier (référence {{reference}}, DUC {{duc}}) a été activé le {{date}} par {{conseiller}}. Vous êtes désormais client du CFC : vous pouvez commencer votre demande de prêt et constituer votre épargne logement.</p>",
        cta("Commencer ma demande de prêt", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Votre dossier (référence {{reference}}, DUC {{duc}}) a été activé le {{date}} par {{conseiller}}. Vous êtes désormais client du CFC : vous pouvez commencer votre demande de prêt et constituer votre épargne logement.",
      "",
      "Commencer ma demande de prêt : {{lien}}",
    ].join("\n"),
  },

  DUC_REFUSED: {
    code: "DUC_REFUSED",
    label: "Éligibilité refusée",
    eventType: "DUC_REFUSED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "conseiller", "motif", "date", "lien", "logo", "siege"],
    subject: "Votre dossier ne peut pas être activé pour l'instant — {{reference}}",
    html: wrapHtml(
      "Votre dossier n'est pas encore activé",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Après examen de votre dossier (référence {{reference}}, DUC {{duc}}) le {{date}}, {{conseiller}} ne peut pas encore l'activer.</p>",
        "<p style=\"margin:0 0 12px 0;\"><strong>Motif :</strong> {{motif}}</p>",
        "<p style=\"margin:0 0 12px 0;\">Il vous recontactera pour lever les points bloquants. Vous pouvez dès à présent lui écrire depuis votre espace.</p>",
        cta("Voir mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Après examen de votre dossier (référence {{reference}}, DUC {{duc}}) le {{date}}, {{conseiller}} ne peut pas encore l'activer.",
      "",
      "Motif : {{motif}}",
      "",
      "Il vous recontactera pour lever les points bloquants.",
      "",
      "Voir mon dossier : {{lien}}",
    ].join("\n"),
  },

  DOCUMENT_REQUESTED: {
    code: "DOCUMENT_REQUESTED",
    label: "Pièce justificative demandée",
    eventType: "DOCUMENT_REQUESTED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "document", "reference", "date", "lien", "logo", "siege"],
    subject: "Une pièce justificative vous est demandée — {{document}}",
    html: wrapHtml(
      "Une pièce justificative vous est demandée",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le service instructeur de la CFC a besoin de la pièce suivante pour instruire votre dossier (DUC {{duc}}, référence {{reference}}) :</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>{{document}}</strong></p>",
        "<p style=\"margin:0 0 12px 0;\">Merci de la déposer sur le portail.</p>",
        cta("Déposer la pièce", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Le service instructeur de la CFC a besoin de la pièce suivante pour votre dossier (DUC {{duc}}, référence {{reference}}) :",
      "",
      "{{document}}",
      "",
      "Merci de la déposer sur le portail.",
      "",
      "Déposer la pièce : {{lien}}",
    ].join("\n"),
  },

  DOCUMENT_UPLOADED: {
    code: "DOCUMENT_UPLOADED",
    label: "Pièce déposée au dossier",
    eventType: "DOCUMENT_UPLOADED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "document", "date", "lien", "logo", "siege"],
    subject: "Votre pièce a bien été reçue — {{reference}}",
    html: wrapHtml(
      "Votre pièce a bien été reçue",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">La pièce « {{document}} » a bien été déposée dans votre dossier (DUC {{duc}}, référence {{reference}}) le {{date}}. Un conseiller la vérifiera.</p>",
        cta("Suivre mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "La pièce « {{document}} » a bien été déposée dans votre dossier (DUC {{duc}}, référence {{reference}}) le {{date}}. Un conseiller la vérifiera.",
      "",
      "Suivre mon dossier : {{lien}}",
    ].join("\n"),
  },

  DOCUMENT_VALIDATED: {
    code: "DOCUMENT_VALIDATED",
    label: "Pièce justificative validée",
    eventType: "DOCUMENT_VALIDATED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "document", "reference", "date", "lien", "logo", "siege"],
    subject: "Votre pièce justificative est validée — {{document}}",
    html: wrapHtml(
      "Votre pièce justificative est validée",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">La pièce suivante a été vérifiée et définitivement retenue pour votre dossier (DUC {{duc}}, référence {{reference}}) :</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>{{document}}</strong></p>",
        cta("Consulter mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "La pièce suivante a été vérifiée et définitivement retenue pour votre dossier (DUC {{duc}}, référence {{reference}}) :",
      "",
      "{{document}}",
      "",
      "Consulter mon dossier : {{lien}}",
    ].join("\n"),
  },

  DOCUMENT_REJECTED: {
    code: "DOCUMENT_REJECTED",
    label: "Pièce justificative refusée",
    eventType: "DOCUMENT_REJECTED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "document", "reference", "motif", "date", "lien", "logo", "siege"],
    subject: "Une pièce justificative doit être refaite — {{document}}",
    html: wrapHtml(
      "Une pièce justificative doit être refaite",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">La pièce suivante n'a pas pu être retenue pour votre dossier (DUC {{duc}}, référence {{reference}}) :</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>{{document}}</strong><br /><strong>Motif :</strong> {{motif}}</p>",
        "<p style=\"margin:0 0 12px 0;\">Merci de la déposer à nouveau depuis votre portail.</p>",
        cta("Déposer la pièce", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "La pièce suivante n'a pas pu être retenue pour votre dossier (DUC {{duc}}, référence {{reference}}) :",
      "",
      "{{document}}",
      "",
      "Motif : {{motif}}",
      "",
      "Merci de la déposer à nouveau depuis votre portail.",
      "",
      "Déposer la pièce : {{lien}}",
    ].join("\n"),
  },

  COMMITTEE_DECISION: {
    code: "COMMITTEE_DECISION",
    label: "Décision de comité de crédit",
    eventType: "COMMITTEE_DECISION",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "decision", "montant", "date", "lien", "logo", "siege"],
    subject: "Décision du comité de crédit — {{decision}}",
    html: wrapHtml(
      "Décision du comité de crédit",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le comité de crédit s'est prononcé le {{date}} sur votre dossier (DUC {{duc}}, référence {{reference}}).</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>Décision :</strong> {{decision}}<br /><strong>Montant retenu :</strong> {{montant}}</p>",
        cta("Consulter mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Le comité de crédit s'est prononcé le {{date}} sur votre dossier (DUC {{duc}}, référence {{reference}}).",
      "",
      "Décision : {{decision}}",
      "Montant retenu : {{montant}}",
      "",
      "Consulter mon dossier : {{lien}}",
    ].join("\n"),
  },

  LOAN_OFFER_ISSUED: {
    code: "LOAN_OFFER_ISSUED",
    label: "Offre de prêt émise",
    eventType: "LOAN_OFFER_ISSUED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "montant", "taux", "echeance", "date", "lien", "logo", "siege"],
    subject: "Votre offre de prêt est disponible — {{montant}}",
    html: wrapHtml(
      "Votre offre de prêt est disponible",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Une offre de prêt a été émise le {{date}} pour votre dossier (DUC {{duc}}, référence {{reference}}).</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>Montant :</strong> {{montant}}<br /><strong>Taux :</strong> {{taux}}<br /><strong>Échéance mensuelle :</strong> {{echeance}}</p>",
        cta("Consulter mon offre de prêt", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Une offre de prêt a été émise le {{date}} pour votre dossier (DUC {{duc}}, référence {{reference}}).",
      "",
      "Montant : {{montant}}",
      "Taux : {{taux}}",
      "Échéance mensuelle : {{echeance}}",
      "",
      "Consulter mon offre de prêt : {{lien}}",
    ].join("\n"),
  },

  DISBURSEMENT_RELEASED: {
    code: "DISBURSEMENT_RELEASED",
    label: "Décaissement effectué",
    eventType: "DISBURSEMENT_RELEASED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "montant", "date", "lien", "logo", "siege"],
    subject: "Décaissement effectué — {{montant}}",
    html: wrapHtml(
      "Décaissement effectué",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le décaissement de {{montant}} a été effectué le {{date}} sur votre dossier (DUC {{duc}}, référence {{reference}}).</p>",
        cta("Consulter mes décaissements", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Le décaissement de {{montant}} a été effectué le {{date}} sur votre dossier (DUC {{duc}}, référence {{reference}}).",
      "",
      "Consulter mes décaissements : {{lien}}",
    ].join("\n"),
  },

  PAYOFF_STATEMENT: {
    code: "PAYOFF_STATEMENT",
    label: "Décompte d'extinction",
    eventType: "PAYOFF_STATEMENT",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "montant", "date", "lien", "logo", "siege"],
    subject: "Votre décompte d'extinction est disponible — {{montant}}",
    html: wrapHtml(
      "Votre décompte d'extinction",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le décompte d'extinction de votre prêt (DUC {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>Montant à solder :</strong> {{montant}}</p>",
        cta("Télécharger mon décompte", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Le décompte d'extinction de votre prêt (DUC {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.",
      "",
      "Montant à solder : {{montant}}",
      "",
      "Télécharger mon décompte : {{lien}}",
    ].join("\n"),
  },

  MAINLEVEE_READY: {
    code: "MAINLEVEE_READY",
    label: "Mainlevée hypothécaire disponible",
    eventType: "MAINLEVEE_READY",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien", "logo", "siege"],
    subject: "Votre mainlevée hypothécaire est disponible — {{reference}}",
    html: wrapHtml(
      "Votre mainlevée hypothécaire est disponible",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">L'acte de mainlevée de l'hypothèque de votre dossier (DUC {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.</p>",
        cta("Consulter mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "L'acte de mainlevée de l'hypothèque de votre dossier (DUC {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.",
      "",
      "Consulter mon dossier : {{lien}}",
    ].join("\n"),
  },

  /**
   * Un dossier est attribué à un conseiller.
   *
   * Le destinataire est un **agent** : le message lui dit ce qu'il a à
   * faire, et non ce qu'il doit comprendre du demandeur. Le lien mène à la
   * console, pas au portail citoyen.
   */
  DOSSIER_ASSIGNED: {
    code: "DOSSIER_ASSIGNED",
    label: "Dossier attribué au conseiller",
    eventType: "DOSSIER_ASSIGNED",
    audience: "staff",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien", "logo", "siege"],
    subject: "Un dossier vous est attribué — {{reference}}",
    html: wrapHtml(
      "Un dossier vous est attribué",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le dossier {{reference}} (DUC {{duc}}) vous est attribué le {{date}}. Il entre dans votre portefeuille : c'est vous qui l'instruisez et qui en informez le demandeur.</p>",
        cta("Ouvrir la console CFC", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Le dossier {{reference}} (DUC {{duc}}) vous est attribué le {{date}}. Il entre dans votre portefeuille : c'est vous qui l'instruisez et qui en informez le demandeur.",
      "",
      "Ouvrir la console CFC : {{lien}}",
    ].join("\n"),
  },

  DOSSIER_UPDATED: {
    code: "DOSSIER_UPDATED",
    label: "Mise à jour du dossier",
    eventType: "DOSSIER_UPDATED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien", "logo", "siege"],
    subject: "Votre dossier a été mis à jour — {{reference}}",
    html: wrapHtml(
      "Votre dossier a été mis à jour",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Une mise à jour a été apportée à votre dossier (DUC {{duc}}, référence {{reference}}) le {{date}}. Connectez-vous pour consulter son état et les éventuelles actions à effectuer.</p>",
        cta("Consulter mon dossier", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Une mise à jour a été apportée à votre dossier (DUC {{duc}}, référence {{reference}}) le {{date}}. Connectez-vous pour consulter son état et les éventuelles actions à effectuer.",
      "",
      "Consulter mon dossier : {{lien}}",
    ].join("\n"),
  },

  SUPPORT_MESSAGE: {
    code: "SUPPORT_MESSAGE",
    label: "Nouveau message du conseiller",
    eventType: "SUPPORT_MESSAGE",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien", "logo", "siege"],
    subject: "Un nouveau message de votre conseiller — {{reference}}",
    html: wrapHtml(
      "Un nouveau message vous attend",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Votre conseiller vous a envoyé un message au sujet de votre dossier (DUC {{duc}}, référence {{reference}}) le {{date}}.</p>",
        "<p style=\"margin:0 0 12px 0;\">Pour protéger la confidentialité de vos échanges, le contenu du message est accessible uniquement après connexion au portail.</p>",
        cta("Lire le message", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Votre conseiller vous a envoyé un message au sujet de votre dossier (DUC {{duc}}, référence {{reference}}) le {{date}}.",
      "Pour protéger la confidentialité de vos échanges, le contenu du message est accessible uniquement après connexion au portail.",
      "",
      "Lire le message : {{lien}}",
    ].join("\n"),
  },

  SAVE_CONTACT: {
    code: "SAVE_CONTACT",
    label: "Prise de contact — épargne habitat",
    eventType: "SAVE_CONTACT",
    audience: "citizen",
    variables: ["prenom", "nom", "email", "telephone", "date", "lien", "logo", "siege"],
    subject: "Nous vous recontactons au sujet de votre épargne habitat",
    html: wrapHtml(
      "Prise de contact — épargne habitat",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Un conseiller CFC vous contacte le {{date}} au sujet de votre épargne habitat. Vous pouvez le rappeler au {{telephone}}.</p>",
        cta("Ouvrir mon portail", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Un conseiller CFC vous contacte le {{date}} au sujet de votre épargne habitat. Vous pouvez le rappeler au {{telephone}}.",
      "",
      "Ouvrir mon portail : {{lien}}",
    ].join("\n"),
  },
};

/** Liste des codes connus du service. */
export const EMAIL_TEMPLATE_CODES = Object.keys(DEFAULT_EMAIL_TEMPLATES);

/**
 * Modèle par défaut pour un code donné, converti au format du moteur de
 * rendu. `null` si le code est inconnu.
 */
export function defaultTemplateFor(code: string): EmailTemplateContent | null {
  const definition = DEFAULT_EMAIL_TEMPLATES[code];
  if (!definition) return null;

  return {
    code: definition.code,
    version: 1,
    label: definition.label,
    subject: definition.subject,
    html: definition.html,
    text: definition.text,
    eventType: definition.eventType,
    audience: definition.audience,
    isActive: true,
    // La definition declare deja `logo` et `siege` : les lister une seconde
    // fois ici gonflerait la liste des variables du gabarit publie.
    variables: [...definition.variables],
    effectiveFrom: "1970-01-01T00:00:00.000Z",
    effectiveTo: null,
  };
}
