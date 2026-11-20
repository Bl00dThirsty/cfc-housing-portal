import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "systac-runs",
    title: "Rapprochements SYSTAC",
    description: "Exécutions SYSTAC présentes dans le registre de rapprochement; aucun taux de rapprochement n’est calculé à partir de données fictives.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
