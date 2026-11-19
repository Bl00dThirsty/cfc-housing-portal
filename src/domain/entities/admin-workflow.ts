export type ProcessFamily = "pilotage" | "realisation" | "support" | "ecosysteme";
export type ProcessPriority = "prioritaire" | "standard";
export type ProcessLane = "client" | "agence" | "siege" | "partenaires" | "support";

export interface WorkflowProcess {
  code: string;
  label: string;
  family: ProcessFamily;
  chainOrder: number | null;
  pilots: string[];
  priority: ProcessPriority;
  activeStepCount: number;
}

export interface WorkflowStep {
  code: string;
  processCode: string;
  label: string;
  phase: string | null;
  lane: ProcessLane;
  external: boolean;
  slaDays: number | null;
  sortOrder: number;
}

export interface WorkflowPhase {
  code: string;
  label: string;
  sortOrder: number;
}

export interface WorkflowFilters {
  query?: string;
  phase?: string | "all" | "unassigned";
  processCode?: string | "all";
}

export function filterWorkflowSteps(steps: readonly WorkflowStep[], filters: WorkflowFilters = {}): WorkflowStep[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  return steps.filter((step) => {
    if (filters.phase === "unassigned" && step.phase !== null) return false;
    if (filters.phase && filters.phase !== "all" && filters.phase !== "unassigned" && step.phase !== filters.phase) return false;
    if (filters.processCode && filters.processCode !== "all" && step.processCode !== filters.processCode) return false;
    if (!query) return true;
    return [step.code, step.processCode, step.label, step.phase, step.lane]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
}
