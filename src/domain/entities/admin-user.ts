export interface AdminStaffAccountRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  pole: string | null;
  job_title: string | null;
  department: string | null;
  phone: string | null;
  initials: string | null;
  agency_id: string | null;
  agency_label: string | null;
  scope: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  active: boolean;
  email_confirmed: boolean;
  avatar_path: string | null;
}

export interface AdminStaffAccount {
  id: string;
  email: string;
  fullName: string | null;
  roleCode: string | null;
  roleLabel: string | null;
  pole: string | null;
  jobTitle: string | null;
  department: string | null;
  phone: string | null;
  initials: string | null;
  agencyId: string | null;
  agencyLabel: string | null;
  scope: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  active: boolean;
  invitePending: boolean;
  avatarUrl: string | null;
}

export interface AdminRoleOption {
  code: string;
  label: string;
  poleCode: string | null;
  scope: string | null;
}

export interface AdminAgencyOption {
  id: string;
  code: string;
  label: string;
  city: string | null;
  region: string | null;
  isDiasporaDesk: boolean;
}

export interface AdminStaffDirectory {
  users: AdminStaffAccount[];
  roles: AdminRoleOption[];
  agencies: AdminAgencyOption[];
  currentUserId: string;
}

/** Maps the protected staff-directory RPC using role labels from the live catalogue. */
export function mapAdminStaffAccount(
  row: AdminStaffAccountRow,
  roleLabels: ReadonlyMap<string, string>,
  avatarUrls: ReadonlyMap<string, string> = new Map(),
): AdminStaffAccount {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    roleCode: row.role,
    roleLabel: row.role ? roleLabels.get(row.role) ?? row.role : null,
    pole: row.pole,
    jobTitle: row.job_title,
    department: row.department,
    phone: row.phone,
    initials: row.initials,
    agencyId: row.agency_id,
    agencyLabel: row.agency_label,
    scope: row.scope,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    active: row.active,
    invitePending: !row.email_confirmed,
    avatarUrl: avatarUrls.get(row.id) ?? null,
  };
}

export type AdminStaffStatus = "all" | "active" | "disabled" | "invited";

export interface AdminStaffFilters {
  query: string;
  role: string;
  status: AdminStaffStatus;
}

/** Applies the directory filters to the already-authorized staff result. */
export function filterAdminStaffAccounts(
  accounts: readonly AdminStaffAccount[],
  filters: AdminStaffFilters,
): AdminStaffAccount[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return accounts.filter((account) => {
    if (filters.role !== "all" && account.roleCode !== filters.role) return false;
    if (filters.status === "active" && !account.active) return false;
    if (filters.status === "disabled" && account.active) return false;
    if (filters.status === "invited" && !account.invitePending) return false;

    if (!query) return true;
    return [
      account.fullName,
      account.email,
      account.roleLabel,
      account.roleCode,
      account.pole,
      account.jobTitle,
      account.department,
      account.phone,
      account.agencyLabel,
    ].some((value) => value?.toLocaleLowerCase().includes(query));
  });
}
