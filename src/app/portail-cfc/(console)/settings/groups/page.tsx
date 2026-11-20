import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GroupDirectory } from "@/components/settings/group-directory";
import { getAdminGroupDirectory } from "@/server/queries/admin-groups";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const result = await getAdminGroupDirectory();
  if (!result.ok) {
    return (
      <main className="space-y-3 p-6">
        <Button asChild variant="ghost" size="sm"><Link href="/portail-cfc/analytics"><ArrowLeft aria-hidden className="size-3.5" />Retour au pilotage</Link></Button>
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{result.error}</div>
      </main>
    );
  }
  return <GroupDirectory groups={result.data.groups} />;
}
