/**
 * Les comptes de démonstration.
 *
 * Ce ne sont pas des comptes **d'agent** : ce sont des **demandeurs** de
 * test, les mêmes que les suites e2e utilisent. Le panneau s'en sert pour
 * ouvrir une session en un clic.
 *
 * ⚠️ La liste vit ici, et **pas** dans le module d'actions : un module
 *    `"use server"` n'exporte que des fonctions — une constante exportée y
 *    deviendrait une référence serveur, illisible côté client.
 */

export interface DemoAccount {
  email: string;
  /** Le rôle du compte dans la démonstration. */
  label: string;
  /** Le nom affiché sur le profil citoyen. */
  fullName: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    email: "e2e.parcours@cfc.cm",
    label: "Demandeur — parcours",
    fullName: "Emprunteur — parcours",
  },
  {
    email: "e2e.storage@cfc.cm",
    label: "Demandeur — dépôt de pièces",
    fullName: "Emprunteur — dépôt de pièces",
  },
  {
    email: "e2e.support@cfc.cm",
    label: "Demandeur — support",
    fullName: "Emprunteur — support",
  },
  {
    email: "e2e.notifications@cfc.cm",
    label: "Demandeur — notifications",
    fullName: "Emprunteur — notifications",
  },
  {
    email: "e2e.cloisonnement@cfc.cm",
    label: "Demandeur — cloisonnement",
    fullName: "Emprunteur — cloisonnement",
  },
];
