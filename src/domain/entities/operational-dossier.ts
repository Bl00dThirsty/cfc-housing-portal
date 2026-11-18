/** Allowlisted non-profile information shown in cross-pole operational queues. */
export type OperationalDossier = {
  id: string;
  ducCode: string;
  region: string;
  agency: string;
  phaseCode: string;
  status: string;
  updatedAt: string | null;
  isDiaspora: boolean;
};

/** Event metadata only; payloads and comments can contain profile information. */
export type OperationalEvent = {
  id: string;
  type: string;
  actorRole: string;
  occurredAt: string;
};
