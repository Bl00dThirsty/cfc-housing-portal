import { OperationalRegisterPage } from "@/server/queries/operational-register-page";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const register = await OperationalRegisterPage({
    register: "release-deeds",
    title: "Mainlevées & actes de clôture",
    description: "Actes de mainlevée enregistrés avec leur statut. Les dossiers sans acte restent absents de cette liste.",
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{register}</div>;
}
