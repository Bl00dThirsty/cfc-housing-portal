/**
 * Les agences du réseau CFC — et leurs libellés courts.
 *
 * La donnée porte le nom complet (« Agence Yaoundé Centre ») ; l'interface
 * affiche le nom court (« Yaoundé Centre »). Cette table de correspondance
 * a **un seul propriétaire** : le domaine. Les écrans qui listent des
 * agences — le répertoire des emprunteurs comme l'écran de l'agence —
 * la partagent au lieu d'en écrire chacun la leur.
 */
export const AGENCY_LABELS: Record<string, string> = {
  "Agence Yaoundé Centre": "Yaoundé Centre",
  "Agence Yaoundé Olembé": "Yaoundé Olembé",
  "Agence Yaoundé Bastos": "Yaoundé Bastos",
  "Agence Yaoundé Mendong": "Yaoundé Mendong",
  "Agence Douala Bonanjo": "Douala Bonanjo",
  "Agence Bafoussam": "Bafoussam",
  "Agence Kribi": "Kribi",
  "Cellule Diaspora Siège": "Cellule Diaspora",
  "Guichet Diaspora / Centre": "Guichet Diaspora",
};

/**
 * Le libellé court d'une agence.
 *
 * Une agence absente de la table garde son nom complet : mieux vaut un
 * libellé long qu'un libellé vide.
 */
export function agencyLabel(agency: string): string {
  return AGENCY_LABELS[agency] ?? agency;
}
