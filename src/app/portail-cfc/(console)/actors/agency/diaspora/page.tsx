import { DossierQueuePage } from "@/server/queries/dossier-workspace";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const queue = await DossierQueuePage({
    title: "Portefeuille diaspora",
    description: "Dossiers marqués diaspora dans votre périmètre. Les coordonnées et justificatifs restent protégés par les habilitations.",
    diasporaOnly: true,
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{queue}</div>;
}
