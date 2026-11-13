import { beforeEach, describe, expect, it } from "vitest";

import { useDataTableStore } from "@/stores/data-table-store";

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
    store.reset(TABLE);

    expect(useDataTableStore.getState().byTable[TABLE]?.search).toBe("");
    expect(useDataTableStore.getState().byTable.kanban?.search).toBe("zola");
  });
});
