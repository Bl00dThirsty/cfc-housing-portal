export type AdminGroupKind = "pole" | "agency";

export interface AdminGroup {
  kind: AdminGroupKind;
  id: string | null;
  code: string;
  label: string;
  description: string | null;
  city: string | null;
  region: string | null;
  isDiasporaDesk: boolean;
  memberCount: number;
  roleCount: number;
  sortOrder: number;
}

export interface AdminGroupFilters {
  query?: string;
  kind?: AdminGroupKind | "all";
}

export function filterAdminGroups(groups: readonly AdminGroup[], filters: AdminGroupFilters = {}): AdminGroup[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  const kind = filters.kind ?? "all";
  return groups.filter((group) => {
    if (kind !== "all" && group.kind !== kind) return false;
    if (!query) return true;
    return [group.code, group.label, group.description, group.city, group.region]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
}
