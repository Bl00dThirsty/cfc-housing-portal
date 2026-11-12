/**
 * Foire aux questions du Guichet Unique.
 *
 * Le contenu est ici — et nulle part ailleurs — parce qu'il est lu par la
 * page publique **et** par l'espace citoyen. Les réponses décrivent le
 * parcours **réel** de la plateforme : le référentiel déclarable, l'épargne
 * logement, les règles prudentielles et le cloisonnement des accès.
 *
 * Module pur : aucun import React, Supabase ou serveur.
 */

/** Un groupe de questions — une étape du parcours. */
export interface FaqGroup {
  /** Identifiant du groupe, pour l'ancrage dans l'adresse. */
  id: string;
  /** Titre du groupe. */
  title: string;
  /** Chapeau : ce que couvre le groupe. */
  summary: string;
  /** Les questions du groupe. */
  items: FaqItem[];
}

/** Une question et sa réponse. */
export interface FaqItem {
  question: string;
  /** Réponse, en français. */
  answer: string;
  /** Renvoi vers l'écran concerné (chemin interne). */
  link?: { href: string; label: string };
}

/** Les groupes de la foire aux questions, dans l'ordre du parcours. */
export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    id: "dossier",
    title: "Ouvrir et suivre son dossier",
    summary:
      "Le dossier unique client (DUC) est ouvert à l'inscription et suit ensuite un parcours balisé.",
    items: [
      {
        question: "Comment ouvrir mon dossier unique client ?",
        answer:
          "Créez votre compte, puis remplissez le formulaire d'ouverture : service sollicité, informations personnelles et pièces de départ. Votre dossier est créé immédiatement et prend le numéro DUC qui vous est communiqué.",
        link: { href: "/onboarding", label: "Ouvrir mon dossier" },
      },
      {
        question: "Quelles pièces me seront demandées ?",
        answer:
          "Celles du catalogue déclarable du service que vous sollicitez. Chaque dossier indique le nombre de pièces obligatoires et de pièces facultatives ; seules les obligatoires conditionnent l'avancement du dossier.",
        link: { href: "/portail-client", label: "Voir mes pièces" },
      },
      {
        question: "Comment savoir où j'en suis ?",
        answer:
          "Votre espace affiche une chronologie indexée sur le manuel de procédures : chaque étape porte son code (CRD-01 à CRD-13, GAR-01) et son état — franchie, en cours, à venir. Les événements de votre dossier y sont datés et signés.",
        link: { href: "/tracking", label: "Suivre mon dossier" },
      },
    ],
  },
  {
    id: "epargne",
    title: "L'épargne-logement",
    summary:
      "L'apport se constitue par versements réguliers ; il ouvre droit au prêt à l'issue de la période contractuelle.",
    items: [
      {
        question: "Combien dois-je épargner ?",
        answer:
          "Le montant de l'apport dépend du produit et du coût du projet. Le simulateur d'épargne habitat vous donne la mensualité correspondante et la capacité d'emprunt qui en découle.",
        link: { href: "/simulator", label: "Ouvrir le simulateur" },
      },
      {
        question: "Qu'est-ce que le droit acquis ?",
        answer:
          "Il est acquis au terme de douze versements consécutifs : avant ce délai, l'épargne peut être clôturée et retirée, mais pas convertie en prêt.",
      },
      {
        question: "Puis-je convertir mon épargne en prêt ?",
        answer:
          "Oui, à l'issue de la période contractuelle, lorsque le droit acquis est acquis et que la cible d'apport est atteinte. Auparavant, la sortie normale est la clôture ou la prorogation du compte.",
      },
    ],
  },
  {
    id: "pret",
    title: "Le prêt foncier",
    summary:
      "L'échéance est calculée par annuité constante ; l'endettement est encadré par les normes prudentielles.",
    items: [
      {
        question: "Comment est calculée mon échéance ?",
        answer:
          "Par annuité constante, au taux du produit souscrit : échéance = montant × [taux / (1 − (1 + taux)^−n)], sur la durée en années de votre prêt. Le montant exact figure dans votre espace.",
        link: { href: "/portail-client", label: "Voir mon échéance" },
      },
      {
        question: "Quel taux d'endettement est admis ?",
        answer:
          "Votre taux d'endettement — échéance rapportée à votre revenu mensuel — doit rester inférieur ou égal à 33 %, seuil prudentiel COBAC appliqué par le simulateur.",
        link: { href: "/simulator", label: "Tester ma capacité" },
      },
    ],
  },
  {
    id: "confidentialite",
    title: "Données et confidentialité",
    summary:
      "Chaque dossier est cloisonné : ni les agents d'autres pôles, ni les autres emprunteurs n'y accèdent.",
    items: [
      {
        question: "Qui peut consulter mon dossier ?",
        answer:
          "Vous-même, et les agents habilités sur le périmètre de votre dossier. Un agent d'un autre pôle ne peut pas l'ouvrir : l'accès direct par l'adresse est refusé, et chaque consultation est journalisée.",
      },
      {
        question: "Mes données sont-elles conservées ?",
        answer:
          "Oui, dans le dossier d'archives électroniques de la plateforme, avec une piste d'audit horodatée (création, modification, retrait) et un ensemble d'actions soumises à la loi n° 2024/017 sur la protection des données.",
      },
      {
        question: "Puis-je échanger avec un conseiller ?",
        answer:
          "Oui, depuis le fil de support de votre dossier. Vos messages sont enregistrés et peuvent porter une pièce jointe ; ils sont rattachés à l'étape du parcours dont vous parlez.",
        link: { href: "/portail-client", label: "Ouvrir le fil" },
      },
    ],
  },
  {
    id: "agent",
    title: "L'espace agent CFC",
    summary:
      "La console d'administration est réservée aux agents provisionnés par la Direction Générale.",
    items: [
      {
        question: "Comment accéder à la console CFC ?",
        answer:
          "Avec un compte agent provisionné par la Direction Générale. Chaque agent n'ouvre que les écrans de son pôle ; son rôle détermine aussi les dossiers qu'il peut instruire.",
        link: { href: "/portail-cfc/login", label: "Espace Agent CFC" },
      },
      {
        question: "Peut-on changer de rôle ?",
        answer:
          "Non. Le rôle est celui attribué par la Direction Générale ; il est lu en base à chaque connexion et l'interface ne permet pas de s'en attribuer un autre.",
      },
    ],
  },
];

/** Nombre total de questions — pour l'accroche de la page. */
export const FAQ_ITEM_COUNT = FAQ_GROUPS.reduce(
  (total, group) => total + group.items.length,
  0,
);
