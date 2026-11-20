import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "committee-all",
    title: "Comités de crédit",
    description: "Délibérations CGR, CRC et de gouvernance enregistrées dans Supabase, selon les habilitations de votre rôle.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
