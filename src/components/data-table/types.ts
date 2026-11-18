import type * as React from "react";

/**
 * Le contrat d'une colonne.
 *
 * L'`accessor` porte la **valeur** de la cellule — celle qu'on cherche, qu'on
 * trie et qu'on groupe. Le `render` porte le **noeud** affiché. Les deux sont
 * distincts : un montant se trie par sa valeur numérique mais s'affiche
 * formaté.
 */
export interface DataColumn<T> {
  /** Identifiant stable de la colonne ; il qualifie le tri, la facette et le groupe. */
  key: string;
  /** Libellé affiché dans l'en-tête. */
  label: string;
  /**
   * Valeur de la cellule. Sans elle, la colonne n'est ni triable ni filtrable.
   *
   * Une **date** est une `Date` : c'est le moteur qui sait la trier
   * chronologiquement. Une date française en texte brut se trierait
   * alphabétiquement — donc dans le désordre.
   */
  accessor?: (row: T) => string | number | boolean | Date | null | undefined;
  /** Rendu de la cellule ; par défaut la valeur de l'`accessor`. */
  render?: (row: T) => React.ReactNode;
  /**
   * Valeurs cherchables **en plus** de la valeur de la colonne.
   *
   * Une ligne peut afficher une information qui n'est pas une colonne — la
   * profession sous le nom, par exemple. Sans cette couture, cette
   * information devient introuvable par la recherche.
   */
  searchValues?: (row: T) => string[];
  /** Exclusion explicite du tri (colonne d'icônes). */
  sortable?: boolean;
  /** La colonne alimente une facette de filtre. */
  filterable?: boolean;
  /** La colonne peut servir de clé de groupement. */
  groupable?: boolean;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
  /** Libellé du groupe quand la colonne sert de clé de groupement. */
  groupLabel?: (value: string) => string;
  /**
   * Libellé de l'option de facette.
   *
   * Une colonne de date produit une valeur ISO ; l'affichage peut vouloir la
   * date française. Le libellé du groupe et celui de la facette sont donc
   * deux points de couture distincts.
   */
  facetLabel?: (value: string) => string;
}
