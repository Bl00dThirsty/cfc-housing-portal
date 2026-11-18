import { AnalyticsDashboard } from "@/components/portail-cfc/analytics-dashboard";
import { getAnalyticsOverview } from "@/server/queries/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const result = await getAnalyticsOverview();
  if (!result.ok) {
    return (
      <section className="rounded-lg border border-destructive/30 bg-card p-5" role="alert">
        <h1 className="font-semibold">Tableau de bord indisponible</h1>
        <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
      </section>
    );
  }
  return <AnalyticsDashboard overview={result.overview} />;
}
