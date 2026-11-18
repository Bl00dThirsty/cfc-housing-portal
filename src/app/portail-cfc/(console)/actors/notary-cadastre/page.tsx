import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "notary-instruments",
    title: "Notariat & garanties",
    description: "Actes et conventions enregistrés dans le registre notarial, sans données fictives.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
