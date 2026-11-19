import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StaffDirectory } from "@/components/settings/staff-directory";
import { getAdminStaffDirectory } from "@/server/queries/admin-users";

export const dynamic = "force-dynamic";

export default async function StaffAccountsPage() {
  const result = await getAdminStaffDirectory();

  if (!result.ok) {
    return (
      <main className="space-y-3 p-6">
        <Button asChild variant="ghost" size="sm"><Link href="/portail-cfc/analytics"><ArrowLeft aria-hidden className="size-3.5" />Retour au pilotage</Link></Button>
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{result.error}</div>
      </main>
    );
  }

  return <StaffDirectory directory={result.data} />;
}
