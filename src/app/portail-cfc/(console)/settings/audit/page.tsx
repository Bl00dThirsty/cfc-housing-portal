import { AdminAuditDirectory } from "@/components/settings/admin-audit-directory";
import { getAdminAuditDashboard } from "@/server/queries/admin-audit";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const result = await getAdminAuditDashboard();
  if (!result.ok) {
    return (
      <main className="flex flex-col gap-3 p-6">
        <h1 className="text-xl font-semibold">Journal d&apos;administration indisponible</h1>
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{result.error}</p>
      </main>
    );
  }
  return <AdminAuditDirectory dashboard={result.data} />;
}
