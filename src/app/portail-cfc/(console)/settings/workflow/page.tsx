import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkflowDirectory } from "@/components/settings/workflow-directory";
import { getAdminWorkflowCatalogue } from "@/server/queries/admin-workflow";

export const dynamic = "force-dynamic";

export default async function WorkflowSettingsPage() {
  const result = await getAdminWorkflowCatalogue();
  if (!result.ok) {
    return <main className="space-y-3 p-6"><Button asChild variant="ghost" size="sm"><Link href="/portail-cfc/analytics"><ArrowLeft aria-hidden className="size-3.5" />Retour au pilotage</Link></Button><div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{result.error}</div></main>;
  }
  return <WorkflowDirectory
    processes={result.processes}
    steps={result.steps}
    phases={result.phases}
    documentStages={result.documentStages}
    documentPolicies={result.documentPolicies}
    roles={result.roles}
  />;
}
