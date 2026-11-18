import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "committee-cgr",
    title: "Comité de Gestion des Risques (CGR)",
    description: "Séances et délibérations CGR présentes dans le registre métier.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
