import SavingsCalculator from "@/components/simulator/savings-calculator";
import { getGeneralDebtCapacityPolicy, listServices } from "@/server/queries/services";

export const dynamic = "force-dynamic";

export default async function AgencySimulatorPage() {
  const [services, debtCapacityPolicy] = await Promise.all([listServices(), getGeneralDebtCapacityPolicy()]);
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 py-6">
      <header className="mx-auto max-w-2xl space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-cfc-brown">Catalogue CFC actif</p>
        <h1 className="text-3xl font-bold tracking-tight">Simulateur de financement</h1>
        <p className="text-sm text-muted-foreground">Les produits, taux, durées et seuils de capacité proviennent des référentiels Supabase en vigueur.</p>
      </header>
      <SavingsCalculator compact={false} services={services} debtCapacityPolicy={debtCapacityPolicy} />
    </section>
  );
}
