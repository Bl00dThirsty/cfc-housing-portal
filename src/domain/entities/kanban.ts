export type ColumnId =
  | "kyc_savings"
  | "risk_bet"
  | "committees"
  | "notary_mortgage"
  | "disbursements"
  | "closing_release";

export type Column = {
  id: ColumnId;
  title: string;
};

export type TaskTeam =
  | "Agence Yaoundé"
  | "Agence Douala"
  | "Direction Crédit"
  | "BET Partenaire"
  | "Comité CRC"
  | "Étude Notariale"
  | "MINDCAF Foncier"
  | "Comptabilité SYSTAC";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskInsightLabel = "Attachments" | "Comments" | "Documents";

export type TaskInsight = {
  label: TaskInsightLabel;
  count: number;
};

export type TaskOwnerProfile = {
  name: string;
  tone: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  progress: number;
  owner: TaskOwnerProfile;
  team: TaskTeam;
  insights: TaskInsight[];
  // Domain specific fields for CFC DUC
  ducId: string;
  clientName: string;
  projectTitle: string;
  amount: string;
  amountRaw: number;
  equityContribution?: string;
  daysInStage: number;
  slaMaxDays: number;
  agency: string;
  clientId?: string;
  landTitle?: string;
  cobacRatio?: string;
  decisionStatus?: string;
};

export type BoardState = Record<ColumnId, Task[]>;
