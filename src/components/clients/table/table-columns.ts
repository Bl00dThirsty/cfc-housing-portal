import type { DataColumn } from "@/components/data-table/types";
import type { ClientItem } from "@/domain/entities/client";

/**
 * Les colonnes du répertoire.
 *
 * La grille s'aligne par **sous-grille** CSS : huit colonnes de largeur
 * `max-content`, les lignes reprenant le découpage par `grid-cols-subgrid`.
 * L'alignement de chaque colonne est porté par `cellClassName` ; la ligne
 * (`client-row.tsx`) en reprend les mêmes classes, car elle possède sa
 * propre mise en page.
 *
 * ⚠️ Ces colonnes sont une **constante de module** : le moteur mémoïse sur
 * leur identité, et une écriture en ligne dans le JSX l'invaliderait à
 * chaque rendu.
 */
export const CLIENT_COLUMNS: DataColumn<ClientItem>[] = [
  {
    key: "name",
    label: "Emprunteur",
    accessor: (row) => row.name,
    // Le DUC est affiché **sous le nom** dans la ligne : il n'est pas une
    // colonne, mais il reste trouvable par la recherche.
    searchValues: (row) => [row.ducId],
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "agency",
    label: "Agence",
    accessor: (row) => row.agency,
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "phase",
    label: "Phase",
    accessor: (row) => row.phase,
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "status",
    label: "Statut",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    cellClassName: "justify-start",
  },
  {
    key: "loanAmount",
    label: "Montant",
    // Le tri porte sur la **valeur** : « 24 000 000 FCFA » se compare par
    // son montant, pas alphabétiquement.
    accessor: (row) => Number(row.loanAmount.replace(/\D/g, "")),
    render: (row) => row.loanAmount,
    cellClassName: "justify-end tabular-nums",
  },
  {
    key: "savingsCurrent",
    label: "Épargne",
    accessor: (row) => Number(row.savingsCurrent.replace(/\D/g, "")),
    render: (row) => row.savingsCurrent,
    cellClassName: "justify-end tabular-nums",
  },
  {
    key: "completionPercent",
    label: "Avancement",
    accessor: (row) => row.completionPercent,
    // L'affichage porte le pourcentage ; la valeur reste le nombre, que le
    // moteur trie.
    render: (row) => `${row.completionPercent}%`,
    cellClassName: "justify-center",
  },
  {
    // La colonne d'actions n'est ni triable ni filtrable : elle porte un
    // menu, pas une valeur.
    key: "action",
    label: "Action",
    sortable: false,
    cellClassName: "justify-center",
  },
];

/** La grille du répertoire : huit colonnes, alignées par sous-grille. */
export const CLIENT_TABLE_GRID_CLASS =
  "grid min-w-max grid-cols-[repeat(8,max-content)] justify-between";

export const CLIENT_TABLE_ROW_CLASS = "col-span-full grid grid-cols-subgrid";

export const CLIENT_TABLE_CELL_CLASS = "flex items-center";
