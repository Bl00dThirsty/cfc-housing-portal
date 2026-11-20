import type { DataColumn } from "@/components/data-table/types";
import { agencyLabel } from "@/domain/entities/agencies";
import type { ClientItem } from "@/domain/entities/client";
import type { SortRule } from "@/lib/data-table";

/**
 * Les colonnes du répertoire.
 *
 * La grille s'aligne par **sous-grille** CSS : huit colonnes de largeur
 * `max-content`, les lignes reprenant le découpage par `grid-cols-subgrid`.
 *
 * ⚠️ Ces colonnes sont une **constante de module** : le moteur mémoïse sur
 * leur identité, et une écriture en ligne dans le JSX l'invaliderait à
 * chaque rendu.
 *
 * ⚠️ Aucune colonne ne déclare `cellClassName` : le moteur ne l'applique
 * qu'aux lignes qu'il rend lui-même. Ici, c'est `client-row.tsx` qui possède
 * la mise en page — les classes d'alignement y vivent, et l'alignement des
 * **en-têtes** est porté par `align`, que le moteur honore sur le `<th>`.
 */
export const CLIENT_COLUMNS: DataColumn<ClientItem>[] = [
  {
    key: "name",
    label: "Emprunteur",
    accessor: (row) => row.name,
    // Le DUC est affiché **sous le nom** dans la ligne : il n'est pas une
    // colonne, mais il reste trouvable par la recherche.
    searchValues: (row) => [row.ducId],
    // Ni facette ni regroupement : une facette « Emprunteur » listerait une
    // option par emprunteur, et le regroupement produirait autant de
    // groupes d'une ligne. L'écran de l'agence fait de même.
    filterable: false,
    groupable: false,
  },
  {
    key: "agency",
    label: "Agence",
    accessor: (row) => row.agency,
    filterable: true,
    groupable: true,
    // La donnée porte le nom complet ; la facette et l'en-tête de groupe
    // portent le nom court — comme l'écran de l'agence.
    groupLabel: (value) => agencyLabel(value),
    facetLabel: (value) => agencyLabel(value),
  },
  {
    key: "phase",
    label: "Phase",
    accessor: (row) => row.phase,
    filterable: true,
    groupable: true,
  },
  {
    key: "status",
    label: "Statut",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
  },
  {
    key: "loanAmount",
    label: "Montant",
    // Le tri porte sur la **valeur** : « 24 000 000 FCFA » se compare par
    // son montant, pas alphabétiquement.
    accessor: (row) => Number(row.loanAmount.replace(/\D/g, "")),
    render: (row) => row.loanAmount,
    align: "right",
  },
  {
    key: "savingsCurrent",
    label: "Épargne",
    accessor: (row) => Number(row.savingsCurrent.replace(/\D/g, "")),
    render: (row) => row.savingsCurrent,
    align: "right",
  },
  {
    key: "completionPercent",
    label: "Avancement",
    accessor: (row) => row.completionPercent,
    // L'affichage porte le pourcentage ; la valeur reste le nombre, que le
    // moteur trie.
    render: (row) => `${row.completionPercent}%`,
    align: "center",
  },
  {
    // La colonne d'actions n'est ni triable ni filtrable : elle porte un
    // menu, pas une valeur.
    key: "action",
    label: "Action",
    sortable: false,
    align: "center",
  },
];

/**
 * Le tri d'ouverture du répertoire : l'emprunteur le plus avancé d'abord.
 *
 * C'est un tri **initial**, pas un état : il s'applique tant qu'aucun tri
 * n'a été choisi, et un clic sur un en-tête le remplace.
 */
export const CLIENT_INITIAL_SORT: readonly SortRule[] = [
  { key: "completionPercent", dir: "desc" },
];

/** La grille du répertoire : huit colonnes, alignées par sous-grille. */
export const CLIENT_TABLE_GRID_CLASS =
  "grid min-w-max grid-cols-[repeat(8,max-content)] justify-between";

export const CLIENT_TABLE_ROW_CLASS = "col-span-full grid grid-cols-subgrid";

export const CLIENT_TABLE_CELL_CLASS = "flex items-center";
