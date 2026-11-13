import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_DATA_TABLE_STATE } from "@/lib/data-table";
import { tableState, useDataTableStore } from "@/stores/data-table-store";

const TABLE = "clients";

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

describe("store des tableaux — un état par tableau", () => {
  it("démarre vide pour un tableau inconnu", () => {
    const state = useDataTableStore.getState();
    expect(state.byTable[TABLE]).toBeUndefined();
  });

  it("n'écrit que dans le tableau visé", () => {
    const store = useDataTableStore.getState();
    store.setSearch(TABLE, "eba");
    store.setSearch("kanban", "zola");

    expect(useDataTableStore.getState().byTable[TABLE]?.search).toBe("eba");
    expect(useDataTableStore.getState().byTable.kanban?.search).toBe("zola");
  });

  it("empile les tris dans l'ordre de priorité", () => {
    const store = useDataTableStore.getState();
    store.toggleSort(TABLE, "phase", false);
    store.toggleSort(TABLE, "name", true);

    expect(useDataTableStore.getState().byTable[TABLE]?.sorts).toEqual([
      { key: "phase", dir: "asc" },
      { key: "name", dir: "asc" },
    ]);
  });

  it("remplace les filtres d'une facette", () => {
    const store = useDataTableStore.getState();
    store.setFilter(TABLE, "phase", ["kyc_savings"]);
    store.setFilter(TABLE, "phase", ["committees"]);

    expect(useDataTableStore.getState().byTable[TABLE]?.filters).toEqual([
      { id: "phase", values: ["committees"] },
    ]);
  });

  it("remet un tableau à zéro sans toucher aux autres", () => {
    const store = useDataTableStore.getState();
    store.setSearch(TABLE, "eba");
    store.setSearch("kanban", "zola");
    store.toggleSort(TABLE, "phase", false);
    store.setFilter(TABLE, "phase", ["committees"]);
    store.setGroupBy(TABLE, "phase");
    store.reset(TABLE);

    const state = useDataTableStore.getState();
    expect(state.byTable[TABLE]?.search).toBe("");
    expect(state.byTable[TABLE]?.sorts).toEqual([]);
    expect(state.byTable[TABLE]?.filters).toEqual([]);
    expect(state.byTable[TABLE]?.groupBy).toBeNull();
    expect(state.byTable.kanban?.search).toBe("zola");
  });
});

describe("store des tableaux — groupement et sélecteur", () => {
  it("écrit le groupement du tableau visé", () => {
    const store = useDataTableStore.getState();
    store.setGroupBy(TABLE, "phase");

    expect(useDataTableStore.getState().byTable[TABLE]?.groupBy).toBe("phase");
  });

  it("retire le groupement quand on le passe à null", () => {
    const store = useDataTableStore.getState();
    store.setGroupBy(TABLE, "phase");
    store.setGroupBy(TABLE, null);

    expect(useDataTableStore.getState().byTable[TABLE]?.groupBy).toBeNull();
  });

  it("renvoie l'état par défaut d'un tableau inconnu", () => {
    const state = useDataTableStore.getState();
    expect(tableState(state, "inconnu")).toEqual(DEFAULT_DATA_TABLE_STATE);
  });

  it("renvoie l'état stocké d'un tableau connu", () => {
    const store = useDataTableStore.getState();
    store.setSearch(TABLE, "eba");
    store.setGroupBy(TABLE, "phase");

    const state = useDataTableStore.getState();
    expect(tableState(state, TABLE)).toEqual({
      search: "eba",
      sorts: [],
      filters: [],
      groupBy: "phase",
    });
  });

  it("renvoie une référence stable pour un tableau donné", () => {
    const state = useDataTableStore.getState();
    expect(tableState(state, "inconnu")).toBe(tableState(state, "inconnu"));
  });
});

describe("store des tableaux — l'état par défaut n'est partagé par personne", () => {
  it("donne à chaque tableau ses propres tableaux", () => {
    const store = useDataTableStore.getState();
    store.reset("a");
    store.reset("b");

    const byTable = useDataTableStore.getState().byTable;
    expect(byTable.a.sorts).not.toBe(byTable.b.sorts);
    expect(byTable.a.filters).not.toBe(byTable.b.filters);
  });

  it("n'expose jamais les tableaux du défaut à un tableau", () => {
    const store = useDataTableStore.getState();
    store.reset("a");
    store.setSearch("b", "eba");

    const byTable = useDataTableStore.getState().byTable;
    expect(byTable.a.sorts).not.toBe(DEFAULT_DATA_TABLE_STATE.sorts);
    expect(byTable.b.sorts).not.toBe(DEFAULT_DATA_TABLE_STATE.sorts);
    expect(byTable.a.sorts).not.toBe(byTable.b.sorts);
  });

  it("ne corrompt pas les autres tableaux quand on modifie un tableau en place", () => {
    const store = useDataTableStore.getState();
    store.reset("a");
    store.reset("b");
    store.setSearch("c", "eba");

    useDataTableStore.getState().byTable.a.sorts.push({ key: "phase", dir: "asc" });

    const byTable = useDataTableStore.getState().byTable;
    expect(byTable.a.sorts).toHaveLength(1);
    expect(byTable.b.sorts).toHaveLength(0);
    expect(byTable.c.sorts).toHaveLength(0);
    expect(DEFAULT_DATA_TABLE_STATE.sorts).toHaveLength(0);
  });

  it("gèle l'état par défaut : une mutation échoue bruyamment", () => {
    expect(() => DEFAULT_DATA_TABLE_STATE.sorts.push({ key: "x", dir: "asc" })).toThrow();
  });

  it("recopie les valeurs de filtre fournies par l'appelant", () => {
    const values = ["committees"];
    useDataTableStore.getState().setFilter(TABLE, "phase", values);
    values.push("kyc_savings");

    expect(useDataTableStore.getState().byTable[TABLE]?.filters).toEqual([
      { id: "phase", values: ["committees"] },
    ]);
  });
});
