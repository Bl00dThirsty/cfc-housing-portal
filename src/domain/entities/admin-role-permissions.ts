import { isCapability, isStaffRole, type Capability, type StaffRole } from "@/domain/policies/capabilities";

export interface AdminRolePermissionRole {
  code: StaffRole;
  label: string;
  description: string | null;
  poleCode: string | null;
  scope: string | null;
  sortOrder: number;
  capabilities: Capability[];
}

export interface AdminRolePermissionCapability {
  code: Capability;
  label: string;
  groupLabel: string;
  description: string | null;
  sortOrder: number;
}

export interface AdminRolePermissionDirectory {
  roles: AdminRolePermissionRole[];
  capabilities: AdminRolePermissionCapability[];
}

export interface AdminRoleRow {
  code: string;
  label: string;
  description: string | null;
  pole_code: string | null;
  scope: string | null;
  sort_order: number;
}

export interface AdminCapabilityRow {
  code: string;
  label: string;
  group_label: string;
  description: string | null;
  sort_order: number;
}

export interface AdminRoleCapabilityRow {
  role_code: string;
  capability: string;
}

export function mapAdminRolePermissionDirectory(
  roleRows: readonly AdminRoleRow[],
  capabilityRows: readonly AdminCapabilityRow[],
  grantRows: readonly AdminRoleCapabilityRow[],
): AdminRolePermissionDirectory {
  const validGrants = new Map<StaffRole, Set<Capability>>();
  for (const row of grantRows) {
    if (!isStaffRole(row.role_code) || !isCapability(row.capability)) continue;
    const grants = validGrants.get(row.role_code) ?? new Set<Capability>();
    grants.add(row.capability);
    validGrants.set(row.role_code, grants);
  }

  const capabilities = capabilityRows
    .filter((row): row is AdminCapabilityRow & { code: Capability } => isCapability(row.code))
    .map((row) => ({
      code: row.code,
      label: row.label,
      groupLabel: row.group_label,
      description: row.description,
      sortOrder: row.sort_order,
    }))
    .sort((left, right) =>
      left.groupLabel.localeCompare(right.groupLabel, "fr") ||
      left.sortOrder - right.sortOrder ||
      left.label.localeCompare(right.label, "fr"),
    );

  const roles = roleRows
    .filter((row): row is AdminRoleRow & { code: StaffRole } => isStaffRole(row.code))
    .map((row) => ({
      code: row.code,
      label: row.label,
      description: row.description,
      poleCode: row.pole_code,
      scope: row.scope,
      sortOrder: row.sort_order,
      capabilities: [...(validGrants.get(row.code) ?? [])].sort(),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.code.localeCompare(right.code));

  return { roles, capabilities };
}
