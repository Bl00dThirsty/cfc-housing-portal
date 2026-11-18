import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "loan-offers",
    title: "Offres de prêt",
    description: "Montants, taux, durées et statuts des offres enregistrées dans Supabase.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
