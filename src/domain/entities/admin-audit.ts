export type AdminAuditAction = "insert" | "update" | "delete";

export interface AdminAuditEvent {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: AdminAuditAction;
  entityType: string;
  entityKey: string | null;
  occurredAt: string;
}

export interface AdminAuditReadiness {
  activeRoles: number;
  activeCapabilities: number;
  orphanedGrants: number;
  activeProcesses: number;
  activeWorkflowSteps: number;
  emailProvider: "smtp" | "resend" | "none";
  emailConfigured: boolean;
}

export interface AdminAuditDashboard {
  events: AdminAuditEvent[];
  readiness: AdminAuditReadiness;
}

const AUDIT_ACTIONS: ReadonlySet<string> = new Set(["insert", "update", "delete"]);

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/** Drop every field outside the safe event contract before it reaches UI code. */
export function mapAdminAuditEvents(rows: readonly Record<string, unknown>[]): AdminAuditEvent[] {
  return rows.flatMap((row) => {
    const action = typeof row.action === "string" ? row.action.toLowerCase() : "";
    const entityType = optionalText(row.entity_type);
    const occurredAt = optionalText(row.occurred_at);
    if (!AUDIT_ACTIONS.has(action) || !entityType || !occurredAt) return [];

    return [{
      id: String(row.id),
      actorId: optionalText(row.actor_id),
      actorRole: optionalText(row.actor_role),
      action: action as AdminAuditAction,
      entityType,
      entityKey: optionalText(row.entity_key),
      occurredAt,
    }];
  });
}
