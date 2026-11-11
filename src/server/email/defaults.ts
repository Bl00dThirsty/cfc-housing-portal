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

/** Enveloppe HTML minimale, en styles en ligne (les clients e-mail ignorent `<style>`). */
function wrapHtml(title: string, body: string): string {
  return [
    '<div style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 12px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">',
    '<tr><td style="background-color:#14532d;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold;">',
    "Crédit Foncier du Cameroun — CFC Habitat",
    "</td></tr>",
    `<tr><td style="padding:24px;color:#1f2937;font-size:14px;line-height:1.6;">`,
    `<p style="margin:0 0 16px 0;font-size:16px;font-weight:bold;color:#14532d;">${title}</p>`,
    body,
    "</td></tr>",
    '<tr><td style="padding:16px 24px;background-color:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;">',
    "Crédit Foncier du Cameroun — Direction Générale. Ce message est généré automatiquement ; merci de ne pas y répondre.",
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
    `<p style="margin:24px 0 8px 0;"><a href="${href}" style="display:inline-block;background-color:#14532d;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;font-size:14px;">${label}</a></p>`,
    `<p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">Si le bouton ne fonctionne pas, copiez ce lien :<br />${href}</p>`,
  ].join("");
}

/** Modèles par défaut, indexés par code métier. */
export const DEFAULT_EMAIL_TEMPLATES: Record<string, EmailTemplateDefinition> = {
  WELCOME: {
    code: "WELCOME",
    label: "Bienvenue — création de compte",
    eventType: "PROFILE_CREATED",
    audience: "citizen",
    variables: ["prenom", "nom", "email", "lien", "date"],
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
    variables: ["prenom", "nom", "lien", "date", "duree"],
    subject: "Votre lien de connexion CFC Habitat",
    html: wrapHtml(
      "Votre lien de connexion",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Vous avez demandé un lien de connexion sans mot de passe. Ce lien est valable {{duree}} et ne peut être utilisé qu'une seule fois.</p>",
        cta("Se connecter", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
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
    variables: ["prenom", "nom", "lien", "date", "duree"],
    subject: "Réinitialisation de votre mot de passe CFC Habitat",
    html: wrapHtml(
      "Réinitialisation de votre mot de passe",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Une réinitialisation de mot de passe a été demandée pour votre compte. Le lien ci-dessous est à usage unique et expire au bout de {{duree}}.</p>",
        cta("Choisir un nouveau mot de passe", "{{lien}}"),
        "<p style=\"margin:16px 0 0 0;font-size:12px;color:#6b7280;\">Si vous n'êtes pas à l'origine de cette demande, aucune action n'est requise et votre mot de passe actuel reste valable.</p>",
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Une réinitialisation de mot de passe a été demandée pour votre compte. Le lien ci-dessous est à usage unique et expire au bout de {{duree}}.",
      "",
      "Choisir un nouveau mot de passe : {{lien}}",
      "",
      "Si vous n'êtes pas à l'origine de cette demande, aucune action n'est requise.",
    ].join("\n"),
  },

  KYC_SUBMITTED: {
    code: "KYC_SUBMITTED",
    label: "Dépôt du dossier KYC",
    eventType: "KYC_SUBMITTED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien"],
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
    variables: ["prenom", "nom", "duc", "reference", "date", "lien"],
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
    variables: ["prenom", "nom", "duc", "reference", "date", "motif", "lien"],
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

  DOCUMENT_REQUESTED: {
    code: "DOCUMENT_REQUESTED",
    label: "Pièce justificative demandée",
    eventType: "DOCUMENT_REQUESTED",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "document", "reference", "date", "echeance", "lien"],
    subject: "Une pièce justificative vous est demandée — {{document}}",
    html: wrapHtml(
      "Une pièce justificative vous est demandée",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le service instructeur de la CFC a besoin de la pièce suivante pour Instruire votre dossier (DUC {{duc}}, référence {{reference}}) :</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>{{document}}</strong></p>",
        "<p style=\"margin:0 0 12px 0;\">Merci de la déposer sur le portail avant le {{echeance}}.</p>",
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
      "Merci de la déposer sur le portail avant le {{echeance}}.",
      "",
      "Déposer la pièce : {{lien}}",
    ].join("\n"),
  },

  COMMITTEE_DECISION: {
    code: "COMMITTEE_DECISION",
    label: "Décision de comité de crédit",
    eventType: "COMMITTEE_DECISION",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "decision", "montant", "date", "lien"],
    subject: "Décision du comité de crédit — {{decision}}",
    html: wrapHtml(
      "Décision du comité de crédit",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le comité de crédit s'est prononcé le {{date}} sur votre dossier (DUC {{duc}}, référence {{reference}}).</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>Décision :</strong> {{decision}}<br /><strong>Montion retenu :</strong> {{montant}}</p>",
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
    variables: ["prenom", "nom", "duc", "reference", "montant", "taux", "echeance", "date", "lien"],
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
    variables: ["prenom", "nom", "duc", "reference", "montant", "date", "lien"],
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
    variables: ["prenom", "nom", "duc", "reference", "montant", "echeance", "date", "lien"],
    subject: "Votre décompte d'extinction est disponible — {{montant}}",
    html: wrapHtml(
      "Votre décompte d'extinction",
      [
        "<p style=\"margin:0 0 12px 0;\">Bonjour {{prenom}} {{nom}},</p>",
        "<p style=\"margin:0 0 12px 0;\">Le décompte d'extinction de votre prêt (DUC {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.</p>",
        "<p style=\"margin:0 0 12px 0;padding:12px;background-color:#f3f4f6;border-radius:6px;\"><strong>Montant à solder :</strong> {{montant}}<br /><strong>Échéance limite :</strong> {{echeance}}</p>",
        cta("Télécharger mon décompte", "{{lien}}"),
      ].join(""),
    ),
    text: [
      "Bonjour {{prenom}} {{nom}},",
      "",
      "Le décompte d'extinction de votre prêt (DUC {{duc}}, référence {{reference}}) est disponible depuis le {{date}}.",
      "",
      "Montant à solder : {{montant}}",
      "Échéance limite : {{echeance}}",
      "",
      "Télécharger mon décompte : {{lien}}",
    ].join("\n"),
  },

  MAINLEVEE_READY: {
    code: "MAINLEVEE_READY",
    label: "Mainlevée hypothécaire disponible",
    eventType: "MAINLEVEE_READY",
    audience: "citizen",
    variables: ["prenom", "nom", "duc", "reference", "date", "lien"],
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

  SAVE_CONTACT: {
    code: "SAVE_CONTACT",
    label: "Prise de contact — épargne habitat",
    eventType: "SAVE_CONTACT",
    audience: "citizen",
    variables: ["prenom", "nom", "email", "telephone", "date", "lien"],
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
    variables: [...definition.variables],
    effectiveFrom: "1970-01-01T00:00:00.000Z",
    effectiveTo: null,
  };
}
