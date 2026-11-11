import type { ClientFilters, ClientSortKey } from "@/stores/clients-store";

export type FilterableClient = {
  id: string;
  name: string;
  agency: string;
  phase: string;
  status: string;
  loanAmount: string;
  savingsCurrent: string;
  completionPercent: number;
};

export function parseAmount(value: string): number {
  const digits = value.replace(/[^0-9]/g, "");
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function matchesSearch(client: FilterableClient, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return client.name.toLowerCase().includes(needle);
}

function compareBy(sortBy: ClientSortKey) {
  return (a: FilterableClient, b: FilterableClient): number => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name, "fr");
      case "phase":
        return a.phase.localeCompare(b.phase, "fr");
      case "status":
        return a.status.localeCompare(b.status, "fr");
      case "loanAmount":
        return parseAmount(b.loanAmount) - parseAmount(a.loanAmount);
      case "savingsCurrent":
        return parseAmount(b.savingsCurrent) - parseAmount(a.savingsCurrent);
      case "completionPercent":
        return b.completionPercent - a.completionPercent;
      default:
        return 0;
    }
  };
}

export function filterClients<T extends FilterableClient>(
  clients: readonly T[],
  filters: ClientFilters,
): T[] {
  return clients
    .filter((client) => {
      if (filters.phase && client.phase !== filters.phase) return false;
      if (filters.agency && client.agency !== filters.agency) return false;
      if (filters.status && client.status !== filters.status) return false;
      if (!matchesSearch(client, filters.search)) return false;
      return true;
    })
    .sort(compareBy(filters.sortBy));
}

export function activeFilterCount(filters: ClientFilters): number {
  let count = 0;
  if (filters.phase) count += 1;
  if (filters.agency) count += 1;
  if (filters.status) count += 1;
  if (filters.search.trim()) count += 1;
  return count;
}

export function distinctValues<T extends FilterableClient>(
  clients: readonly T[],
  key: "phase" | "agency" | "status",
): string[] {
  const values = new Set<string>();
  for (const client of clients) {
    const value = client[key];
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, "fr"));
}
