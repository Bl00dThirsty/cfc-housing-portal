export interface SafeEmailProviderSummary {
  provider: "smtp" | "resend" | "none";
  from: string;
  configured: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsernameConfigured: boolean;
  smtpPasswordConfigured: boolean;
  smtpImplicitTls: boolean | null;
  tlsCertificateVerification: boolean;
  resendApiKeyConfigured: boolean;
}

export interface EmailProviderDeliveryStats {
  available: boolean;
  sentRecently: number;
  failedRecently: number;
  skippedRecently: number;
  latestSentAt: string | null;
  lastAttemptAt: string | null;
}
