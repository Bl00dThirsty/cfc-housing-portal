import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "disbursements",
    title: "Décaissements enregistrés",
    description: "Tranches, canaux, montants et statuts issus des écritures de décaissement persistées.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
