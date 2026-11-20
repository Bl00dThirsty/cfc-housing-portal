import { EmailProviderConsole } from "@/components/settings/email-provider-console";
import { getEmailProviderConsole } from "@/server/email/provider-console";

export const dynamic = "force-dynamic";

export default async function EmailProviderSettingsPage() {
  const result = await getEmailProviderConsole();
  if (!result.ok) return <main className="p-6"><div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{result.error}</div></main>;
  return <EmailProviderConsole provider={result.provider} deliveries={result.deliveries} />;
}
