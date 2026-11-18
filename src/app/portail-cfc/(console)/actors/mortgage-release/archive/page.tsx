import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "archived-instruments",
    title: "Archives notariales",
    description: "Actes archivés, filtrés depuis le registre notarial persistant.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
