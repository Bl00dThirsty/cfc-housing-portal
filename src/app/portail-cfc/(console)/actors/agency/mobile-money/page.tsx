import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "mobile-money",
    title: "Versements Mobile Money",
    description: "Opérations réellement enregistrées via MTN MoMo ou Orange Money dans le carnet d’épargne. Les statuts reflètent la décision persistée.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
