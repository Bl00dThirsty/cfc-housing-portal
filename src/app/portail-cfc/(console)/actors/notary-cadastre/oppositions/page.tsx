import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "notary-oppositions",
    title: "Oppositions foncières",
    description: "Oppositions et actes de libération actuellement enregistrés.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
